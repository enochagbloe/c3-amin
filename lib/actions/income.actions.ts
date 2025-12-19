/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createIncomeSchema, GetIncomeSchema } from "@/lib/validations";
import prisma from "../prisma";
import action from "../handler/action";
import handleError from "../handler/error";
import { Income, Prisma } from "../generated/prisma";
import { auth } from "@/auth";
import { ForbiddenError } from "@/lib/http.error";

// Define the Income type with customValues included
export type IncomeWithCustomValues = Prisma.IncomeGetPayload<{
    include: {
        customValues: {
            include: {
                customField: true
            }
        }
    }
}>;


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
                organizationId: (params as any).organizationId || null, // Add org support
                customValues: {
                    create: [],
                },
            },
        });

        if (customFields && customFields.length > 0) {
            await Promise.all(
                customFields.map(async (cf) => {
                    let fieldId = cf.fieldId;

                    // If no existing fieldId, create a new CustomField definition
                    if (!fieldId) {
                        const createdField = await prisma.customField.create({
                            data: {
                                userId,
                                name: cf.name || "Custom Field",
                                type: (cf.type as any) || "TEXT",
                                required: cf.required ?? false,
                                options: cf.options ?? [],
                            },
                        });
                        fieldId = createdField.id;
                    }

                    await prisma.incomeCustomValue.create({
                        data: {
                            incomeId: newIncome.id,
                            fieldId,
                            value: cf.value instanceof Date ? cf.value.toISOString() : String(cf.value),
                        },
                    });
                })
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
): Promise<ActionResponse<IncomeWithCustomValues | null>> {
    const validationResult = await action({
        params,
        schema: GetIncomeSchema,
        authorize: true,
        useMongo: false,
    });
    if (validationResult instanceof Error)
        return handleError(validationResult) as ErrorResponse;

    const { incomeId } = validationResult.params!;
    const session = await auth();
    const userId = session?.user?.id as string;

    try {
        // Use findUnique since id is a unique field
        const income = await prisma.income.findUnique({
            where: {
                id: incomeId,
            },
            include: {
                customValues: {
                    include: {
                        customField: true
                    }
                }
            }
        });

        if (!income) {
            return { success: true, data: null };
        }

        // Authorization check - verify user owns this income
        if (income.userId !== userId) {
            throw new ForbiddenError("You can only view your own income records");
        }

        return { success: true, data: income };
    } catch (error) {
        return handleError(error) as ErrorResponse;
    }
}