"use client";
import { useState } from "react";
import EmailSettings from "./EmailSettings";
import InvitationForm from "./InvitationForm";
import PendingInvitations from "./PendingInvitations";
import TeamMembers from "./TeamMembers";
export default function TeamPage({
  organizationId,
}: {
  organizationId: string;
}) {
  const [configured, setConfigured] = useState(false),
    [revision, setRevision] = useState(0);
  return (
    <main className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="mt-2 text-muted-foreground">
          Invite people by email and manage membership in your church
          organization.
        </p>
      </div>
      <EmailSettings organizationId={organizationId} onReady={setConfigured} />
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
