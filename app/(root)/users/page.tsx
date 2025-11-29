"use client"
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Link2, Upload } from "lucide-react";
import React, { useState } from "react";
import { columns } from "./columns";
import type { UserManagementTable } from "./columns"
import { ReusableDataTable } from "@/components/ReuableDataTable";
import { useRouter } from "next/navigation";

export default function UserPage() {
  const [tableData, setTableData] = useState<UserManagementTable[]>([])
  const router = useRouter()

 React.useEffect(() => {
     const fetchData = async () => {
       const result = await fetch("/api/users").then(
         (res) => res.json()
       );
       setTableData(result.data);
     };
 
     fetchData();
     
   }, []);

   const handleRowClick = (user: UserManagementTable) =>{
    router.push(`/users/${user.id}`)
   }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p className="text-gray-600">Manage and view your coworkers and guests</p>
      </div>

      {/* Invite Section */}
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          {/* Email Invite */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Send Email Invitation
            </label>
            <div className="flex gap-3">
              <Input type="email" placeholder="Enter email address" className="flex-1" />
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>

          {/* Generate Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Or Generate Invite Link
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Click generate to create invite link"
                readOnly
                className="flex-1"
              />
              <Button variant="outline">
                <Link2 className="w-4 h-4 mr-2" />
                Generate Link
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button variant="outline" className="rounded-full">
              Personalize your invitation
            </Button>
            <Button variant="outline" className="rounded-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          </div>
        </div>
      </Card>

      <ReusableDataTable columns={columns} data={tableData} onRowClick={handleRowClick}/>
    </div>
  );
}