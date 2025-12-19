/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { columns, Payment } from "./columns";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { useRouter } from "next/navigation";
import { CreateIncome } from "@/lib/actions/income.actions";
import { toast } from "sonner";
import { IncomeDialog } from "@/components/create/IncomeDialog";
import { createIncomeSchema } from "@/lib/validations";
import { Loading } from "@/components/ui/loaading-spinner";


// Sample data matching the Payment type

const IncomeExpenses = () => {
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
        const result = await fetch("/api/incomeTracker").then((res) => res.json());
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
      const result = await CreateIncome(formData);

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

  const handleRowClick = (income: Payment) => {
    router.push(`/IncomeExpenses/${income.id}`);
  };

  return (
    <main className="w-full">
      <div className="w-full px-4 md:px-6 lg:px-8">
        {/* Income Tab*/}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Income Tracker</h1>
          </div>

          {/*<UploadCSV/>*/}
      </section>

        <button
          className="w-full sm:w-auto px-4 py-2 mb-4 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          Add Income
        </button>


      <IncomeDialog
        open={open}
        onOpenChange={setOpen}
        title="Add Income"
        dialogName="Add Income"
        schema={createIncomeSchema}
        defaultValues={{
          name: "",
          amount: "",
          source: "",
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

      <div className="w-full py-6 md:py-10">
        {isFetching ? (
          <div className="flex justify-center items-center h-64">
              <Loading name="Income Expenses"/>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ReusableDataTable
              columns={columns}
              data={tableData}
              onRowClick={handleRowClick} // ← fixed: just pass the function
            />
          </div>
        )}
      </div>
      </div>
    </main>
  );
};
export default IncomeExpenses