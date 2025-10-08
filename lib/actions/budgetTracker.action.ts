"use server";
import { ExpenseTracker } from "../generated/prisma";
import action from "../handler/action";
import handleError from "../handler/error";
import prisma from "../prisma";
import { ExpenseTrackerInputSchema, GetExpenseSchema } from "../validations";
import { auth } from "@/auth";

export async function createBudgetExpense(
  params: createBudgetExpense
): Promise<ActionResponse<ExpenseTracker>> {
  const validationResult = await action({
    params: {
      ...params,
      amount: params.amount.toString(),
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

export async function getAllExpense(
  params: GetExpenseParams
): Promise<ActionResponse<ExpenseTracker>> {
  const validationResult = await action({
    params,
    schema: GetExpenseSchema,
    authorize: false,
    useMongo: false,
  });

  if (validationResult instanceof Error)
    return handleError(validationResult) as ErrorResponse;

  const { expensesId } = validationResult.params!;
  try {
    const expense = await prisma.expenseTracker.findUnique({
      where: { id: expensesId },
    });
    if (!expense) {
      return {
        success: false,
        error: {
          message: "Expense not found.",
          details: {},
        },
      };
    }
    return { success: true, data: JSON.parse(JSON.stringify(expense)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
