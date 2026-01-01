import handleError from "@/lib/handler/error";
import {
  getOrganizationMembers,
  addOrganizationMember,
} from "@/lib/actions/org/organization.actions";
import { NextResponse } from "next/server";

/**
 * GET /api/organizations/:id/members
 * Fetches all members of an organization with pagination
 * Query params: page?, pageSize?
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    const result = await getOrganizationMembers({
      organizationId: id,
      ...(page && { page: parseInt(page) }),
      ...(pageSize && { pageSize: parseInt(pageSize) }),
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
 * POST /api/organizations/:id/members
 * Adds a user to the organization with a specified role
 * Body: { userId, role }
 * Requires OWNER or ADMIN role
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await addOrganizationMember({
      organizationId: id,
      ...body,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
