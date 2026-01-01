/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  CONTEXT_PROMPT,
  ORG_SYSTEM_PROMPT,
  ORG_ANALYTICS_PROMPT,
} from "@/lib/ai/prompts";
import {
  handleOrgAddExpense,
  handleOrgAddIncome,
  handleOrgQuerySpending,
  handleOrgQueryIncome,
  handleOrgFinancialSummary,
  getOrgFinancialContext,
} from "@/lib/ai/handlers";

// Initialize OpenRouter client
const client = new OpenRouter({
  apiKey: process.env.OPEN_AI_KEYS!,
});

// Available AI models
const AI_MODELS = {
  fast: "anthropic/claude-3-haiku",
  balanced: "anthropic/claude-3-5-sonnet",
  powerful: "anthropic/claude-3-opus",
} as const;

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50;
const RATE_WINDOW = 60 * 1000;

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
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    return JSON.parse(text);
  } catch {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return extractFromMalformedJSON(objectMatch[0]);
      }
    }
    return null;
  }
}

function extractFromMalformedJSON(text: string): any {
  try {
    const intentMatch = text.match(/"intent"\s*:\s*"([^"]+)"/);
    const confidenceMatch = text.match(/"confidence"\s*:\s*([\d.]+)/);

    let reply = "";
    const replyMatch = text.match(/"reply"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|",\s*")/);
    if (replyMatch) {
      reply = replyMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }

    if (intentMatch && reply) {
      return {
        intent: intentMatch[1],
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        reply: reply,
        needs_clarification: false,
        suggested_actions: null,
        data: {},
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Build conversation history
function buildConversationHistory(context: any[]): string {
  if (!context || !Array.isArray(context) || context.length === 0) {
    return "";
  }

  return context
    .slice(-10) // Last 10 messages for context
    .map((msg: any) => `${msg.role}: ${msg.content}`)
    .join("\n");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Verify user is a member of this organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please wait a moment." },
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

    // Build organization context
    const orgContext = {
      organizationId: orgId,
      organizationName: organization.name,
      industry: organization.industry,
      userRole: membership.role,
      memberCount: organization.members.length,
    };

    // Build enhanced prompt with organization context
    let enhancedSystemPrompt = ORG_SYSTEM_PROMPT(orgContext);

    // Add conversation context
    const conversationHistory = buildConversationHistory(context);
    if (conversationHistory) {
      enhancedSystemPrompt += "\n\n" + CONTEXT_PROMPT(conversationHistory);
    }

    // Add organization financial context
    if (includeFinancialContext) {
      const financialData = await getOrgFinancialContext(orgId, "month");
      if (financialData) {
        enhancedSystemPrompt += "\n\n" + ORG_ANALYTICS_PROMPT(financialData);
      }
    }

    // Select model
    const selectedModel =
      AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS.fast;

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

    // Parse AI response
    const rawResponse =
      completion.choices?.[0]?.message?.content || "I couldn't process that.";
    const parsed = safeJSON(rawResponse as any);

    if (!parsed) {
      // Return raw response if JSON parsing fails
      return NextResponse.json({
        success: true,
        data: rawResponse,
        intent: "general",
        confidence: 0.5,
        organizationId: orgId,
        organizationName: organization.name,
      });
    }

    const intent = parsed.intent || "general";
    const confidence = parsed.confidence || 0.5;
    const reply = parsed.reply || rawResponse;

    // Route to organization-specific handlers
    switch (intent) {
      case "add_expense":
        const expenseResult = await handleOrgAddExpense(parsed, orgContext);
        return NextResponse.json({
          success: expenseResult.success,
          data: expenseResult.data,
          intent,
          confidence,
          metadata: expenseResult.metadata,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "add_income":
        const incomeResult = await handleOrgAddIncome(parsed, orgContext);
        return NextResponse.json({
          success: incomeResult.success,
          data: incomeResult.data,
          intent,
          confidence,
          metadata: incomeResult.metadata,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "query_spending":
        const spendingResult = await handleOrgQuerySpending(parsed, orgContext);
        return NextResponse.json({
          success: spendingResult.success,
          data: spendingResult.data,
          intent,
          confidence,
          metadata: spendingResult.metadata,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "query_income":
        const incomeQueryResult = await handleOrgQueryIncome(parsed, orgContext);
        return NextResponse.json({
          success: incomeQueryResult.success,
          data: incomeQueryResult.data,
          intent,
          confidence,
          metadata: incomeQueryResult.metadata,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "financial_summary":
        const summaryResult = await handleOrgFinancialSummary(parsed, orgContext);
        return NextResponse.json({
          success: summaryResult.success,
          data: summaryResult.data,
          intent,
          confidence,
          metadata: summaryResult.metadata,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
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
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "team_analytics":
        // Get team expense breakdown
        const teamAnalytics = await getOrgFinancialContext(orgId, "month");
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          analytics: teamAnalytics,
          suggestedActions: parsed.suggested_actions,
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "approval_status":
        // Query pending approvals
        const pendingExpenses = await prisma.expenseTracker.findMany({
          where: {
            organizationId: orgId,
            status: "pending",
          },
          orderBy: { date: "desc" },
          take: 10,
        });

        const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
        const pendingResponse =
          pendingExpenses.length === 0
            ? `No pending expenses for ${organization.name}. All caught up! ✅`
            : `**Pending Expenses for ${organization.name}**\n\nTotal: $${pendingTotal.toFixed(2)} across ${pendingExpenses.length} expense(s)\n\n${pendingExpenses.map((e, i) => `${i + 1}. ${e.name}: $${e.amount.toFixed(2)}`).join("\n")}`;

        return NextResponse.json({
          success: true,
          data: reply || pendingResponse,
          intent,
          confidence,
          metadata: {
            pendingCount: pendingExpenses.length,
            pendingTotal,
          },
          suggestedActions: parsed.suggested_actions || ["Approve all", "View details"],
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "greeting":
        return NextResponse.json({
          success: true,
          data: reply,
          intent,
          confidence,
          suggestedActions: parsed.suggested_actions || [
            `Check ${organization.name} expenses`,
            "View financial summary",
            "Check pending approvals",
          ],
          organizationId: orgId,
          organizationName: organization.name,
        });

      case "acknowledgment":
        return NextResponse.json({
          success: true,
          data: reply || "Got it! Is there anything else I can help you with?",
          intent,
          confidence,
          suggestedActions: parsed.suggested_actions || [
            "Add another transaction",
            "View organization balance",
            "Get budget advice",
          ],
          organizationId: orgId,
          organizationName: organization.name,
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
          organizationId: orgId,
          organizationName: organization.name,
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
          organizationId: orgId,
          organizationName: organization.name,
        });
    }
  } catch (error: any) {
    console.error("[Organization AI Error]", error);

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

// Health check endpoint for organization AI
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, industry: true },
  });

  if (!organization) {
    return NextResponse.json(
      { success: false, error: "Organization not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "ok",
    service: "C3-Amin Organization AI",
    version: "1.0",
    organization: {
      id: organization.id,
      name: organization.name,
      industry: organization.industry,
    },
    capabilities: [
      "organization_expense_tracking",
      "organization_income_tracking",
      "organization_financial_analysis",
      "team_analytics",
      "approval_status",
      "budget_advice",
    ],
  });
}
