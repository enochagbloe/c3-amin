import handleError from "@/lib/handler/error";
import {
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/lib/actions/org/organization.actions";
import { NextResponse } from "next/server";

/**
 * GET /api/organizations/:id
 * Fetches a single organization with members and expenses
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getOrganization({ organizationId: id });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: { message: "Organization not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

/**
 * PUT /api/organizations/:id
 * Updates organization details
 * Body: { name?, email?, bio?, industry? }
 * Requires OWNER or ADMIN role
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateOrganization({ id, ...body });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

/**
 * DELETE /api/organizations/:id
 * Deletes an organization and all related data
 * Requires OWNER role
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteOrganization({ organizationId: id });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
