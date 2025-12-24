import handleError from "@/lib/handler/error";
import {
  createOrganization,
  getUserOrganizations,
} from "@/lib/actions/org/organization.actions";
import { NextResponse } from "next/server";

/**
 * GET /api/organizations
 * Fetches all organizations the current user is a member of
 */
export async function GET() {
  try {
    const result = await getUserOrganizations();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

/**
 * POST /api/organizations
 * Creates a new organization and sets the current user as OWNER
 * Body: { name, email?, bio?, industry }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createOrganization(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
