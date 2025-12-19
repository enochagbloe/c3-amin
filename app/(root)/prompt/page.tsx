"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ChatMessage,
  ChatInput,
  ChatShortcuts,
  ChatHeader,
  ChatEmptyState,
  ChatTypingIndicator,
} from "@/components/chat";
import handleError from "@/lib/handler/error";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Type animation for AI response
  const typeMessage = useCallback(async (text: string) => {
    const words = text.split(" ");
    let currentText = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    const messageIndex = messages.length + 1;
    setTypingMessageIndex(messageIndex);

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[messageIndex] = { role: "assistant", content: currentText };
        return newMessages;
      });

      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    setTypingMessageIndex(null);
  }, [messages.length]);

  // Handle submit
  const handleSubmit = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    const userMessage = prompt;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setPrompt("");
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const result = await response.json();
      const aiReply = result.data || "Sorry, I didn't catch that. Please try again.";
      
      await typeMessage(aiReply);
    } catch (err) {
      handleError(err, "api") as APIErrorResponse;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
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
    setMessages([]);
    setPrompt("");
    setAttachedFiles([]);
  };

  const isFirstMessage = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <ChatHeader onNewChat={handleNewChat} />

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700"
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
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                isTyping={idx === typingMessageIndex}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && typingMessageIndex === null && <ChatTypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-4 pb-6 px-4">
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
    </div>
  );
};

export default ChatPage;
