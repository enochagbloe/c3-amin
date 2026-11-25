"use server";
import prisma from '@/lib/prisma';
import { signIn } from '@/auth';
import action from '../handler/action';
import handleError from '../handler/error';
import { SignInSchema, SignUpSchema } from '../validations';
import bcrypt from 'bcryptjs';

export async function signUpWithCredentials(params: AuthCredentials): Promise<ActionResponse> {
  const validation = await action({ params, schema: SignUpSchema });
  if (validation instanceof Error) return handleError(validation) as ErrorResponse;
  const { name, username, email, password } = SignUpSchema.parse(params);
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.$transaction(async tx => {
      if (await tx.user.findUnique({ where: { email } })) throw new Error('Email is already registered');
      if (await tx.user.findUnique({ where: { username } })) throw new Error('Username is already taken');
      await tx.user.create({ data: {
        name, username, email,
        accounts: { create: { name, username, email, password: hashedPassword,
          provider: 'credentials', providerAccountId: email } },
      } });
    });
    return { success: true };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function signInWithCredentials(params: Pick<AuthCredentials, 'email' | 'password'>): Promise<ActionResponse> {
  const validation = await action({ params, schema: SignInSchema });
  if (validation instanceof Error) return handleError(validation) as ErrorResponse;
  try {
    await signIn('credentials', { ...SignInSchema.parse(params), redirect: false });
    return { success: true };
  } catch (error) { return handleError(error) as ErrorResponse; }
}
