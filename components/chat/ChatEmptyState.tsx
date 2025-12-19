"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ChatEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-zinc-900 animate-pulse" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        How can I help you today?
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        I can help with expenses, reports, coding, brainstorming, and much more.
        Just ask!
      </p>
    </motion.div>
  );
}
