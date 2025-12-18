"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { orgSidebarLinks } from "@/constant/org-sidebar";

const OrgSidebar = () => {
  const pathname = usePathname();
  const params = useParams();
  const orgId = params.id as string;

  return (
    <section className="custom-scrollbar sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-hidden scrollbar-hide border-r p-6 pt-20 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex flex-1 flex-col gap-6">
        {orgSidebarLinks.map((item) => {
          const fullRoute = `/org/${orgId}${item.route}`;
          const isActive = pathname === fullRoute || pathname.startsWith(fullRoute + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={fullRoute}
              className={cn(
                isActive
                  ? "bg-sky-300 rounded-2xl"
                  : "text-black dark:text-white",
                "flex items-center gap-4 p-4"
              )}
            >
              <Icon
                className={cn(
                  isActive
                    ? "text-sky-500"
                    : "text-black dark:text-white opacity-50"
                )}
                size={20}
              />
              <p
                className={cn(
                  isActive ? "base-bold" : "base-small",
                  "max-lg:hidden"
                )}
              >
                {item.label}
              </p>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default OrgSidebar;
