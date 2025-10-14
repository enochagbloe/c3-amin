import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SignInSchema } from "./lib/validations";
import { IAccountDoc } from "./database/account.model";
import { IUserDoc } from "./database/user.model";
import { api } from "./lib/api";
import bcrypt from "bcryptjs" 

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials){
        const validatedFields = SignInSchema.safeParse(credentials);
        console.log("✅ Validated Fields:", validatedFields);
         if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          console.log("🔑 Email and Password:", { email, password });
          // get the account api by email as ActionResponse<IAccountDoc>
          const { data: existingAccount } = (await api.accounts.getByProvider(
            email
          )) as ActionResponse<IAccountDoc>;
          console.log("📜 Existing Account:", existingAccount);

          // if the existingAccount is not found return null
          if (!existingAccount) {
            console.log("❌ Account not found", email);
            return null;
          }

          const { data: existingUser } = (await api.users.getById(
            existingAccount.userId.toString()
          )) as ActionResponse<IUserDoc>;
          console.log("👤 Existing User:", existingUser);

          if (!existingUser) {
            console.log("❌ User not found", existingAccount.userId);
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            password,
            existingAccount.password!
          );
          console.log("🔐 Password Valid", isValidPassword)

          if (isValidPassword) {
            const userObject = {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              image: existingUser.image,
            };
            console.log("✅ User Object:", userObject);
            return userObject;
          }
        }
        return null;
      }
    })
  ],
    callbacks: {
    // callback for sessions
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
    // callback for jwt token
    async jwt({ token, account }) {
      if (account) {
        const { data: existingAccount, success } =
          (await api.accounts.getByProvider(
            account.type === "credentials"
              ? token.email!
              : account.providerAccountId
          )) as ActionResponse<IAccountDoc>;

        if (!success || !existingAccount) return token;

        const userId = existingAccount.userId;

        if (userId) token.sub = userId.toString();
      }

      return token;
    },
    // callback when the user logs in
    async signIn({ user, account }) {
      // when the user tries logging in with emil and password
      if (account?.type === "credentials") return true;
      if (!account || !user) return false;

      return true;
    },
  },
});
 