import LeftSideBar from "@/components/Nav/LeftSideBar";
import NavBar from "@/components/Nav/navbar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <NavBar />
      <div className="flex">
        <section className="hidden lg:block">
          <LeftSideBar />
        </section>
        <section className="flex min-h-screen flex-1 flex-col px-6 pb-6 pt-16 max-md:pb-14 sm:px-14">
          <div className="">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default layout;
