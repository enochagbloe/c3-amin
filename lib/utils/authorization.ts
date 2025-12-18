/**
 * Authorization utilities for checking user permissions
 */

import prisma from "@/lib/prisma";
import { ForbiddenError } from "@/lib/http.error";

/**
 * Verifies that a user is a member of an organization
 * @param userId - The user's ID
 * @param organizationId - The organization's ID
 * @throws ForbiddenError if user is not a member
 */
export async function verifyOrganizationMember(
  userId: string,
  organizationId: string
): Promise<void> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this organization");
  }
}

/**
 * Verifies that a user has OWNER or ADMIN role in an organization
 * @param userId - The user's ID
 * @param organizationId - The organization's ID
 * @throws ForbiddenError if user is not an OWNER or ADMIN
 */
export async function verifyOrganizationAdmin(
  userId: string,
  organizationId: string
): Promise<void> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new ForbiddenError(
      "You must be an organization OWNER or ADMIN to perform this action"
    );
  }
}

/**
 * Verifies that a user has OWNER role in an organization
 * @param userId - The user's ID
 * @param organizationId - The organization's ID
 * @throws ForbiddenError if user is not an OWNER
 */
export async function verifyOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<void> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership || membership.role !== "OWNER") {
    throw new ForbiddenError(
      "You must be the organization OWNER to perform this action"
    );
  }
}

/**
 * Verifies expense access permissions
 * - If expense belongs to an organization: user must be a member
 * - If expense has no organization: user must be the author
 * @param userId - The user's ID
 * @param expense - The expense object with author and organizationId
 * @throws ForbiddenError if user doesn't have access
 */
export async function verifyExpenseAccess(
  userId: string,
  expense: { author: string; organizationId: string | null }
): Promise<void> {
  if (expense.organizationId) {
    await verifyOrganizationMember(userId, expense.organizationId);
  } else if (expense.author !== userId) {
    throw new ForbiddenError("You can only access your own expenses");
  }
}

/**
 * Verifies expense modification permissions
 * - If expense belongs to an organization: user must be OWNER or ADMIN
 * - If expense has no organization: user must be the author
 * @param userId - The user's ID
 * @param expense - The expense object with author and organizationId
 * @throws ForbiddenError if user doesn't have permission to modify
 */
export async function verifyExpenseModifyPermission(
  userId: string,
  expense: { author: string; organizationId: string | null }
): Promise<void> {
  if (expense.organizationId) {
    await verifyOrganizationAdmin(userId, expense.organizationId);
  } else if (expense.author !== userId) {
    throw new ForbiddenError("You can only modify your own expenses");
  }
}

/**
 * Verifies that a user owns an income record
 * @param userId - The user's ID
 * @param income - The income object with userId
 * @throws ForbiddenError if user doesn't own the income
 */
export function verifyIncomeOwnership(
  userId: string,
  income: { userId: string }
): void {
  if (income.userId !== userId) {
    throw new ForbiddenError("You can only access your own income records");
  }
}
