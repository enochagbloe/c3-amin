"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

// Storage key for localStorage
const STORAGE_KEY = "c3-amin-chat-sessions";

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate title from first message
const generateTitle = (content: string): string => {
  const maxLength = 40;
  const cleaned = content.trim().replace(/\n/g, " ");
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + "...";
};

// Create context with default values
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to always have the latest session ID (avoids stale closure issues)
  const currentSessionIdRef = useRef<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sessionsWithDates = parsed.map((session: ChatSession) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save chat sessions:", error);
      }
    }
  }, [sessions, isLoading]);

  // Create a new session
  const createSession = useCallback((): string => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };

    setSessions((prev) => [newSession, ...prev]);
    currentSessionIdRef.current = newSession.id;
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  // Load an existing session
  const loadSession = useCallback((sessionId: string) => {
    currentSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionIdRef.current === sessionId) {
        currentSessionIdRef.current = null;
        setCurrentSessionId(null);
      }
    },
    []
  );

  // Update session title
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
      )
    );
  }, []);

  // Toggle pin status
  const togglePinSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, isPinned: !s.isPinned, updatedAt: new Date() }
          : s
      )
    );
  }, []);

  // Add a message to the current session
  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: new Date(),
      };

      // Use the ref to get the latest session ID (avoids stale closure)
      const sessionId = currentSessionIdRef.current;

      // If no current session, create one first
      if (!sessionId) {
        const newSessionId = generateId();
        const newSession: ChatSession = {
          id: newSessionId,
          title: message.role === "user" ? generateTitle(message.content) : "New Chat",
          messages: [newMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
        };
        
        // Update ref immediately
        currentSessionIdRef.current = newSessionId;
        
        // Update both states together
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
        return;
      }

      // Add to existing session
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;

          const isFirstUserMessage =
            message.role === "user" &&
            s.messages.filter((m) => m.role === "user").length === 0;

          return {
            ...s,
            messages: [...s.messages, newMessage],
            title: isFirstUserMessage ? generateTitle(message.content) : s.title,
            updatedAt: new Date(),
          };
        })
      );
    },
    [] // No dependencies needed since we use ref
  );

  // Clear current session (start fresh)
  const clearCurrentSession = useCallback(() => {
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
  }, []);

  // Get the current session
  const getCurrentSession = useCallback((): ChatSession | null => {
    if (!currentSessionId) return null;
    return sessions.find((s) => s.id === currentSessionId) || null;
  }, [currentSessionId, sessions]);

  // Get context from previous sessions for AI
  const getSessionContext = useCallback(
    (limit: number = 5): string => {
      const recentSessions = sessions
        .filter((s) => s.id !== currentSessionId && s.messages.length > 0)
        .slice(0, limit);

      if (recentSessions.length === 0) return "";

      const context = recentSessions
        .map((session) => {
          const summary = session.messages
            .slice(0, 4)
            .map((m) => `${m.role}: ${m.content.substring(0, 100)}`)
            .join("\n");
          return `Previous conversation "${session.title}":\n${summary}`;
        })
        .join("\n\n");

      return `Here's context from previous conversations:\n${context}`;
    },
    [sessions, currentSessionId]
  );

  // Memoize context value
  const contextValue = useMemo<ChatContextType>(
    () => ({
      sessions,
      currentSessionId,
      isLoading,
      createSession,
      loadSession,
      deleteSession,
      updateSessionTitle,
      togglePinSession,
      addMessage,
      clearCurrentSession,
      getCurrentSession,
      getSessionContext,
    }),
    [
      sessions,
      currentSessionId,
      isLoading,
      createSession,
      loadSession,
      deleteSession,
      updateSessionTitle,
      togglePinSession,
      addMessage,
      clearCurrentSession,
      getCurrentSession,
      getSessionContext,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

// Custom hook to use chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

// Safe hook that returns null if outside provider (for optional usage)
export function useChatSafe() {
  return useContext(ChatContext);
}

// Utility hook to get grouped sessions
export function useGroupedSessions(): GroupedSessions {
  const context = useChatSafe();

  return useMemo(() => {
    const sessions = context?.sessions ?? [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const grouped: GroupedSessions = {
      pinned: [],
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    };

    sessions.forEach((session) => {
      if (session.isPinned) {
        grouped.pinned.push(session);
        return;
      }

      const sessionDate = new Date(session.updatedAt);
      if (sessionDate >= today) {
        grouped.today.push(session);
      } else if (sessionDate >= yesterday) {
        grouped.yesterday.push(session);
      } else if (sessionDate >= lastWeek) {
        grouped.lastWeek.push(session);
      } else {
        grouped.older.push(session);
      }
    });

    return grouped;
  }, [context?.sessions]);
}
