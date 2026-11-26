"use client";
import { useCallback, useEffect, useState } from "react";
import { budgetApi } from "@/lib/budget-requests/client";
export function useBudgetActivity<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try { const result = await budgetApi<T>(endpoint, { signal }); if (!signal?.aborted) { setData(result); setError(""); } }
    catch (error) { if ((error as Error).name !== "AbortError") setError((error as Error).message); }
  }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController(); setData(null);
    const update = () => { void refresh(controller.signal); };
    update(); const interval = window.setInterval(update, 30000);
    window.addEventListener("focus", update); window.addEventListener("budget-activity", update);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", update); window.removeEventListener("budget-activity", update); };
  }, [refresh]);
  return { data, error, refresh };
}
