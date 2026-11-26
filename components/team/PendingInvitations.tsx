"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InvitationLink from "./InvitationLink";
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
  const [links, setLinks] = useState<Record<string, string>>({});
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
    type: "resend" | "revoke" | "delivery" | "link",
  ) {
    setBusy(invitation.id);
    setError("");
    try {
      const result = await budgetApi<{ invitationUrl?: string }>(
        type === "resend" || type === "link" ? endpoint : `${endpoint}/${invitation.id}`,
        {
          method:
            type === "resend" || type === "link" ? "POST" : type === "revoke" ? "DELETE" : "GET",
          ...((type === "resend" || type === "link")
            ? { body: JSON.stringify({ email: invitation.email, delivery: type === "link" ? "link" : "email" }) }
            : {}),
        },
      );
      setLinks(current => { const next = { ...current }; delete next[invitation.id]; if (result.invitationUrl) next[invitation.id] = result.invitationUrl; return next; });
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
            Invitations and their status will appear here.
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
                    {invitation.emailStatus === "NOT_SENT" ? "Link created" : `Email: ${invitation.emailStatus.toLowerCase()}`}
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
                    <Button type="button" variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => action(invitation, "link")}>Create new link</Button>
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
              {invitation.status === "PENDING" && links[invitation.id] && <div className="w-full"><InvitationLink url={links[invitation.id]} /></div>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
