"use server";

/*AI Intent Handlers Handle specific intents with database operations*/

import prisma from "@/lib/prisma";
import { createBudgetExpense } from "@/lib/actions/budgetTracker.action";
import { CreateIncome } from "@/lib/actions/income.actions";

// Types
interface ParsedIntent {
  intent: string;
  confidence: number;
  data: Record<string, unknown>;
  reply: string;
  needs_clarification: boolean;
  suggested_actions: string[] | null;
  follow_up_questions: string[] | null;
}

interface HandlerResult {
  success: boolean;
  data: string;
  metadata?: Record<string, unknown>;
}

// Parse relative date strings like "last Tuesday", "yesterday", "2 days ago"
function parseRelativeDate(dateStr: string): Date {
  const now = new Date();
  const lower = dateStr.toLowerCase().trim();
  
  // Today/now
  if (lower === "today" || lower === "now") {
    return now;
  }
  
  // Yesterday
  if (lower === "yesterday") {
    const date = new Date(now);
    date.setDate(date.getDate() - 1);
    return date;
  }
  
  // X days ago
  const daysAgoMatch = lower.match(/(\d+)\s*days?\s*ago/);
  if (daysAgoMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() - parseInt(daysAgoMatch[1]));
    return date;
  }
  
  // Last week
  if (lower === "last week") {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    return date;
  }
  
  // Last [weekday] - e.g., "last Tuesday", "last monday"
  const lastWeekdayMatch = lower.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (lastWeekdayMatch) {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = weekdays.indexOf(lastWeekdayMatch[1].toLowerCase());
    const currentDay = now.getDay();
    
    // Calculate days to subtract
    let daysBack = currentDay - targetDay;
    if (daysBack <= 0) daysBack += 7; // Go to previous week
    
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);
    return date;
  }
  
  // This [weekday] - within the current week
  const thisWeekdayMatch = lower.match(/this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (thisWeekdayMatch) {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = weekdays.indexOf(thisWeekdayMatch[1].toLowerCase());
    const currentDay = now.getDay();
    
    let daysDiff = targetDay - currentDay;
    if (daysDiff < 0) daysDiff += 7;
    
    const date = new Date(now);
    date.setDate(date.getDate() + daysDiff);
    return date;
  }
  
  // Try to parse as ISO date or other formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Default to today if can't parse
  return now;
}

// Date range helper
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "last_month":
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/* Handle adding an expense*/
export async function handleAddExpense(parsed: ParsedIntent): Promise<HandlerResult> {
  const { data, reply } = parsed;
  
  const name = data.name as string;
  const amount = Number(data.amount);
  const category = (data.category as string) || "other";
  const description = (data.description as string) || "";
  const dateStr = data.date as string;

  if (!name || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      data: "I need a valid name and amount to add this expense. Could you provide those details? For example: 'I spent $50 on groceries'",
    };
  }

  try {
    // Parse date using improved parser
    const date = dateStr ? parseRelativeDate(dateStr) : new Date();

    const expense = await createBudgetExpense({
      name,
      amount: String(amount), // Schema expects string
      date,
      description,
    });

    if (!expense.success) {
      return {
        success: false,
        data: "I couldn't save that expense. Please try again.",
      };
    }

    return {
      success: true,
      data: reply || `✅ Added ${formatCurrency(amount)} for "${name}" ${category !== "other" ? `(${category})` : ""}`,
      metadata: {
        expense: expense.data,
        category,
      },
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    return {
      success: false,
      data: "Something went wrong while saving the expense. Please try again.",
    };
  }
}

/**
 * Handle adding income - uses the proper Income table
 */
export async function handleAddIncome(parsed: ParsedIntent): Promise<HandlerResult> {
  const { data, reply } = parsed;
  
  const name = data.name as string;
  const amount = Number(data.amount);
  const category = (data.category as string) || "other";
  const source = (data.source as string) || category || "other";
  const description = (data.description as string) || "";
  const dateStr = data.date as string;

  if (!name || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      data: "I need a valid description and amount to log this income. For example: 'Received 5000 cedis salary'",
    };
  }

  try {
    // Parse date using improved parser
    const date = dateStr ? parseRelativeDate(dateStr) : new Date();
    
    // Use the proper CreateIncome action
    const income = await CreateIncome({
      name,
      amount: String(amount), // Schema expects string
      source: source || "other",
      description,
      date,
    });

    if (!income.success) {
      return {
        success: false,
        data: "I couldn't save that income. Please try again.",
      };
    }

    // Format the date for the response
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long", 
      day: "numeric",
    });

    return {
      success: true,
      data: reply || `💰 Logged ${formatCurrency(amount)} income for "${name}" on ${formattedDate}`,
      metadata: { income: income.data, category, source },
    };
  } catch (error) {
    console.error("Error adding income:", error);
    return {
      success: false,
      data: "Something went wrong while logging the income. Please try again.",
    };
  }
}

