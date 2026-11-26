"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { budgetApi } from "@/lib/budget-requests/client";
import type { ApprovalOptions } from "@/lib/budget-requests/types";
import { toast } from "sonner";

export default function ApprovalSettings({
  organizationId,
}: {
  organizationId: string;
}) {
  const [options, setOptions] = useState<ApprovalOptions | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [pastorId, setPastorId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const endpoint = `/api/organizations/${organizationId}/budget-approval-settings`;
  const load = useCallback(async () => {
    try {
      const data = await budgetApi<ApprovalOptions>(endpoint);
      setOptions(data);
      setReviewerId(data.reviewer?.id ?? "");
      setPastorId(data.pastor?.id ?? "");
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save() {
    setSaving(true);
    setError("");
    try {
      const data = await budgetApi<ApprovalOptions>(endpoint, {
        method: "PUT",
        body: JSON.stringify({ reviewerId, pastorId }),
      });
      setOptions(data);
      toast.success("Budget approval route saved");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Budget approval settings</CardTitle>
        <CardDescription>
          The owner assigns the approval route. Members never choose their
          approvers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}{" "}
            <button className="underline" onClick={load}>
              Retry
            </button>
          </p>
        )}
        {!options && !error && (
          <p className="text-sm text-muted-foreground">
            Loading approval settings…
          </p>
        )}
        {options &&
          (options.isOwner ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "First approval · budget reviewer",
                    value: reviewerId,
                    change: setReviewerId,
                    other: pastorId,
                  },
                  {
                    label: "Final approval · pastor",
                    value: pastorId,
                    change: setPastorId,
                    other: reviewerId,
                  },
                ].map(({ label, value, change, other }, index) => (
                  <div className="space-y-2" key={label}>
                    <Label htmlFor={`approver-${index}`}>{label}</Label>
                    <Select value={value} onValueChange={change}>
                      <SelectTrigger
                        id={`approver-${index}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose an organization member" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.members.map((member) => (
                          <SelectItem
                            key={member.id}
                            value={member.id}
                            disabled={member.id === other}
                          >
                            {member.name} · {member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Requests go to the reviewer first, then to the pastor for the
                final go-ahead. Changes reroute unfinished stages; recorded
                decisions stay in history. Any active organization member can be the reviewer; the owner can change this assignment. The assigned reviewer may give first approval to their own request, but a different person must give final approval. A pastor cannot give final approval to their own request.
              </p>
              <Button
                onClick={save}
                disabled={
                  saving || !reviewerId || !pastorId || reviewerId === pastorId
                }
              >
                {saving ? "Saving…" : "Save approval route"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Reviewer: {options.reviewer?.name ?? "Not assigned"} → Final
              pastor: {options.pastor?.name ?? "Not assigned"}. Only the
              organization owner can change this route.
            </p>
          ))}
      </CardContent>
    </Card>
  );
}
