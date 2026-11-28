import "server-only";
import { emailConfiguration } from "@/lib/invitations/email-settings";
export async function sendResetEmail(email: string, url: string, deliveryId: string) {
  const config = await emailConfiguration();
  if (!config) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `password-reset/${deliveryId}` },
      body: JSON.stringify({ from: `C3 Church <${config.fromEmail}>`, to: [email], subject: "Reset your C3 Church password",
        text: `Reset your password: ${url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, ignore this email. Your password will stay unchanged.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:24px;color:#171717"><h1>Reset your password</h1><p>Use the link below to choose a new password for your C3 Church account.</p><p><a href="${url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Reset password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, ignore this email. Your password will stay unchanged.</p></div>` }),
    });
    // Do not log provider responses: reset URLs and recipient data must stay private.
    return response.ok;
  } catch { return false; }
}
