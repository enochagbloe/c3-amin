/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { columns, Payment } from "./columns";
import { ExpensesDialog } from "@/components/create/Dialog";
import { ExpenseTrackerInputSchema } from "@/lib/validations";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { useRouter } from "next/navigation";
import { createBudgetExpense } from "@/lib/actions/budgetTracker.action";
import { toast } from "sonner";
import UploadCSV from "@/components/uploadcsv/uploadcsv";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncomeExpenses from "../IncomeExpenses/page";
import { motion } from "framer-motion"
import { Loading } from "@/components/ui/loaading-spinner";


// Sample data matching the Payment type

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
      <div className="items-center justify-center">
      <div>
        <Tabs defaultValue="income">
          <TabsList>
           <TabsTrigger value="income">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
                >
                  Income
                </motion.button>
           </TabsTrigger>
           <TabsTrigger value="Budget">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
                >
                  Budget
                </motion.button>

           </TabsTrigger>
          </TabsList>
        <TabsContent value="Budget">


      {/* Budget Tab*/}
      <section className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Tracker</h1>
          </div>

          <UploadCSV/>
      </section>
        <button
          className="px-4 py-2 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          Create Expense
        </button>
      <ExpensesDialog
        open={open}
        onOpenChange={setOpen}
        title="Create Expense"
        dialogName="Create Expense"
        schema={ExpenseTrackerInputSchema}
        defaultValues={{
          name: "",
          amount: "",
          //status: "pending",
          date: new Date().toISOString().split("T")[0], // proper YYYY-MM-DD
          description: "",
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading} 
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
           { /*<p>Loading expenses...</p>*/}
            <Loading name="budget Expenses" />
          </div>
        ) : (
          <ReusableDataTable
            columns={columns}
            data={tableData}
            onRowClick={handleRowClick} // ← fixed: just pass the function
          />
        )}
      </div>
        </TabsContent>
        <TabsContent value="income">
          <IncomeExpenses/>
        </TabsContent>
        </Tabs>
      </div>
      </div>


    </main>
  );
};
export default BudgetTracker