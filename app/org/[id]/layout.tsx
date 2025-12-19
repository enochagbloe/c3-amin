import React from "react";
import OrgSidebar from "@/components/Nav/org/OrgSidebar";
import OrgNavBar from "@/components/Nav/org/orgNavBar";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen">
      {/* Organization Sidebar */}
      <OrgSidebar />
      <OrgNavBar />
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}
