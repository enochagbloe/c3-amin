"use server";

import { createIncomeSchema, GetIncomeSchema } from "@/lib/validations";
import prisma from "../prisma";
import action from "../handler/action";
import handleError from "../handler/error";
import { Income } from "../generated/prisma";
import { auth } from "@/auth";


export async function CreateIncome(params: CreateIncome): Promise<ActionResponse<Income>> {
    const validationResult = await action({
        params: {...params, date: new Date(params.date) },
        schema: createIncomeSchema,
        authorize: false,
        useMongo: false,
    });
    if (validationResult instanceof Error)
        return handleError(validationResult) as ErrorResponse;

    const { name, amount, source, description, date, customFields } = validationResult.params!;
      const session = await auth();
      const userId = session?.user?.id as string;
    try {
        const newIncome = await prisma.income.create({

            data: {
                userId, // Replace with actual user ID from session/auth
                name,
                amount: parseFloat(amount),
                source,
                description,
                date: new Date(date),
            },
        });

        if (customFields && customFields.length > 0) {
            await Promise.all(
                customFields.map((cf) =>
                    prisma.incomeCustomValue.create({
                        data: {
                            incomeId: newIncome.id,
                            fieldId: cf.fieldId,
                            value: String(cf.value),
                        },
                    })
                )
            );
        }

        console.log("New Income Created:", newIncome);
        return { success: true, data: newIncome };
    } catch (error) {
        return handleError(error) as ErrorResponse;
    }
}

export async function getAllIncome(
    params: getAllIncome
): Promise<ActionResponse<Income[]>> {
    const validationResult = await action({
        params,
        schema: GetIncomeSchema,
        authorize: true,
        useMongo: false,
    });
    if (validationResult instanceof Error)
        return handleError(validationResult) as ErrorResponse;

    const { incomeId } = validationResult.params!;
    try {
        const incomes = await prisma.income.findMany({
            where: {
                id: incomeId,
            },
            orderBy: {
                date: "desc",
            },
        });
        return { success: true, data: incomes };
    } catch (error) {
        return handleError(error) as ErrorResponse;
    }
}