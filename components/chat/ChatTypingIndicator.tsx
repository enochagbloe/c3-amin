"use client";

import { motion } from "framer-motion";

export function ChatTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 1.5 }}
            className="w-2 h-2 rounded-full bg-violet-400"
          />
        </div>
      </div>
    </motion.div>
  );
}
