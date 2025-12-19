"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { orgSidebarLinks } from "@/constant/org-sidebar";
import { SheetClose } from "@/components/ui/sheet";
import { Building2 } from "lucide-react";

interface Props {
  isMobile?: boolean;
  orgName?: string;
}

const OrgSidebar = ({isMobile = false, orgName = "Organization"}: Props) => {
  const pathname = usePathname();
  const params = useParams();
  const orgId = params.id as string;
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const NavContent = (
    <div className="space-y-1">
      {orgSidebarLinks.map((item) => {
        const fullRoute = `/org/${orgId}${item.route}`;
        const isActive = pathname === fullRoute || pathname.startsWith(fullRoute + "/");
        const Icon = item.icon;

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
            <Icon className="h-4 w-4 shrink-0" />
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
          </div>
        );

        return isMobile ? (
          <SheetClose asChild key={item.label}>
            <Link href={fullRoute}>
              {linkContent}
            </Link>
          </SheetClose>
        ) : (
          <Link key={item.label} href={fullRoute}>
            {linkContent}
          </Link>
        );
      })}
    </div>
  );

  if (isMobile) {
    return <div className="space-y-1">{NavContent}</div>;
  }

  return (
    <aside 
      className={cn(
        "sticky left-0 top-0 flex h-screen flex-col border-r bg-background transition-all duration-300 max-sm:hidden",
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className={cn(
            "transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            <h2 className="text-sm font-semibold leading-tight whitespace-nowrap">{orgName}</h2>
            <p className="text-xs text-muted-foreground">Organization</p>
          </div>
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
              Workspace
            </h3>
            {NavContent}
          </div>
        </div>
      </nav>
      
      {/* Footer */}
      <div className="border-t p-4">
        <div className={cn(
          "rounded-lg bg-muted/50 p-3 transition-all duration-300",
          isCollapsed ? "opacity-0 h-0 overflow-hidden p-0" : "opacity-100"
        )}>
          <p className="text-xs font-medium">Team Workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Collaborate with your team
          </p>
        </div>
      </div>
    </aside>
  );
};

export default OrgSidebar;
