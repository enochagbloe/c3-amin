/* eslint-disable @typescript-eslint/no-empty-object-type */
"use server";

import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import action from "@/lib/handler/action";
import handleError from "@/lib/handler/error";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  GetOrganizationSchema,
  DeleteOrganizationSchema,
  AddOrganizationMemberSchema,
  UpdateOrganizationMemberSchema,
  RemoveOrganizationMemberSchema,
  GetOrganizationMembersSchema,
} from "@/lib/validations";
import { auth } from "@/auth";
import { ForbiddenError, NotFoundError } from "@/lib/http.error";

/**
 * CREATE ORGANIZATION
 * Creates a new organization and sets the current user as OWNER
 */
export async function createOrganization(
  params: CreateOrganization
): Promise<ActionResponse<Prisma.OrganizationGetPayload<{}>>> {
  const validationResult = await action({
    params,
    schema: CreateOrganizationSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { name, email, bio, industry } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    const organization = await prisma.organization.create({
      data: {
        name,
        email: email || null,
        bio: bio || null,
        industry,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
        expenses: true,
      },
    });

    return { success: true, data: organization };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * GET ORGANIZATION BY ID
 * Fetches a single organization with all its members and expenses
 */
export async function getOrganization(
  params: GetOrganization
): Promise<ActionResponse<Prisma.OrganizationGetPayload<{ include: { members: true; expenses: true } }> | null>> {
  const validationResult = await action({
    params,
    schema: GetOrganizationSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { organizationId } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // First, verify user is a member of this organization
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

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: true,
        expenses: true,
      },
    });

    if (!organization) {
      return { success: true, data: null };
    }

    return { success: true, data: organization };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * GET ALL ORGANIZATIONS FOR CURRENT USER
 * Fetches all organizations the current user is a member of
 */
export async function getUserOrganizations(): Promise<
  ActionResponse<Prisma.OrganizationGetPayload<{ include: { members: true; expenses: true } }>[]>
> {
  const validationResult = await action({
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
        expenses: true,
      },
    });

    return { success: true, data: organizations };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * UPDATE ORGANIZATION
 * Updates organization details (name, email, bio, industry)
 * Requires OWNER or ADMIN role
 */
export async function updateOrganization(
  params: UpdateOrganization
): Promise<ActionResponse<Prisma.OrganizationGetPayload<{}>>> {
  const validationResult = await action({
    params,
    schema: UpdateOrganizationSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { id, name, email, bio, industry } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // Check if user is OWNER or ADMIN
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: id,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new ForbiddenError("You must be an OWNER or ADMIN to update this organization");
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(industry && { industry }),
      },
    });

    return { success: true, data: organization };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * DELETE ORGANIZATION
 * Deletes an organization and all related data (cascade)
 * Requires OWNER role
 */
export async function deleteOrganization(
  params: DeleteOrganization
): Promise<ActionResponse<{ message: string }>> {
  const validationResult = await action({
    params,
    schema: DeleteOrganizationSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { organizationId } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // Check if user is OWNER
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      throw new ForbiddenError("Only the OWNER can delete this organization");
    }

    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return { success: true, data: { message: "Organization deleted successfully" } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * ADD ORGANIZATION MEMBER
 * Adds a user to an organization with a specified role
 * Requires OWNER or ADMIN role
 */
export async function addOrganizationMember(
  params: AddOrganizationMember
): Promise<ActionResponse<Prisma.OrganizationMemberGetPayload<{ include: { organization: true } }>>> {
  const validationResult = await action({
    params,
    schema: AddOrganizationMemberSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { organizationId, userId, role } = validationResult.params!;
  const session = await auth();
  const currentUserId = session?.user?.id as string;

  try {
    // Check if current user is OWNER or ADMIN
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: currentUserId,
          organizationId,
        },
      },
    });

    if (!currentMembership || !["OWNER", "ADMIN"].includes(currentMembership.role)) {
      throw new ForbiddenError("You must be an OWNER or ADMIN to add members");
    }

    // Check if user is already a member
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingMembership) {
      throw new Error("This user is already a member of the organization");
    }

    const member = await prisma.organizationMember.create({
      data: {
        userId,
        organizationId,
        role,
      },
      include: {
        organization: true,
      },
    });

    return { success: true, data: member };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * UPDATE ORGANIZATION MEMBER ROLE
 * Changes a member's role within the organization
 * Requires OWNER or ADMIN role
 */
export async function updateOrganizationMemberRole(
  params: UpdateOrganizationMember
): Promise<ActionResponse<Prisma.OrganizationMemberGetPayload<{}>>> {
  const validationResult = await action({
    params,
    schema: UpdateOrganizationMemberSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { memberId, role } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // Get the member to update
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundError("Member");
    }

    // Check if current user is OWNER or ADMIN of the org
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: member.organizationId,
        },
      },
    });

    if (!currentMembership || !["OWNER", "ADMIN"].includes(currentMembership.role)) {
      throw new ForbiddenError("You must be an OWNER or ADMIN to update member roles");
    }

    // Cannot change the role of the only OWNER
    if (member.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: member.organizationId,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        throw new Error("The organization must have at least one OWNER");
      }
    }

    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });

    return { success: true, data: updatedMember };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * REMOVE ORGANIZATION MEMBER
 * Removes a user from an organization
 * Requires OWNER or ADMIN role (OWNER cannot remove themselves)
 */
export async function removeOrganizationMember(
  params: RemoveOrganizationMember
): Promise<ActionResponse<{ message: string }>> {
  const validationResult = await action({
    params,
    schema: RemoveOrganizationMemberSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { memberId } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // Get the member to remove
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundError("Member");
    }

    // Cannot remove yourself if you're the only OWNER
    if (member.userId === userId && member.role === "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: member.organizationId,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        throw new Error("The organization must have at least one OWNER");
      }
    }

    // Check if current user is OWNER or ADMIN
    const currentMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: member.organizationId,
        },
      },
    });

    if (!currentMembership || !["OWNER", "ADMIN"].includes(currentMembership.role)) {
      throw new ForbiddenError("You must be an OWNER or ADMIN to remove members");
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return { success: true, data: { message: "Member removed successfully" } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * GET ORGANIZATION MEMBERS
 * Fetches all members of an organization with pagination
 */
export async function getOrganizationMembers(
  params: GetOrganizationMembers
): Promise<
  ActionResponse<{
    members: Prisma.OrganizationMemberGetPayload<{}>[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  const validationResult = await action({
    params,
    schema: GetOrganizationMembersSchema,
    authorize: true,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { organizationId, page = 1, pageSize = 10 } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;

  try {
    // Check if user is a member of the organization
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

    const skip = (page - 1) * pageSize;

    const [members, total] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId },
        skip,
        take: pageSize,
        orderBy: { joinedAt: "desc" },
      }),
      prisma.organizationMember.count({
        where: { organizationId },
      }),
    ]);

    return {
      success: true,
      data: {
        members,
        total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
