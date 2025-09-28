import React from "react";
import Navigation from "./Navigation";
import UserAvatar from "../UserAvatar";
import { ThemeToggle } from "../ui/theme";

const NavBar = () => {
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
          <UserAvatar name="Enoch Agbloe" id="user-avatar" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
