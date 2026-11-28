import { ResetPasswordForm } from "@/components/forms/PasswordResetForms";
export const metadata = { title: "Choose a new password · C3 Church", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function Page() { return <main><h1 className="text-2xl font-bold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">Reset your password securely using the link sent to your email.</p><ResetPasswordForm /></main>; }
