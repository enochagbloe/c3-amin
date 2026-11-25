"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { budgetApi } from "@/lib/budget-requests/client";
import { toast } from "sonner";
type Settings = { configured: boolean; fromEmail: string };
export default function EmailSettings({
  organizationId,
  onReady,
}: {
  organizationId: string;
  onReady: (ready: boolean) => void;
}) {
  const [settings, setSettings] = useState<Settings | null>(null),
    [fromEmail, setFromEmail] = useState(""),
    [key, setKey] = useState("");
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const endpoint = `/api/organizations/${organizationId}/email-settings`;
  useEffect(() => {
    const controller = new AbortController();
    budgetApi<Settings>(endpoint, { signal: controller.signal })
      .then((data) => {
        setSettings(data);
        setFromEmail(data.fromEmail);
        onReady(data.configured);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [endpoint, onReady]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await budgetApi<Settings>(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          fromEmail,
          ...(key.trim() ? { apiKey: key.trim() } : {}),
        }),
      });
      setSettings(data);
      setKey("");
      onReady(data.configured);
      toast.success("Email delivery settings saved");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email delivery</CardTitle>
        <CardDescription>
          {settings?.configured
            ? "Resend is configured. Invite a member below to test delivery."
            : "Connect Resend once to send team invitations."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender">Verified sender email</Label>
              <Input
                id="sender"
                type="email"
                value={fromEmail}
                onChange={(event) => setFromEmail(event.target.value)}
                placeholder="team@yourchurch.org"
                required
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resend-key">Resend API key</Label>
              <Input
                id="resend-key"
                type="password"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder={
                  settings?.configured
                    ? "Saved securely · leave blank to keep"
                    : "re_…"
                }
                required={!settings?.configured}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use a sender on a domain verified in{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Resend
            </a>
            . Create a key under{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              API keys
            </a>
            . The key is encrypted and is never shown again. Only the
            organization owner can change these settings.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? "Saving…" : "Save email settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
