import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { ForbiddenError, RequestError } from "@/lib/http.error";
import type { RequestContext } from "./access";
import { approvalSettingsSchema } from "./validation";

export async function requestOptions(context: RequestContext) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: context.organizationId },
    select: {
      budgetReviewerId: true,
      budgetPastorId: true,
      members: { where: { role: "OWNER" }, select: { userId: true } },
    },
  });
  const reviewerId =
    organization.budgetReviewerId ?? organization.members[0]?.userId;
  const pastorId = organization.budgetPastorId;
  const assigned = await prisma.user.findMany({
    where: {
      id: {
        in: [reviewerId, pastorId].filter((id): id is string => Boolean(id)),
      },
    },
    select: { id: true, name: true },
  });
  const route = {
    reviewer: assigned.find((user) => user.id === reviewerId) ?? null,
    pastor: assigned.find((user) => user.id === pastorId) ?? null,
  };
  if (!context.isOwner)
    return { userId: context.userId, isOwner: false, ...route, members: [] };
  const memberships = await prisma.organizationMember.findMany({
    where: { organizationId: context.organizationId },
  });
  const users = await prisma.user.findMany({
    where: {
      id: { in: memberships.map((member) => member.userId) },
      status: "active",
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return { userId: context.userId, isOwner: true, ...route, members: users };
}

export async function updateApprovalSettings(
  context: RequestContext,
  input: unknown,
) {
  if (!context.isOwner)
    throw new ForbiddenError(
      "Only the organization owner can assign budget approvers",
    );
  const { reviewerId, pastorId } = approvalSettingsSchema.parse(input);
  await prisma.$transaction(
    async (tx) => {
      const ids = [reviewerId, pastorId];
      const members = await tx.organizationMember.count({
        where: { organizationId: context.organizationId, userId: { in: ids } },
      });
      const active = await tx.user.count({
        where: { id: { in: ids }, status: "active" },
      });
      if (members !== 2 || active !== 2)
        throw new RequestError(400, "Choose two active organization members");
      const pending = await tx.budgetRequest.findMany({
        where: {
          organizationId: context.organizationId,
          status: { in: ["PENDING_MAIN", "PENDING_SECOND"] },
        },
      });
      if (
        pending.some(
          (request) =>
            request.status === "PENDING_SECOND" &&
            request.mainApproverId === pastorId,
        )
      ) {
        throw new RequestError(
          400,
          "This pastor has already given the first approval on a pending request. Choose a different final approver",
        );
      }
      await tx.organization.update({
        where: { id: context.organizationId },
        data: { budgetReviewerId: reviewerId, budgetPastorId: pastorId },
      });
      // Reroute only unfinished stages; recorded approvals and completed requests stay intact.
      await tx.budgetRequest.updateMany({
        where: {
          organizationId: context.organizationId,
          status: "PENDING_MAIN",
        },
        data: { mainApproverId: reviewerId, secondApproverId: pastorId },
      });
      await tx.budgetRequest.updateMany({
        where: {
          organizationId: context.organizationId,
          status: "PENDING_SECOND",
        },
        data: { secondApproverId: pastorId },
      });
      const people = await tx.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      const changed = pending.filter(
        (request) =>
          request.secondApproverId !== pastorId ||
          (request.status === "PENDING_MAIN" &&
            request.mainApproverId !== reviewerId),
      );
      if (changed.length)
        await tx.budgetRequestEvent.createMany({
          data: changed.map((request) => ({
            requestId: request.id,
            actorId: context.userId,
            action: "REASSIGNED" as const,
            stage:
              request.status === "PENDING_MAIN"
                ? ("MAIN" as const)
                : ("SECOND" as const),
            comment: `Reviewer: ${people.find((person) => person.id === (request.status === "PENDING_MAIN" ? reviewerId : request.mainApproverId))?.name ?? "Previous reviewer (unchanged)"}. Final pastor: ${people.find((person) => person.id === pastorId)?.name}.`,
          })),
        });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 },
  );
  return requestOptions(context);
}
