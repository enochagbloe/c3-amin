"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { budgetApi } from "@/lib/budget-requests/client";
import { toast } from "sonner";
export default function InvitationForm({
  organizationId,
  configured,
  onSent,
}: {
  organizationId: string;
  configured: boolean;
  onSent: () => void;
}) {
  const [email, setEmail] = useState(""),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const data = await budgetApi<{
        emailStatus: string;
        emailError: string | null;
      }>(`/api/organizations/${organizationId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (data.emailStatus === "FAILED")
        setError(
          data.emailError ??
            "Email could not be sent. Check your email settings and try again.",
        );
      else {
        toast.success("Invitation sent");
        setEmail("");
      }
      onSent();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a member</CardTitle>
        <CardDescription>
          They will receive an email with a secure link to join this
          organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={send}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Member email</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="invite-email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
              />
              <Button disabled={sending || !configured}>
                {sending ? "Sending…" : "Send invitation"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            New members can only request budgets, view their own request history
            and update their personal settings. They cannot see church finances
            or approve budgets unless the owner assigns them.
          </p>
          {!configured && (
            <p className="text-sm text-muted-foreground">
              Save email delivery settings above to enable invitations.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
