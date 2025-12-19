"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

export function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "relative max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm",
          isUser
            ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md"
            : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-zinc-700"
        )}
      >
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
          {content}
          {isTyping && (
            <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse" />
          )}
        </p>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}
