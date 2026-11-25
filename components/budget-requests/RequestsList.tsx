"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, FileText, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { budgetApi, budgetEndpoint } from "@/lib/budget-requests/client";
import { budgetAmount, type BudgetRequest } from "@/lib/budget-requests/types";
import RequestStatus from "./RequestStatus";
import { useOrganizationAccess } from "@/components/organizations/OrganizationAccessProvider";

type Result = {
  requests: BudgetRequest[];
  total: number;
  page: number;
  pageSize: number;
};
export default function RequestsList({
  organizationId,
}: {
  organizationId: string;
}) {
  const access = useOrganizationAccess();
  const [scope, setScope] = useState("mine");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    budgetApi<Result>(
      `${budgetEndpoint(organizationId)}?scope=${scope}&page=${page}`,
      { signal: controller.signal },
    )
      .then(setData)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [organizationId, scope, page, refresh]);
  return (
    <main className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Budget requests</h1>
          <p className="mt-2 text-muted-foreground">
            Submit church budgets and follow each approval.
          </p>
        </div>
        <Button asChild>
          <Link href={`/org/${organizationId}/budget-requests/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Request budget
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Request",
            text: "Submit the amount and purpose.",
          },
          {
            icon: Clock,
            title: "First approval",
            text: "Your designated reviewer checks it.",
          },
          {
            icon: ShieldCheck,
            title: "Final go-ahead",
            text: "The pastor gives the final approval.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs
        value={scope}
        onValueChange={(value) => {
          setScope(value);
          setPage(1);
        }}
      >
        <TabsList className="flex h-auto w-fit flex-wrap">
          <TabsTrigger value="mine">My requests</TabsTrigger>
          {access.canReviewBudgets && (
            <TabsTrigger value="inbox">Needs my approval</TabsTrigger>
          )}
          {access.canReviewBudgets && (
            <TabsTrigger value="all">Oversight</TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      <p className="text-sm text-muted-foreground">
        {scope === "all"
          ? "Owners see all organization requests. Approvers see only requests assigned to them; other members see only their own."
          : scope === "inbox"
            ? "Only requests awaiting your decision at the current approval stage appear here."
            : "Your complete request history, including pending, approved and rejected budgets."}
      </p>
      <Card>
        <CardContent className="pt-6">
          {error ? (
            <div role="alert" className="space-y-3">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          ) : !data ? (
            <p
              role="status"
              className="py-10 text-center text-muted-foreground"
            >
              Loading requests…
            </p>
          ) : data.requests.length === 0 ? (
            <div className="space-y-3 py-12 text-center">
              <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
              <h2 className="font-semibold">
                {scope === "inbox"
                  ? "No requests need your approval"
                  : "No budget requests yet"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {scope === "mine"
                  ? "Send your first request to start its approval journey."
                  : "Requests you are allowed to see will appear here."}
              </p>
              {scope === "mine" && (
                <Button asChild variant="outline">
                  <Link href={`/org/${organizationId}/budget-requests/new`}>
                    Request budget
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="p-3">Request</th>
                      <th className="p-3">Requester</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="p-3 font-medium">
                          <Link
                            className="underline-offset-4 hover:underline"
                            href={`/org/${organizationId}/budget-requests/${request.id}`}
                          >
                            {request.title}
                          </Link>
                        </td>
                        <td className="p-3">{request.requester.name}</td>
                        <td className="whitespace-nowrap p-3">
                          {budgetAmount(request.amount, request.currency)}
                        </td>
                        <td className="p-3">
                          <RequestStatus status={request.status} />
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {data.total} requests · Page {data.page} of{" "}
                  {Math.max(1, Math.ceil(data.total / data.pageSize))}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * data.pageSize >= data.total}
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
    </main>
  );
}
