import { notifyBudget, organizationOwners } from "./notifications";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { ForbiddenError, NotFoundError, RequestError } from "@/lib/http.error";
import { visibility, type RequestContext } from "./access";
import { requestSchema, decisionSchema, listSchema } from "./validation";
import { z } from "zod";

const person = { id: true, name: true };
export const requestInclude = {
  requester: { select: person },
  mainApprover: { select: person },
  secondApprover: { select: person },
  events: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: person } },
  },
};

export async function listRequests(context: RequestContext, input: unknown) {
  const { scope, page } = listSchema.parse(input);
  const filter: Prisma.BudgetRequestWhereInput =
    scope === "mine"
      ? { requesterId: context.userId }
      : scope === "inbox"
        ? {
            OR: [
              { mainApproverId: context.userId, status: "PENDING_MAIN" },
              { secondApproverId: context.userId, status: "PENDING_SECOND" },
            ],
          }
        : scope === "payments" ? { status: "APPROVED" } : {};
  const where = { AND: [visibility(context), filter] };
  const [requests, total] = await prisma.$transaction([
    prisma.budgetRequest.findMany({
      where,
      include: requestInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.budgetRequest.count({ where }),
  ]);
  return { requests, total, page, pageSize: 20 };
}

export async function getRequest(context: RequestContext, requestId: string) {
  z.string().uuid().parse(requestId);
  const request = await prisma.budgetRequest.findFirst({
    where: { AND: [visibility(context), { id: requestId }] },
    include: requestInclude,
  });
  if (!request) throw new NotFoundError("Budget request");
  return request;
}

export async function createRequest(context: RequestContext, input: unknown) {
  const data = requestSchema.parse(input);
  return prisma.$transaction(
    async (tx) => {
      const organization = await tx.organization.findUniqueOrThrow({
        where: { id: context.organizationId },
        include: { members: { where: { role: "OWNER" } } },
      });
      const mainApproverId =
        organization.budgetReviewerId ?? organization.members[0]?.userId;
      const secondApproverId = organization.budgetPastorId;
      if (
        !mainApproverId ||
        mainApproverId === secondApproverId
      )
        throw new RequestError(
          400,
          "The organization needs an owner or designated reviewer to receive requests",
        );
      const approverIds = [mainApproverId, secondApproverId].filter((id): id is string => Boolean(id));
      const [members, users] = await Promise.all([
        tx.organizationMember.count({
          where: {
            organizationId: context.organizationId,
            userId: { in: approverIds },
          },
        }),
        tx.user.count({ where: { id: { in: approverIds }, status: "active" } }),
      ]);
      if (members !== approverIds.length || users !== approverIds.length)
        throw new RequestError(
          400,
          "Assigned approvers must be active members of this organization",
        );
      const created = await tx.budgetRequest.create({
        data: {
          ...data,
          amount: new Prisma.Decimal(data.amount),
          neededBy: data.neededBy
            ? new Date(`${data.neededBy}T00:00:00Z`)
            : null,
          organizationId: context.organizationId,
          requesterId: context.userId,
          mainApproverId,
          secondApproverId,
          events: {
            create: {
              actorId: context.userId,
              action: "SUBMITTED",
              stage: "SUBMITTED",
            },
          },
        },
        include: requestInclude,
      });
      await notifyBudget(tx, { organizationId: context.organizationId, requestId: created.id, actorId: context.userId, recipients: [mainApproverId, ...await organizationOwners(tx, context.organizationId)], title: "New budget request submitted", message: created.title });
      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 },
  );
}

export async function decideRequest(
  context: RequestContext,
  requestId: string,
  input: unknown,
) {
  const data = decisionSchema.parse(input);
  z.string().uuid().parse(requestId);
  return prisma.$transaction(
    async (tx) => {
      const request = await tx.budgetRequest.findFirst({
        where: { AND: [visibility(context), { id: requestId }] },
      });
      if (!request) throw new NotFoundError("Budget request");
      const stage =
        request.status === "PENDING_MAIN"
          ? "MAIN"
          : request.status === "PENDING_SECOND"
            ? "SECOND"
            : null;
      if (!stage)
        throw new RequestError(409, "This request has already been completed");
      const approverId =
        stage === "MAIN" ? request.mainApproverId : request.secondApproverId;
      if (
        (stage === "SECOND" && context.userId === request.requesterId) ||
        context.userId !== approverId
      ) {
        throw new ForbiddenError(
          "Only the assigned approver for the current stage can decide this request",
        );
      }
      if (stage === "SECOND" && request.mainApproverId === context.userId)
        throw new ForbiddenError(
          "The final approval must be given by a different person",
        );
      const status =
        data.decision === "REJECTED"
          ? "REJECTED"
          : stage === "MAIN"
            ? "PENDING_SECOND"
            : "APPROVED";
      // Compare-and-set prevents double decisions and duplicate audit events under concurrent requests.
      const result = await tx.budgetRequest.updateMany({
        where: { id: requestId, status: request.status },
        data: { status },
      });
      if (result.count !== 1)
        throw new RequestError(
          409,
          "Another decision was recorded. Refresh this request",
        );
      await tx.budgetRequestEvent.create({
        data: {
          requestId,
          actorId: context.userId,
          stage,
          action: data.decision,
          comment: data.comment || null,
        },
      });
      await notifyBudget(tx, { organizationId: context.organizationId, requestId, actorId: context.userId,
        recipients: [...await organizationOwners(tx, context.organizationId), request.requesterId, ...(status === "PENDING_SECOND" ? [request.secondApproverId] : status === "APPROVED" ? [request.mainApproverId] : [])],
        title: status === "REJECTED" ? "Budget request rejected" : status === "APPROVED" ? "Budget approved · cash collection pending" : "First approval recorded · awaiting final approval", message: request.title });
      return tx.budgetRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: requestInclude,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 },
  );
}
