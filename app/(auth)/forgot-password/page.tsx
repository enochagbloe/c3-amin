import { ForgotPasswordForm } from "@/components/forms/PasswordResetForms";
export const metadata = { title: "Forgot your password? · C3 Church", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <main><h1 className="text-2xl font-bold">Forgot your password?</h1><p className="mt-2 text-sm text-muted-foreground">Enter your account email and we’ll send you a reset link.</p><ForgotPasswordForm /></main>; }
