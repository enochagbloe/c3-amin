// Chat Message Type
declare interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Chat Session Type
declare interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  organizationId?: string;
  organizationName?: string;
}

// Chat Context State
declare interface ChatContextState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
}

// Chat Context Actions
declare interface ChatContextActions {
  createSession: () => string;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  togglePinSession: (sessionId: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearCurrentSession: () => void;
  getCurrentSession: () => ChatSession | null;
  getSessionContext: (limit?: number) => string;
}

// Combined Chat Context
declare type ChatContextType = ChatContextState & ChatContextActions;

// Grouped Sessions for Display
declare interface GroupedSessions {
  pinned: ChatSession[];
  today: ChatSession[];
  yesterday: ChatSession[];
  lastWeek: ChatSession[];
  older: ChatSession[];
}

// Organization AI Context
declare interface OrganizationAIContext {
  organizationId: string;
  organizationName: string;
  industry: string;
  userRole: string;
  memberCount: number;
}

// Organization AI Response
declare interface OrganizationAIResponse {
  success: boolean;
  data: string;
  intent: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  suggestedActions?: string[];
  followUpQuestions?: string[];
  needsClarification?: boolean;
  organizationId: string;
  organizationName: string;
  analytics?: OrganizationFinancialData;
}

// Organization Financial Data
declare interface OrganizationFinancialData {
  totalExpenses: number;
  totalIncome: number;
  expenseCount: number;
  incomeCount: number;
  topCategories: { category: string; amount: number }[];
  period: string;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
}

// Organization AI Request
declare interface OrganizationAIRequest {
  message: string;
  context?: ChatMessage[];
  model?: "fast" | "balanced" | "powerful";
  includeFinancialContext?: boolean;
}
