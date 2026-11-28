"use client";
import { useState } from "react";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { budgetApi } from "@/lib/budget-requests/client";
export type ReleaseCard = { id: string; date: string; title: string; description: string; detail: string };
export type ReleaseFeed = { cards: ReleaseCard[]; read: string[] };
export default function ReleaseCards({ feed, endpoint, onRead }: { feed: ReleaseFeed; endpoint: string; onRead: (id: string) => void }) {
  const [selection, setSelection] = useState<string | null>(null), [review, setReview] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const unread = feed.cards.filter(card => !feed.read.includes(card.id));
  const card = feed.cards.find(card => card.id === selection) ?? (review ? feed.cards[0] : unread[0]);
  if (!card) return <div className="flex flex-col items-center gap-4 px-6 py-16 text-center"><Check className="h-8 w-8 text-muted-foreground" /><h3 className="text-xl font-semibold">You’re up to date</h3><p className="text-sm text-muted-foreground">Future organization improvements will appear here.</p><Button variant="outline" onClick={() => { setReview(true); setSelection(feed.cards[0]?.id ?? null); }}>Review updates</Button></div>;
  const index = feed.cards.findIndex(item => item.id === card.id);
  async function next() {
    setBusy(true); setError("");
    try {
      await budgetApi(endpoint, { method: "POST", body: JSON.stringify({ updateId: card!.id }) });
      onRead(card!.id);
      const following = review ? feed.cards[index + 1] : feed.cards.find(item => item.id !== card!.id && !feed.read.includes(item.id));
      setSelection(following?.id ?? null); if (!following) setReview(false);
    } catch { setError("Could not save your progress. Try again."); } finally { setBusy(false); }
  }
  return <article className="space-y-6 p-6" aria-live="polite">
    <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Organization update</span><span>{index + 1} of {feed.cards.length}</span></div>
    <div className="flex gap-1" aria-label={`Update ${index + 1} of ${feed.cards.length}`}>{feed.cards.map((item, position) => <span key={item.id} className={`h-1 flex-1 ${position <= index ? "bg-primary" : "bg-muted"}`} />)}</div>
    <p className="text-xs text-muted-foreground">{new Date(card.date + "T12:00:00Z").toLocaleDateString()}</p>
    <h3 className="text-2xl font-semibold tracking-tight">{card.title}</h3>
    <p className="text-sm leading-6">{card.description}</p><p className="bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">{card.detail}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center justify-between gap-3"><Button variant="ghost" disabled={busy || index === 0} onClick={() => setSelection(feed.cards[index - 1].id)}>Previous</Button><Button disabled={busy} onClick={() => void next()}>{busy ? "Saving…" : index === feed.cards.length - 1 ? "Got it" : "Next update"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    <p className="text-xs text-muted-foreground">Progress is saved for your membership in this organization.</p>
  </article>;
}
