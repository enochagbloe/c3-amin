import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../ui/button";
import { ROUTES } from "@/constant/route";
import OrgSidebar from "./OrgSidebar";
import { getOrganization } from "@/lib/actions/org/organization.actions";

const OrgMobileSidebar = async () => {
const org = await getOrganization({ organizationId: "orgId" });
const [ organizationName ] = (org.data?.name || "Organization");
  return (
    <>
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
                <p>{organizationName}</p>
              </Link>
              <section className="mt-10 h-full flex-col flex gap-3 pt-4 scrollbar-hide">
                {/*<NavLinks isMobile />*/}
                <OrgSidebar isMobile />
              </section>
              <SheetClose>
                <div className="flex">
                      <SheetClose asChild>
                        <Link href={ROUTES.SIGN_IN}>
                          <Button className="small-medium btn-secondary mt-12 min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
                            <p className="primary-text-gradient"> Log in </p>
                          </Button>
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link href={ROUTES.SIGN_UP}>
                          <Button className="small-medium btn-tertiary min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
                            <p className="primary-text-gradient"> Sign up </p>
                          </Button>
                        </Link>
                      </SheetClose>
                </div>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default OrgMobileSidebar;
