/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import prisma from "@/lib/prisma";
import { createBudgetExpense } from "@/lib/actions/budgetTracker.action";

const client = new OpenRouter({
  apiKey: process.env.OPEN_AI_KEYS!,
});

// Safe JSON parser
function safeJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // SYSTEM PROMPT
    const systemPrompt = `
You are an assistant for a budget tracking app.
Respond ONLY with JSON in this format:

{
  "intent": "add_expense" | "query_spending" | "general",
  "name": string | null,
  "amount": number | null,
  "date": string | null,
  "period": "month" | "week" | "day" | null,
  "reply": string | null
}

Never return anything outside JSON.
    `;

    // CALL OPENROUTER PROPERLY
    const completion = await client.chat.send({
      model: "anthropic/claude-3-haiku", // SAFE + CHEAP MODEL
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0].message.content;
    
    if (typeof raw !== "string") {
      return NextResponse.json({
        success: true,
        data: "I couldn't understand that. Can you rephrase?",
      });
    }

    const parsed = safeJSON(raw);

    if (!parsed) {
      return NextResponse.json({
        success: true,
        data: "I couldn't understand that. Can you rephrase?",
      });
    }

    const intent = parsed.intent;

    //  ADD EXPENSE
    if (intent === "add_expense") {
      if (!parsed.name || !parsed.amount || !parsed.date) {
        return NextResponse.json({
          success: true,
          data: "I need a name, amount and date to add this expense.",
        });
      }

      const added = await createBudgetExpense({
        name: parsed.name,
        amount: parsed.amount,
        date: new Date(parsed.date),
      });

      return NextResponse.json({
        success: true,
        data: `Expense added successfully: ${parsed.name} — $${parsed.amount}. ${added}`,
      });
    }

    //  QUERY SPENDING 
    if (intent === "query_spending") {
      const period = parsed.period ?? "month";

      const startDate = new Date();
      if (period === "month") startDate.setDate(1);
      if (period === "week") startDate.setDate(startDate.getDate() - 7);
      if (period === "day") startDate.setDate(startDate.getDate() - 1);

      const expenses = await prisma.expenseTracker.findMany({
        where: { date: { gte: startDate } },
      });

      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      return NextResponse.json({
        success: true,
        data: `You have spent $${total.toFixed(2)} this ${period}.`,
      });
    }

    //  GENERAL CHAT 
    if (intent === "general") {
      return NextResponse.json({
        success: true,
        data: parsed.reply ?? "Sure! How can I assist?",
      });
    }

    //  FALLBACK 
    return NextResponse.json({
      success: true,
      data: "I'm not sure what you meant. Try rephrasing?",
    });

  } catch (error: any) {
    console.error("AI error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ?? "Something went wrong with AI",
      },
      { status: 500 }
    );
  }
}
