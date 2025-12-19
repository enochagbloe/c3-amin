import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const incomeId = searchParams.get("incomeId");
    const orgId = searchParams.get("orgId");

    // Build where condition
    const whereCondition: any = {};
    
    if (incomeId) {
        whereCondition.id = incomeId;
    }
    
    // Filter by organizationId or personal (null)
    if (orgId) {
        whereCondition.organizationId = orgId;
    } else {
        whereCondition.organizationId = null; // Only personal income
    }

    try {
        const getIncome = await prisma.income.findMany({
            where: whereCondition,
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