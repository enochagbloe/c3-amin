"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { budgetApi, budgetEndpoint } from "@/lib/budget-requests/client";
import { budgetAmount, cashLabels, type BudgetRequest } from "@/lib/budget-requests/types";
export default function CashReceipt({ request, userId, organizationId, onChange }: { request: BudgetRequest; userId: string; organizationId: string; onChange: (request: BudgetRequest) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [reference, setReference] = useState(""), [confirmed, setConfirmed] = useState(false);
  const reviewer = request.mainApproverId === userId, requester = request.requesterId === userId;
  const action = reviewer && request.cashStatus === "NOT_RELEASED" ? "RECEIVE_FUNDS" : reviewer && request.cashStatus === "WITH_REVIEWER" ? "HAND_OVER" : requester && request.cashStatus === "AWAITING_RECEIPT" ? "CONFIRM_RECEIPT" : null;
  const amount = budgetAmount(request.amount, request.currency);
  async function record() {
    if (!action || !confirmed) return;
    setBusy(true); setError("");
    try {
      onChange(await budgetApi<BudgetRequest>(`${budgetEndpoint(organizationId)}/${request.id}/cash`, { method: "POST", body: JSON.stringify({ action, ...(action === "RECEIVE_FUNDS" ? { reference } : {}) }) }));
      setConfirmed(false); window.dispatchEvent(new Event("budget-activity"));
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <Card><CardHeader><CardTitle>Cash handover</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="font-medium">{cashLabels[request.cashStatus]} · {amount}</p>
    <p className="text-sm text-muted-foreground">After final approval, the reviewer collects the cash and records handover. Only the requester can confirm receipt. That confirmation records the expense.</p>
    <ol className="space-y-2 text-sm">
      <li>1. Reviewer collected cash: {request.reviewerReceivedAt ? new Date(request.reviewerReceivedAt).toLocaleString() : "Not recorded"}</li>
      <li>2. Cash handed to requester: {request.handedOverAt ? new Date(request.handedOverAt).toLocaleString() : "Not recorded"}</li>
      <li>3. Requester confirmed receipt: {request.receiptConfirmedAt ? new Date(request.receiptConfirmedAt).toLocaleString() : "Not confirmed"}</li>
    </ol>
    {request.paymentReference && <p className="text-sm">Reference: {request.paymentReference}</p>}
    {action && <div className="space-y-4 border-t pt-4">
      {action === "RECEIVE_FUNDS" && <div className="space-y-2"><Label htmlFor="cash-reference">Payment reference (optional)</Label><Input id="cash-reference" maxLength={150} value={reference} onChange={event => setReference(event.target.value)} disabled={busy} placeholder="Cash voucher or payment reference" /></div>}
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} className="mt-1" /><span>{action === "RECEIVE_FUNDS" ? `I have collected ${amount} for this approved request.` : action === "HAND_OVER" ? `I have handed the full ${amount} to ${request.requester.name}.` : `I confirm I have actually received the full ${amount}.`}</span></label>
      <Button disabled={busy || !confirmed} onClick={record}>{busy ? "Recording…" : action === "RECEIVE_FUNDS" ? "Record cash collected" : action === "HAND_OVER" ? "Record cash handed over" : "Confirm cash received"}</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {request.cashStatus === "RECEIVED" && <p className="text-sm">Receipt confirmed. One approved expense has been recorded in the organization’s Expenses page.</p>}
  </CardContent></Card>;
}
