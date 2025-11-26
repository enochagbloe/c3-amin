/* eslint-disable @typescript-eslint/no-explicit-any */
import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedStatuses = ["approved", "pending", "rejected"] as const; // valid enum values

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Only use status if it's truly valid
  const whereCondition = allowedStatuses.includes(status as any)
    ? { status: status as (typeof allowedStatuses)[number] }
    : undefined;

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
