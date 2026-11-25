import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { NotFoundError, UnauthorizedError } from '@/lib/http.error';
const safeAccount={id:true,userId:true,name:true,email:true,username:true,image:true,provider:true,providerAccountId:true,createdAt:true,updatedAt:true};

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
 try {
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const {id}=await params;
  const account=await prisma.account.findFirst({where:{id,userId:session.user.id},select:safeAccount});
  if(!account)throw new NotFoundError('Account');
  return NextResponse.json({success:true,data:account});
 }catch(error){return handleError(error,'api') as APIErrorResponse;}
}
