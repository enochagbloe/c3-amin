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
