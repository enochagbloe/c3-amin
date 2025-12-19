"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { orgSidebarLinks } from "@/constant/org-sidebar";
import { SheetClose } from "@/components/ui/sheet";

interface Props {
  isMobile?: boolean;
}

const OrgSidebar = ({isMobile = false}: Props) => {
  const pathname = usePathname();
  const params = useParams();
  const orgId = params.id as string;

  const NavContent = (
    <>
      {orgSidebarLinks.map((item) => {
        const fullRoute = `/org/${orgId}${item.route}`;
        const isActive = pathname === fullRoute || pathname.startsWith(fullRoute + "/");
        const Icon = item.icon;

        const linkContent = (
          <div
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
                isMobile ? "" : "max-lg:hidden"
              )}
            >
              {item.label}
            </p>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
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
    </>
  );

  if (isMobile) {
    return (
      <section className="flex flex-col gap-3">
        {NavContent}
      </section>
    );
  }

  return (
    <section className="custom-scrollbar sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-hidden scrollbar-hide border-r p-6 pt-20 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex flex-1 flex-col gap-6">
        {NavContent}
      </div>
    </section>
  );
};

export default OrgSidebar;
