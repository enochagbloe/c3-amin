import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";
import TextAreaPrompt from "./prompt/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface SearchParams {
  searchParams: Promise<{ [key: string]: string }>;
}
const MainContent = async ({ searchParams }: SearchParams) => {
  const session = await auth();
  console.log("Session: ", session);
  if (!session) return redirect("/sign-in");
  return (
    <main className="max-h-screen">
        <div className="">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Main Content Area
          </h2>
          <div>
            <Tabs defaultValue="dashboard">
            <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Dashboard Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This is where the dashboard content will go.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="prompt">
                <TextAreaPrompt />
            </TabsContent>
          </Tabs>
          </div>
        </div>
    </main>
  );
};
export default MainContent;
