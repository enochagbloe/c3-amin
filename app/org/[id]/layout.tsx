import React from "react";
import OrgSidebar from "@/components/Nav/org/OrgSidebar";
import OrgNavBar from "@/components/Nav/org/orgNavBar";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <OrgNavBar />
      <div className="flex">
        <OrgSidebar />
        {/* Main Content */}
        <section className="flex max-h-screen flex-1 flex-col px-3 pb-3 pt-8 max-md:pb-8 sm:px-6 overflow-y-auto">
          <div>{children}</div>
        </section>
      </div>
    </main>
  );
}
