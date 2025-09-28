import React from "react";
import NavLinks from "./NavLinks";



const LeftSideBar = () => {
// const session = await auth();
//const userId = session.user.id;

  return (
    <section className=" custom-scrollbar sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-hidden scrollbar-hide border-r p-6 pt-20 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex flex-1 flex-col gap-6">
        <NavLinks />
      </div>
    </section>
  );
};

export default LeftSideBar;
