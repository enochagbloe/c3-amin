"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Image,
  Lightbulb,
  Code,
  BookOpen,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import handleError from "@/lib/handler/error";
import ThinkingAnimation from "@/components/ui/thinking-animation";

const ModernPromptUI = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const [prompt, setPrompt] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<
    {
      name: string;
      size: number;
      type: string;
      file: File;
    }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);

  const shortcuts = [
    {
      icon: Lightbulb,
      label: "Brainstorm ideas",
      prompt: "Help me brainstorm ideas for ",
    },
    { icon: Code, label: "Write code", prompt: "Write code to " },
    {
      icon: BookOpen,
      label: "Create Expense Report",
      prompt: "Create an expense report for ",
    },
    {
      icon: Zap,
      label: "Quick summary",
      prompt: "Summarize this in simple terms: ",
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const typeMessage = async(text:string)=>{
    const words =text.split(' ')
    let currentText = ''

    setMessages((prev) => [...prev, {role: "assistant", content: ""}]);
    const messageIndex = messages.length + 1
    setTypingMessageIndex(messageIndex);

     for (let i = 0; i < words.length; i++) {
     currentText += (i > 0 ? ' ' : '') + words[i];
    
    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[messageIndex] = { role: "assistant", content: currentText };
      return newMessages;
    });
    
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms per word
  }
  
  setTypingMessageIndex(null); 
  }
  

  {
    /* Ai prompt on submit */
  }
  const handleSubmit = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    //Immediately log user's message (for now, console)
    console.log("User prompt:", prompt);
    // Before sending
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const result = await response.json()
      const aiReply =result.data || "sorry i didn't catch that.";
      // After AI reply
      // setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
      await typeMessage(aiReply)

      console.log("AI reply:", aiReply);
    } catch (err) {
      handleError(err, "api") as APIErrorResponse;
    } finally {
      setIsLoading(false);
    }

    // Reset input and attachments
    setPrompt("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const FileIcon = (type: string) =>
    type.startsWith("image/") ? Image : FileText;

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* Chat Messages - Scrollable */}
        <div className="flex-1 overflow-x-auto px-4 py-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-3 pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white"
                      : "text-gray-800"
                  }`}
                >
                  {msg.content}
                  {idx === typingMessageIndex && (
                    <span className="inline-block w-0.5 h-4 bg-gray-800 ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && <ThinkingAnimation/>}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input + UI - Sticky Bottom */}
        <div className="sticky bottom-0 scrollbar-hide">
          <div className="w-full max-w-4xl mx-auto px-4 py-4">
            {/* Shortcuts - Hide when user starts typing or after first message */}
            {!prompt && messages.length === 0 && (
              <div className="mb-3 flex flex-wrap justify-center gap-3 transition-all duration-300">
                {shortcuts.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setPrompt(s.prompt)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border hover:border-violet-300 transition-all"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <Card className="shadow-2xl">
              <div className="p-6">
                {attachedFiles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {attachedFiles.map((file, idx) => {
                      const FileIconComponent = FileIcon(file.type);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 bg-violet-50 border rounded-lg"
                        >
                          <FileIconComponent className="w-4 h-4" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs truncate max-w-[200px]">
                              {file.name}
                            </span>
                            <span className="text-xs">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <Button
                            onClick={() => removeFile(idx)}
                            className="ml-2 p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className={`pr-24 transition-all duration-300 ${
                      messages.length === 0 ? "min-h-[120px]" : "min-h-[60px]"
                    }`}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 bg-slate-100 flex items-center justify-center"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        (!prompt.trim() && attachedFiles.length === 0) ||
                        isLoading
                      }
                      className="w-9 h-9 bg-violet-600 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            <p className="text-center text-sm mt-4">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernPromptUI;
