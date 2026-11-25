import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { NotFoundError, UnauthorizedError } from '@/lib/http.error';
const safeAccount={id:true,userId:true,name:true,email:true,username:true,image:true,provider:true,providerAccountId:true,createdAt:true,updatedAt:true};

import {z} from 'zod';
export async function POST(req:Request) {
 try {
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const {providerAccountId}=z.object({providerAccountId:z.string().min(1)}).parse(await req.json());
  const account=await prisma.account.findFirst({where:{providerAccountId,userId:session.user.id},select:safeAccount});
  if(!account)throw new NotFoundError('Account');
  return NextResponse.json({success:true,data:account});
 }catch(error){return handleError(error,'api') as APIErrorResponse;}
}
