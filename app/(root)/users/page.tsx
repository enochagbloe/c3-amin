import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import SelectableTable from "@/components/create/selectTable";

export default async function UserPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/users`, {
    cache: "no-store",
  });

  const json = await res.json();
  const users = json.data;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p>Manage and view your coworkers and guests</p>
      </div>

      <div className="py-12">
        <Card>
          <div className="mx-8">
            <div className="flex gap-3">
              <Input type="email" placeholder="Email" />
              <Button variant="primary">
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>

            <div className="flex gap-4 mt-6">
              <Button className="rounded-[20px]">Personalize your invitation</Button>
              <Button className="rounded-[20px]" variant="primary">
                Upload CSV
              </Button>
            </div>

            <div className="border-t mt-6"></div>
          </div>
        </Card>
      </div>

      <SelectableTable data={users} />
    </div>
  );
}
