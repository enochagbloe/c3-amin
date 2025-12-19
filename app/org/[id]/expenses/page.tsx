/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { columns, Payment } from "./columns";
import { ExpensesDialog } from "@/components/create/Dialog";
import { ExpenseTrackerInputSchema } from "@/lib/validations";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/loaading-spinner";
import { DollarSign, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBudgetExpense } from "@/lib/actions/budgetTracker.action";

const OrgExpensesPage = () => {
  const params = useParams();
  const orgId = params.id as string;

  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Payment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [stats, setStats] = React.useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Fetch org expenses
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const result = await fetch(`/api/budgetTracker?orgId=${orgId}`).then(
          (res) => res.json()
        );
        
        const expenses = result.data || [];
        setTableData(expenses);

        // Calculate stats
        const total = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
        const pending = expenses.filter((exp: any) => exp.status === "pending").length;
        const approved = expenses.filter((exp: any) => exp.status === "approved").length;
        const rejected = expenses.filter((exp: any) => exp.status === "rejected").length;

        setStats({ total, pending, approved, rejected });
      } catch (error) {
        toast.error("Failed to load organization expenses");
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [orgId]);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      // Add organizationId to the expense data
      const expenseData = { ...formData, organizationId: orgId };
      
      const result = await createBudgetExpense(expenseData);

      if (result.success && result.data) {
        setTableData((prevData) => [...prevData, result.data] as any);
        setOpen(false);
        toast.success("Organization expense created successfully");
        
        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total + parseFloat(result.data!.amount.toString()),
          pending: prev.pending + 1,
        }));
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

  const statCards = [
    {
      title: "Total Expenses",
      value: `$${stats.total.toFixed(2)}`,
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Organization Expenses</h1>
          <p className="text-muted-foreground">
            Manage and track all expenses for this organization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Expenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ExpensesDialog
            open={open}
            onOpenChange={setOpen}
            title="Add Expense"
            schema={ExpenseTrackerInputSchema}
            defaultValues={{
              name: "",
              amount: "",
              status: "pending",
              date: new Date(),
              description: "",
            }}
            onSubmit={handleSubmit}
            dialogName="Expense"
            isLoading={isLoading}
          />
          <ReusableDataTable
            columns={columns}
            data={tableData}
          />
        </motion.div>
      </motion.div>
    </main>
  );
};

export default OrgExpensesPage;
