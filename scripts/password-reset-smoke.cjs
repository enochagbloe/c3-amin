// Local runs require the explicit fake Resend preload. Remote runs seed disposable tokens and send no email.
const assert=require('node:assert/strict');const fs=require('node:fs');const {randomUUID,randomBytes,createHash,createHmac}=require('node:crypto');const bcrypt=require('bcryptjs');const {PrismaClient}=require('../lib/generated/prisma');const db=new PrismaClient();const users=[];const emails=[];const base=process.argv[2]||'http://localhost:3000';const password='Old-'+randomUUID()+'Aa1!';const nextPassword='New-'+randomUUID()+'Aa1!';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function post(path,body){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {code:response.status,...await response.json()};}
function messages(email){return fs.existsSync(process.env.TEAM_TEST_OUTBOX)?fs.readFileSync(process.env.TEAM_TEST_OUTBOX,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(message=>message.subject==='Reset your C3 Church password'&&message.to.includes(email)):[];}
async function mailToken(email,previous){for(let i=0;i<120;i++){const rows=messages(email);if(rows.length>previous){const url=rows.at(-1).text.match(/https?:\/\/\S+\/reset-password#token=[A-Za-z0-9_-]+/)[0];return new URLSearchParams(new URL(url).hash.slice(1)).get('token');}await pause(250);}throw Error('Reset email was not captured');}
async function actor(user, loginPassword = password) {
  const jar = new Map();
  function capture(response) { for (const cookie of response.headers.getSetCookie()) { const pair = cookie.split(';')[0], split = pair.indexOf('='); jar.set(pair.slice(0, split), pair.slice(split + 1)); } }
  const cookies = () => [...jar].map(([key, value]) => key + '=' + value).join('; ');
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, redirect: 'manual', headers: { Cookie: cookies(), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); capture(response);
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = { html: text }; }
    return { code: response.status, location: response.headers.get('location'), ...data };
  }
  const csrf = await request('/api/auth/csrf');
  const login = await fetch(base + '/api/auth/callback/credentials', { method: 'POST', redirect: 'manual', headers: { Cookie: cookies(), 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: user.email, password: loginPassword, callbackUrl: base }) }); capture(login);

  return request;
}
(async()=>{
 const oldHash=await bcrypt.hash(password,4);
 for(const [name,status] of [['Reset User','active'],['Inactive Reset User','inactive']]){const email=`reset-test-${randomUUID()}@example.invalid`;emails.push(email);users.push(await db.user.create({data:{name,status,email,username:'reset_'+randomUUID().slice(0,8),accounts:{create:{name,email,provider:'credentials',providerAccountId:email,password:oldHash}}},include:{accounts:true}}));}
 const user=users[0],account=user.accounts[0],oldSession=await actor(user);assert.equal((await oldSession('/api/auth/session')).user.id,user.id);
 let token;
 if(base.startsWith('http://localhost:')){
  const requested=await post('/api/password-reset/request',{email:'  '+user.email.toUpperCase()+'  '});assert.equal(requested.code,200);assert(!JSON.stringify(requested).includes(user.email));
  const unknownEmail=`unknown-reset-${randomUUID()}@example.invalid`;emails.push(unknownEmail);
  const unknown=await post('/api/password-reset/request',{email:unknownEmail});assert.deepEqual(unknown,requested,'Known and unknown emails must have the same response');
  token=await mailToken(user.email,0);const stored=await db.passwordResetToken.findUniqueOrThrow({where:{accountId:account.id}});assert.equal(stored.tokenHash,createHash('sha256').update(token).digest('hex'));assert(!JSON.stringify(stored).includes(token));
  const repeat=await post('/api/password-reset/request',{email:user.email});assert.deepEqual(repeat,requested);await pause(750);assert.equal(messages(user.email).length,1,'Cooldown prevents duplicate email');
  const key=createHmac('sha256',process.env.AUTH_SECRET).update('password-reset:'+user.email).digest('hex');
  await db.passwordResetThrottle.update({where:{key},data:{lastRequestedAt:new Date(0)}});
  await post('/api/password-reset/request',{email:user.email});const replacement=await mailToken(user.email,1);assert.notEqual(replacement,token);assert.equal((await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword})).code,400,'Replacement invalidates old links');token=replacement;
  await db.passwordResetToken.update({where:{accountId:account.id},data:{expiresAt:new Date(0)}});assert.equal((await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword})).code,400);
  await db.passwordResetThrottle.update({where:{key},data:{lastRequestedAt:new Date(0)}});await post('/api/password-reset/request',{email:user.email});token=await mailToken(user.email,2);
  await db.passwordResetThrottle.update({where:{key},data:{lastRequestedAt:new Date(0)}});await post('/api/password-reset/request',{email:user.email});await pause(750);assert.equal(messages(user.email).length,3,'Hourly rate limit remains enforced');
  assert.deepEqual(await post('/api/password-reset/request',{email:users[1].email}),requested);await pause(750);assert.equal(messages(users[1].email).length,0);
 }else{
  token=randomBytes(32).toString('base64url');await db.passwordResetToken.create({data:{accountId:account.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+1800000)}});
 }
 assert.equal((await post('/api/password-reset/confirm',{token,password:'weak',confirmPassword:'weak'})).code,400);
 assert.equal((await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword+'x'})).code,400);
 await db.user.update({where:{id:user.id},data:{status:'inactive'}});assert.equal((await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword})).code,400);await db.user.update({where:{id:user.id},data:{status:'active'}});
 const reset=await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword});assert.equal(reset.code,200,JSON.stringify(reset));assert.equal((await db.user.findUniqueOrThrow({where:{id:user.id}})).sessionVersion,1);
 assert.equal((await oldSession('/api/auth/session')).user,undefined,'Old sessions are revoked');assert.equal((await oldSession('/api/profile')).code,401);
 assert.equal((await (await actor(user,password))('/api/auth/session')).user,undefined,'Old password no longer signs in');
 const newSession=await actor(user,nextPassword);assert.equal((await newSession('/api/auth/session')).user.id,user.id);
 assert.equal((await post('/api/password-reset/confirm',{token,password:nextPassword,confirmPassword:nextPassword})).code,400,'Tokens are single use');
 const raceToken=randomBytes(32).toString('base64url');await db.passwordResetToken.create({data:{accountId:account.id,tokenHash:createHash('sha256').update(raceToken).digest('hex'),expiresAt:new Date(Date.now()+1800000)}});
 const results=await Promise.all([post('/api/password-reset/confirm',{token:raceToken,password:nextPassword,confirmPassword:nextPassword}),post('/api/password-reset/confirm',{token:raceToken,password:nextPassword,confirmPassword:nextPassword})]);assert.equal(results.filter(row=>row.code===200).length,1);assert(results.every(row=>[200,400,409].includes(row.code)),JSON.stringify(results));assert.equal((await db.user.findUniqueOrThrow({where:{id:user.id}})).sessionVersion,2);
 assert(await bcrypt.compare(nextPassword,(await db.account.findUniqueOrThrow({where:{id:account.id}})).password));
 console.log('PASS: reset tokens are hashed, expiring and single-use; password validation, inactive-user denial, session revocation and concurrent consumption are enforced.'+(base.startsWith('http://localhost:')?' Generic responses, email template, link rotation and rate limits verified with simulated email.':' No email sent.'));
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await db.user.deleteMany({where:{id:{in:users.map(user=>user.id)}}});if(process.env.AUTH_SECRET)await db.passwordResetThrottle.deleteMany({where:{key:{in:emails.map(email=>createHmac('sha256',process.env.AUTH_SECRET).update('password-reset:'+email).digest('hex'))}}});await db.$disconnect();});
