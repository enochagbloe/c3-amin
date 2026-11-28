import prisma from "@/lib/prisma";
import { z } from "zod";
import { ForbiddenError, NotFoundError } from "@/lib/http.error";
import { visibility, type RequestContext } from "@/lib/budget-requests/access";
const labels: Record<string, string> = { dashboard: "Home", expenses: "Expenses", income: "Income", analytics: "Analytics", settings: "Settings", "budget-requests": "Budget requests", "budget-requests/new": "New budget request", propmt: "Chat" };
function allowed(context: RequestContext, suffix: string) { return !["expenses", "income", "analytics", "propmt"].includes(suffix) || context.canFinance; }
export async function workspaceRecents(context: RequestContext, input?: unknown) {
  const prefix = `/org/${context.organizationId}/`;
  if (input !== undefined) {
    const { path } = z.object({ path: z.string().max(250) }).strict().parse(input);
    if (!path.startsWith(prefix)) throw new ForbiddenError();
    const suffix = path.slice(prefix.length);
    let requestId: string | null = null;
    if (!Object.hasOwn(labels, suffix)) {
      const match = /^budget-requests\/([a-f0-9-]{36})$/.exec(suffix);
      if (!match) throw new NotFoundError("Page");
      const request = await prisma.budgetRequest.findFirst({ where: { AND: [visibility(context), { id: match[1] }] }, select: { id: true } });
      if (!request) throw new NotFoundError("Page");
      requestId = request.id;
    }
    if (!allowed(context, suffix)) throw new ForbiddenError();
    await prisma.organizationRecent.upsert({ where: { userId_organizationId_path: { userId: context.userId, organizationId: context.organizationId, path } }, create: { userId: context.userId, organizationId: context.organizationId, path, requestId }, update: { updatedAt: new Date() } });
  }
  const visits = await prisma.organizationRecent.findMany({ where: { userId: context.userId, organizationId: context.organizationId, OR: [{ requestId: null }, { request: visibility(context) }] }, include: { request: { select: { title: true } } }, orderBy: { updatedAt: "desc" }, take: 20 });
  return visits.filter(visit => allowed(context, visit.path.slice(prefix.length))).map(visit => ({ path: visit.path, title: visit.request?.title ?? labels[visit.path.slice(prefix.length)] ?? "Page", isRequest: Boolean(visit.requestId) }));
}
