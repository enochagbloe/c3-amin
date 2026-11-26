"use client";
import React, { useRef } from "react";
import { Send, Paperclip, Mic, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
interface AttachedFile {
    name: string;
    size: number;
    type: string;
    file: File;
}
interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    attachedFiles: AttachedFile[];
    onFileSelect: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    isFirstMessage?: boolean;
}
export function ChatInput({ value, onChange, onSubmit, isLoading, attachedFiles, onFileSelect, onRemoveFile, isFirstMessage = true, }: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        onFileSelect(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    const formatFileSize = (bytes: number) => bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
            ? `${(bytes / 1024).toFixed(1)} KB`
            : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    const getFileIcon = (type: string) => type.startsWith("image/") ? Image : FileText;
    return (<div className="w-full">
      {/* Attached Files */}
      <>
        {attachedFiles.length > 0 && (<div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => {
                const FileIcon = getFileIcon(file.type);
                return (<div key={idx} className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-sm">
                  <FileIcon className="w-4 h-4 text-violet-600 dark:text-violet-400"/>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate max-w-[150px] text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button onClick={() => onRemoveFile(idx)} className="ml-1 p-1 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors">
                    <X className="w-3 h-3 text-gray-500"/>
                  </button>
                </div>);
            })}
          </div>)}
      </>

      {/* Input Container */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-sm border border-gray-200 dark:border-zinc-700  overflow-hidden">
        <Textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask me anything..." className={cn("w-full resize-none border-0 bg-transparent px-4 pt-4 pb-14 text-base", "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0", "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600", isFirstMessage ? "min-h-[120px]" : "min-h-[60px]")}/>

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt"/>
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 rounded-sm hover:bg-gray-100 dark:hover:bg-zinc-800">
              <Paperclip className="w-4 h-4 text-gray-500"/>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm hover:bg-gray-100 dark:hover:bg-zinc-800">
              <Mic className="w-4 h-4 text-gray-500"/>
            </Button>
          </div>

          <Button type="button" onClick={onSubmit} disabled={(!value.trim() && attachedFiles.length === 0) || isLoading} className={cn("h-9 px-4 rounded-sm font-medium transition-all duration-200", "    ", "disabled:opacity-50 disabled:cursor-not-allowed")}>
            {isLoading ? (<div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                <span className="hidden sm:inline">Thinking...</span>
              </div>) : (<div className="flex items-center gap-2">
                <Send className="w-4 h-4"/>
                <span className="hidden sm:inline">Send</span>
              </div>)}
          </Button>
        </div>
      </div>
    </div>);
}
