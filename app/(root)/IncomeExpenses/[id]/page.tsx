import { notFound, redirect } from "next/navigation";
import React from "react";
import { auth } from "@/auth";
import { getAllIncome } from "@/lib/actions/income.actions";
import IncomeExpensesClient from "./IncomeExpensesClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const IncomeExpensesPage = async ({ params }: RouteParams) => {
    const { id } = await params;
    const session = await auth();
    
    // Redirect if not authenticated
    if (!session) return redirect("/sign-in");
    
    const user = session?.user?.name;

    if (!id) {
      return <div>No Income ID provided</div>;
    }

    // Fetch data from the server action
    const response = await getAllIncome({ incomeId: id });

    // Show 404 if not successful or no data found
    if (!response.success || !response.data) return notFound();

    // Now we can safely use the data as a single Income object
    const incomeData = response.data;

    return <IncomeExpensesClient incomeData={incomeData} user={user ?? ""} />;
  }
export default IncomeExpensesPage;