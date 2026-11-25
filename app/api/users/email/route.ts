import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { NotFoundError, UnauthorizedError } from '@/lib/http.error';

import {z} from 'zod';
export async function POST(req:Request) {
 try {
  if(!(await auth())?.user?.id) throw new UnauthorizedError();
  const {email}=z.object({email:z.string().email()}).parse(await req.json());
  const user=await prisma.user.findUnique({where:{email}});
  if(!user) throw new NotFoundError('User');
  return NextResponse.json({success:true,data:user});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
