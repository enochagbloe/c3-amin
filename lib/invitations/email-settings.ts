import "server-only";
import { requireOrganizationOwner } from "@/lib/organizations/access";

export async function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  return apiKey && fromEmail ? { apiKey, fromEmail } : null;
}

export async function emailSettingsView(organizationId: string) {
  await requireOrganizationOwner(organizationId);
  return { configured: Boolean(await emailConfiguration()) };
}
