"use client";

import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

// Import your Payment type
type Payment = {
  id: string;
  name: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  date: string;
  description: string;
  author?: string;
};

// TODO: Replace this with your actual data fetching logic
// This could be an API call, database query, or global state
const fetchExpenseById = async (id: string): Promise<Payment | null> => {
  try {
    // Example: API call
    // const response = await fetch(`/api/expenses/${id}`);
    // const data = await response.json();
    // return data;

    // For now, you'll need to implement your data fetching here
    // Options:
    // 1. Fetch from your API
    // 2. Use global state (Redux, Zustand, etc.)
    // 3. Pass data through localStorage temporarily
    // 4. Query from database

    // Temporary: Check localStorage for demo purposes
    const storedExpenses = localStorage.getItem("expenses");
    if (storedExpenses) {
      const expenses: Payment[] = JSON.parse(storedExpenses);
      return expenses.find((expense) => expense.id === id) || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching expense:", error);
    return null;
  }
};

const ExpenseDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const [expense, setExpense] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpense = async () => {
      if (params.id) {
        const expenseData = await fetchExpenseById(params.id as string);
        setExpense(expenseData);
        setLoading(false);
      }
    };

    loadExpense();
  }, [params.id]);

  const handleBack = () => {
    router.back(); // Goes back to previous page
    // OR use: router.push('/budget'); // Goes to specific route
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "success":
        return "✓";
      case "pending":
        return "⏱";
      case "processing":
        return "⟳";
      case "failed":
        return "✕";
      default:
        return "•";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!expense) {
    return (
      <div className=" flex items-center justify-center p-4">
        no expenses found
      </div>
    );
  }

  // Main details page
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {expense.name}
                </h1>
                <p className="text-blue-100 text-sm">
                  Transaction ID: {expense.id}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border-2 ${getStatusColor(
                  expense.status
                )}`}
              >
                <span className="font-semibold text-sm flex items-center gap-2">
                  <span>{getStatusIcon(expense.status)}</span>
                  {expense.status.charAt(0).toUpperCase() +
                    expense.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Amount - Featured */}
            <div className="mb-8 text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-600 mb-2">Total Amount</p>
              <p className="text-5xl font-bold text-gray-900">
                ${expense.amount.toFixed(2)}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Date */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">Date</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Status Details */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Payment Status
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                        expense.status
                      )}`}
                    >
                      {expense.status.charAt(0).toUpperCase() +
                        expense.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {expense.status === "success" &&
                      "Payment completed successfully"}
                    {expense.status === "pending" && "Awaiting confirmation"}
                    {expense.status === "processing" &&
                      "Payment being processed"}
                    {expense.status === "failed" && "Payment failed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-2">
                    Description
                  </p>
                  <p className="text-gray-900 leading-relaxed">
                    {expense.description ||
                      "No description provided for this expense."}
                  </p>
                </div>
              </div>
            </div>

            {/* Author Section - if available */}
            {expense.author && (
              <div className="mb-6">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium mb-1">
                      Created By
                    </p>
                    <p className="text-gray-900 font-semibold">
                      {expense.author}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-blue-600">ℹ</span>
                Summary
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                This expense of{" "}
                <span className="font-semibold">
                  ${expense.amount.toFixed(2)}
                </span>{" "}
                for <span className="font-semibold">{expense.name}</span> was
                recorded on{" "}
                <span className="font-semibold">
                  {new Date(expense.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>{" "}
                with a status of{" "}
                <span className="font-semibold">{expense.status}</span>.
                {expense.description && (
                  <span> Note: {expense.description}</span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to List
              </button>
              <button
                onClick={() => {
                  // TODO: Implement edit functionality
                  console.log("Edit expense:", expense.id);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Edit Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailsPage;
