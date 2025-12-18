import handleError from "@/lib/handler/error";
import {
  updateOrganizationMemberRole,
  removeOrganizationMember,
} from "@/lib/actions/organization.actions";
import { NextResponse } from "next/server";

/**
 * PUT /api/organizations/:id/members/:memberId
 * Updates a member's role within the organization
 * Body: { role }
 * Requires OWNER or ADMIN role
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const body = await request.json();
    const result = await updateOrganizationMemberRole({
      memberId,
      ...body,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

/**
 * DELETE /api/organizations/:id/members/:memberId
 * Removes a user from the organization
 * Requires OWNER or ADMIN role
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const result = await removeOrganizationMember({
      memberId,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
