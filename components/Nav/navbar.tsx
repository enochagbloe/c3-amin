import React from "react";
import Navigation from "./Navigation";
import UserAvatar from "../UserAvatar";
import { ThemeToggle } from "../ui/theme";
import OrgSwitcher from "./OrgSwitcher";
// import { auth } from "@/auth";

const NavBar = async () => {
  // const session = await auth();
  // const userIdName = session?.user?.name;
  // const userId = session?.user?.id;
  return (
    <div className="w-full h-16">
      <div className="flex justify-between items-center px-4 h-full">
        <div className="flex gap-4">
          <span className="lg:hidden">
            <Navigation />
          </span>
          <h2> NavLogo</h2>
        </div>
        <h2> Local search </h2>
        <div className="flex items-center gap-4">
          <OrgSwitcher />
          <UserAvatar name='enoch agbloe' id='' />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
