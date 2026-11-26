"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { budgetApi } from "@/lib/budget-requests/client";
type Details = {
  organization: { id: string; name: string };
  status: string;
  expired: boolean;
  emailHint: string;
  signedIn: boolean;
  emailMatches: boolean;
};
export default function AcceptInvitation({ token }: { token: string }) {
  const [details, setDetails] = useState<Details | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter(),
    destination = `/invitations/${token}`;
  useEffect(() => {
    const controller = new AbortController();
    budgetApi<Details>(`/api/invitations/${token}`, {
      signal: controller.signal,
    })
      .then(setDetails)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [token]);
  async function accept() {
    setBusy(true);
    setError("");
    try {
      const data = await budgetApi<{ organizationId: string }>(
        `/api/invitations/${token}`,
        { method: "POST" },
      );
      router.push(`/org/${data.organizationId}/dashboard`);
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  const unavailable =
    details?.status === "REVOKED" ||
    (details?.expired && details.status !== "ACCEPTED");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-5">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {details
              ? `Join ${details.organization.name}`
              : "Your team invitation"}
          </CardTitle>
          <CardDescription>
            Join your church team to request budgets and follow your approvals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {!details && !error && <p>Loading invitation…</p>}
          {details &&
            (unavailable ? (
              <p>
                This invitation has{" "}
                {details.status === "REVOKED" ? "been revoked" : "expired"}. Ask
                the organization owner to send a new one.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  This invitation is for {details.emailHint}. Sign in with that
                  address to accept it.
                </p>
                {!details.signedIn ? (
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link
                        href={`/sign-in?next=${encodeURIComponent(destination)}`}
                      >
                        Sign in to accept
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link
                        href={`/sign-up?next=${encodeURIComponent(destination)}`}
                      >
                        Create an account
                      </Link>
                    </Button>
                  </div>
                ) : !details.emailMatches ? (
                  <>
                    <p className="text-sm">
                      You are signed in with a different email address.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        signOut({
                          callbackUrl: `/sign-in?next=${encodeURIComponent(destination)}`,
                        })
                      }
                    >
                      Use the invited email
                    </Button>
                  </>
                ) : (
                  <Button onClick={accept} disabled={busy}>
                    {busy
                      ? "Joining…"
                      : details.status === "ACCEPTED"
                        ? "Open organization"
                        : "Accept invitation"}
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  As a member, you can view your own budget requests and
                  personal settings. Approval access is only granted when the
                  owner assigns you.
                </p>
              </>
            ))}
        </CardContent>
      </Card>
    </main>
  );
}
