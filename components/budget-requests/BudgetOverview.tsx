"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { budgetAmount, cashLabels, statusLabels, type BudgetRequest } from "@/lib/budget-requests/types";
import { useBudgetActivity } from "./useBudgetActivity";
type Summary = { approvalCount: number; cashCount: number; receiptCount: number; pending: { currency: string; amount: string }[]; tasks: BudgetRequest[]; recent: BudgetRequest[] };
export default function BudgetOverview({ organizationId }: { organizationId: string }) {
  const { data, error, refresh } = useBudgetActivity<Summary>(`/api/organizations/${organizationId}/budget-requests/summary`);
  return <section className="space-y-5" aria-label="Budget activity">
    <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Budget activity</h2><Button variant="ghost" size="sm" onClick={() => void refresh()}>Refresh</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!data ? <p className="text-sm text-muted-foreground">Loading budget activity…</p> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ title: "Needs my approval", value: data.approvalCount }, { title: "Cash steps for me", value: data.cashCount }, { title: "Confirm my cash receipt", value: data.receiptCount }, { title: "Pending approval amounts", value: data.pending.map(group => budgetAmount(group.amount, group.currency)).join(" · ") || "None" }].map(item => <Card key={item.title}><CardHeader><CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{item.value}</p></CardContent></Card>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">{[{ title: "Needs your action", rows: data.tasks }, { title: "Recent decisions and payments", rows: data.recent }].map(section => <Card key={section.title}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent><ul className="divide-y">{section.rows.map(request => <li key={request.id} className="py-3 first:pt-0"><Link className="font-medium hover:underline" href={`/org/${organizationId}/budget-requests/${request.id}`}>{request.title}</Link><p className="mt-1 text-sm text-muted-foreground">{budgetAmount(request.amount, request.currency)} · {request.status === "APPROVED" ? cashLabels[request.cashStatus] : statusLabels[request.status]}</p></li>)}</ul>{!section.rows.length && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}</CardContent></Card>)}</div>
      <p className="text-xs text-muted-foreground">Only requests you are permitted to see are included. Updates automatically every 30 seconds.</p>
    </>}
  </section>;
}
