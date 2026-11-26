// Run against an isolated Neon branch and its matching local server.
// node --env-file=.env.budget-test scripts/budget-requests-smoke.cjs
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const base = process.argv[2] || 'http://localhost:3000';
const fixtures = { users: [], organizations: [] };
const password = randomUUID() + 'Aa1!';

async function actor(user) {
  const cookies = new Map();
  async function call(path, method = 'GET', body) {
    const response = await fetch(base + path, {
      method, redirect: 'manual',
      headers: { 'Content-Type': 'application/json', Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';'); const split = pair.indexOf('=');
      cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    const json = await response.json();
    return { status: response.status, ...json };
  }
  const csrf = await call('/api/auth/csrf');
  const login = await fetch(base + '/api/auth/callback/credentials', {
    method: 'POST', redirect: 'manual', headers: {
      'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1',
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '),
    }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: user.email, password, callbackUrl: base }),
  });
  for (const cookie of login.headers.getSetCookie()) {
    const [pair] = cookie.split(';'); const split = pair.indexOf('=');
    cookies.set(pair.slice(0, split), pair.slice(split + 1));
  }
  assert.equal((await call('/api/auth/session')).user.id, user.id);
  return call;
}

(async () => {
  const hash = await bcrypt.hash(password, 4);
  for (const name of ['Owner', 'Admin A', 'Admin B', 'Reviewer', 'Pastor', 'Outsider']) {
    const email = `budget-test-${randomUUID()}@example.invalid`;
    const user = await db.user.create({ data: { name, email, username: 'test_' + randomUUID().slice(0, 12),
      accounts: { create: { name, email, provider: 'credentials', providerAccountId: email, password: hash } },
    } });
    fixtures.users.push(user);
  }
  const [ownerUser, adminAUser, adminBUser, reviewerUser, pastorUser, outsiderUser] = fixtures.users;
  const org = await db.organization.create({ data: { name: 'Budget workflow test', industry: 'CHURCH', members: { create: fixtures.users.slice(0, 5).map(user => ({ userId: user.id, role: user.id === ownerUser.id ? 'OWNER' : user.id === pastorUser.id ? 'MEMBER' : 'ADMIN' })) } } });
  fixtures.organizations.push(org.id);
  const otherOrg = await db.organization.create({ data: { name: 'Other church test', industry: 'CHURCH', members: { create: { userId: outsiderUser.id, role: 'OWNER' } } } });
  fixtures.organizations.push(otherOrg.id);
  const [owner, adminA, adminB, reviewer, pastor, outsider] = await Promise.all(fixtures.users.map(actor));
  const endpoint = `/api/organizations/${org.id}/budget-requests`;
  const settings = `/api/organizations/${org.id}/budget-approval-settings`;
  const body = { title: 'Youth outreach budget', description: 'Food and supplies for the church youth outreach.', amount: '250.50', currency: 'GHS', neededBy: '2026-12-15' };
  const route = { reviewerId: reviewerUser.id, pastorId: pastorUser.id };
  const decision = id => `${endpoint}/${id}/decision`;

  assert.equal((await (await fetch(base + endpoint)).json()).success, false);
  const unconfiguredEndpoint = `/api/organizations/${otherOrg.id}/budget-requests`;
  const queued = await outsider(unconfiguredEndpoint, 'POST', body);
  assert.equal(queued.status, 201, 'An owner-only church must be able to submit before pastor setup');
  assert.equal(queued.data.mainApproverId, outsiderUser.id);
  assert.equal(queued.data.secondApproverId, null);
  assert.equal(queued.data.status, 'PENDING_MAIN');
  assert.equal((await outsider(`${unconfiguredEndpoint}/${queued.data.id}/decision`, 'POST', { decision: 'APPROVED' })).status, 403, 'Queuing must never enable self approval');
  assert.equal((await adminA(settings, 'PUT', route)).status, 403, 'Admins cannot assign approvers');
  assert.equal((await owner(settings, 'PUT', { reviewerId: reviewerUser.id, pastorId: reviewerUser.id })).status, 400);
  assert.equal((await owner(settings, 'PUT', { ...route, pastorId: outsiderUser.id })).status, 400);
  assert.equal((await owner(settings, 'PUT', route)).status, 200);
  const options = await adminA(`${endpoint}/options`);
  assert.deepEqual(options.data.members, [], 'Members must not receive approver-selection options');
  assert.equal(options.data.reviewer.id, reviewerUser.id);
  assert.equal((await adminA(endpoint, 'POST', { ...body, amount: '-1' })).status, 400);
  assert.equal((await adminA(endpoint, 'POST', { ...body, neededBy: '2026-02-30' })).status, 400);
  const created = await adminA(endpoint, 'POST', { ...body, mainApproverId: adminBUser.id, secondApproverId: adminAUser.id, requesterId: adminBUser.id, status: 'APPROVED' });
  assert.equal(created.status, 201);
  const first = created.data;
  assert.equal(first.requesterId, adminAUser.id);
  assert.equal(first.mainApproverId, reviewerUser.id, 'The server must ignore requester-supplied routing');
  assert.equal(first.secondApproverId, pastorUser.id);
  assert.equal(first.status, 'PENDING_MAIN');
  const second = (await adminB(endpoint, 'POST', { ...body, title: 'Admin B private budget' })).data;
  assert.equal((await adminA(endpoint + '?scope=all')).data.total, 1);
  assert.equal((await adminB(endpoint + '?scope=all')).data.total, 1);
  assert.equal((await adminB(`${endpoint}/${first.id}`)).status, 404, 'Admins cannot read each other’s requests');
  assert.equal((await outsider(`${endpoint}/${first.id}`)).status, 403, 'Other churches cannot access a request');
  assert.equal((await adminA(`/api/organizations/${otherOrg.id}/budget-requests/${first.id}`)).status, 403);
  assert.equal((await owner(endpoint + '?scope=all')).data.total, 2);
  assert.equal((await reviewer(endpoint + '?scope=inbox')).data.total, 2);
  assert.equal((await pastor(endpoint + '?scope=inbox')).data.total, 0);
  assert.equal((await pastor(decision(first.id), 'POST', { decision: 'APPROVED' })).status, 403, 'Pastor cannot skip the first approval');
  assert.equal((await owner(decision(first.id), 'POST', { decision: 'APPROVED' })).status, 403, 'Owner cannot bypass an assigned reviewer');
  assert.equal((await adminA(decision(first.id), 'POST', { decision: 'APPROVED' })).status, 403);
  const competing = await Promise.all([reviewer(decision(first.id), 'POST', { decision: 'APPROVED' }), reviewer(decision(first.id), 'POST', { decision: 'APPROVED' })]);
  assert.equal(competing.filter(result => result.status === 200).length, 1, 'Exactly one concurrent approval must succeed');
  assert(competing.every(result => [200, 403, 409].includes(result.status)));
  assert.equal((await adminA(`${endpoint}/${first.id}`)).data.status, 'PENDING_SECOND');
  assert.equal((await pastor(endpoint + '?scope=inbox')).data.total, 1);
  assert.equal((await pastor(decision(first.id), 'POST', { decision: 'APPROVED', comment: 'Pastoral go-ahead' })).data.status, 'APPROVED');
  const history = (await adminA(`${endpoint}/${first.id}`)).data.events;
  assert.deepEqual(history.map(event => event.action), ['SUBMITTED', 'APPROVED', 'APPROVED']);
  assert.equal((await pastor(decision(first.id), 'POST', { decision: 'APPROVED' })).status, 409);
  assert.equal((await reviewer(decision(second.id), 'POST', { decision: 'REJECTED' })).status, 400, 'Rejections need a reason');
  assert.equal((await reviewer(decision(second.id), 'POST', { decision: 'REJECTED', comment: 'Please include a cost breakdown.' })).data.status, 'REJECTED');
  assert.equal((await pastor(decision(second.id), 'POST', { decision: 'APPROVED' })).status, 409);
  const finalRejectionResult = await adminA(endpoint, 'POST', body);
  assert.equal(finalRejectionResult.status, 201, JSON.stringify(finalRejectionResult));
  const finalRejection = finalRejectionResult.data;
  await reviewer(decision(finalRejection.id), 'POST', { decision: 'APPROVED' });
  assert.equal((await pastor(decision(finalRejection.id), 'POST', { decision: 'REJECTED', comment: 'Not in this term’s budget.' })).data.status, 'REJECTED');
  const own = (await reviewer(endpoint, 'POST', body)).data;
  assert.equal((await reviewer(decision(own.id), 'POST', { decision: 'APPROVED' })).status, 403, 'No self approval');
  assert.equal((await owner(settings, 'PUT', { reviewerId: ownerUser.id, pastorId: pastorUser.id })).status, 200);
  const rerouted = (await owner(`${endpoint}/${own.id}`)).data;
  assert.equal(rerouted.mainApproverId, ownerUser.id);
  assert(rerouted.events.some(event => event.action === 'REASSIGNED'));
  assert.equal((await owner(decision(own.id), 'POST', { decision: 'APPROVED' })).data.status, 'PENDING_SECOND');
  assert.equal((await pastor(decision(own.id), 'POST', { decision: 'APPROVED' })).data.status, 'APPROVED');
  assert.equal((await adminA(endpoint + '?scope=mine')).data.total, 2, 'Members retain their full request history');
  assert.equal(await db.expenseTracker.count({ where: { organizationId: org.id } }), 0, 'Private requests must not leak into shared expense tables');
  console.log('PASS: owner-only routing; automatic assignment; admin privacy; cross-organization denial; sequential reviewer/pastor approval; concurrent decisions; rejection reasons; immutable final decisions; self-approval prevention; owner reassignment and audit history.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await db.organization.deleteMany({ where: { id: { in: fixtures.organizations } } });
  await db.user.deleteMany({ where: { id: { in: fixtures.users.map(user => user.id) } } });
  await db.$disconnect();
});
