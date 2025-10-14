import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

interface SearchParams {
  searchParams: Promise<{ [key: string]: string }>;
}
const MainContent = async ({ searchParams }: SearchParams) => {
  const session = await auth();
  console.log("Session: ", session);
  if (!session) return redirect("/sign-in");
  return (
    <main className="">
      <div className="">
        <div className="">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Main Content Area
          </h2>
          <p className="text-gray-900 dark:text-white">
            This is where you can add your dashboard cards and content.
          </p>
        </div>
      </div>
    </main>
  );
};
export default MainContent;
