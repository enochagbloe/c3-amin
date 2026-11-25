import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/http.error";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma";

export async function requestContext(organizationId: string) {
  z.string().uuid().parse(organizationId);
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const userId = session.user.id;
  const [membership, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { status: true } }),
  ]);
  if (!membership || user?.status !== "active")
    throw new ForbiddenError("Active organization membership is required");
  return { organizationId, userId, isOwner: membership.role === "OWNER" };
}

export type RequestContext = Awaited<ReturnType<typeof requestContext>>;

// Apply this filter to every read, including individual detail and event history.
export function visibility(
  context: RequestContext,
): Prisma.BudgetRequestWhereInput {
  return {
    organizationId: context.organizationId,
    ...(context.isOwner
      ? {}
      : {
          OR: [
            { requesterId: context.userId },
            { mainApproverId: context.userId },
            { secondApproverId: context.userId },
          ],
        }),
  };
}
