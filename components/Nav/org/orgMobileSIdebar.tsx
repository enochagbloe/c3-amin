import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrgSidebar from "./OrgSidebar";
export default function OrgMobileSidebar({ orgName }: { orgName: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open organization navigation"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{orgName}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6">
          <OrgSidebar isMobile orgName={orgName} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
