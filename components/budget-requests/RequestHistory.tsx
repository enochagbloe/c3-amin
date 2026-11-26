import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetRequest } from "@/lib/budget-requests/types";

export default function RequestHistory({
  request,
}: {
  request: BudgetRequest;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request history</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-5 border-l pl-5">
          {request.events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary" />
              <p className="font-medium">
                {event.action === "FUNDS_RECEIVED" ? "Reviewer collected cash" : event.action === "CASH_HANDED_OVER" ? "Reviewer handed cash to requester" : event.action === "RECEIPT_CONFIRMED" ? "Requester confirmed receipt · expense recorded" : event.action === "SUBMITTED"
                  ? "Request submitted"
                  : event.action === "REASSIGNED"
                    ? "Approval route updated by owner"
                    : `${event.stage === "MAIN" ? "Reviewer" : "Pastor"} ${event.action === "APPROVED" ? "approved" : "rejected"}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.actor.name} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
              </p>
              {event.comment && (
                <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-3 text-sm">
                  {event.comment}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
