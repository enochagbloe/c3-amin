"use client";

import React from "react";
import NavLinks from "./NavLinks";
import { cn } from "@/lib/utils";

interface LeftSideBarClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

const LeftSideBarClient = ({ user }: LeftSideBarClientProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  return (
    <aside 
      className={cn(
        "group sticky left-0 top-0 flex h-screen flex-col border-r bg-background transition-all duration-300 max-sm:hidden",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          isCollapsed ? "justify-center w-full" : ""
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
            EA
          </div>
          <h2 className={cn(
            "text-lg font-semibold whitespace-nowrap transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            Personal
          </h2>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          <div>
            <h3 className={cn(
              "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-300",
              isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            )}>
              Navigation
            </h3>
            <NavLinks isCollapsed={isCollapsed} />
          </div>
        </div>
      </nav>
      
      {/* Footer */}
      <div className="border-t p-4">
        <div className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-all duration-300",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
            EA
          </div>
          <div className={cn(
            "flex-1 transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">Personal Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSideBarClient;
