"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { budgetApi, budgetEndpoint } from "@/lib/budget-requests/client";
import type {
  ApprovalOptions,
  BudgetRequest,
} from "@/lib/budget-requests/types";
import { requestSchema } from "@/lib/budget-requests/validation";
import { toast } from "sonner";

export default function RequestForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<ApprovalOptions | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("USD");
  useEffect(() => {
    const controller = new AbortController();
    budgetApi<ApprovalOptions>(`${budgetEndpoint(organizationId)}/options`, {
      signal: controller.signal,
    })
      .then(setOptions)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [organizationId]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = requestSchema.safeParse({
      title: form.get("title"),
      description: form.get("description"),
      amount: form.get("amount"),
      currency,
      neededBy: form.get("neededBy") || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(". "));
      return;
    }
    setSaving(true);
    try {
      const request = await budgetApi<BudgetRequest>(
        budgetEndpoint(organizationId),
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      toast.success("Budget request sent to your designated reviewer");
      router.push(`/org/${organizationId}/budget-requests/${request.id}`);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const ready = Boolean(options?.reviewer);
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Request a budget</CardTitle>
        <CardDescription>
          Explain what your church activity needs and submit it for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Your approval route</p>
            <p className="mt-1 text-muted-foreground">
              {options
                ? `${options.reviewer?.name ?? "Reviewer not assigned"} → ${options.pastor?.name ?? "Final pastor not assigned"}`
                : "Loading…"}
            </p>
            {options && !options.pastor && (
              <p className="mt-2">
                You can submit now. The owner must assign a final pastor in{" "}
                {options.isOwner ? (
                  <Link
                    className="underline"
                    href={`/org/${organizationId}/settings?tab=organization`}
                  >
                    organization settings
                  </Link>
                ) : (
                  "organization settings"
                )}{" "}
                before final approval.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Budget title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Youth outreach supplies"
              minLength={3}
              maxLength={150}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="amount">Amount requested</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                max="999999999999.99"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "GHS", "GBP", "EUR"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Purpose and breakdown</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What is the budget for? Include the items, costs and why they are needed."
              rows={5}
              minLength={10}
              maxLength={5000}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neededBy">
              Needed by{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="neededBy"
              name="neededBy"
              type="date"
              className="sm:max-w-xs"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Private to you, the organization owner and designated approvers.
            Other members cannot see your request.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving || !ready}>
              {saving ? "Sending…" : "Submit budget request"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/org/${organizationId}/budget-requests`}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
