import prisma from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { visibility, type RequestContext } from "./access";
import { z } from "zod";

export async function notifyBudget(tx: Prisma.TransactionClient, input: {
  organizationId: string; requestId: string; actorId: string; recipients: (string | null)[]; title: string; message: string;
}) {
  const recipients = [...new Set(input.recipients.filter((id): id is string => Boolean(id) && id !== input.actorId))];
  if (recipients.length) await tx.budgetNotification.createMany({ data: recipients.map(recipientId => ({ organizationId: input.organizationId, requestId: input.requestId, recipientId, title: input.title, message: input.message })) });
}
function notificationWhere(context: RequestContext) {
  return { organizationId: context.organizationId, recipientId: context.userId, request: visibility(context) };
}
export async function listNotifications(context: RequestContext) {
  const where = notificationWhere(context);
  const [items, unread] = await prisma.$transaction([
    prisma.budgetNotification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, select: { id: true, requestId: true, title: true, message: true, readAt: true, createdAt: true } }),
    prisma.budgetNotification.count({ where: { ...where, readAt: null } }),
  ]);
  return { items, unread };
}
export async function readNotifications(context: RequestContext, input: unknown) {
  const { id } = z.object({ id: z.string().uuid().optional() }).strict().parse(input);
  await prisma.budgetNotification.updateMany({ where: { ...notificationWhere(context), ...(id ? { id } : {}), readAt: null }, data: { readAt: new Date() } });
  return { read: true };
}
