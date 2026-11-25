import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { RequestError } from "@/lib/http.error";
import { requireOrganizationOwner } from "@/lib/organizations/access";
function encryptionKey() {
  const secret = process.env.MAIL_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret)
    throw new RequestError(
      503,
      "Email settings cannot be secured until the app secret is configured",
    );
  return createHash("sha256").update(`c3-email-v1:${secret}`).digest();
}
function encrypt(value: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((value) => value.toString("base64url"))
    .join(".");
}
function decrypt(value: string) {
  const [iv, tag, data] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
export async function emailConfiguration(organizationId: string) {
  const settings = await prisma.organizationEmailSettings.findUnique({
    where: { organizationId },
  });
  if (settings)
    return {
      apiKey: decrypt(settings.apiKeyEncrypted),
      fromEmail: settings.fromEmail,
    };
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    };
  return null;
}
export async function emailSettingsView(organizationId: string) {
  await requireOrganizationOwner(organizationId);
  const settings = await prisma.organizationEmailSettings.findUnique({
    where: { organizationId },
    select: { fromEmail: true },
  });
  return {
    configured: Boolean(
      settings || (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    ),
    fromEmail: settings?.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? "",
  };
}
export async function saveEmailSettings(
  organizationId: string,
  input: unknown,
) {
  await requireOrganizationOwner(organizationId);
  const data = z
    .object({
      fromEmail: z.string().trim().email(),
      apiKey: z
        .string()
        .trim()
        .regex(/^re_[A-Za-z0-9_-]{10,}$/)
        .optional(),
    })
    .parse(input);
  const existing = await prisma.organizationEmailSettings.findUnique({
    where: { organizationId },
  });
  const apiKey =
    data.apiKey ?? (existing ? undefined : process.env.RESEND_API_KEY);
  if (!apiKey && !existing)
    throw new RequestError(400, "Add your Resend API key");
  await prisma.organizationEmailSettings.upsert({
    where: { organizationId },
    create: {
      organizationId,
      fromEmail: data.fromEmail,
      apiKeyEncrypted: apiKey ? encrypt(apiKey) : existing!.apiKeyEncrypted,
    },
    update: {
      fromEmail: data.fromEmail,
      ...(apiKey ? { apiKeyEncrypted: encrypt(apiKey) } : {}),
    },
  });
  return emailSettingsView(organizationId);
}
