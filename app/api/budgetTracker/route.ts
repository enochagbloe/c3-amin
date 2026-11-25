import {NextResponse} from "next/server";
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireOrganizationFinance } from '@/lib/organizations/access';
import { UnauthorizedError } from '@/lib/http.error';
import { requestResponse } from '@/lib/budget-requests/http';

export async function GET(request:Request) {
 const response = await requestResponse(async()=>{
  const session=await auth(); if(!session?.user?.id)throw new UnauthorizedError();
  const search=new URL(request.url).searchParams;const orgId=search.get('orgId');
  if(orgId)await requireOrganizationFinance(orgId);
  const status=search.get('status');
  const expenses=await prisma.expenseTracker.findMany({where:{...(orgId?{organizationId:orgId}:{organizationId:null,author:session.user.id}),...(['approved','pending','rejected'].includes(status??'')?{status:status as 'approved'|'pending'|'rejected'}:{})},orderBy:{date:'desc'}});
  return expenses;
 });
 if(!response.ok)return response;
 const result=await response.json();
 return NextResponse.json({...result,totalAmount:result.data.reduce((sum:number,item:{amount:number})=>sum+Number(item.amount),0)},{headers:{'Cache-Control':'private, no-store'}});
}
