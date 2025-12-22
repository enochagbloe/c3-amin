/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import { auth } from "@/auth";
import { 
  SYSTEM_PROMPT, 
  CONTEXT_PROMPT, 
  ANALYTICS_PROMPT 
} from "@/lib/ai/prompts";
import {
  handleAddExpense,
  handleAddIncome,
  handleQuerySpending,
  handleQueryIncome,
  handleFinancialSummary,
  getFinancialContext,
} from "@/lib/ai/handlers";

// Initialize OpenRouter client
const client = new OpenRouter({
  apiKey: process.env.OPEN_AI_KEYS!,
});

// Available AI models (can be configured)
const AI_MODELS = {
  fast: "anthropic/claude-3-haiku",
  balanced: "anthropic/claude-3-5-sonnet",
  powerful: "anthropic/claude-3-opus",
} as const;

// Rate limiting (simple in-memory, use Redis for production)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Safe JSON parser with fallback
function safeJSON(text: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // If JSON parsing still fails, try to extract key fields manually
        return extractFromMalformedJSON(objectMatch[0]);
      }
    }
    return null;
  }
}

// Extract data from malformed JSON (when AI includes unescaped newlines in strings)
function extractFromMalformedJSON(text: string): any {
  try {
    // Try to extract intent
    const intentMatch = text.match(/"intent"\s*:\s*"([^"]+)"/);
    const confidenceMatch = text.match(/"confidence"\s*:\s*([\d.]+)/);
    
    // Extract reply - handle multi-line content
    let reply = "";
    const replyMatch = text.match(/"reply"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|",\s*")/);
    if (replyMatch) {
      reply = replyMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    
    // If we at least have an intent and reply, return a parsed object
    if (intentMatch && reply) {
      return {
        intent: intentMatch[1],
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        reply: reply,
        needs_clarification: false,
        suggested_actions: null,
      };
    }
    
    // Last resort: just return the reply if we can find it
    if (reply) {
      return {
        intent: "general",
        confidence: 0.5,
        reply: reply,
        needs_clarification: false,
        suggested_actions: null,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Build conversation history string
function buildConversationHistory(context?: string): string {
  if (!context) return "";
  
  // Parse and format context for the AI
  try {
    // Context might be a formatted string of previous conversations
    return context;
  } catch {
    return "";
  }
}

// Main POST handler
export async function POST(request: Request) {
  try {
    // Authentication
    const session = await auth();
    const userId = session?.user?.id || "anonymous";

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Rate limit exceeded. Please wait a moment." 
        },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { 
      message, 
      context,
      model = "fast",
      includeFinancialContext = true,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Build enhanced prompt
    let enhancedSystemPrompt = SYSTEM_PROMPT;

    // Add conversation context
    const conversationHistory = buildConversationHistory(context);
    if (conversationHistory) {
      enhancedSystemPrompt += "\n\n" + CONTEXT_PROMPT(conversationHistory);
    }

    // Add financial context for smarter responses
    if (includeFinancialContext) {
      const financialData = await getFinancialContext("month");
      if (financialData) {
        enhancedSystemPrompt += "\n\n" + ANALYTICS_PROMPT(financialData);
      }
    }

    // Select model
    const selectedModel = AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS.fast;

    // Call AI
    const completion = await client.chat.send({
      model: selectedModel,
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    const rawResponse = completion.choices[0]?.message?.content;

    if (typeof rawResponse !== "string") {
      return NextResponse.json({
        success: true,
        data: "I'm having trouble processing that. Could you rephrase your question?",
      });
    }

    // Parse AI response
    const parsed = safeJSON(rawResponse);

    if (!parsed) {
      // AI didn't return valid JSON, return raw response
      return NextResponse.json({
        success: true,
        data: rawResponse,
        raw: true,
      });
    }

    const intent = parsed.intent || "general";
    const confidence = parsed.confidence || 0.5;
    const reply = parsed.reply || "I'm here to help!";

    // Log for debugging (remove in production)
    console.log(`[AI] Intent: ${intent} (${(confidence * 100).toFixed(0)}%) - ${message.substring(0, 50)}...`);

    // Route to appropriate handler based on intent
    switch (intent) {
      case "add_expense":
        const expenseResult = await handleAddExpense(parsed);
        return NextResponse.json({
          success: expenseResult.success,
          data: expenseResult.data,
          intent,
          confidence,
          metadata: expenseResult.metadata,
          suggestedActions: parsed.suggested_actions,
        });

      case "add_income":
        const incomeResult = await handleAddIncome(parsed);
        return NextResponse.json({
          success: incomeResult.success,
          data: incomeResult.data,
          intent,
          confidence,
          metadata: incomeResult.metadata,
          suggestedActions: parsed.suggested_actions,
        });

      case "query_spending":
        const spendingResult = await handleQuerySpending(parsed);
        return NextResponse.json({
          success: spendingResult.success,
          data: spendingResult.data,
          intent,
          confidence,
          metadata: spendingResult.metadata,
          suggestedActions: parsed.suggested_actions,
        });

      case "query_income":
        const incomeQueryResult = await handleQueryIncome(parsed);
        return NextResponse.json({
          success: incomeQueryResult.success,
          data: incomeQueryResult.data,
          intent,
          confidence,
          metadata: incomeQueryResult.metadata,
          suggestedActions: parsed.suggested_actions,
        });

      case "financial_summary":
        const summaryResult = await handleFinancialSummary(parsed);
        return NextResponse.json({
          success: summaryResult.success,
          data: summaryResult.data,
          intent,
          confidence,
          metadata: summaryResult.metadata,
          suggestedActions: parsed.suggested_actions,
        });

      case "budget_advice":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "budget_advice",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
          followUpQuestions: parsed.follow_up_questions,
        });

      case "schedule_meeting":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "schedule_meeting",
          actionData: parsed.data,
          needsClarification: parsed.needs_clarification,
          suggestedActions: parsed.suggested_actions,
        });

      case "create_task":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "create_task",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
        });

      case "send_email":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "send_email",
          actionData: parsed.data,
          needsClarification: parsed.needs_clarification,
          suggestedActions: parsed.suggested_actions,
        });

      case "set_reminder":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "set_reminder",
          actionData: parsed.data,
          suggestedActions: parsed.suggested_actions,
        });

      case "manage_content":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          action: "manage_content",
          actionData: parsed.data,
          needsClarification: parsed.needs_clarification,
          suggestedActions: parsed.suggested_actions,
        });

      case "analytics":
        // Fetch real analytics data
        const analyticsData = await getFinancialContext("month");
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          analytics: analyticsData,
          suggestedActions: parsed.suggested_actions,
        });

      case "greeting":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          suggestedActions: parsed.suggested_actions || [
            "Check my expenses",
            "Add a new expense",
            "View financial summary",
          ],
        });

      case "acknowledgment":
        // Brief response for acknowledgments like "ok", "thanks", etc.
        return NextResponse.json({
          success: true,
          data: reply || "Got it! Is there anything else I can help you with?",
          intent,
          confidence,
          suggestedActions: parsed.suggested_actions || [
            "Add another transaction",
            "View my balance",
            "Get financial advice",
          ],
        });

      case "unclear":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          needsClarification: true,
          followUpQuestions: parsed.follow_up_questions,
          suggestedActions: parsed.suggested_actions,
        });

      case "general":
      default:
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          suggestedActions: parsed.suggested_actions,
          followUpQuestions: parsed.follow_up_questions,
        });
    }
  } catch (error: any) {
    console.error("[AI Error]", error);

    // Graceful error handling
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { success: false, error: "AI service is busy. Please try again in a moment." },
        { status: 429 }
      );
    }

    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { success: false, error: "AI service configuration error." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "C3-Amin AI",
    version: "2.0",
    capabilities: [
      "expense_tracking",
      "income_tracking",
      "financial_analysis",
      "budget_advice",
      "task_management",
      "meeting_scheduling",
      "email_drafting",
      "content_planning",
    ],
  });
}
