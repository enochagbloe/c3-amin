import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import handleError from '@/lib/handler/error';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '@/lib/http.error';

import {UserSchema} from '@/lib/validations';
type Context={params:Promise<{id:string}>};
async function requireUser(id:string,modify=false) {
 const session=await auth();
 if(!session?.user?.id) throw new UnauthorizedError();
 const actor=await prisma.user.findUnique({where:{id:session.user.id}});
 if(modify&&actor?.id!==id&&actor?.role!=='admin') throw new ForbiddenError('Access denied');
 return actor;
}
export async function GET(_:Request,{params}:Context) {
 try {
  const {id}=await params; await requireUser(id);
  const user=await prisma.user.findUnique({where:{id}});
  if(!user) throw new NotFoundError('User');
  return NextResponse.json({success:true,data:user});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
export async function PUT(req:Request,{params}:Context) {
 try {
  const {id}=await params; const actor=await requireUser(id,true);
  const data=UserSchema.partial().parse(await req.json());
  if(actor?.role!=='admin'){delete data.role;delete data.staffId;delete data.status;}
  const user=await prisma.user.update({where:{id},data});
  return NextResponse.json({success:true,data:user,message:'User updated successfully'});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
export async function DELETE(_:Request,{params}:Context) {
 try {
  const {id}=await params; await requireUser(id,true);
  await prisma.user.delete({where:{id}});
  return NextResponse.json({success:true,message:'User deleted successfully'});
 } catch(error) {return handleError(error,'api') as APIErrorResponse;}
}
