"use server";
import { ExpenseTracker } from "../generated/prisma";
import action from "../handler/action";
import handleError from "../handler/error";
import prisma from "../prisma";
import { ExpenseTrackerInputSchema } from "../validations";
import { auth } from "@/auth";

export async function createBudgetExpense(
  params: createBudgetExpense
): Promise<ActionResponse<ExpenseTracker>> {
  const validationResult = await action({
    params: {
      ...params,
      amount: (params.amount).toString(),
      date: new Date(params.date),
    },
    schema: ExpenseTrackerInputSchema,
    authorize: false,
    useMongo: false,
  });
  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { name, amount, status, date, description } = validationResult.params!;
  const session = await auth();
  const userId = session?.user?.id as string;
  try {
    const newExpenses = await prisma.expenseTracker.create({
      data: {
        name: name,
        amount: String(amount) as string,
        status: status ?? "pending",
        description: description,
        date: date ?? new Date(),
        author: userId,
      },
    });
    console.log("New Expense Created:", newExpenses);
    return { success: true, data: newExpenses };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
