"use client";

import { sidebarLinks } from "@/constant";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface Props {
  isMobile?: boolean;
  userId?: string;
}

const NavLinks = ({ isMobile = false, userId }: Props) => {
  const path = usePathname();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  return (
    <>
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

        return (
          <div key={item.label} className="relative">
            <div
              onClick={() =>
                hasSubmenu
                  ? setOpenIndex(openIndex === idx ? null : idx)
                  : undefined
              }
              className={cn(
                "flex items-center",
                hasSubmenu ? "cursor-pointer" : "cursor-default"
              )}
            >
              <Link
                href={item.route}
                className={cn(
                  isActive
                    ? "bg-sky-300 rounded-2xl"
                    : "text-black dark:text-white",
                  "flex items-center flex-1 gap-2 p-4"
                )}
              >
                <Icon
                  className={cn(
                    isActive
                      ? "text-sky-500"
                      : "text-black dark:text-white opacity-50","gap-2"
                  )}
                  size={20}
                />
                <p
                  className={cn(
                    isActive ? "base-bold" : "base-small",
                    !isMobile && "max-lg:hidden",
                    "ml-2"
                  )}
                >
                  {item.label}
                </p>
              </Link>
              {hasSubmenu && (
                <span className="ml-2">{openIndex === idx ? "▲" : "▼"}</span>
              )}
            </div>
            {hasSubmenu && openIndex === idx && (
              <div className="ml-8 mt-1">
                {(item.submenu ?? []).map((sub) => (
                  <Link
                    key={sub.label}
                    href={sub.route}
                    className="block py-3 px-2 hover:bg-sky-100 dark:hover:bg-sky-900 rounded"
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default NavLinks;
