"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { budgetApi } from "@/lib/budget-requests/client";
type Member = {
  id: string;
  role: string;
  userId: string;
  user: { name: string; email: string } | null;
};
export default function TeamMembers({
  organizationId,
}: {
  organizationId: string;
}) {
  const [data, setData] = useState<{ members: Member[]; total: number } | null>(
      null,
    ),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const endpoint = `/api/organizations/${organizationId}/members`;
  const load = useCallback(async () => {
    try {
      setData(await budgetApi(`${endpoint}?page=${page}&pageSize=20`));
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }, [endpoint, page]);
  useEffect(() => {
    void load();
  }, [load]);
  async function remove(member: Member) {
    setBusy(member.id);
    setError("");
    try {
      await budgetApi(`${endpoint}/${member.id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team members</CardTitle>
        <Button variant="ghost" size="sm" onClick={load}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!data ? (
          <p className="text-sm text-muted-foreground">Loading team…</p>
        ) : (
          <>
            <div className="divide-y">
              {data.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-medium">
                      {member.user?.name ?? "Member"}
                    </p>
                    <p className="break-all text-sm text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{member.role.toLowerCase()}</Badge>
                    {member.role !== "OWNER" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(busy)}
                        onClick={() => remove(member)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">{data.total} members</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * 20 >= data.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
