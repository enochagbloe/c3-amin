"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Pin,
  Trash2,
  MoreHorizontal,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onTogglePin: () => void;
}

export function ChatSessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
}: ChatSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(session.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Format relative time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
        isActive
          ? "bg-violet-100 dark:bg-violet-500/20 text-violet-900 dark:text-violet-100"
          : "hover:bg-gray-100 dark:hover:bg-zinc-800/50 text-gray-700 dark:text-gray-300"
      )}
      onClick={onSelect}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          isActive
            ? "bg-violet-200 dark:bg-violet-500/30"
            : "bg-gray-100 dark:bg-zinc-800 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700"
        )}
      >
        <MessageSquare
          className={cn(
            "w-4 h-4",
            isActive
              ? "text-violet-600 dark:text-violet-300"
              : "text-gray-500 dark:text-gray-400"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm px-2"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleSaveTitle}
            >
              <Check className="w-3.5 h-3.5 text-green-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleCancelEdit}
            >
              <X className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{session.title}</p>
              {session.isPinned && (
                <Pin className="w-3 h-3 text-violet-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.messages.length} messages • {formatTime(session.updatedAt)}
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div
          className={cn(
            "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
            isActive && "opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePin}>
                <Pin className="w-4 h-4 mr-2" />
                {session.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  );
}
