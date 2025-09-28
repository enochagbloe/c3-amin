import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import NavLinks from "./NavLinks";

const MobileNavigation = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <Link href={"/"} className="flex items-center gap-2 mt-4">
            <Image
              src={"/images/logo/main-logo.png"}
              height={30}
              width={30}
              alt="logo"
            />
            <p>C3 Ignite ERP</p>
            </Link>
            <section className="mt-10 h-full flex-col flex gap-2 pt-3 scrollbar-hide">
                <NavLinks isMobile/>
            </section>
          </SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
