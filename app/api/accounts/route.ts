import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { UnauthorizedError } from '@/lib/http.error';
const safeAccount={id:true,userId:true,name:true,email:true,username:true,image:true,provider:true,providerAccountId:true,createdAt:true,updatedAt:true};

export async function GET() {
 try {
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const accounts=await prisma.account.findMany({where:{userId:session.user.id},select:safeAccount});
  return NextResponse.json({success:true,data:accounts});
 }catch(error){return handleError(error,'api') as APIErrorResponse;}
}
export async function POST(){return NextResponse.json({success:false,error:{message:'Use the sign-up form to create an account'}},{status:405});}
