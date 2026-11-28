"use client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { budgetApi } from "@/lib/budget-requests/client";
import { useOrganizationAccess } from "@/components/organizations/OrganizationAccessProvider";
import { useBudgetActivity } from "./useBudgetActivity";
import ReleaseCards, { type ReleaseFeed } from "./ReleaseCards";
type Notification = { id: string; requestId: string | null; title: string; message: string; actorName: string | null; href: string | null; readAt: string | null; createdAt: string };
export default function NotificationBell() {
  const { organizationId, organizationName } = useOrganizationAccess(), router = useRouter();
  const [open, setOpen] = useState(false), [readError, setReadError] = useState(""), [unreadOnly, setUnreadOnly] = useState(false), [cursor, setCursor] = useState<string | null>(null), [acknowledged, setAcknowledged] = useState<string[]>([]);
  useEffect(() => { setAcknowledged([]); setCursor(null); setUnreadOnly(false); setOpen(false); setReadError(""); }, [organizationId]);
  const endpoint = `/api/organizations/${organizationId}/notifications`, updatesEndpoint = `/api/organizations/${organizationId}/updates`;
  const query = new URLSearchParams({ ...(unreadOnly ? { unread: "1" } : {}), ...(cursor ? { cursor } : {}) });
  const { data, error, refresh } = useBudgetActivity<{ items: Notification[]; unread: number; nextCursor: string | null }>(`${endpoint}?${query}`);
  const updates = useBudgetActivity<ReleaseFeed>(updatesEndpoint);
  const feed = updates.data ? { ...updates.data, read: [...new Set([...updates.data.read, ...acknowledged])] } : null;
  const updateCount = feed?.cards.filter(card => !feed.read.includes(card.id)).length ?? 0, total = (data?.unread ?? 0) + updateCount;
  async function markRead(item?: Notification) {
    try { await budgetApi(endpoint, { method: "PATCH", body: JSON.stringify(item ? { id: item.id } : {}) }); setReadError(""); void refresh(); }
    catch { setReadError("Could not mark notifications as read. Try again."); }
    if (item) { setOpen(false); router.push(item.href || (item.requestId ? `/org/${organizationId}/budget-requests/${item.requestId}` : `/org/${organizationId}/dashboard`)); }
  }
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button size="sm" variant="ghost" aria-label={`Notifications${total ? `, ${total} unread` : ""}`}><Bell className="h-4 w-4" />{total > 0 && <span className="text-xs">{total > 99 ? "99+" : total}</span>}</Button></SheetTrigger><SheetContent side="right" className="notification-panel flex h-svh w-full flex-col gap-0 p-0 sm:w-[30rem] sm:max-w-none">
    <SheetHeader className="shrink-0 px-6 pb-4 pt-6"><SheetTitle>Notifications</SheetTitle><SheetDescription>{organizationName} · Activity and organization updates</SheetDescription></SheetHeader>
    <Tabs defaultValue="activity" className="flex min-h-0 flex-1 flex-col gap-0"><TabsList className="mx-6 h-auto shrink-0"><TabsTrigger value="activity">Activity {data?.unread ? `(${data.unread})` : ""}</TabsTrigger><TabsTrigger value="updates">What’s new {updateCount ? `(${updateCount})` : ""}</TabsTrigger></TabsList>
      <TabsContent value="activity" className="min-h-0 overflow-y-auto px-6 py-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1"><Button size="sm" variant={unreadOnly ? "ghost" : "secondary"} aria-pressed={!unreadOnly} onClick={() => { setUnreadOnly(false); setCursor(null); }}>All</Button><Button size="sm" variant={unreadOnly ? "secondary" : "ghost"} aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setCursor(null); }}>Unread</Button></div><Button size="sm" variant="ghost" disabled={!data?.unread} onClick={() => void markRead()}>Mark all read</Button></div>
      {(error || readError) && <p role="alert" className="text-sm text-destructive">{error || readError}</p>}
      <ul className="divide-y">{data?.items.map(item => <li key={item.id}><button className="w-full space-y-2 py-4 text-left hover:bg-muted/40" onClick={() => void markRead(item)}><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted text-xs font-medium">{(item.actorName || "S").slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className={item.readAt ? "text-sm" : "text-sm font-semibold"}>{!item.readAt && <span className="mr-1" aria-label="Unread">•</span>}{item.title}</p><p className="mt-1 break-words text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">{item.actorName || "Earlier activity"}</span> · {new Date(item.createdAt).toLocaleString()}</p></div></div></button></li>)}</ul>
      {data && !data.items.length && <p className="py-12 text-center text-sm text-muted-foreground">{unreadOnly ? "No unread activity." : "No activity notifications yet."}</p>}{!data && !error && <p className="py-8 text-sm">Loading activity…</p>}
      <div className="mt-4 flex justify-between">{cursor && <Button variant="ghost" size="sm" onClick={() => setCursor(null)}>Back to latest</Button>}{data?.nextCursor && <Button variant="outline" size="sm" onClick={() => setCursor(data.nextCursor)}>Earlier activity</Button>}</div>
      <p className="mt-5 text-xs text-muted-foreground">Only activity intended for you appears here.</p></TabsContent>
      <TabsContent value="updates" className="min-h-0 overflow-y-auto">{updates.error && <p role="alert" className="p-6 text-sm text-destructive">{updates.error}</p>}{feed ? <ReleaseCards key={organizationId} feed={feed} endpoint={updatesEndpoint} onRead={id => { setAcknowledged(previous => [...previous, id]); void updates.refresh(); }} /> : !updates.error && <p className="p-6 text-sm">Loading updates…</p>}</TabsContent>
    </Tabs>
  </SheetContent></Sheet>;
}
