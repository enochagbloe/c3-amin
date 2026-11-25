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
      return { id, name, image, email: account.user.email };
    },
  })],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
});
