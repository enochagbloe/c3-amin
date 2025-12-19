"use client";

import { ChatProvider } from "@/lib/context/ChatContext";

export default function PromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatProvider>{children}</ChatProvider>;
}
