// Run with an isolated database and matching local server. No email or cash is actually sent.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
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
 const hash=await bcrypt.hash(password,4);
 for(const name of ['Cash Owner','Cash Reviewer','Cash Head','Cash Requester','Other Member']){const email=`cash-test-${randomUUID()}@example.invalid`;users.push(await db.user.create({data:{name,email,username:'cash_'+randomUUID().slice(0,10),accounts:{create:{name,email,provider:'credentials',providerAccountId:email,password:hash}}}}));}
 const org=await db.organization.create({data:{name:'Disposable cash receipt test',industry:'CHURCH',members:{create:users.map((user,i)=>({userId:user.id,role:i===0?'OWNER':'MEMBER'}))}}});orgs.push(org.id);
 const [owner,reviewer,head,requester,other]=await Promise.all(users.map(actor));
 const root=`/api/organizations/${org.id}`,requests=root+'/budget-requests',notifications=root+'/notifications',summary=requests+'/summary';
 assert.equal((await owner(root+'/budget-approval-settings','PUT',{reviewerId:users[1].id,pastorId:users[2].id})).code,200);
 const created=await requester(requests,'POST',{title:'Cash receipt workflow',description:'Private breakdown that must not be copied to the finance ledger.',amount:'125.50',currency:'GHS'});assert.equal(created.code,201,JSON.stringify(created));
 const id=created.data.id,detail=requests+'/'+id,cash=detail+'/cash',decision=detail+'/decision';
 assert((await reviewer(notifications)).data.items.some(item=>item.requestId===id));
 assert.equal((await other(notifications)).data.unread,0);
 const reviewerNotice=(await reviewer(notifications)).data.items.find(item=>item.requestId===id);
 await other(notifications,'PATCH',{id:reviewerNotice.id});assert.equal((await db.budgetNotification.findUniqueOrThrow({where:{id:reviewerNotice.id}})).readAt,null,'Other members cannot mark another user’s notification read');
 await reviewer(notifications,'PATCH',{id:reviewerNotice.id});assert((await db.budgetNotification.findUniqueOrThrow({where:{id:reviewerNotice.id}})).readAt);
 assert.equal((await reviewer(summary)).data.approvalCount,1);
 assert.equal((await other(summary)).data.pending.length,0);
 assert.equal((await requester(cash,'POST',{action:'CONFIRM_RECEIPT'})).code,409);
 assert.equal((await reviewer(decision,'POST',{decision:'APPROVED'})).data.status,'PENDING_SECOND');
 assert((await head(notifications)).data.items.some(item=>item.requestId===id));
 assert.equal((await head(decision,'POST',{decision:'APPROVED'})).data.status,'APPROVED');
 assert.equal((await reviewer(summary)).data.cashCount,1);
 const requesterMembership=await db.organizationMember.findUniqueOrThrow({where:{userId_organizationId:{userId:users[3].id,organizationId:org.id}}});
 assert.equal((await owner(root+'/members/'+requesterMembership.id,'DELETE')).code,400,'Requesters with unsettled cash must remain members until confirmation');
 assert.equal(await db.expenseTracker.count({where:{organizationId:org.id}}),0,'Approval alone must never add an expense');
 assert.equal((await owner(cash,'POST',{action:'RECEIVE_FUNDS'})).code,403,'Owner cannot bypass assigned cash reviewer');
 assert.equal((await reviewer(cash,'POST',{action:'HAND_OVER'})).code,409);
 assert.equal((await reviewer(cash,'POST',{action:'RECEIVE_FUNDS',amount:'999'})).code,400,'Cash amount is fixed to the approved request');
 assert.equal((await reviewer(cash,'POST',{action:'RECEIVE_FUNDS',reference:'TEST-VOUCHER-001'})).data.cashStatus,'WITH_REVIEWER');
 assert.equal((await requester(cash,'POST',{action:'HAND_OVER'})).code,403);
 assert.equal((await requester(cash,'POST',{action:'CONFIRM_RECEIPT'})).code,409);
 assert.equal((await reviewer(cash,'POST',{action:'HAND_OVER'})).data.cashStatus,'AWAITING_RECEIPT');
 assert.equal(await db.expenseTracker.count({where:{organizationId:org.id}}),0,'Handover alone must not record an expense');
 assert.equal((await requester(summary)).data.receiptCount,1);
 assert.equal((await reviewer(cash,'POST',{action:'CONFIRM_RECEIPT'})).code,403);
 assert.equal((await other(cash,'POST',{action:'CONFIRM_RECEIPT'})).code,404);
 const competing=await Promise.all([requester(cash,'POST',{action:'CONFIRM_RECEIPT'}),requester(cash,'POST',{action:'CONFIRM_RECEIPT'})]);
 assert(competing.some(r=>r.code===200));assert(competing.every(r=>[200,409].includes(r.code)),JSON.stringify(competing));
 assert.equal((await requester(cash,'POST',{action:'CONFIRM_RECEIPT'})).data.cashStatus,'RECEIVED');
 const expenses=await db.expenseTracker.findMany({where:{organizationId:org.id}});assert.equal(expenses.length,1,'Repeated and concurrent confirmation must record exactly one expense');
 const expense=expenses[0];assert.equal(expense.budgetRequestId,id);assert.equal(expense.author,users[0].id);assert.equal(expense.amount,125.5);assert.equal(expense.currency,'GHS');assert.equal(expense.status,'approved');assert(!expense.description.includes('Private breakdown'));
 assert.equal((await owner(`/api/budgetTracker?orgId=${org.id}`)).data[0].id,expense.id);assert.equal((await requester(`/api/budgetTracker?orgId=${org.id}`)).code,403);
 const result=(await requester(detail)).data;assert(result.reviewerReceivedAt&&result.handedOverAt&&result.receiptConfirmedAt);assert.equal(result.paymentReference,'TEST-VOUCHER-001');assert.deepEqual(result.events.filter(e=>e.stage==='PAYMENT').map(e=>e.action),['FUNDS_RECEIVED','CASH_HANDED_OVER','RECEIPT_CONFIRMED']);
 assert((await owner(notifications)).data.items.some(n=>n.title.includes('expense recorded')));
 assert.equal((await requester(summary)).data.receiptCount,0);assert.equal((await other(summary)).data.recent.length,0);
 console.log('PASS: private dashboard and notifications, read ownership, sequential approval and cash steps, reviewer-only handover, requester-only receipt, no early expense, currency preservation, atomic exactly-once expense and audit events under concurrent confirmation.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await db.organization.deleteMany({where:{id:{in:orgs}}});await db.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await db.$disconnect();});
