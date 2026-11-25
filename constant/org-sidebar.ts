import {
  Home,
  BarChart3,
  Users,
  Settings,
  DollarSign,
  FileText,
} from "lucide-react";

export const orgSidebarLinks = [
  { icon: Settings, label: "Personal settings", route: "/personal-settings", badge: null },
  {
    icon: FileText,
    label: "Budget requests",
    route: "/budget-requests",
    badge: null,
  },
  {
    icon: Home,
    label: "Dashboard",
    route: "/dashboard",
    badge: null,
  },
  {
    icon: DollarSign,
    label: "Expenses",
    route: "/expenses",
    badge: null,
  },
  {
    icon: FileText,
    label: "Income",
    route: "/income",
    badge: null,
  },
  {
    icon: Users,
    label: "Team",
    route: "/members",
    badge: null,
  },
  {
    icon: BarChart3,
    label: "Analytics",
    route: "/analytics",
    badge: null,
  },
  {
    icon: Settings,
    label: "Settings",
    route: "/settings",
    badge: null,
  },
];