/*Handle spending queries*/
export async function handleQuerySpending(parsed: ParsedIntent): Promise<HandlerResult> {
  const { data, reply } = parsed;
  const period = (data.period as string) || "month";
  // TODO: Add category filtering support
  // const category = data.category as string | undefined;

  try {
    const { start, end } = getDateRange(period);

    const whereClause: Record<string, unknown> = {
      date: { gte: start, lte: end },
      amount: { gte: 0 }, // Only expenses (positive amounts)
    };

    const expenses = await prisma.expenseTracker.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;

    // Group by category/name for insights
    const byName: Record<string, number> = {};
    expenses.forEach((e) => {
      byName[e.name] = (byName[e.name] || 0) + e.amount;
    });

    const topExpenses = Object.entries(byName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    let response = "";
    if (count === 0) {
      response = `🎉 Great news! You haven't logged any expenses this ${period}.`;
    } else {
      response = `**Spending Summary (${period})**\n\n`;
      response += `Total: ${formatCurrency(total)} across ${count} expense${count === 1 ? "" : "s"}\n\n`;
      
      if (topExpenses.length > 0) {
        response += `**Top Expenses:**\n`;
        topExpenses.forEach(([name, amount], i) => {
          response += `${i + 1}. ${name}: ${formatCurrency(amount)}\n`;
        });
      }
    }

    return {
      success: true,
      data: reply || response,
      metadata: {
        total,
        count,
        period,
        topExpenses,
      },
    };
  } catch (error) {
    console.error("Error querying spending:", error);
    return {
      success: false,
      data: "I couldn't retrieve your spending data. Please try again.",
    };
  }
}

/* Handle income queries*/
export async function handleQueryIncome(parsed: ParsedIntent): Promise<HandlerResult> {
  const { data, reply } = parsed;
  const period = (data.period as string) || "month";

  try {
    const { start, end } = getDateRange(period);

    const income = await prisma.expenseTracker.findMany({
      where: {
        date: { gte: start, lte: end },
        amount: { lt: 0 }, // Income is stored as negative
      },
      orderBy: { date: "desc" },
    });

    const total = Math.abs(income.reduce((sum, e) => sum + e.amount, 0));
    const count = income.length;

    let response = "";
    if (count === 0) {
      response = `No income logged this ${period}. Would you like to add some?`;
    } else {
      response = `**Income Summary (${period})**\n\n`;
      response += `Total Income: ${formatCurrency(total)} from ${count} source${count === 1 ? "" : "s"}`;
    }

    return {
      success: true,
      data: reply || response,
      metadata: { total, count, period },
    };
  } catch (error) {
    console.error("Error querying income:", error);
    return {
      success: false,
      data: "I couldn't retrieve your income data. Please try again.",
    };
  }
}

/**
 * Handle financial summary
 */
export async function handleFinancialSummary(parsed: ParsedIntent): Promise<HandlerResult> {
  const { data, reply } = parsed;
  const period = (data.period as string) || "month";

  try {
    const { start, end } = getDateRange(period);

    const allTransactions = await prisma.expenseTracker.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    });

    const expenses = allTransactions.filter((t) => t.amount >= 0);
    const income = allTransactions.filter((t) => t.amount < 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = Math.abs(income.reduce((sum, e) => sum + e.amount, 0));
    const netSavings = totalIncome - totalExpenses;

    // Calculate daily average
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const dailyAverage = totalExpenses / daysInPeriod;

    let response = `📈 **Financial Summary (${period})**\n\n`;
    response += `💰 Income: ${formatCurrency(totalIncome)}\n`;
    response += `💸 Expenses: ${formatCurrency(totalExpenses)}\n`;
    response += `${netSavings >= 0 ? "✅" : "⚠️"} Net: ${formatCurrency(netSavings)}\n\n`;
    response += `📊 Daily Average Spending: ${formatCurrency(dailyAverage)}`;

    if (netSavings < 0) {
      response += `\n\n💡 Tip: You're spending more than you're earning. Consider reviewing your expenses.`;
    } else if (netSavings > 0) {
      response += `\n\n🎉 Great job! You're saving ${formatCurrency(netSavings)} this ${period}.`;
    }

    return {
      success: true,
      data: reply || response,
      metadata: {
        totalExpenses,
        totalIncome,
        netSavings,
        dailyAverage,
        period,
      },
    };
  } catch (error) {
    console.error("Error getting financial summary:", error);
    return {
      success: false,
      data: "I couldn't generate your financial summary. Please try again.",
    };
  }
}

/**
 * Get financial context for AI
 */
export async function getFinancialContext(period: string = "month") {
  try {
    const { start, end } = getDateRange(period);

    const transactions = await prisma.expenseTracker.findMany({
      where: { date: { gte: start, lte: end } },
    });

    const expenses = transactions.filter((t) => t.amount >= 0);
    const income = transactions.filter((t) => t.amount < 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = Math.abs(income.reduce((sum, e) => sum + e.amount, 0));

    // Group expenses by name (as proxy for category)
    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.name.split(" ")[0].toLowerCase();
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });

    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    return {
      totalExpenses,
      totalIncome,
      expenseCount: expenses.length,
      incomeCount: income.length,
      topCategories,
      period,
    };
  } catch (error) {
    console.error("Error getting financial context:", error);
    return null;
  }
}
