const assert = require('node:assert/strict');
const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const marker = new Error('ROLLBACK_TEST');
  try {
    await prisma.$transaction(async tx => {
      const password = await bcrypt.hash('Temporary-test-only-123!', 4);
      const user = await tx.user.create({ data: { name:'Schema Test', username:'test_'+Date.now(), email:`schema-${Date.now()}@example.invalid`, accounts:{create:{name:'Schema Test',email:'schema@example.invalid',provider:'credentials',providerAccountId:`schema-${Date.now()}`,password}} },include:{accounts:true} });
      assert.match(user.id,/^[0-9a-f-]{36}$/);
      assert(await bcrypt.compare('Temporary-test-only-123!',user.accounts[0].password));
      const org=await tx.organization.create({data:{name:'Test Church',industry:'CHURCH',members:{create:{userId:user.id,role:'OWNER'}}}});
      const expense=await tx.expenseTracker.create({data:{name:'Test expense',amount:25,author:user.id,organizationId:org.id}});
      await tx.expenseTracker.update({where:{id:expense.id},data:{status:'approved'}});
      const income=await tx.income.create({data:{name:'Test offering',amount:100,source:'Offering',userId:user.id,organizationId:org.id}});
      assert.equal(income.amount-expense.amount,75);
      const chat=await tx.chatSession.create({data:{userId:user.id,organizationId:org.id,messages:{create:{role:'user',content:'Test'}}},include:{messages:true}});
      assert.equal(chat.messages.length,1);
      await tx.chatSession.delete({where:{id:chat.id}});
      assert.equal(await tx.chatMessage.count({where:{sessionId:chat.id}}),0);
      throw marker;
    }, {timeout:30000});
  } catch(error) { if(error!==marker) throw error; }
  console.log('PASS: PostgreSQL user/account relations, password hashing, church membership, income, budget approval, and chat cascade; test data rolled back.');
})().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>prisma.$disconnect());
