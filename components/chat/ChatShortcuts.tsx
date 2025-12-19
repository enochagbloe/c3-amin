"use client";

import { motion } from "framer-motion";
import { Lightbulb, Code, BookOpen, Zap, PenLine, Calculator, LucideIcon } from "lucide-react";

interface Shortcut {
  icon: LucideIcon;
  label: string;
  prompt: string;
  gradient: string;
}

interface ChatShortcutsProps {
  onSelect: (prompt: string) => void;
}

const shortcuts: Shortcut[] = [
  {
    icon: Lightbulb,
    label: "Brainstorm",
    prompt: "Help me brainstorm ideas for ",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: Code,
    label: "Write Code",
    prompt: "Write code to ",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: BookOpen,
    label: "Expense Report",
    prompt: "Create an expense report for ",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: Zap,
    label: "Summarize",
    prompt: "Summarize this in simple terms: ",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    icon: PenLine,
    label: "Draft Email",
    prompt: "Draft a professional email about ",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    icon: Calculator,
    label: "Calculate",
    prompt: "Help me calculate ",
    gradient: "from-indigo-400 to-blue-600",
  },
];

export function ChatShortcuts({ onSelect }: ChatShortcutsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      {shortcuts.map((shortcut, idx) => {
        const Icon = shortcut.icon;
        return (
          <motion.button
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelect(shortcut.prompt)}
            className="group relative flex items-center gap-3 p-4 bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shortcut.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {shortcut.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
