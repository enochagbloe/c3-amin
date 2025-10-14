/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { columns, Payment } from "./columns";
import { ReusableDialog } from "@/components/create/Dialog";
import { ExpenseTrackerInputSchema } from "@/lib/validations";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { useRouter } from "next/navigation";
import { createBudgetExpense } from "@/lib/actions/budgetTracker.action";
import { toast } from "sonner";

// Sample data matching the Payment type
const data: Payment[] = [];

const BudgetTracker = () => {
  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Payment[]>(data);
  const router = useRouter();

  //fetch data from api and set it to table data
  React.useEffect(() => {
    const fetchData = async () => {
      const result = await fetch("/api/budgetTracker").then((res) =>
        res.json()
      );
      setTableData(result.data);
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData: any) => {
    const result = await createBudgetExpense(formData);
    // add the new expense to the table data
    if (result.success) {
      setTableData((prevData) => [...prevData, result.data] as any);
      setOpen(false);
      console.log("Expense created:", result.data);
      toast.success("Expense created successfully");
      router.refresh();
    } else {
      toast.error("Error creating expense");
    }
  };
  const handleRowClick = (expense: Payment) => {
    // Navigate to the details page
    router.push(`/budgetTracker/${expense.id}`);
  };
  return (
    <main>
      <section className="flex justify-between mb-6">
        <div className="items-center">
          <h1 className="text-2xl font-bold">Budget Tracker</h1>
        </div>
        <button
          className="dark:text-white px-4 py-2 rounded-lg font-medium transition-colors text-black"
          onClick={() => setOpen(true)}
        >
          Create Expense
        </button>
      </section>

      <ReusableDialog
        open={open}
        onOpenChange={setOpen}
        title="Create Expense"
        dialogName="Create Expense"
        schema={ExpenseTrackerInputSchema}
        defaultValues={{
          name: "",
          amount: "", // Changed from 0 to "" to match your schema transformation
          status: "pending", // Add default status
          date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
          description: "",
          // Remove author if it's not in your schema
          // author: "",
        }}
        onSubmit={handleSubmit}
        fieldConfig={{
          name: {
            type: "",
            options: "",
            placeholder: "Select User",
            //loading: isLoading
          },
        }}
      />

      <div className="container mx-auto py-10">
        <ReusableDataTable
          columns={columns}
          data={tableData}
          onRowClick={handleRowClick}
        />
      </div>
    </main>
  );
};

export default BudgetTracker;
