"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { budgetApi, budgetEndpoint } from "@/lib/budget-requests/client";
import { budgetAmount, type BudgetRequest } from "@/lib/budget-requests/types";
import RequestStatus from "./RequestStatus";
import RequestHistory from "./RequestHistory";
import DecisionForm from "./DecisionForm";

export default function RequestDetail({
  organizationId,
  requestId,
  userId,
}: {
  organizationId: string;
  requestId: string;
  userId: string;
}) {
  const [request, setRequest] = useState<BudgetRequest | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    budgetApi<BudgetRequest>(`${budgetEndpoint(organizationId)}/${requestId}`, {
      signal: controller.signal,
    })
      .then(setRequest)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [organizationId, requestId, refresh]);
  const currentApprover =
    request?.status === "PENDING_MAIN"
      ? request.mainApproverId
      : request?.status === "PENDING_SECOND"
        ? request.secondApproverId
        : null;
  return (
    <main className="space-y-6 p-3 sm:p-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/org/${organizationId}/budget-requests`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Budget requests
        </Link>
      </Button>
      {error ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p role="alert" className="text-destructive">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={() => setRefresh((value) => value + 1)}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : !request ? (
        <p role="status">Loading budget request…</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="break-words text-3xl font-bold">
                {request.title}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Requested by {request.requester.name} ·{" "}
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <RequestStatus status={request.status} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Budget details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-3xl font-bold">
                    {budgetAmount(request.amount, request.currency)}
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {request.description}
                  </p>
                  {request.neededBy && (
                    <p className="text-sm text-muted-foreground">
                      Needed by{" "}
                      {new Date(request.neededBy).toLocaleDateString(
                        undefined,
                        { timeZone: "UTC" },
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
              {currentApprover === userId && (request.status === "PENDING_MAIN" || request.requesterId !== userId) && (
                <DecisionForm
                  organizationId={organizationId}
                  request={request}
                  onDecision={setRequest}
                />
              )}
              {currentApprover === userId && request.status === "PENDING_SECOND" && request.requesterId === userId && (
                <p className="rounded-lg border p-4 text-sm">
                  You cannot give final approval to your own request. The organization owner
                  must assign another approver for this stage in budget approval
                  settings.
                </p>
              )}
              <RequestHistory request={request} />
            </div>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Approval route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">1. Budget reviewer</p>
                  <p className="text-muted-foreground">
                    {request.mainApprover.name}
                  </p>
                </div>
                <div>
                  <p className="font-medium">2. Pastor · final go-ahead</p>
                  <p className="text-muted-foreground">
                    {request.secondApprover?.name ?? "Awaiting owner assignment"}
                  </p>
                </div>
                <p className="border-t pt-4 text-muted-foreground">
                  Assigned by the owner. Private to the requester, owner and
                  designated approvers.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefresh((value) => value + 1)}
                >
                  Refresh status
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
