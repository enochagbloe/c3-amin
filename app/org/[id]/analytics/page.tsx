/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/loaading-spinner";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const OrgAnalyticsPage = () => {
  const params = useParams();
  const orgId = params.id as string;

  const [isFetching, setIsFetching] = React.useState(true);
  const [analytics, setAnalytics] = React.useState({
    totalExpenses: 0,
    totalIncome: 0,
    netBalance: 0,
    expensesByMonth: [] as any[],
    incomeByMonth: [] as any[],
    topExpenses: [] as any[],
    expensesByCategory: [] as any[],
  });

  // Fetch analytics data
  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsFetching(true);
        
        // Fetch expenses
        const expensesRes = await fetch(`/api/budgetTracker?orgId=${orgId}`);
        const expensesData = await expensesRes.json();
        const expenses = expensesData.data || [];
        
        // Fetch income
        const incomeRes = await fetch(`/api/incomeTracker?orgId=${orgId}`);
        const incomeData = await incomeRes.json();
        const income = incomeData.data || [];
        
        // Calculate totals
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
        const totalIncome = income.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount), 0);
        const netBalance = totalIncome - totalExpenses;
        
        // Top 5 expenses
        const topExpenses = expenses
          .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
          .slice(0, 5);
        
        setAnalytics({
          totalExpenses,
          totalIncome,
          netBalance,
          expensesByMonth: [],
          incomeByMonth: [],
          topExpenses,
          expensesByCategory: [],
        });
      } catch (error) {
        toast.error("Failed to load analytics");
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchAnalytics();
  }, [orgId]);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  const isProfit = analytics.netBalance >= 0;

  return (
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Financial insights and performance metrics for your organization
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${analytics.totalIncome.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${analytics.totalExpenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Balance
                </CardTitle>
                <DollarSign className={`h-4 w-4 ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${Math.abs(analytics.netBalance).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isProfit ? 'Profit' : 'Loss'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profit Margin
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalIncome > 0 
                    ? ((analytics.netBalance / analytics.totalIncome) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Expenses</CardTitle>
              <CardDescription>Highest spending categories</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No expense data available
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topExpenses.map((expense: any, index: number) => (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 dark:text-red-400">
                          ${parseFloat(expense.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {expense.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Overview of your organization&apos;s financial health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Income vs Expenses Ratio</span>
                  <span className="text-sm font-bold">
                    {analytics.totalExpenses > 0
                      ? (analytics.totalIncome / analytics.totalExpenses).toFixed(2)
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Average Expense</span>
                  <span className="text-sm font-bold">
                    ${analytics.topExpenses.length > 0
                      ? (analytics.totalExpenses / analytics.topExpenses.length).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Financial Status</span>
                  <span className={`text-sm font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isProfit ? 'Healthy' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default OrgAnalyticsPage;
