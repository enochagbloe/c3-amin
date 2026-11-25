import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireOrganizationFinance } from '@/lib/organizations/access';
import { UnauthorizedError } from '@/lib/http.error';
import { requestResponse } from '@/lib/budget-requests/http';

export async function GET(request:Request) {
 return requestResponse(async()=>{
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const search=new URL(request.url).searchParams;const orgId=search.get('orgId');
  if(orgId)await requireOrganizationFinance(orgId);
  return prisma.income.findMany({where:{...(orgId?{organizationId:orgId}:{organizationId:null,userId:session.user.id}),...(search.get('incomeId')?{id:search.get('incomeId')!}:{})},orderBy:{date:'desc'}});
 });
}
