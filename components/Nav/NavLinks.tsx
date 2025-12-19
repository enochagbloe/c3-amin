"use client";

import { sidebarLinks } from "@/constant";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";

interface Props {
  isMobile?: boolean;
  userId?: string;
  isCollapsed?: boolean;
}

const NavLinks = ({ isMobile = false, userId, isCollapsed = false }: Props) => {
  const path = usePathname();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  
  return (
    <div className="space-y-1">
      {sidebarLinks.map((item, idx) => {
        const isActive =
          (path.includes(item.route) && item.route.length > 1) ||
          path == item.route;

        if (item.route == "/profile") {
          if (userId) item.route = `${item.route}/${userId}`;
        }

        const Icon = item.icon;
        const hasSubmenu =
          Array.isArray(item.submenu) && item.submenu.length > 0;

        const linkContent = (
          <div
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
              isCollapsed && !isMobile ? "justify-center" : ""
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0")} />
            <span className={cn(
              "flex-1 transition-all duration-300",
              isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              {item.label}
            </span>
            {item.badge && !isCollapsed && (
              <span className={cn(
                "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium transition-all duration-300",
                isActive
                  ? "bg-background text-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {item.badge}
              </span>
            )}
            {hasSubmenu && !isCollapsed && (
              <div className="ml-auto">
                {openIndex === idx ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        );

        return (
          <div key={item.label}>
            {hasSubmenu ? (
              <div
                onClick={() => !isCollapsed && setOpenIndex(openIndex === idx ? null : idx)}
                className="cursor-pointer"
              >
                {linkContent}
              </div>
            ) : isMobile ? (
              <SheetClose asChild>
                <Link href={item.route}>
                  {linkContent}
                </Link>
              </SheetClose>
            ) : (
              <Link href={item.route}>
                {linkContent}
              </Link>
            )}
            
            {hasSubmenu && openIndex === idx && !isCollapsed && (
              <div className="ml-7 mt-1 space-y-1 border-l border-border pl-3">
                {(item.submenu ?? []).map((sub) => {
                  const subActive = path === sub.route;
                  const subContent = (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                        "hover:bg-accent hover:text-accent-foreground",
                        subActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                      <span>{sub.label}</span>
                    </div>
                  );
                  
                  return isMobile ? (
                    <SheetClose asChild key={sub.label}>
                      <Link href={sub.route}>
                        {subContent}
                      </Link>
                    </SheetClose>
                  ) : (
                    <Link key={sub.label} href={sub.route}>
                      {subContent}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NavLinks;
