"use client";
import { Sparkles } from "lucide-react";
export function ChatEmptyState() {
    return (<div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-sm     flex items-center justify-center  ">
          <Sparkles className="w-10 h-10 text-foreground"/>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-zinc-900 animate-pulse"/>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        How can I help you today?
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        I can help with expenses, reports, coding, brainstorming, and much more.
        Just ask!
      </p>
    </div>);
}
