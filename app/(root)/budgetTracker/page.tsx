/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { columns, Payment } from "./columns";
import { ReusableDialog } from "@/components/create/Dialog";
import { ExpenseTrackerInputSchema } from "@/lib/validations";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { useRouter } from "next/navigation";

// Sample data matching the Payment type
const data: Payment[] = [];

const BudgetTracker = () => {
  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Payment[]>(data);

  const router = useRouter();



  const handleSubmit = async (formData: any) => {
    try {
      console.log("Received form data:", formData);

      // Create a new payment with the form data
      const newPayment: Payment = {
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        name: formData.name,
        amount: Number(formData.amount),
        status: formData.status || "pending",
        date: formData.date,
        description: formData.description || "",
        // Remove author field if it's not in your schema/form
        // author: formData.author,
      };

      // Add the new payment to the table data
      setTableData((prevData) => [...prevData, newPayment]);
      console.log("New payment added:", newPayment);

      return { success: true };
    } catch (error) {
      console.error("Error adding payment:", error);
      return { success: false };
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
          className="text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
