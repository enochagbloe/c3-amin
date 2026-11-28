import prisma from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { visibility, type RequestContext } from "./access";
import { z } from "zod";
type Notice = { organizationId: string; requestId?: string; actorId: string | null; recipients: (string | null)[]; title: string; message: string; href?: string; ownerOnly?: boolean };
export async function organizationOwners(tx: Prisma.TransactionClient, organizationId: string) { return (await tx.organizationMember.findMany({ where: { organizationId, role: "OWNER" }, select: { userId: true } })).map(member => member.userId); }
export async function notifyOrganization(tx: Prisma.TransactionClient, input: Notice) {
  const recipients = [...new Set(input.recipients.filter((id): id is string => Boolean(id)))];
  if (!recipients.length) return;
  const actor = input.actorId ? await tx.user.findUnique({ where: { id: input.actorId }, select: { name: true } }) : null;
  await tx.budgetNotification.createMany({ data: recipients.map(recipientId => ({ organizationId: input.organizationId, ownerOnly: input.ownerOnly ?? false, requestId: input.requestId ?? null, recipientId, actorId: actor ? input.actorId : null, actorName: actor?.name ?? "System", title: input.title, message: input.message, href: input.href ?? (input.requestId ? `/org/${input.organizationId}/budget-requests/${input.requestId}` : `/org/${input.organizationId}/dashboard`) })) });
}
export const notifyBudget = notifyOrganization;
// For existing server actions, notification failure must not falsely report that a saved operation failed.
export async function recordOwnerActivity(input: Omit<Notice, "recipients"> & { alsoNotify?: string[] }) {
  try { await prisma.$transaction(async tx => {
    const owners = await organizationOwners(tx, input.organizationId);
    await notifyOrganization(tx, { ...input, recipients: owners, ownerOnly: true });
    const others = (input.alsoNotify ?? []).filter(id => !owners.includes(id));
    if (others.length) await notifyOrganization(tx, { ...input, recipients: others, ownerOnly: false });
  }, { maxWait: 10000, timeout: 30000 }); }
  catch { console.error("Organization activity notification could not be recorded"); }
}
function notificationWhere(context: RequestContext): Prisma.BudgetNotificationWhereInput {
  return { organizationId: context.organizationId, recipientId: context.userId, AND: [{ OR: [{ requestId: null }, { request: visibility(context) }] }, ...(context.isOwner ? [] : [{ ownerOnly: false }])] };
}
export async function listNotifications(context: RequestContext, input?: unknown) {
  const { unreadOnly, cursor } = z.object({ unreadOnly: z.boolean().default(false), cursor: z.string().uuid().optional() }).parse(input ?? {});
  if (context.isOwner) await prisma.$transaction(async tx => {
    const expired = await tx.organizationInvitation.findMany({ where: { organizationId: context.organizationId, status: "PENDING", expiresAt: { lt: new Date() }, expiryNotifiedAt: null }, select: { id: true, email: true }, take: 10 });
    for (const invitation of expired) {
      const claimed = await tx.organizationInvitation.updateMany({ where: { id: invitation.id, status: "PENDING", expiresAt: { lt: new Date() }, expiryNotifiedAt: null }, data: { expiryNotifiedAt: new Date() } });
      if (claimed.count) await notifyOrganization(tx, { organizationId: context.organizationId, actorId: null, recipients: await organizationOwners(tx, context.organizationId), ownerOnly: true, title: "Invitation expired", message: `The invitation for ${invitation.email} has expired.`, href: `/org/${context.organizationId}/settings?tab=team` });
    }
  }, { maxWait: 10000, timeout: 30000 });
  const where = notificationWhere(context);
  const [rows, unread] = await prisma.$transaction([
    prisma.budgetNotification.findMany({ where: { ...where, ...(unreadOnly ? { readAt: null } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 31, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: { id: true, requestId: true, title: true, message: true, actorName: true, actorId: true, href: true, readAt: true, createdAt: true } }),
    prisma.budgetNotification.count({ where: { ...where, readAt: null } }),
  ]);
  return { items: rows.slice(0, 30), unread, nextCursor: rows.length > 30 ? rows[29].id : null };
}
export async function readNotifications(context: RequestContext, input: unknown) {
  const { id } = z.object({ id: z.string().uuid().optional() }).strict().parse(input);
  await prisma.budgetNotification.updateMany({ where: { ...notificationWhere(context), ...(id ? { id } : {}), readAt: null }, data: { readAt: new Date() } });
  return { read: true };
}
