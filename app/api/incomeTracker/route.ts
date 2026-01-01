/* eslint-disable @typescript-eslint/no-explicit-any */
import handleError from "@/lib/handler/error";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

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
        // TODO: Verify user is member of this organization
    } else {
        whereCondition.organizationId = null; // Only personal income
        whereCondition.userId = userId; // Filter by current user for personal income
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