import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { SignInSchema } from './lib/validations';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [Credentials({
    async authorize(credentials) {
      const parsed = SignInSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: 'credentials', providerAccountId: email } },
        include: { user: true },
      });
      if (!account?.password || account.user.status !== 'active' ||
          !(await bcrypt.compare(password, account.password))) return null;
      const { id, name, image } = account.user;
      return { id, name, image, email: account.user.email, sessionVersion: account.user.sessionVersion };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (!token.sub) return null;
      const current = await prisma.user.findUnique({ where: { id: token.sub }, select: { status: true, sessionVersion: true } });
      if (user) token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      if (!current || current.status !== 'active' || current.sessionVersion !== (token.sessionVersion ?? 0)) return null;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
});
