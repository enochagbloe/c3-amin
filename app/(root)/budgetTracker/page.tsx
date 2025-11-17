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
{/*const BudgetTracker = () => {
  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Payment[]>(data);
  const [isLoading, setIsLoading] = React.useState(false)
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
      setIsLoading(false)
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
          date: new Date().toISOString(), // YYYY-MM-DD format
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
          },
        }}
      />

      <div className="container mx-auto py-10">
        <ReusableDataTable
          columns={columns}
          data={tableData}
          onRowClick={handleRowClick || isLoading}
        />
      </div>
    </main>
  );
};

export default BudgetTracker; */}


const BudgetTracker = () => {
  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Payment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);        // for form submission
  const [isFetching, setIsFetching] = React.useState(true);      // for initial load
  const router = useRouter();

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const result = await fetch("/api/budgetTracker").then((res) => res.json());
        setTableData(result.data || []);
      } catch (error) {
        toast.error("Failed to load expenses");
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const result = await createBudgetExpense(formData);

      if (result.success) {
        // Add the new expense optimistically
        setTableData((prevData) => [...prevData, result.data] as any);
        setOpen(false);
        toast.success("Expense created successfully");
        router.refresh(); // optional: revalidate server data
      } else {
        toast.error(result.error?.message || "Error creating expense");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (expense: Payment) => {
    router.push(`/budgetTracker/${expense.id}`);
  };

  return (
    <main>
      <section className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Budget Tracker</h1>
        </div>
        <button
          className="px-4 py-2 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
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
          amount: "",
          status: "pending",
          date: new Date().toISOString().split("T")[0], // proper YYYY-MM-DD
          description: "",
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading} // ← make sure your ReusableDialog accepts and uses this prop!
        fieldConfig={{
          name: {
            type: "text", // or "select" if you have options
            placeholder: "Expense name",
          },
          // ... other field configs
        }}
      />

      <div className="container mx-auto py-10">
        {isFetching ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading expenses...</p>
            {/* Or your spinner component */}
          </div>
        ) : (
          <ReusableDataTable
            columns={columns}
            data={tableData}
            onRowClick={handleRowClick} // ← fixed: just pass the function
          />
        )}
      </div>
    </main>
  );
};
export default BudgetTracker