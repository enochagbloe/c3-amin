"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { budgetApi, budgetEndpoint } from "@/lib/budget-requests/client";
import type { BudgetRequest } from "@/lib/budget-requests/types";
import { toast } from "sonner";

export default function DecisionForm({
  organizationId,
  request,
  onDecision,
}: {
  organizationId: string;
  request: BudgetRequest;
  onDecision: (request: BudgetRequest) => void;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function decide(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !comment.trim()) {
      setError("Add a reason before rejecting this request.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await budgetApi<BudgetRequest>(
        `${budgetEndpoint(organizationId)}/${request.id}/decision`,
        { method: "POST", body: JSON.stringify({ decision, comment }) },
      );
      onDecision(updated);
      setComment("");
      toast.success(
        decision === "REJECTED"
          ? "Request rejected"
          : updated.status === "APPROVED"
            ? "Budget received final approval"
            : "Approved and sent to the pastor",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {request.status === "PENDING_MAIN"
            ? "Review budget request"
            : "Pastor’s final approval"}
        </CardTitle>
        <CardDescription>
          {request.status === "PENDING_MAIN"
            ? "Approve to send this request to the pastor, or reject with a reason."
            : "Give the final go-ahead, or reject with a reason."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="decision-comment">
            Comment{" "}
            <span className="text-muted-foreground">
              (required for rejection)
            </span>
          </Label>
          <Textarea
            id="decision-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={saving}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button disabled={saving} onClick={() => decide("APPROVED")}>
            {saving
              ? "Recording decision…"
              : request.status === "PENDING_MAIN"
                ? "Approve and send to pastor"
                : "Give final approval"}
          </Button>
          <Button
            variant="destructive"
            disabled={saving}
            onClick={() => decide("REJECTED")}
          >
            Reject request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
