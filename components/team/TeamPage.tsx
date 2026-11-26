"use client";
import { useEffect, useState } from "react";
import { budgetApi } from "@/lib/budget-requests/client";
import InvitationForm from "./InvitationForm";
import PendingInvitations from "./PendingInvitations";
import TeamMembers from "./TeamMembers";
export default function TeamPage({
  organizationId, embedded = false,
}: {
  organizationId: string; embedded?: boolean;
}) {
  const [configured, setConfigured] = useState(false),
    [revision, setRevision] = useState(0);
  const [configurationError, setConfigurationError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setConfigured(false);
    setConfigurationError("");
    budgetApi<{ configured: boolean }>(`/api/organizations/${organizationId}/email-settings`, { signal: controller.signal })
      .then(result => setConfigured(result.configured))
      .catch(error => { if (error.name !== "AbortError") setConfigurationError("Unable to check invitation availability. Refresh and try again."); });
    return () => controller.abort();
  }, [organizationId]);
  return (
    <main className={embedded ? "space-y-6" : "space-y-6 p-3 sm:p-6"}>
      {!embedded && <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="mt-2 text-muted-foreground">
          Invite people by email and manage membership in your church
          organization.
        </p>
      </div>}
      {configurationError && <p role="alert" className="text-sm text-destructive">{configurationError}</p>}
      <InvitationForm
        organizationId={organizationId}
        configured={configured}
        onSent={() => setRevision((value) => value + 1)}
      />
      <PendingInvitations organizationId={organizationId} revision={revision} />
      <TeamMembers organizationId={organizationId} />
    </main>
  );
}
