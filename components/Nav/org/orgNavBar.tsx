import NotificationBell from "@/components/budget-requests/NotificationBell";
import { ThemeToggle } from "@/components/ui/theme";
import OrgMobileSidebar from "./orgMobileSIdebar";
export default function OrgNavBar({
  name,
  orgName,
}: {
  name: string;
  orgName: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b px-4">
      <div className="flex items-center gap-3">
        <span className="lg:hidden">
          <OrgMobileSidebar orgName={orgName} />
        </span>
        <span className="truncate text-sm font-medium">{orgName}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm sm:inline">{name}</span>
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
