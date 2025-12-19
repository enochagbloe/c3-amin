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
import NavLinks from "../NavLinks";
import { Button } from "../../ui/button";
import { auth, signOut } from "@/auth";
import { LogOut } from "lucide-react";
import { ROUTES } from "@/constant/route";
import OrgSidebar from "./OrgSidebar";

const OrgMobileSidebar = async () => {
  const session = await auth();
  const userId = session?.user?.id;
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
                <p>C3 Ignite ERP</p>
              </Link>
              <section className="mt-10 h-full flex-col flex gap-3 pt-4 scrollbar-hide">
                {/*<NavLinks isMobile />*/}
                <OrgSidebar isMobile />
              </section>
              <SheetClose>
                <div className="flex">
                  {userId ? (
                    <SheetClose asChild>
                      <form
                        action={async () => {
                          "use server";
                          await signOut();
                        }}
                      >
                        <Button className="flex py-2 px-12 w-full">
                          <LogOut /> <span>Logout</span>
                        </Button>
                      </form>
                    </SheetClose>
                  ) : (
                    <>
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
                    </>
                  )}
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
