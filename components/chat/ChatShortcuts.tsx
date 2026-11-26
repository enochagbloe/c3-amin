"use client";
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
        gradient: " ",
    },
    {
        icon: Code,
        label: "Write Code",
        prompt: "Write code to ",
        gradient: " ",
    },
    {
        icon: BookOpen,
        label: "Expense Report",
        prompt: "Create an expense report for ",
        gradient: " ",
    },
    {
        icon: Zap,
        label: "Summarize",
        prompt: "Summarize this in simple terms: ",
        gradient: " ",
    },
    {
        icon: PenLine,
        label: "Draft Email",
        prompt: "Draft a professional email about ",
        gradient: " ",
    },
    {
        icon: Calculator,
        label: "Calculate",
        prompt: "Help me calculate ",
        gradient: " ",
    },
];
export function ChatShortcuts({ onSelect }: ChatShortcutsProps) {
    return (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {shortcuts.map((shortcut, idx) => {
            const Icon = shortcut.icon;
            return (<button key={idx} onClick={() => onSelect(shortcut.prompt)} className="group relative flex items-center gap-3 p-4 bg-white dark:bg-zinc-800/50 rounded-sm border border-gray-100 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-300  ">
            <div className={`w-10 h-10 rounded-sm  ${shortcut.gradient} flex items-center justify-center   transition-transform`}>
              <Icon className="w-5 h-5 text-foreground"/>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {shortcut.label}
            </span>
          </button>);
        })}
    </div>);
}
