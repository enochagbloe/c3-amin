/* C3-Amin AI Module Enhanced AI capabilities for the productivity platform */

export * from "./prompts";
export * from "./handlers";

// Re-export types for convenience
export type AIModel = "fast" | "balanced" | "powerful";

export interface AIResponse {
  success: boolean;
  data: string;
  intent?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  suggestedActions?: string[];
  followUpQuestions?: string[];
  needsClarification?: boolean;
  action?: string;
  actionData?: Record<string, unknown>;
}

export interface AIRequest {
  message: string;
  context?: string;
  model?: AIModel;
  includeFinancialContext?: boolean;
  organizationId?: string;
}
