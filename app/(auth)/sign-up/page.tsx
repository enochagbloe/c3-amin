 
"use client";

import AuthForm from "@/components/forms/AuthForms";
import { signUpWithCredentials } from "@/lib/actions/auth.actions";
import { SignUpSchema } from "@/lib/validations";

const SignUp = () => {
  return (
    <main className="">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="text-sm text-muted-foreground">Sign up with your email and password</p>
      <AuthForm
        schema={SignUpSchema}
        defaultValues={{ email: "", password: "" , username: "", name: "" }}
        formType="SIGN_UP"
        onSubmit={signUpWithCredentials}
      />
    </main>
  );
};

export default SignUp;
