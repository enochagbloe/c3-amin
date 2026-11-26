"use client";
export function ChatTypingIndicator() {
    return (<div className="flex gap-3 justify-start">
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400"/>
        </div>
      </div>
    </div>);
}
