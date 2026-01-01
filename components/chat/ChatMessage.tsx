"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

// Parse and format the message content
function formatContent(content: string): string {
  // Replace literal \n with actual newlines
  let formatted = content.replace(/\\n/g, "\n");
  
  // Clean up any double newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  
  return formatted.trim();
}

// Simple markdown-like formatting
function renderFormattedContent(content: string) {
  const formatted = formatContent(content);
  
  // Split by lines and render
  const lines = formatted.split("\n");
  
  return lines.map((line, index) => {
    // Bold text: **text**
    const processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Check if it's a bullet point or numbered list
    const isBullet = /^[\-•]\s/.test(line);
    const isNumbered = /^\d+\.\s/.test(line);
    
    if (isBullet || isNumbered) {
      return (
        <span key={index} className="block pl-2">
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          {index < lines.length - 1 && <br />}
        </span>
      );
    }
    
    // Empty line = paragraph break
    if (line.trim() === "") {
      return <br key={index} />;
    }
    
    return (
      <span key={index}>
        <span dangerouslySetInnerHTML={{ __html: processedLine }} />
        {index < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  const isUser = role === "user";
  
  const formattedContent = useMemo(() => {
    if (isUser) return content;
    return renderFormattedContent(content);
  }, [content, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center shadow-lg">
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "relative max-w-[80%] sm:max-w-[70%] px-4 py-3",
          isUser
            ? "text-white rounded-br-md"
            : "text-gray-800 dark:text-gray-100"
        )}
      >
        <div className="text-sm sm:text-base leading-relaxed break-words">
          {isUser ? content : formattedContent}
          {isTyping && (
            <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
        </div>
      )}
    </motion.div>
  );
}
