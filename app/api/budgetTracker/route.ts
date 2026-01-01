/* eslint-disable @typescript-eslint/no-explicit-any */
import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const allowedStatuses = ["approved", "pending", "rejected"] as const; // valid enum values

export async function GET(request: Request) {
  // Check authentication first
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orgId = searchParams.get("orgId");

  // Build where condition
  const whereCondition: any = {};
  
  // Filter by organizationId or personal (null)
  if (orgId) {
    whereCondition.organizationId = orgId;
    // TODO: Verify user is member of this organization
  } else {
    whereCondition.organizationId = null; // Only personal expenses
    whereCondition.author = userId; // Filter by current user for personal expenses
  }
  
  // Add status filter if valid
  if (allowedStatuses.includes(status as any)) {
    whereCondition.status = status as (typeof allowedStatuses)[number];
  }

  try {
    const getExpenses = await prisma.expenseTracker.findMany({
      where: whereCondition,
      orderBy: { date: "desc" },
    });

    const totalAmount = getExpenses.reduce((sum, item) => sum +  Number(item.amount), 0);

    return NextResponse.json(
      { success: true, data: getExpenses, totalAmount },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
