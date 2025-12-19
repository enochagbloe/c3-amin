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
import {
  getChatSessions,
  createSessionWithMessage,
  addMessageToSession,
  updateChatSession,
  deleteChatSession,
} from "../actions/chat.actions";
import { toast } from "sonner";
import { IChatMessage, IChatSessionDoc } from "@/database/chatSession.model";

// Create context with default values
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Props for the provider
interface ChatProviderProps {
  children: React.ReactNode;
  organizationId?: string; // Optional: for org-specific chats
}

// Provider component
export function ChatProvider({ children, organizationId }: ChatProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to always have the latest session ID (avoids stale closure issues)
  const currentSessionIdRef = useRef<string | null>(null);
  const organizationIdRef = useRef<string | undefined>(organizationId);
  
  // Keep refs in sync
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    organizationIdRef.current = organizationId;
  }, [organizationId]);

  // Load sessions from database on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const result = await getChatSessions({ organizationId });
        
        if (result.success && result.data) {
          // Transform database format to context format
          const transformedSessions: ChatSession[] = result.data.map((session: IChatSessionDoc) => ({
            id: session._id.toString(),
            title: session.title,
            messages: session.messages.map((msg: IChatMessage, index: number) => ({
              id: `${session._id}-${index}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            })),
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            isPinned: session.isPinned,
          }));
          setSessions(transformedSessions);
        }
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
        toast.error("Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [organizationId]);

  // Create a new session (empty)
  const createSession = useCallback((): string => {
    // Generate a temporary ID - will be replaced when message is added
    const tempId = `temp-${Date.now()}`;
    const newSession: ChatSession = {
      id: tempId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };

    setSessions((prev) => [newSession, ...prev]);
    currentSessionIdRef.current = tempId;
    setCurrentSessionId(tempId);
    return tempId;
  }, []);

  // Load an existing session
  const loadSession = useCallback((sessionId: string) => {
    currentSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      // Optimistically remove from UI
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      if (currentSessionIdRef.current === sessionId) {
        currentSessionIdRef.current = null;
        setCurrentSessionId(null);
      }

      // Don't delete temp sessions from database
      if (sessionId.startsWith("temp-")) return;

      try {
        const result = await deleteChatSession({ sessionId });
        if (!result.success) {
          toast.error("Failed to delete chat");
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
        toast.error("Failed to delete chat");
      }
    },
    []
  );

  // Update session title
  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string) => {
      // Optimistically update UI
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title, updatedAt: new Date() } : s
        )
      );

      // Don't update temp sessions in database
      if (sessionId.startsWith("temp-")) return;

      try {
        const result = await updateChatSession({ sessionId, title });
        if (!result.success) {
          toast.error("Failed to update chat title");
        }
      } catch (error) {
        console.error("Failed to update session title:", error);
      }
    },
    []
  );

  // Toggle pin status
  const togglePinSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const newPinned = !session.isPinned;

      // Optimistically update UI
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, isPinned: newPinned, updatedAt: new Date() }
            : s
        )
      );

      // Don't update temp sessions in database
      if (sessionId.startsWith("temp-")) return;

      try {
        const result = await updateChatSession({ sessionId, isPinned: newPinned });
        if (!result.success) {
          toast.error("Failed to update pin status");
        }
      } catch (error) {
        console.error("Failed to toggle pin:", error);
      }
    },
    [sessions]
  );

  // Add a message to the current session
  const addMessage = useCallback(
    async (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Use the ref to get the latest session ID
      const sessionId = currentSessionIdRef.current;
      const orgId = organizationIdRef.current;

      // If no current session or it's a temp session with no messages, create new in database
      if (!sessionId || sessionId.startsWith("temp-")) {
        try {
          const result = await createSessionWithMessage({
            role: message.role,
            content: message.content,
            organizationId: orgId,
          });

          if (result.success && result.data) {
            const dbSession = result.data;
            const newSessionId = dbSession._id.toString();

            // Create the session object
            const newSession: ChatSession = {
              id: newSessionId,
              title: dbSession.title,
              messages: dbSession.messages.map((msg: IChatMessage, index: number) => ({
                id: `${newSessionId}-${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
              })),
              createdAt: new Date(dbSession.createdAt),
              updatedAt: new Date(dbSession.updatedAt),
              isPinned: dbSession.isPinned,
            };

            // Update ref immediately
            currentSessionIdRef.current = newSessionId;

            // Remove temp session if exists and add new one
            setSessions((prev) => {
              const filtered = prev.filter((s) => !s.id.startsWith("temp-"));
              return [newSession, ...filtered];
            });
            setCurrentSessionId(newSessionId);
          } else {
            toast.error("Failed to save message");
          }
        } catch (error) {
          console.error("Failed to create session:", error);
          toast.error("Failed to save message");
        }
        return;
      }

      // Add to existing session - optimistic update
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;

          return {
            ...s,
            messages: [...s.messages, newMessage],
            updatedAt: new Date(),
          };
        })
      );

      // Persist to database
      try {
        const result = await addMessageToSession({
          sessionId,
          role: message.role,
          content: message.content,
        });

        if (!result.success) {
          toast.error("Failed to save message");
        }
      } catch (error) {
        console.error("Failed to add message:", error);
        toast.error("Failed to save message");
      }
    },
    []
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
        .map((session: ChatSession) => {
          const summary = session.messages
            .slice(0, 4)
            .map((m: ChatMessage) => `${m.role}: ${m.content.substring(0, 100)}`)
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

    sessions.forEach((session: ChatSession) => {
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
