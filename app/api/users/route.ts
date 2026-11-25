import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { UnauthorizedError, ForbiddenError } from '@/lib/http.error';

import { UserSchema } from '@/lib/validations';
export async function GET() {
 try {
  const session=await auth();if(!session?.user?.id)throw new UnauthorizedError();
  const userId=session.user.id;
  const rosters=await prisma.organizationMember.findMany({where:{userId,role:{in:['OWNER','ADMIN']}},select:{organizationId:true}});
  const shared=await prisma.organizationMember.findMany({where:{organizationId:{in:rosters.map(member=>member.organizationId)}},select:{userId:true}});
  const users = await prisma.user.findMany({ where:{id:{in:[userId,...shared.map(member=>member.userId)]}}, select: {id:true,staffId:true,name:true,email:true,status:true,createdAt:true,role:true} });
  return NextResponse.json({success:true,data:users.map(user=>({...user,date:user.createdAt,userId:user.id}))});
 } catch(error) { return handleError(error,'api') as APIErrorResponse; }
}
export async function POST(req:Request) {
 try {
  const session=await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const actor=await prisma.user.findUnique({where:{id:session.user.id}});
  if(actor?.role!=='admin') throw new ForbiddenError('Admin access required');
  const user=await prisma.user.create({data:UserSchema.parse(await req.json())});
  return NextResponse.json({success:true,data:user},{status:201});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
