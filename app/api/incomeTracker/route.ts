import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const incomeId = searchParams.get("incomeId");

    try {
        const getIncome = await prisma.income.findMany({
            where: incomeId ? { id: incomeId } : {},
            orderBy: { date: "desc" },
        });

        return NextResponse.json(
            { success: true, data: getIncome },
            { status: 200 }
        );
    } catch (error) {
        return handleError(error, "api") as APIErrorResponse;
    }
}