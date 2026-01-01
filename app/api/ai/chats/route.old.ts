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

// Handle expense addition
async function handleAddExpense(parsed: any) {
  if (!parsed.data?.name || !parsed.data?.amount) {
    return NextResponse.json({
      success: true,
      data: "I need a name and amount to add this expense. Could you provide those details?",
    });
  }

  const added = await createBudgetExpense({
    name: parsed.data.name,
    amount: parsed.data.amount,
    date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
  });

  return NextResponse.json({
    success: true,
    data: parsed.reply || `✅ Added $${parsed.data.amount} for ${parsed.data.name}!`,
    expense: added
  });
}

// Handle spending queries
async function handleQuerySpending(parsed: any) {
  const period = parsed.data?.period ?? "month";
  
  const startDate = new Date();
  if (period === "month") startDate.setDate(1);
  if (period === "week") startDate.setDate(startDate.getDate() - 7);
  if (period === "day") startDate.setHours(0, 0, 0, 0);

  const expenses = await prisma.expenseTracker.findMany({
    where: { date: { gte: startDate } },
  });

  const total = expenses.reduce((sum, e) => sum + (e.amount), 0);
  const count = expenses.length;

  const friendlyReply = count === 0 
    ? `Good news! You haven't logged any expenses this ${period}. 🎉`
    : `You've spent $${total.toFixed(2)} across ${count} expense${count === 1 ? '' : 's'} this ${period}.`;

  return NextResponse.json({
    success: true,
    data: parsed.reply || friendlyReply,
  });
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
You are an intelligent assistant for a comprehensive productivity platform that includes:
- Budget & Expense Tracking
- Meeting Management & Scheduling
- Email Communication
- Task Management (personal & team)
- Content Planning & Management
- User Management
- Calendar Integration
- AI-powered Notes
- Follow-ups & Reminders
- Payment Processing

You should:
1. Be friendly, professional, and conversational
2. Understand natural language and context
3. Help users with ANY of these features
4. Ask clarifying questions when needed
5. Provide helpful suggestions

Respond in JSON format:
{
  "intent": "add_expense" | "query_spending" | "schedule_meeting" | "send_email" | "create_task" | "manage_content" | "take_notes" | "general" | "unclear",
  "data": {
    // Relevant extracted data based on intent
  },
  "reply": "Your friendly response to the user",
  "needs_clarification": boolean,
  "suggested_actions": string[] | null
}

Examples:

User: "Hi!"
{
  "intent": "general",
  "data": {},
  "reply": "Hey there! 👋 I'm your productivity assistant. I can help you manage tasks, schedule meetings, track expenses, plan content, and much more. What can I help you with today?",
  "needs_clarification": false,
  "suggested_actions": ["View today's tasks", "Check calendar", "Review expenses"]
}

User: "Schedule a meeting with John tomorrow at 2pm"
{
  "intent": "schedule_meeting",
  "data": {"attendee": "John", "date": "tomorrow", "time": "2pm"},
  "reply": "I'll schedule a meeting with John for tomorrow at 2pm. Would you like me to send him an invite?",
  "needs_clarification": false,
  "suggested_actions": ["Send calendar invite", "Set reminder"]
}

User: "I spent $50 on groceries today"
{
  "intent": "add_expense",
  "data": {"name": "groceries", "amount": 50, "date": "${new Date().toISOString().split('T')[0]}"},
  "reply": "Got it! I've added $50 for groceries today.",
  "needs_clarification": false,
  "suggested_actions": null
}

User: "What tasks do I have today?"
{
  "intent": "create_task",
  "data": {"query": "today"},
  "reply": "Let me pull up your tasks for today...",
  "needs_clarification": false,
  "suggested_actions": null
}

User: "Help me plan content for next week"
{
  "intent": "manage_content",
  "data": {"period": "next_week"},
  "reply": "I'd love to help with content planning! What type of content are you working on? (Social media, blog posts, emails, etc.)",
  "needs_clarification": true,
  "suggested_actions": ["View content calendar", "Create content template"]
}

User: "Send email to Sarah about the project update"
{
  "intent": "send_email",
  "data": {"recipient": "Sarah", "subject": "project update"},
  "reply": "I can help you draft an email to Sarah about the project update. What would you like to say?",
  "needs_clarification": true,
  "suggested_actions": ["Draft email", "Use template"]
}

User: "How much did I spend this week?"
{
  "intent": "query_spending",
  "data": {"period": "week"},
  "reply": "Let me check your spending for this week...",
  "needs_clarification": false,
  "suggested_actions": null
}

Be conversational and context-aware. Use emojis occasionally to be friendly. Today's date is ${new Date().toLocaleDateString()}.
    `;

    // CALL OPENROUTER
    const completion = await client.chat.send({
      model: "anthropic/claude-3-haiku",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0].message.content;

    console.log("Ai:", raw)
    
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
    const reply = parsed.reply || "I'm here to help!";

    // ROUTE TO DIFFERENT HANDLERS
    switch (intent) {
      case "add_expense":
        return await handleAddExpense(parsed);
      
      case "query_spending":
        return await handleQuerySpending(parsed);
      
      case "schedule_meeting":
        return NextResponse.json({
          success: true,
          data: reply,
          action: "schedule_meeting",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "send_email":
        return NextResponse.json({
          success: true,
          data: reply,
          action: "send_email",
          actionData: parsed.data,
          needsClarification: parsed.needs_clarification,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "create_task":
        return NextResponse.json({
          success: true,
          data: reply,
          action: "create_task",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "manage_content":
        return NextResponse.json({
          success: true,
          data: reply,
          action: "manage_content",
          actionData: parsed.data,
          needsClarification: parsed.needs_clarification,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "take_notes":
        return NextResponse.json({
          success: true,
          data: reply,
          action: "take_notes",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "general":
        return NextResponse.json({
          success: true,
          data: reply,
          suggestedActions: parsed.suggested_actions,
        });
      
      case "unclear":
        return NextResponse.json({
          success: true,
          data: reply,
          needsClarification: true,
          suggestedActions: parsed.suggested_actions,
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: "I can help you with tasks, meetings, expenses, emails, content planning, and more! What would you like to do?",
        });
    }

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