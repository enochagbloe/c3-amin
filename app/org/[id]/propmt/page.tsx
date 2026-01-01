"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  ChatMessage,
  ChatInput,
  ChatHeader,
  ChatTypingIndicator,
  ChatSidebar,
} from "@/components/chat";
import { useChatSafe, ChatProvider } from "@/lib/context/ChatContext";
import handleError from "@/lib/handler/error";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Building2 } from "lucide-react";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const OrgChatPage = () => {
  const params = useParams();
  const orgId = params.id as string;
  const chatContext = useChatSafe();

  const [prompt, setPrompt] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  // Get current session directly from context state
  const currentSession = useMemo(() => {
    if (!chatContext?.currentSessionId || !chatContext?.sessions) return null;
    return chatContext.sessions.find((s: ChatSession) => s.id === chatContext.currentSessionId) || null;
  }, [chatContext?.currentSessionId, chatContext?.sessions]);

  const messages = useMemo(() => currentSession?.messages ?? [], [currentSession?.messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle submit with organization-specific endpoint
  const handleSubmit = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    if (!chatContext) return;

    const userMessage = prompt;

    // Add user message to context
    chatContext.addMessage({ role: "user", content: userMessage });

    setPrompt("");
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // Get context from previous sessions for smarter AI responses
      const previousContext = chatContext.getSessionContext(3);

      // Use organization-specific AI endpoint
      const response = await fetch(`/api/ai/organization/${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: previousContext,
          includeFinancialContext: true,
        }),
      });

      const result = await response.json();
      
      // Store organization name from response
      if (result.organizationName && !organizationName) {
        setOrganizationName(result.organizationName);
      }

      const aiReply = result.data || "Sorry, I didn't catch that. Please try again.";

      // Add AI response to context
      chatContext.addMessage({ role: "assistant", content: aiReply });
    } catch (err) {
      handleError(err, "api") as APIErrorResponse;
      chatContext.addMessage({
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    const newFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  // Handle new chat
  const handleNewChat = () => {
    chatContext?.clearCurrentSession();
    setPrompt("");
    setAttachedFiles([]);
  };

  const isFirstMessage = messages.length === 0;

  // Organization-specific shortcuts
  const orgShortcuts = [
    { label: "How much did we spend this month?", icon: "💰" },
    { label: "Show pending expenses", icon: "⏳" },
    { label: "What's our financial summary?", icon: "📊" },
    { label: "Add organization expense", icon: "➕" },
  ];

  // Show loading state while context is not available
  if (!chatContext) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <ChatProvider organizationId={orgId} organizationName={organizationName}>
      <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header with Organization Badge */}
      <div className="border-b bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">
                {organizationName || "Organization"} AI Assistant
              </h1>
              <p className="text-xs text-muted-foreground">
                Managing organization finances
              </p>
            </div>
          </div>
          <ChatHeader onNewChat={handleNewChat} />
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 transition-all duration-300",
          isSidebarOpen && !isMobile && "pr-[340px]"
        )}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty State */}
          {isFirstMessage && (
            <>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Organization AI Assistant
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  I can help you manage {organizationName || "your organization"}&apos;s finances. 
                  Ask me about expenses, income, budgets, or get financial insights.
                </p>
              </div>
              
              {/* Organization-specific shortcuts */}
              <div className="flex flex-wrap gap-2 justify-center">
                {orgShortcuts.map((shortcut, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(shortcut.label)}
                    className="px-4 py-2 bg-white dark:bg-zinc-800 border rounded-full text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <span>{shortcut.icon}</span>
                    <span>{shortcut.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message: ChatMessage) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && <ChatTypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        className={cn(
          "sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-4 pb-6 px-4 transition-all duration-300",
          isSidebarOpen && !isMobile && "pr-[340px]"
        )}
      >
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            attachedFiles={attachedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={(idx) =>
              setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
            }
            isFirstMessage={isFirstMessage}
          />

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Organization AI • All data is specific to this organization
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    </div>
    </ChatProvider>
  );
};

export default OrgChatPage;
