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
    <main className="w-full">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <Tabs defaultValue="income" className="">
          <TabsList className="">
           <TabsTrigger value="income" className="">
              Income
           </TabsTrigger>
           <TabsTrigger value="Budget" className="flex-1 md:flex-none">
              Budget
           </TabsTrigger>
          </TabsList>
        <TabsContent value="Budget" className="w-full">


      {/* Budget Tab*/}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Budget Tracker</h1>
          </div>

          <UploadCSV/>
      </section>
        <button
          className="w-full sm:w-auto px-4 py-2 mb-4 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
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
          date: new Date(), // proper YYYY-MM-DD
          description: "",
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading} 
        fieldConfig={{
          name: {
            type: "text",
            placeholder: "Expense name",
          }
        }}
      />

      <div className="w-full py-6 md:py-10">
        {isFetching ? (
          <div className="flex justify-center items-center h-64">
            <Loading name="budget Expenses" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ReusableDataTable
              columns={columns}
              data={tableData}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>
        </TabsContent>
        <TabsContent value="income" className="w-full">
          <IncomeExpenses/>
        </TabsContent>
        </Tabs>
      </div>


    </main>
  );
};
export default BudgetTracker