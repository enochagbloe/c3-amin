import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { requireOrganizationOwner } from "@/lib/organizations/access";
import {
  ForbiddenError,
  NotFoundError,
  RequestError,
  UnauthorizedError,
} from "@/lib/http.error";
import { z } from "zod";
import { emailConfiguration } from "./email-settings";
import {
  EmailDeliveryError,
  sendInvitationEmail,
  invitationDelivery,
} from "./resend";

const safeInvitation = {
  id: true,
  email: true,
  status: true,
  expiresAt: true,
  emailStatus: true,
  emailError: true,
  lastSentAt: true,
  acceptedAt: true,
  createdAt: true,
};
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
function inviteToken(token: string) {
  return z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/)
    .parse(token);
}
export async function listInvitations(organizationId: string) {
  await requireOrganizationOwner(organizationId);
  return prisma.organizationInvitation.findMany({
    where: { organizationId },
    select: safeInvitation,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
export async function sendInvitation(organizationId: string, input: unknown) {
  const owner = await requireOrganizationOwner(organizationId);
  const { email, delivery } = z
    .object({
      delivery: z.enum(["email", "link"]).default("email"),
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
    })
    .parse(input);
  const configuration = delivery === "email" ? await emailConfiguration() : null;
  if (delivery === "email" && !configuration)
    throw new RequestError(
      503,
      "Email invitations are not configured on the server",
    );
  const origin = process.env.AUTH_URL;
  if (!origin)
    throw new RequestError(503, "The application URL is not configured");
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (
    existingUser &&
    (await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { organizationId, userId: existingUser.id },
      },
    }))
  )
    throw new RequestError(409, "This email already belongs to a team member");
  const prior = await prisma.organizationInvitation.findUnique({
    where: { organizationId_email: { organizationId, email } },
  });
  if (
    prior?.status === "PENDING" &&
    prior.emailStatus !== "FAILED" &&
    Date.now() - prior.updatedAt.getTime() < 30000
  )
    throw new RequestError(
      429,
      "Wait 30 seconds before creating another invitation for this address",
    );
  const token = randomBytes(32).toString("base64url"),
    tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  const invitation = await prisma.organizationInvitation.upsert({
    where: { organizationId_email: { organizationId, email } },
    create: {
      organizationId,
      email,
      invitedById: owner.userId,
      tokenHash,
      expiresAt,
      emailStatus: delivery === "link" ? "NOT_SENT" : "PENDING",
    },
    update: {
      invitedById: owner.userId,
      tokenHash,
      expiresAt,
      status: "PENDING",
      acceptedAt: null,
      acceptedById: null,
      emailStatus: delivery === "link" ? "NOT_SENT" : "PENDING",
      emailId: null,
      lastSentAt: null,
      emailError: null,
    },
  });
  const invitationUrl = new URL(`/invitations/${token}`, origin).toString();
  if (delivery === "link") {
    const safe = await prisma.organizationInvitation.findUniqueOrThrow({ where: { id: invitation.id }, select: safeInvitation });
    return { ...safe, invitationUrl };
  }
  try {
    const emailId = await sendInvitationEmail({
      ...configuration!,
      email,
      organization: owner.organizationName,
      inviter: owner.name,
      url: invitationUrl,
      deliveryKey: `organization-invite/${invitation.id}/${tokenHash.slice(0, 20)}`,
    });
    await prisma.organizationInvitation.updateMany({
      where: { id: invitation.id, tokenHash },
      data: { emailStatus: "SENT", emailId, lastSentAt: new Date() },
    });
  } catch (error) {
    await prisma.organizationInvitation.updateMany({
      where: { id: invitation.id, tokenHash },
      data: {
        emailStatus: "FAILED",
        emailError:
          error instanceof EmailDeliveryError
            ? error.message
            : "Email delivery could not connect. Please try again.",
      },
    });
  }
  return prisma.organizationInvitation.findUniqueOrThrow({
    where: { id: invitation.id },
    select: safeInvitation,
  });
}
export async function revokeInvitation(organizationId: string, id: string) {
  await requireOrganizationOwner(organizationId);
  z.string().uuid().parse(id);
  const result = await prisma.organizationInvitation.updateMany({
    where: { id, organizationId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (!result.count) throw new NotFoundError("Pending invitation");
  return { revoked: true };
}
export async function checkDelivery(organizationId: string, id: string) {
  await requireOrganizationOwner(organizationId);
  z.string().uuid().parse(id);
  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id, organizationId },
  });
  if (!invitation?.emailId) throw new NotFoundError("Sent invitation");
  const configuration = await emailConfiguration();
  if (!configuration)
    throw new RequestError(503, "Email delivery is not configured");
  try {
    const emailStatus = await invitationDelivery(
      configuration.apiKey,
      invitation.emailId,
    );
    return await prisma.organizationInvitation.update({
      where: { id },
      data: { emailStatus },
      select: safeInvitation,
    });
  } catch (error) {
    throw new RequestError(
      502,
      error instanceof EmailDeliveryError
        ? error.message
        : "Unable to check delivery status",
    );
  }
}
export async function invitationDetails(token: string) {
  inviteToken(token);
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { tokenHash: hash(token) },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!invitation) throw new NotFoundError("Invitation");
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      })
    : null;
  return {
    organization: invitation.organization,
    status: invitation.status,
    expired: invitation.expiresAt < new Date(),
    emailHint: invitation.email.replace(/^(.).*(@.*)$/, "$1***$2"),
    signedIn: Boolean(user),
    emailMatches: Boolean(
      user && user.email.toLowerCase() === invitation.email.toLowerCase(),
    ),
  };
}
export async function acceptInvitation(token: string) {
  inviteToken(token);
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const userId = session.user.id;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, status: true },
  });
  if (user.status !== "active")
    throw new ForbiddenError("An active account is required");
  return prisma.$transaction(
    async (tx) => {
      const invitation = await tx.organizationInvitation.findUnique({
        where: { tokenHash: hash(token) },
      });
      if (!invitation || invitation.status === "REVOKED")
        throw new NotFoundError("Active invitation");
      if (invitation.email !== user.email.toLowerCase())
        throw new ForbiddenError(
          "Sign in with the email address that received this invitation",
        );
      if (invitation.status === "ACCEPTED") {
        if (invitation.acceptedById !== userId) throw new ForbiddenError();
        return { organizationId: invitation.organizationId };
      }
      if (invitation.expiresAt < new Date())
        throw new RequestError(
          410,
          "This invitation has expired. Ask the owner to send a new one",
        );
      const result = await tx.organizationInvitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedById: userId,
        },
      });
      if (!result.count)
        throw new RequestError(409, "This invitation has already been used");
      await tx.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: userId,
            organizationId: invitation.organizationId,
          },
        },
        create: {
          userId: userId,
          organizationId: invitation.organizationId,
          role: "MEMBER",
        },
        update: {},
      });
      return { organizationId: invitation.organizationId };
    },
    { isolationLevel: "Serializable", maxWait: 10000, timeout: 30000 },
  );
}
