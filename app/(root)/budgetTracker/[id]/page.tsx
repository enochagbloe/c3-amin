import { getAllExpense } from "@/lib/actions/budgetTracker.action";
import { ExpenseTracker } from "@/lib/generated/prisma";
import { notFound } from "next/navigation";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/seperator";
import { Calendar, DollarSign, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteParams {
  params: {
    id: string;
  };
}

const ExpenseDetailsPage = async ({ params }: RouteParams) => {
  const { id } = await params;

  if (!id) {
    return <div>No Expense ID provided</div>;
  }

  // Fetch data from the server action
  const response = await getAllExpense({ expensesId: id });

  if (!response.success || !response.data) return notFound();

  const expensesData = response.data as ExpenseTracker;
  const { name, amount, status, date, description } = expensesData;

  // Status variant mapping
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // const handleClick = () => {
  //   router.back();
  // };

  return (
    <>
      <div className="flex justify-between mb-14 ">
        <button
          className="text-sm text-slate-500 dark:text-white"
          //onClick={handleClick}
        >
          Back
        </button>
        <div className="ml-auto gap-4 p-2 hover:cursor-pointer">
          <Button variant="outline">Approve</Button>
          <Button variant="outline">Reject</Button>
        </div>
      </div>
      <div>
        <h1 className="text-4xl font-bold">Expense Details</h1>
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold">{name}</CardTitle>
                  <CardDescription>Expense Details</CardDescription>
                </div>
                <Badge
                  variant={getStatusVariant(status)}
                  className="text-sm px-3 py-1"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium dark:text-white">
                      Amount
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${parseFloat(amount.toString()).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium dark:text-white">
                    Date
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium dark:text-white">
                    Status
                  </p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          {description && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-xl">Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpenseDetailsPage;
