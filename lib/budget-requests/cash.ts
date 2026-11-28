import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";
import { ForbiddenError, NotFoundError, RequestError } from "@/lib/http.error";
import { visibility, type RequestContext } from "./access";
import { requestInclude } from "./service";
import { notifyBudget, organizationOwners } from "./notifications";
const cashSchema = z.object({ action: z.enum(["RECEIVE_FUNDS", "HAND_OVER", "CONFIRM_RECEIPT"]), reference: z.string().trim().max(150).optional() }).strict();
export async function recordCash(context: RequestContext, requestId: string, input: unknown) {
  z.string().uuid().parse(requestId);
  const { action, reference } = cashSchema.parse(input);
  return prisma.$transaction(async tx => {
    const request = await tx.budgetRequest.findFirst({ where: { AND: [visibility(context), { id: requestId }] } });
    if (!request) throw new NotFoundError("Budget request");
    if (request.status !== "APPROVED") throw new RequestError(409, "Final approval is required before recording cash");
    const confirming = action === "CONFIRM_RECEIPT";
    if (context.userId !== (confirming ? request.requesterId : request.mainApproverId)) throw new ForbiddenError(confirming ? "Only the requester can confirm receiving this cash" : "Only the assigned reviewer can record cash collection or handover");
    const expected = action === "RECEIVE_FUNDS" ? "NOT_RELEASED" : action === "HAND_OVER" ? "WITH_REVIEWER" : "AWAITING_RECEIPT";
    // Repeated successful confirmations return the existing result, never another expense.
    if (confirming && request.cashStatus === "RECEIVED") return tx.budgetRequest.findUniqueOrThrow({ where: { id: requestId }, include: requestInclude });
    if (request.cashStatus !== expected) throw new RequestError(409, "This cash step is not available. Refresh the request");
    const now = new Date();
    const next = action === "RECEIVE_FUNDS" ? "WITH_REVIEWER" : action === "HAND_OVER" ? "AWAITING_RECEIPT" : "RECEIVED";
    const changed = await tx.budgetRequest.updateMany({ where: { id: requestId, status: "APPROVED", cashStatus: expected }, data: {
      cashStatus: next,
      ...(action === "RECEIVE_FUNDS" ? { reviewerReceivedAt: now, paymentReference: reference || null } : action === "HAND_OVER" ? { handedOverAt: now } : { receiptConfirmedAt: now }),
    } });
    if (changed.count !== 1) throw new RequestError(409, "Another cash action was recorded. Refresh this request");
    if (confirming) {
      const owner = await tx.organizationMember.findFirst({ where: { organizationId: context.organizationId, role: "OWNER" }, orderBy: { joinedAt: "asc" } });
      if (!owner) throw new RequestError(409, "The organization needs an owner before recording this expense");
      await tx.expenseTracker.create({ data: { budgetRequestId: requestId, organizationId: context.organizationId, author: owner.userId, name: request.title, amount: Number(request.amount), currency: request.currency, date: now, status: "approved", description: "Budget cash received and confirmed by the requester." } });
    }
    const eventAction = action === "RECEIVE_FUNDS" ? "FUNDS_RECEIVED" : action === "HAND_OVER" ? "CASH_HANDED_OVER" : "RECEIPT_CONFIRMED";
    await tx.budgetRequestEvent.create({ data: { requestId, actorId: context.userId, stage: "PAYMENT", action: eventAction, comment: action === "RECEIVE_FUNDS" ? reference || null : null } });
    const owners = confirming ? await tx.organizationMember.findMany({ where: { organizationId: context.organizationId, role: "OWNER" }, select: { userId: true } }) : [];
    await notifyBudget(tx, { organizationId: context.organizationId, requestId, actorId: context.userId,
      recipients: [...await organizationOwners(tx, context.organizationId), ...(confirming ? [request.mainApproverId, ...owners.map(owner => owner.userId)] : [request.requesterId])],
      title: action === "RECEIVE_FUNDS" ? "Reviewer has collected the cash" : action === "HAND_OVER" ? "Confirm your cash receipt" : "Cash receipt confirmed · expense recorded", message: request.title });
    return tx.budgetRequest.findUniqueOrThrow({ where: { id: requestId }, include: requestInclude });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 });
}
