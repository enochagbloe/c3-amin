import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/http.error";
import { z } from "zod";

export async function organizationAccess(organizationId: string) {
  z.string().uuid().parse(organizationId);
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const userId = session.user.id;
  const [membership, user] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: {
        organization: {
          select: { name: true, budgetReviewerId: true, budgetPastorId: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, name: true },
    }),
  ]);
  if (!membership || user?.status !== "active")
    throw new ForbiddenError("Active organization membership is required");
  const isOwner = membership.role === "OWNER";
  const assigned =
    membership.organization.budgetReviewerId === userId ||
    membership.organization.budgetPastorId === userId;
  const priorAssignment = assigned
    ? null
    : await prisma.budgetRequest.findFirst({
        where: {
          organizationId,
          OR: [{ mainApproverId: userId }, { secondApproverId: userId }],
        },
        select: { id: true },
      });
  return {
    organizationId,
    userId,
    role: membership.role,
    name: user.name,
    organizationName: membership.organization.name,
    isOwner,
    canFinance: isOwner || membership.role === "ADMIN",
    canManageTeam: isOwner,
    canReviewBudgets: isOwner || assigned || Boolean(priorAssignment),
  };
}
export type OrganizationAccess = Awaited<ReturnType<typeof organizationAccess>>;
export async function requireOrganizationFinance(organizationId: string) {
  const access = await organizationAccess(organizationId);
  if (!access.canFinance)
    throw new ForbiddenError(
      "Income, expenses and analytics are restricted to organization owners and admins",
    );
  return access;
}
export async function requireOrganizationOwner(organizationId: string) {
  const access = await organizationAccess(organizationId);
  if (!access.isOwner)
    throw new ForbiddenError("Only the organization owner can manage the team");
  return access;
}
