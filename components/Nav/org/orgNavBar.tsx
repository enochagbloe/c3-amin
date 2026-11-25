import { ThemeToggle } from "@/components/ui/theme";
import OrgMobileSidebar from "./orgMobileSIdebar";
import OrgSwitcher from "./OrgSwitcher";
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
        <span className="font-semibold">C3 Church</span>
      </div>
      <div className="flex items-center gap-3">
        <OrgSwitcher />
        <span className="hidden text-sm sm:inline">{name}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
