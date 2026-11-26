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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { budgetApi } from "@/lib/budget-requests/client";
import { toast } from "sonner";
type Profile = {
  name: string;
  email: string;
  username: string;
  phone: string | null;
  bio: string | null;
};
export default function PersonalSettings({ embedded = false }: { embedded?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    budgetApi<Profile>("/api/profile", { signal: controller.signal })
      .then(setProfile)
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      setProfile(
        await budgetApi<Profile>("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone ?? "",
            bio: profile.bio ?? "",
          }),
        }),
      );
      toast.success("Personal settings saved");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className={embedded ? "space-y-6" : "space-y-6 p-3 sm:p-6"}>
      {!embedded && <div>
        <h1 className="text-3xl font-bold">Personal settings</h1>
        <p className="mt-2 text-muted-foreground">Update your own profile.</p>
      </div>}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>
            These settings do not change your organization role or approval
            permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {!profile ? (
            <p>Loading profile…</p>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={profile.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={profile.phone ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-bio">About you</Label>
                <Textarea
                  id="profile-bio"
                  value={profile.bio ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, bio: event.target.value })
                  }
                  maxLength={1000}
                />
              </div>
              <Button disabled={saving}>
                {saving ? "Saving…" : "Save personal settings"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
