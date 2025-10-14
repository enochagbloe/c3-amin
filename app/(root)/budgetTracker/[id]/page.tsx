import { getAllExpense } from "@/lib/actions/budgetTracker.action";
import { ExpenseTracker } from "@/lib/generated/prisma";
import { notFound } from "next/navigation";
import React from "react";
import ExpenseDetailsClient from "./ExpenseDetailsClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ExpenseDetailsPage = async ({ params }: RouteParams) => {
  const { id } = await params;

  if (!id) {
    return <div>No Expense ID provided</div>;
  }

  // Fetch data from the server action
  const response = await getAllExpense({ expensesId: id });

  if (!response.success || !response.data) return notFound();

  const expensesData = response.data as ExpenseTracker;

  return <ExpenseDetailsClient expensesData={expensesData} />;
};

export default ExpenseDetailsPage;