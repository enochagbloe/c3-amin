"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetApi } from "@/lib/budget-requests/client";
type Invitation = {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  emailStatus: string;
  emailError: string | null;
  lastSentAt: string | null;
};
export default function PendingInvitations({
  organizationId,
  revision,
}: {
  organizationId: string;
  revision: number;
}) {
  const [invitations, setInvitations] = useState<Invitation[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const endpoint = `/api/organizations/${organizationId}/invitations`;
  const load = useCallback(async () => {
    try {
      setInvitations(await budgetApi<Invitation[]>(endpoint));
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
  }, [load, revision]);
  async function action(
    invitation: Invitation,
    type: "resend" | "revoke" | "delivery",
  ) {
    setBusy(invitation.id);
    setError("");
    try {
      await budgetApi(
        type === "resend" ? endpoint : `${endpoint}/${invitation.id}`,
        {
          method:
            type === "resend" ? "POST" : type === "revoke" ? "DELETE" : "GET",
          ...(type === "resend"
            ? { body: JSON.stringify({ email: invitation.email }) }
            : {}),
        },
      );
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
        <CardTitle>Invitations</CardTitle>
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
        {!invitations.length ? (
          <p className="text-sm text-muted-foreground">
            Sent invitations and their status will appear here.
          </p>
        ) : (
          invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="space-y-1">
                <p className="break-all font-medium">{invitation.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {invitation.status === "PENDING" &&
                    new Date(invitation.expiresAt) < new Date()
                      ? "Expired"
                      : invitation.status.toLowerCase()}
                  </Badge>
                  <Badge
                    variant={
                      invitation.emailStatus === "FAILED" ||
                      invitation.emailStatus === "BOUNCED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    Email: {invitation.emailStatus.toLowerCase()}
                  </Badge>
                </div>
                {invitation.emailError && (
                  <p className="max-w-xl text-sm text-destructive">
                    {invitation.emailError}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {invitation.status === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(busy)}
                      onClick={() => action(invitation, "resend")}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={Boolean(busy)}
                      onClick={() => action(invitation, "revoke")}
                    >
                      Revoke
                    </Button>
                  </>
                )}
                {invitation.lastSentAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(busy)}
                    onClick={() => action(invitation, "delivery")}
                  >
                    Check delivery
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
