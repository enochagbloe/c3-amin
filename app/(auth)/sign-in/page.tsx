"use client";

import AuthForm from "@/components/forms/AuthForms";
import { signInWithCredentials } from "@/lib/actions/auth.actions";
import { SignInSchema } from "@/lib/validations";

const SignInPage =  () => {
  return (
    <main>
      <h1 className="text-2xl font-bold">Welcome Back</h1>
      <p className="text-sm text-muted-foreground">Sign in with your email and password</p>
      <AuthForm
        schema={SignInSchema}
        defaultValues={{ email: "", password: "" }}
        formType="SIGN_IN"
        onSubmit={signInWithCredentials}
      />
    </main>
  );
};

export default SignInPage;
