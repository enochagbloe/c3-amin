import { organizationAccess } from "@/lib/organizations/access";
import type { Prisma } from "@/lib/generated/prisma";

export async function requestContext(organizationId: string) {
  return organizationAccess(organizationId);
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
