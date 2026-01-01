"use client";

import { useState } from "react";
import TextAreaPrompt from "./prompt/page";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MainContentClient() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <main className="flex h-screen">
      {/* MAIN */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <h3 className="text-lg font-medium">
              Dashboard Content
            </h3>
          </TabsContent>

          <TabsContent value="prompt">
            <TextAreaPrompt />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
