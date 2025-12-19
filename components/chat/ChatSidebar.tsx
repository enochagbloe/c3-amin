"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  History,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat, useGroupedSessions, useChatSafe } from "@/lib/context/ChatContext";
import { ChatSessionItem } from "./ChatSessionItem";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Session group component
function SessionGroup({
  title,
  icon: Icon,
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
}: {
  title: string;
  icon: React.ElementType;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (sessions.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3 h-3" />
        </motion.div>
        <Icon className="w-3.5 h-3.5" />
        <span>{title}</span>
        <span className="ml-auto text-gray-400 dark:text-gray-500">
          {sessions.length}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-0.5">
              {sessions.map((session) => (
                <ChatSessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={() => onSelect(session.id)}
                  onDelete={() => onDelete(session.id)}
                  onRename={(title) => onRename(session.id, title)}
                  onTogglePin={() => onTogglePin(session.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main sidebar content
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const {
    currentSessionId,
    loadSession,
    deleteSession,
    updateSessionTitle,
    togglePinSession,
    clearCurrentSession,
  } = useChat();
  const groupedSessions = useGroupedSessions();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sessions by search query
  const filterSessions = (sessions: ChatSession[]) => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  };

  const handleNewChat = () => {
    clearCurrentSession();
    onClose?.();
  };

  const handleSelectSession = (id: string) => {
    loadSession(id);
    onClose?.();
  };

  const filteredPinned = filterSessions(groupedSessions.pinned);
  const filteredToday = filterSessions(groupedSessions.today);
  const filteredYesterday = filterSessions(groupedSessions.yesterday);
  const filteredLastWeek = filterSessions(groupedSessions.lastWeek);
  const filteredOlder = filterSessions(groupedSessions.older);

  const hasResults =
    filteredPinned.length +
      filteredToday.length +
      filteredYesterday.length +
      filteredLastWeek.length +
      filteredOlder.length >
    0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Chat History
            </h2>
          </div>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9 bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2 py-3">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {searchQuery ? "No results found" : "No conversations yet"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Start a new chat to begin"}
            </p>
          </div>
        ) : (
          <>
            <SessionGroup
              title="Pinned"
              icon={Pin}
              sessions={filteredPinned}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={updateSessionTitle}
              onTogglePin={togglePinSession}
            />
            <SessionGroup
              title="Today"
              icon={History}
              sessions={filteredToday}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={updateSessionTitle}
              onTogglePin={togglePinSession}
            />
            <SessionGroup
              title="Yesterday"
              icon={History}
              sessions={filteredYesterday}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={updateSessionTitle}
              onTogglePin={togglePinSession}
            />
            <SessionGroup
              title="Last 7 Days"
              icon={History}
              sessions={filteredLastWeek}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={updateSessionTitle}
              onTogglePin={togglePinSession}
            />
            <SessionGroup
              title="Older"
              icon={History}
              sessions={filteredOlder}
              currentSessionId={currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={updateSessionTitle}
              onTogglePin={togglePinSession}
            />
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-zinc-800">
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          Conversations are stored locally
        </p>
      </div>
    </div>
  );
}

// Desktop sidebar
function DesktopSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  return (
    <>
      {/* Toggle button */}
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className={cn(
          "fixed right-4 top-20 z-50 h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 shadow-md border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all",
          isOpen && "right-[324px]"
        )}
      >
        {isOpen ? (
          <PanelRightClose className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <PanelRightOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </Button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-16 bottom-0 z-40 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile sidebar (Sheet)
function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 top-20 z-50 h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 shadow-md border border-gray-200 dark:border-zinc-700"
        >
          <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-[320px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>
        <SidebarContent onClose={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Main export - auto-detects mobile/desktop
export function ChatSidebar({ isOpen, onToggle }: ChatSidebarProps) {
  const isMobile = useIsMobile();
  const chatContext = useChatSafe();

  // Don't render if context is not available
  if (!chatContext) {
    return null;
  }

  if (isMobile) {
    return <MobileSidebar />;
  }

  return <DesktopSidebar isOpen={isOpen} onToggle={onToggle} />;
}
