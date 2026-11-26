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
import InvitationLink from "./InvitationLink";
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
  const [delivery, setDelivery] = useState<"link" | "email">("link");
  const [invitationUrl, setInvitationUrl] = useState("");
  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setInvitationUrl("");
    try {
      const data = await budgetApi<{
        emailStatus: string;
        emailError: string | null;
        invitationUrl?: string;
      }>(`/api/organizations/${organizationId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, delivery }),
      });
      if (data.emailStatus === "FAILED")
        setError(
          data.emailError ??
            "Email could not be sent. Try again or contact the application administrator.",
        );
      else {
        toast.success(delivery === "link" ? "Invitation link created" : "Invitation sent");
        setInvitationUrl(data.invitationUrl ?? "");
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
          Create a private invitation link to share directly, or send it by email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={send}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Invitation method</legend>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="delivery" value="link" checked={delivery === "link"} disabled={sending} onChange={() => { setDelivery("link"); setError(""); }} />Share a link</label>
              <label className="flex items-center gap-2"><input type="radio" name="delivery" value="email" checked={delivery === "email"} disabled={sending} onChange={() => { setDelivery("email"); setError(""); }} />Send email</label>
            </div>
          </fieldset>
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
              <Button disabled={sending || (delivery === "email" && !configured)}>
                {sending ? "Creating…" : delivery === "link" ? "Create invitation link" : "Send invitation"}
              </Button>
            </div>
          </div>
          {invitationUrl && <InvitationLink url={invitationUrl} />}
          <p className="text-sm text-muted-foreground">Links expire after 7 days and can only be accepted by the invited email. Creating a replacement invalidates the previous link.</p>
          <p className="text-sm text-muted-foreground">
            New members can only request budgets, view their own request history
            and update their personal settings. They cannot see church finances
            or approve budgets unless the owner assigns them.
          </p>
          {delivery === "email" && !configured && (
            <p className="text-sm text-muted-foreground">
              Email invitations are currently unavailable. Contact the application administrator.
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
