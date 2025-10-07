import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const getExpenses = await prisma.expenseTracker.findMany({
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(
      { success: true, data: getExpenses },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
