"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ChatMessage,
  ChatInput,
  ChatShortcuts,
  ChatHeader,
  ChatEmptyState,
  ChatTypingIndicator,
  ChatSidebar,
} from "@/components/chat";
import { useChatSafe } from "../../../lib/context/ChatContext";
import handleError from "@/lib/handler/error";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const ChatPage = () => {
  const chatContext = useChatSafe();

  const [prompt, setPrompt] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  // Get current session directly from context state (not via callback)
  // This ensures we always have the latest data when context re-renders
  const currentSession = useMemo(() => {
    if (!chatContext?.currentSessionId || !chatContext?.sessions) return null;
    return chatContext.sessions.find((s: ChatSession) => s.id === chatContext.currentSessionId) || null;
  }, [chatContext?.currentSessionId, chatContext?.sessions]);
  
  const messages = useMemo(() => currentSession?.messages ?? [], [currentSession?.messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle submit
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
      
      const response = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          context: previousContext,
        }),
      });

      const result = await response.json();
      const aiReply = result.data || "Sorry, I didn't catch that. Please try again.";
      
      // Add AI response to context
      chatContext.addMessage({ role: "assistant", content: aiReply });
    } catch (err) {
      handleError(err, "api") as APIErrorResponse;
      chatContext.addMessage({ 
        role: "assistant", 
        content: "Sorry, something went wrong. Please try again." 
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

  // Show loading state while context is not available
  if (!chatContext) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <ChatHeader onNewChat={handleNewChat} />

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
              <ChatEmptyState />
              <ChatShortcuts onSelect={setPrompt} />
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
      <div className={cn(
        "sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-4 pb-6 px-4 transition-all duration-300",
        isSidebarOpen && !isMobile && "pr-[340px]"
      )}>
        <div className="max-w-3xl mx-auto">
          <ChatInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            attachedFiles={attachedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={(idx) => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
            isFirstMessage={isFirstMessage}
          />
          
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
    </div>
  );
};

export default ChatPage;
