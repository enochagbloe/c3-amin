import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '@/lib/http.error';

import {z} from 'zod';
export async function POST(req:Request) {
 try {
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const {email}=z.object({email:z.string().email()}).parse(await req.json());
  const user=await prisma.user.findUnique({where:{email}});
  if(!user) throw new NotFoundError('User');
  if(user.id!==session.user.id){
   const shared=await prisma.organization.findFirst({where:{AND:[{members:{some:{userId:session.user.id,role:{in:['OWNER','ADMIN']}}}},{members:{some:{userId:user.id}}}]}});
   if(!shared)throw new ForbiddenError();
  }

  return NextResponse.json({success:true,data:user});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
