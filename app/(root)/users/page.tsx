import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const UserPage = () => {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p>Manage and view your coworkers and guests</p>
      </div>
      <div className="py-12">
        <Card>
          <div className="mx-8">
            <Input type="email" placeholder="Email" />
          </div>
          <div className="flex mx-8 gap-4">
            <Button className="rounded-[20px]">
              Personalize your invitation
            </Button>
            <Button className="rounded-[20px]">Upload CSV</Button>
          </div>
          <div className="border-t mt-2 mx-6"></div>
        </Card>
      </div>
    </div>
  );
};

export default UserPage;
