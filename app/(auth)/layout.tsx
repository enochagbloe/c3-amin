import React from "react";
import { Toaster } from "sonner";

const AuthLayout = (
  { children }: { children: React.ReactNode },
) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <section className="min-w-full rounded-[10px] px-4 py-10 sm:min-w-[512px] sm:px-8">
        {children}
        <Toaster />
      </section>
    </main>
  );
};

export default AuthLayout;
