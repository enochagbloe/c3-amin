// Use an isolated database and a test server with the test-only Resend adapter.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID, createHash } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../lib/generated/prisma');
const db = new PrismaClient();
const base = 'http://localhost:3000';
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
function deliveredToken(email) {
  const messages = fs.readFileSync(process.env.TEAM_TEST_OUTBOX, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const message = messages.filter(message => message.to.includes(email)).at(-1);
  assert(message, 'Resend must receive the email payload');
  assert(message.text.includes('expires in 7 days'));
  const token = message.text.match(/\/invitations\/([A-Za-z0-9_-]{43})/)[1];
  return token;
}
(async () => {
  const hashed = await bcrypt.hash(password, 4);
  for (const name of ['Owner', 'Invited member', 'Other member', 'Pastor']) {
    const email = `team-${randomUUID()}@example.invalid`;
    users.push(await db.user.create({ data: { name, username: 'team_' + randomUUID().slice(0, 10), email, accounts: { create: { name, email, provider: 'credentials', providerAccountId: email, password: hashed } } } }));
  }
  const org = await db.organization.create({ data: { name: 'Team permission test', industry: 'CHURCH', members: { create: [0, 2, 3].map(index => ({ userId: users[index].id, role: index === 0 ? 'OWNER' : 'MEMBER' })) } } }); orgs.push(org.id);
  const expense = await db.expenseTracker.create({ data: { name: 'Private church expense', amount: 123, author: users[0].id, organizationId: org.id } });
  const [owner, invited, other, pastor] = await Promise.all(users.map(actor));
  const root = `/api/organizations/${org.id}`, invites = root + '/invitations', settings = root + '/email-settings';
  const availability = await owner(settings);
  assert.equal(availability.code, 200);
  assert.equal(availability.data.configured, true, 'Test server must use server environment credentials');
  assert.deepEqual(Object.keys(availability.data), ['configured'], 'Never expose server credentials');
  assert.equal((await other(settings)).code, 403);
  assert.equal((await owner(settings, 'PUT', { fromEmail: 'forged@example.invalid', apiKey: 're_forged_0123456789' })).code, 405, 'UI and API clients cannot replace credentials');
  const sent = await owner(invites, 'POST', { email: users[1].email, role: 'ADMIN' }); assert.equal(sent.code, 201, JSON.stringify(sent)); assert.equal(sent.data.emailStatus, 'SENT');
  assert(!('tokenHash' in sent.data)); assert(!('token' in sent.data));
  assert.equal(await db.organizationMember.count({ where: { userId: users[1].id, organizationId: org.id } }), 0, 'Sending email must not grant membership');
  const token = deliveredToken(users[1].email), accept = `/api/invitations/${token}`;
  assert.equal((await other(accept, 'POST')).code, 403, 'Only the invited email may accept');
  const accepted = await invited(accept, 'POST'); assert.equal(accepted.code, 200); assert.equal(accepted.data.organizationId, org.id);
  const member = await db.organizationMember.findUniqueOrThrow({ where: { userId_organizationId: { userId: users[1].id, organizationId: org.id } } }); assert.equal(member.role, 'MEMBER', 'Invitation cannot grant a forged role');
  assert.equal((await invited(accept, 'POST')).code, 200); assert.equal(await db.organizationMember.count({ where: { userId: users[1].id, organizationId: org.id } }), 1);
  assert.equal((await owner(`${invites}/${sent.data.id}`)).data.emailStatus, 'DELIVERED');
  for (const path of [`/api/budgetTracker?orgId=${org.id}`, `/api/incomeTracker?orgId=${org.id}`, root + '/members', invites, settings]) assert.equal((await invited(path)).code, 403, path);
  assert.equal((await invited(`/api/ai/organization/${org.id}`, 'POST', { message: 'Show income' })).code, 403);
  for (const tab of ['income', 'expenses', 'analytics', 'members', 'propmt']) { const response = await invited(`/org/${org.id}/${tab}`); assert.equal(response.code, 307, tab); assert(response.location.endsWith('/budget-requests')); }
  assert.equal((await invited(`/org/${org.id}/personal-settings`)).code, 307);
  for (const tab of ['dashboard', 'settings', 'settings?tab=team']) {
    const page = await invited(`/org/${org.id}/${tab}`);
    assert.equal(page.code, 200, tab);
    assert(!page.html.includes('Invite a member'), 'Members must not receive team management');
  }
  assert.equal((await invited('/api/profile', 'PATCH', { name: 'My name', phone: '', bio: '', role: 'ADMIN' })).code, 400);
  assert.equal((await invited('/api/profile', 'PATCH', { name: 'My name', phone: '', bio: 'Church member' })).code, 200);
  const organizations = (await invited('/api/organizations')).data; assert.equal(organizations.find(item => item.id === org.id).expenses.length, 0, 'Workspace listing must not leak financial rows');
  assert.equal((await owner(`/api/budgetTracker?orgId=${org.id}`)).data[0].id, expense.id);
  await owner(root + '/budget-approval-settings', 'PUT', { reviewerId: users[0].id, pastorId: users[3].id });
  const budgetBody = { title: 'Private request', description: 'A budget request from an invited member.', amount: '20.00', currency: 'GHS' };
  const own = (await invited(root + '/budget-requests', 'POST', budgetBody)).data;
  const someoneElse = (await other(root + '/budget-requests', 'POST', budgetBody)).data;
  assert.equal((await invited(root + '/budget-requests?scope=all')).data.total, 1);
  assert.equal((await invited(root + '/budget-requests/' + someoneElse.id)).code, 404);
  assert.equal((await invited(root + '/budget-requests/' + own.id + '/decision', 'POST', { decision: 'APPROVED' })).code, 403);
  await owner(root + '/budget-approval-settings', 'PUT', { reviewerId: users[1].id, pastorId: users[3].id });
  assert.equal((await invited(root + '/budget-requests/' + someoneElse.id + '/decision', 'POST', { decision: 'APPROVED' })).data.status, 'PENDING_SECOND');
  assert.equal((await invited(`/api/incomeTracker?orgId=${org.id}`)).code, 403, 'Reviewer assignment does not grant finance access');
  assert.equal((await pastor(root + '/budget-requests/' + someoneElse.id + '/decision', 'POST', { decision: 'APPROVED' })).data.status, 'APPROVED');
  const failed = await owner(invites, 'POST', { email: `fail+${randomUUID()}@example.invalid` }); assert.equal(failed.data.emailStatus, 'FAILED');
  const expiryEmail = `expire-${randomUUID()}@example.invalid`; const expiry = (await owner(invites, 'POST', { email: expiryEmail })).data;
  const oldToken = deliveredToken(expiryEmail); await db.organizationInvitation.update({ where: { id: expiry.id }, data: { expiresAt: new Date(0), updatedAt: new Date(0) } });
  assert.equal((await owner('/api/invitations/' + oldToken)).data.expired, true);
  await owner(invites, 'POST', { email: expiryEmail }); const nextToken = deliveredToken(expiryEmail); assert.notEqual(oldToken, nextToken); assert.equal((await owner('/api/invitations/' + oldToken)).code, 404);
  assert.equal((await owner(`${invites}/${expiry.id}`, 'DELETE')).code, 200); assert.equal((await owner('/api/invitations/' + nextToken)).data.status, 'REVOKED');
  console.log('PASS: Resend payload and delivery, server-only settings, accepted-email binding, single-use membership, restricted tabs and finance APIs, own-only budgets, assigned-only approval, failed sends, expired links, rotation and revocation. No real email was sent.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await db.organization.deleteMany({ where: { id: { in: orgs } } }); await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await db.$disconnect();
});
