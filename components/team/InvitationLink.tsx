"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function InvitationLink({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage("Link copied. Share it with the invited member."); }
    catch { setMessage("Select the link above and copy it manually."); }
  }
  return <div className="space-y-2 border-l-2 pl-4">
    <p className="text-sm font-medium">Invitation link</p>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input aria-label="Invitation link" value={url} readOnly onFocus={event => event.target.select()} />
      <Button type="button" variant="outline" onClick={copy}>Copy link</Button>
    </div>
    <p className="text-sm text-muted-foreground">Save this link now. It is only shown when generated.</p>
    <p role="status" className="text-sm">{message}</p>
  </div>;
}
