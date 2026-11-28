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
      <SheetContent side="left" className="flex h-svh flex-col gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{orgName}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 pt-8">
          <OrgSidebar isMobile orgName={orgName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
