import { invitationEmail } from "./email-template";
export class EmailDeliveryError extends Error {}
export async function sendInvitationEmail(input: {
  apiKey: string;
  fromEmail: string;
  email: string;
  organization: string;
  inviter: string;
  url: string;
  deliveryKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.deliveryKey,
    },
    body: JSON.stringify({
      from: `C3 Church <${input.fromEmail}>`,
      to: [input.email],
      ...invitationEmail(input.organization, input.inviter, input.url),
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.id)
    throw new EmailDeliveryError(
      typeof result.message === "string"
        ? result.message.slice(0, 400)
        : "Resend could not send this invitation",
    );
  return result.id as string;
}
export async function invitationDelivery(apiKey: string, emailId: string) {
  const response = await fetch(
    `https://api.resend.com/emails/${encodeURIComponent(emailId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new EmailDeliveryError(
      "Resend could not retrieve delivery status. Check that the API key has email read access.",
    );
  const result = await response.json();
  return String(result.last_event ?? "sent").toUpperCase();
}
