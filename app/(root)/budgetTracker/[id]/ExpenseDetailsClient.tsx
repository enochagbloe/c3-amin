"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ExpenseTracker } from "@/lib/generated/prisma";
import ApproveDialog from "@/components/approveDialog";
import MakePaymentDialog from "@/components/make-paymentDialog";
import { toast } from "sonner";
import ApprovalTimeline from "@/components/ui/timeline";

interface ExpenseDetailsClientProps {
  expensesData: ExpenseTracker;
  user: string;
}

export default function ExpenseDetailsClient({
  expensesData,
  user,
}: ExpenseDetailsClientProps) {
  const router = useRouter();
  const { name, amount, status, date, description } = expensesData;

  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [openMakePayment, setOpenMakePayment] = useState(false);

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

  const handleBack = () => {
    router.back();
    router.refresh();
  };
  const handlePayment = () => {
    console.log("testing");
    toast.success("Payment created successfully");
    router.refresh()
  };

  return (
    <>
      <div>
        <button
          className="text-sm text-slate-500 dark:text-white"
          onClick={handleBack}
        >
          Back
        </button>
      </div>

      <ApproveDialog
        open={openApprove}
        onOpenChange={setOpenApprove}
        isApprove={true}
        id={expensesData.id}
        alreadyApproved={status === "approved"}
      />
      <ApproveDialog
        open={openReject}
        onOpenChange={setOpenReject}
        isApprove={false}
        id={expensesData.id}
        alreadyApproved={status === "approved" ? true : status === "rejected"}
      />

      <div className="flex justify-between mb-14">
        {status === "approved" ? (
          <>
            {" "}
            <MakePaymentDialog
              open={openMakePayment}
              onOpenChange={setOpenMakePayment}
              id={expensesData.id}
              isApprove={false}
              alreadyApproved={true}
              onSubmit={handlePayment}
            />
          </>
        ) : (
          <>
            <MakePaymentDialog
              open={openMakePayment}
              onOpenChange={setOpenMakePayment}
              isApprove={false}
              alreadyApproved={false}
              id={expensesData.id}
              onSubmit={handlePayment}
            />
          </>
        )}
        <div className="ml-auto gap-4 p-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="hover:cursor-pointer"
              onClick={() => setOpenApprove(true)}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              className="hover:cursor-pointer"
              onClick={() => setOpenReject(true)}
            >
              Reject
            </Button>
          </div>
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
        {status === "approved" ? <ApprovalTimeline status={status} user={user} /> : null}
        {status === "rejected" ? <ApprovalTimeline status={status} user={user}/>: null}
        </div>
      </div>
    </>
  );
}
