// Run against an isolated database and its matching local server. No email is sent.
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../lib/generated/prisma');
const db = new PrismaClient();
const base = process.argv[2] || 'http://localhost:3000';
const password = randomUUID() + 'A1!';
const users = [], orgs = [];
async function actor(user) {
  const jar = new Map();
  function capture(response) { for (const cookie of response.headers.getSetCookie()) { const pair = cookie.split(';')[0], split = pair.indexOf('='); jar.set(pair.slice(0, split), pair.slice(split + 1)); } }
  const cookies = () => [...jar].map(([key, value]) => key + '=' + value).join('; ');
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, redirect: 'manual', headers: { Cookie: cookies(), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); capture(response);
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = { html: text }; }
    return { code: response.status, location: response.headers.get('location'), ...data };
  }
  const csrf = await request('/api/auth/csrf');
  const login = await fetch(base + '/api/auth/callback/credentials', { method: 'POST', redirect: 'manual', headers: { Cookie: cookies(), 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: user.email, password, callbackUrl: base }) }); capture(login);
  assert.equal((await request('/api/auth/session')).user.id, user.id);
  return request;
}
(async () => {
  const hash = await bcrypt.hash(password, 4);
  for (const name of ['Link Owner', 'Link Member', 'Wrong Email']) {
    const email = `link-test-${randomUUID()}@example.invalid`;
    users.push(await db.user.create({ data: { name, email, username: 'link_' + randomUUID().slice(0, 10), accounts: { create: { name, email, provider: 'credentials', providerAccountId: email, password: hash } } } }));
  }
  const org = await db.organization.create({ data: { name: 'Disposable link invitation test', industry: 'CHURCH', members: { create: { userId: users[0].id, role: 'OWNER' } } } }); orgs.push(org.id);
  const [owner, member, wrong] = await Promise.all(users.map(actor));
  const root = `/api/organizations/${org.id}`, endpoint = root + '/invitations';
  const create = email => owner(endpoint, 'POST', { email, delivery: 'link', role: 'ADMIN' });
  assert.equal((await member(endpoint, 'POST', { email: users[2].email, delivery: 'link' })).code, 403);
  if (base.startsWith('http://localhost:')) assert.equal((await owner(endpoint, 'POST', { email: users[1].email })).code, 503, 'Local test must have no Resend credentials');
  const first = await create(users[1].email);
  assert.equal(first.code, 201, JSON.stringify(first));
  assert.equal(first.data.emailStatus, 'NOT_SENT');
  const token = new URL(first.data.invitationUrl).pathname.split('/').pop();
  const stored = await db.organizationInvitation.findUniqueOrThrow({ where: { id: first.data.id } });
  assert.equal(stored.tokenHash, createHash('sha256').update(token).digest('hex'));
  assert(!JSON.stringify(stored).includes(token));
  assert.equal(stored.emailId, null);
  assert.equal(await db.organizationMember.count({ where: { organizationId: org.id } }), 1);
  assert(!JSON.stringify((await owner(endpoint)).data).includes(token), 'Listings never disclose a token');
  assert.equal((await wrong(`/api/invitations/${token}`, 'POST')).code, 403);
  assert.equal((await create(users[1].email)).code, 429, 'Throttle repeated link creation');
  await db.organizationInvitation.update({ where: { id: first.data.id }, data: { updatedAt: new Date(0) } });
  const replacement = await create(users[1].email);
  assert.equal(replacement.code, 201);
  assert.equal((await member(`/api/invitations/${token}`)).code, 404);
  const next = new URL(replacement.data.invitationUrl).pathname.split('/').pop();
  const path = `/api/invitations/${next}`;
  assert.equal((await member(path)).data.emailMatches, true);
  assert.equal((await member(path, 'POST')).code, 200);
  assert.equal((await member(path, 'POST')).code, 200);
  const membership = await db.organizationMember.findUniqueOrThrow({ where: { userId_organizationId: { userId: users[1].id, organizationId: org.id } } });
  assert.equal(membership.role, 'MEMBER');
  assert.equal((await member(`/api/incomeTracker?orgId=${org.id}`)).code, 403);
  assert.equal((await create(users[1].email)).code, 409, 'Existing members cannot be reinvited');
  const expiry = await create(users[2].email);
  const expiredToken = new URL(expiry.data.invitationUrl).pathname.split('/').pop();
  await db.organizationInvitation.update({ where: { id: expiry.data.id }, data: { expiresAt: new Date(0), updatedAt: new Date(0) } });
  assert.equal((await wrong(`/api/invitations/${expiredToken}`, 'POST')).code, 410);
  const renewed = await create(users[2].email);
  const renewedToken = new URL(renewed.data.invitationUrl).pathname.split('/').pop();
  assert.equal((await owner(`${endpoint}/${renewed.data.id}`, 'DELETE')).code, 200);
  assert.equal((await wrong(`/api/invitations/${renewedToken}`, 'POST')).code, 404);
  console.log('PASS: links without email delivery, owner-only generation, token hashing, hidden tokens, rate limiting, replacement, matching-email acceptance, idempotency, restricted membership, expiry and revocation.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await db.organization.deleteMany({ where: { id: { in: orgs } } });
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  await db.$disconnect();
});
