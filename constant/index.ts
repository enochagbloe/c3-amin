import {
  Home,
  BarChart3,
  Users,
  ShoppingCart,
  Settings,
  Bell,
  FileText,
  CreditCard,
} from "lucide-react";

export const sidebarLinks = [
  {
    icon: Home,
    label: "Dashboard",
    route: "#",
    badge: null,
  },
  {
    icon: BarChart3,
    label: "Analytics",
    route: "#",
    badge: null,
    submenu: [
      { label: "Overview", route: "/analytics/overview" },
      { label: "Reports", route: "/analytics/reports" },
      { label: "Insights", route: "/analytics/insights" },
    ],
  },
  {
    icon: Users,
    label: "Users",
    route: "#",
    badge: "124",
  },
  {
    icon: ShoppingCart,
    label: "Orders",
    route: "#",
    badge: "12",
    submenu: [
      { label: "All Orders", route: "#" },
      { label: "Pending", route: "#" },
      { label: "Completed", route: "#" },
    ],
  },
  {
    icon: CreditCard,
    label: "Payments",
    route: "/budgetTracker",
    badge: null,
  },
  {
    icon: FileText,
    label: "Approved Expenses",
    route: "/approvedBudgets",
    badge: null,
  },
  {
    icon: FileText,
    label: "Reports",
    route: "#",
    badge: null,
  },
  {
    icon: Bell,
    label: "Notifications",
    route: "#",
    badge: "5",
  },
  {
    icon: Settings,
    label: "Settings",
    route: "#",
    badge: null,
  },
];
