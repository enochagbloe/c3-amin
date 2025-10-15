"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      label: "Dashboard",
      route: "#",
      icon: IconDashboard,
    },
    {
      label: "Payments",
      route: "/budgetTracker",
      icon: IconListDetails,
    },
    {
      label: "Analytics",
      route: "/analytics",
      icon: IconChartBar,
    },
    {
      label: "Projects",
      route: "#",
      icon: IconFolder,
    },
    {
      label: "Team",
      route: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          label: "Active Proposals",
          route: "#",
        },
        {
          label: "Archived",
          route: "#",
        },
      ],
    },
    {
      label: "Proposal",
      icon: IconFileDescription,
      route: "#",
      items: [
        {
          label: "Active Proposals",
          route: "#",
        },
        {
          label: "Archived",
          route: "#",
        },
      ],
    },
    {
      label: "Prompts",
      icon: IconFileAi,
      route: "#",
      items: [
        {
          label: "Active Proposals",
          route: "#",
        },
        {
          label: "Archived",
          route: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      label: "Settings",
      route: "#",
      icon: IconSettings,
    },
    {
      label: "Get Help",
      route: "#",
      icon: IconHelp,
    },
    {
      label: "Search",
      route: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      label: "Data Library",
      route: "#",
      icon: IconDatabase,
    },
    {
      label: "Reports",
      route: "#",
      icon: IconReport,
    },
    {
      label: "Word Assistant",
      route: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
