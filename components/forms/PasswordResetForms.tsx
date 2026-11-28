"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { budgetApi } from "@/lib/budget-requests/client";
import { resetPasswordSchema } from "@/lib/password-reset/validation";
export function ForgotPasswordForm() {
  const [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await budgetApi<{ message: string }>("/api/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); setMessage(result.message); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <div className="mt-8 space-y-5">{message ? <p role="status" className="text-sm">{message}</p> : <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="reset-email">Email address</Label><Input id="reset-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? "Requesting…" : "Send reset link"}</Button></form>}<Link href="/sign-in" className="inline-block text-sm underline">Back to sign in</Link></div>;
}
export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null), [password, setPassword] = useState(""), [confirmPassword, setConfirmPassword] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  useEffect(() => { setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) { setError(parsed.error.issues.map(issue => issue.message).join(" ")); return; }
    setBusy(true);
    try { await budgetApi("/api/password-reset/confirm", { method: "POST", body: JSON.stringify(parsed.data) }); setDone(true); setPassword(""); setConfirmPassword(""); window.history.replaceState(null, "", "/reset-password"); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  if (token === null) return <p className="mt-8 text-sm">Loading reset link…</p>;
  if (done) return <div className="mt-8 space-y-5"><p role="status">Your password has been reset. Sign in with your new password. Previous sessions have been signed out.</p><Button asChild className="w-full"><Link href="/sign-in">Sign in</Link></Button></div>;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return <div className="mt-8 space-y-4"><p role="alert">This reset link is invalid or missing.</p><Link href="/forgot-password" className="text-sm underline">Request a new reset link</Link></div>;
  return <form onSubmit={submit} className="mt-8 space-y-5"><p className="text-sm text-muted-foreground">Use 8–72 characters, including uppercase, lowercase, a number and a symbol.</p><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={busy} /></div>{error && <p role="alert" className="text-sm text-destructive">{error} <Link href="/forgot-password" className="underline">Request another link</Link></p>}<Button className="w-full" disabled={busy}>{busy ? "Resetting…" : "Reset password"}</Button></form>;
}
