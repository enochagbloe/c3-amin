import "server-only";
import { after } from "next/server";
import { createHash, createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { RequestError } from "@/lib/http.error";
import { resetPasswordSchema, resetRequestSchema } from "./validation";
import { sendResetEmail } from "./email";
export const resetMessage = "If an active account exists for that email, we’ll send a password reset link. Check your inbox and spam folder.";
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const invalidLink = () => new RequestError(400, "This reset link is invalid, expired or already used. Request a new one.");
export async function requestPasswordReset(input: unknown) {
  const { email } = resetRequestSchema.parse(input);
  const secret = process.env.AUTH_SECRET, origin = process.env.AUTH_URL;
  if (!secret || !origin) return { message: resetMessage };
  const key = createHmac("sha256", secret).update(`password-reset:${email}`).digest("hex"), now = new Date();
  let allowed = false;
  try {
    allowed = await prisma.$transaction(async tx => {
      const bucket = await tx.passwordResetThrottle.findUnique({ where: { key } });
      const withinHour = bucket && now.getTime() - bucket.windowStart.getTime() < 3600000;
      if (withinHour && (bucket.count >= 3 || now.getTime() - bucket.lastRequestedAt.getTime() < 60000)) return false;
      await tx.passwordResetThrottle.upsert({ where: { key }, create: { key, windowStart: now, lastRequestedAt: now, count: 1 }, update: { windowStart: withinHour ? bucket!.windowStart : now, lastRequestedAt: now, count: withinHour ? bucket!.count + 1 : 1 } });
      return true;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code))) throw error;
  }
  // Account lookup and delivery happen after the generic response, hiding delivery timing.
  if (allowed) after(async () => {
    try {
      const account = await prisma.account.findFirst({ where: { provider: "credentials", password: { not: null }, user: { email: { equals: email, mode: "insensitive" }, status: "active" } }, select: { id: true, user: { select: { email: true } } } });
      if (!account) return;
      const token = randomBytes(32).toString("base64url"), tokenHash = hash(token), issued = new Date();
      const reset = await prisma.passwordResetToken.upsert({ where: { accountId: account.id }, create: { accountId: account.id, tokenHash, expiresAt: new Date(issued.getTime() + 1800000) }, update: { tokenHash, expiresAt: new Date(issued.getTime() + 1800000), createdAt: issued } });
      const url = new URL("/reset-password", origin); url.hash = `token=${token}`;
      if (!(await sendResetEmail(account.user.email, url.toString(), `${reset.id}/${tokenHash.slice(0, 20)}`))) await prisma.passwordResetToken.deleteMany({ where: { accountId: account.id, tokenHash } });
    } catch { console.error("Password reset delivery could not be completed"); }
  });
  return { message: resetMessage };
}
export async function confirmPasswordReset(input: unknown) {
  const data = resetPasswordSchema.parse(input);
  if (Buffer.byteLength(data.password, "utf8") > 72) throw new RequestError(400, "The password must be at most 72 UTF-8 bytes. Use fewer characters.");
  const tokenHash = hash(data.token);
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { account: { select: { userId: true, user: { select: { status: true } } } } } });
  if (!token || token.expiresAt <= new Date() || token.account.user.status !== "active") throw invalidLink();
  const password = await bcrypt.hash(data.password, 12);
  return prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: token.account.userId }, select: { status: true } });
    if (user?.status !== "active") throw invalidLink();
    const consumed = await tx.passwordResetToken.deleteMany({ where: { accountId: token.accountId, tokenHash, expiresAt: { gt: new Date() } } });
    if (consumed.count !== 1) throw invalidLink();
    await tx.account.update({ where: { id: token.accountId }, data: { password } });
    await tx.user.update({ where: { id: token.account.userId }, data: { sessionVersion: { increment: 1 } } });
    return { reset: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 });
}
