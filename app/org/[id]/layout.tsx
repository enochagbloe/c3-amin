import React from "react";
import OrgSidebar from "@/components/Nav/OrgSidebar";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen">
      {/* Organization Sidebar */}
      <OrgSidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}
