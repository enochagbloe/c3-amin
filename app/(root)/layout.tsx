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
        <section className="flex max-h-screen flex-1 flex-col px-3 pb-3 pt-8 max-md:pb-8 sm:px-6">
          <div className="">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default layout;
