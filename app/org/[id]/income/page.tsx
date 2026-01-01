/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { columns, Income } from "./columns";
import { IncomeDialog } from "@/components/create/IncomeDialog";
import { createIncomeSchema } from "@/lib/validations";
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/loaading-spinner";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateIncome } from "@/lib/actions/income.actions";


const OrgIncomePage = () => {
  const params = useParams();
  const orgId = params.id as string;

  const [open, setOpen] = React.useState(false);
  const [tableData, setTableData] = React.useState<Income[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [stats, setStats] = React.useState({
    total: 0,
    thisMonth: 0,
    count: 0,
  });

  // Fetch org income
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const result = await fetch(`/api/incomeTracker?orgId=${orgId}`).then(
          (res) => res.json()
        );
        
        const income = result.data || [];
        setTableData(income);

        // Calculate stats
        const total = income.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount), 0);
        const currentMonth = new Date().getMonth();
        const thisMonth = income
          .filter((inc: any) => new Date(inc.date).getMonth() === currentMonth)
          .reduce((sum: number, inc: any) => sum + parseFloat(inc.amount), 0);

        setStats({ total, thisMonth, count: income.length });
      } catch (error) {
        toast.error("Failed to load organization income");
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [orgId]);

  // creating a an organization income
  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const incomeData = { ...formData, organizationId: orgId };
      
      const result = await CreateIncome(incomeData);

      if (result.success && result.data) {
        setTableData((prevData) => [...prevData, result.data] as any);
        setOpen(false);
        toast.success("Organization income created successfully");
        
        
        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total + parseFloat(result.data!.amount.toString()),
          count: prev.count + 1,
        }));
      } else {
        toast.error(result.error?.message || "Error creating income");
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
      title: "Total Income",
      value: `$${stats.total.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "This Month",
      value: `$${stats.thisMonth.toFixed(2)}`,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Entries",
      value: stats.count,
      icon: Wallet,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Growth",
      value: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
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
          <h1 className="text-3xl font-bold mb-2">Organization Income</h1>
          <p className="text-muted-foreground">
            Track and manage all income sources for this organization
          </p>
          
        </div>
         <button
          className="w-full sm:w-auto px-4 py-2 mb-4 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          Add Income
        </button>

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

        {/* Income Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <IncomeDialog
            open={open}
            onOpenChange={setOpen}
            title="Add Income"
            schema={createIncomeSchema}
            defaultValues={{
              name: "",
              amount: "",
              source: "",
              date: new Date(),
              description: "",
            }}
            onSubmit={handleSubmit}
            dialogName="Income"
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

export default OrgIncomePage;
