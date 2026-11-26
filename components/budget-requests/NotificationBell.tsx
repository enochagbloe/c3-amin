"use client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { budgetApi } from "@/lib/budget-requests/client";
import { useOrganizationAccess } from "@/components/organizations/OrganizationAccessProvider";
import { useBudgetActivity } from "./useBudgetActivity";
type Notification = { id: string; requestId: string; title: string; message: string; readAt: string | null; createdAt: string };
export default function NotificationBell() {
  const { organizationId } = useOrganizationAccess(); const router = useRouter(); const [open, setOpen] = useState(false), [readError, setReadError] = useState("");
  const endpoint = `/api/organizations/${organizationId}/notifications`;
  const { data, error, refresh } = useBudgetActivity<{ items: Notification[]; unread: number }>(endpoint);
  async function markRead(item?: Notification) {
    try { await budgetApi(endpoint, { method: "PATCH", body: JSON.stringify(item ? { id: item.id } : {}) }); setReadError(""); void refresh(); }
    catch { setReadError("Could not mark notifications as read. Try again."); }
    if (item) { setOpen(false); router.push(`/org/${organizationId}/budget-requests/${item.requestId}`); }
  }
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button size="sm" variant="ghost" aria-label={`Notifications${data?.unread ? `, ${data.unread} unread` : ""}`}><Bell className="h-4 w-4" />{Boolean(data?.unread) && <span className="text-xs">{data!.unread > 99 ? "99+" : data!.unread}</span>}</Button></PopoverTrigger><PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-4">
    <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Notifications</h2><Button size="sm" variant="ghost" disabled={!data?.unread} onClick={() => void markRead()}>Mark all read</Button></div>
    {(error || readError) && <p role="alert" className="text-sm text-destructive">{error || readError}</p>}
    <ul className="max-h-96 divide-y overflow-y-auto">{data?.items.map(item => <li key={item.id}><button className="w-full space-y-1 py-3 text-left hover:bg-muted/40" onClick={() => void markRead(item)}><p className={item.readAt ? "text-sm" : "text-sm font-semibold"}>{!item.readAt && <span className="mr-2" aria-label="Unread">•</span>}{item.title}</p><p className="break-words text-sm text-muted-foreground">{item.message}</p><p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p></button></li>)}</ul>
    {data && !data.items.length && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
    {!data && !error && <p className="text-sm">Loading notifications…</p>}
  </PopoverContent></Popover>;
}
