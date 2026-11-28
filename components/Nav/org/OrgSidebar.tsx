"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, MessageCircle, CalendarDays, Clock3, LockKeyhole, PanelLeftClose, PanelLeftOpen, Search, Settings, FileText, DollarSign, BarChart3, CheckCheck, Wallet, type LucideIcon } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { useOrganizationAccess } from "@/components/organizations/OrganizationAccessProvider";
import { budgetApi } from "@/lib/budget-requests/client";
import { useSidebarSize } from "../useSidebarSize";
import { cn } from "@/lib/utils";
import OrganizationAccountMenu from "./OrganizationAccountMenu";
type Recent = { path: string; title: string; isRequest: boolean };
function SidebarLink({ href, title, icon: Icon, collapsed, mobile, active }: { href: string; title: string; icon: LucideIcon; collapsed: boolean; mobile: boolean; active?: boolean }) {
  const link = <Link href={href} aria-label={title} title={collapsed ? title : undefined} aria-current={active ? "page" : undefined} className={cn("flex min-h-8 items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground", collapsed && "justify-center")}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="truncate">{title}</span>}</Link>;
  return mobile ? <SheetClose asChild>{link}</SheetClose> : link;
}
export default function OrgSidebar({ isMobile = false, orgName = "Organization" }: { isMobile?: boolean; orgName?: string }) {
  const access = useOrganizationAccess(), pathname = usePathname(), size = useSidebarSize(`c3-sidebar:${access.organizationId}:${access.userId}`);
  const collapsed = !isMobile && size.collapsed, base = `/org/${access.organizationId}`;
  const [query, setQuery] = useState(""), [recents, setRecents] = useState<Recent[]>([]), [error, setError] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setRecents([]);
    budgetApi<Recent[]>(`/api/organizations/${access.organizationId}/recents`, { method: "POST", body: JSON.stringify({ path: pathname }), signal: controller.signal }).then(data => { setRecents(data); setError(""); }).catch(error => { if (error.name !== "AbortError") setError("Recent pages are unavailable."); });
    return () => controller.abort();
  }, [access.organizationId, pathname]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && search.current?.offsetParent) { event.preventDefault(); search.current.focus(); } };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);
  const matches = (title: string) => title.toLowerCase().includes(query.toLowerCase());
  const workspace = [{ title: "Settings", route: "/settings", icon: Settings }, ...(access.canFinance ? [{ title: "Expenses", route: "/expenses", icon: DollarSign }, { title: "Income", route: "/income", icon: FileText }, { title: "Analytics", route: "/analytics", icon: BarChart3 }] : [])];
  const privateLinks = [{ title: "Assigned approvals", route: "/budget-requests?scope=inbox", icon: CheckCheck }, { title: "Cash tracking", route: "/budget-requests?scope=payments", icon: Wallet }, ...(access.isOwner ? [{ title: "Organization settings", route: "/settings?tab=organization", icon: LockKeyhole }] : [])];
  const content = <>
    <div className="flex h-12 shrink-0 items-center gap-2 px-3">{!collapsed && <><Building2 className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="flex-1 truncate text-sm font-medium">{orgName}</span></>}{!isMobile && <button type="button" onClick={size.toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>}</div>
    {!collapsed && <div className="px-3 pb-3"><div className="flex items-center gap-2 rounded-sm border bg-background/50 px-2"><Search className="h-3.5 w-3.5 text-muted-foreground" /><input ref={search} aria-label="Search workspace navigation and recents" placeholder="Search workspace" value={query} onChange={event => setQuery(event.target.value)} className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" /><kbd className="text-[10px] text-muted-foreground">Ctrl K</kbd></div></div>}
    <nav aria-label="Organization navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-2 pb-6">
      <div className={cn("gap-1", collapsed ? "space-y-1" : "flex flex-wrap")}><SidebarLink href={`${base}/dashboard`} title="Home" icon={Home} collapsed={collapsed} mobile={isMobile} active={pathname === `${base}/dashboard`} />{access.canFinance && <SidebarLink href={`${base}/propmt`} title="Chat" icon={MessageCircle} collapsed={collapsed} mobile={isMobile} active={pathname === `${base}/propmt`} />}{!collapsed && <button disabled className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground" title="Meetings · Coming soon"><CalendarDays className="h-4 w-4" />Meetings<span className="sr-only">Coming soon</span></button>}</div>
      {!collapsed && <section aria-label="Upcoming events"><h2 className="mb-2 px-2 text-xs font-medium text-muted-foreground">Upcoming events</h2><div className="flex items-center gap-2 px-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /><span>Events</span><span className="ml-auto text-xs">Coming soon</span></div></section>}
      <section aria-label="Workspace">{!collapsed && <h2 className="mb-2 px-2 text-xs font-medium text-muted-foreground">Workspace</h2>}{workspace.filter(item => matches(item.title)).map(item => <SidebarLink key={item.route} href={base + item.route} title={item.title} icon={item.icon} collapsed={collapsed} mobile={isMobile} active={pathname === base + item.route} />)}</section>
      {!collapsed && <section aria-label="Recents"><h2 className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground"><Clock3 className="h-3 w-3" />Recents</h2>{recents.filter(item => matches(item.title)).slice(0, 12).map(item => <SidebarLink key={item.path} href={item.path} title={item.title} icon={FileText} collapsed={false} mobile={isMobile} active={pathname === item.path} />)}{!recents.length && <p className="px-2 text-xs text-muted-foreground">{error || "Pages you open will appear here."}</p>}{query && !recents.some(item => matches(item.title)) && <p className="px-2 text-xs text-muted-foreground">No matching recent pages.</p>}</section>}
      {access.canReviewBudgets && <section aria-label="Private">{!collapsed && <h2 className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground"><LockKeyhole className="h-3 w-3" />Private</h2>}{privateLinks.filter(item => matches(item.title)).map(item => <SidebarLink key={item.route} href={base + item.route} title={item.title} icon={item.icon} collapsed={collapsed} mobile={isMobile} />)}</section>}
    </nav>
    <div className="shrink-0 border-t p-2"><OrganizationAccountMenu compact={collapsed} accountName={access.name} /></div>
  </>;
  if (isMobile) return <div className="flex h-full min-h-0 flex-col bg-muted/20">{content}</div>;
  return <aside aria-label="Workspace sidebar" className="sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-muted/20 lg:flex" style={{ width: collapsed ? 56 : size.width, maxWidth: "45vw" }}>{content}{!collapsed && <div role="separator" aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={220} aria-valuemax={size.maximum} aria-valuenow={size.width} tabIndex={0} className="absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize touch-none hover:bg-primary/15 focus-visible:bg-primary/20 focus-visible:outline-none" {...size.handle} />}</aside>;
}
