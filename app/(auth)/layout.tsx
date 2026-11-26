import React from "react";
import { Toaster } from "sonner";

const AuthLayout = (
  { children }: { children: React.ReactNode },
) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <section className="w-full max-w-md px-6 py-12">
        {children}
        <Toaster />
      </section>
    </main>
  );
};

export default AuthLayout;
