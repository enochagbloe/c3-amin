"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useSidebarSize(key: string) {
  const [width, setWidth] = useState(280), [collapsed, setCollapsed] = useState(false), [maximum, setMaximum] = useState(620);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const clamp = useCallback((value: number) => Math.max(220, Math.min(value, Math.floor(window.innerWidth * 0.45))), []);
  const save = useCallback((nextWidth: number, nextCollapsed: boolean) => { try { localStorage.setItem(key, JSON.stringify({ width: nextWidth, collapsed: nextCollapsed })); } catch {} }, [key]);
  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem(key) ?? "null"); if (stored && Number.isFinite(stored.width)) { setWidth(clamp(stored.width)); setCollapsed(stored.collapsed === true); } } catch {}
    const resize = () => { setMaximum(Math.floor(window.innerWidth * 0.45)); setWidth(current => clamp(current)); };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, [key, clamp]);
  const toggle = () => { setCollapsed(!collapsed); save(width, !collapsed); };
  return { width, collapsed, toggle, maximum,
    handle: {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => { if (event.button !== 0) return; event.preventDefault(); drag.current = { x: event.clientX, width }; event.currentTarget.setPointerCapture(event.pointerId); },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => { if (drag.current) setWidth(clamp(drag.current.width + event.clientX - drag.current.x)); },
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => { if (!drag.current) return; const next = clamp(drag.current.width + event.clientX - drag.current.x); drag.current = null; setWidth(next); save(next, false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); },
      onPointerCancel: () => { drag.current = null; },
      onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = clamp(event.key === "Home" ? 220 : event.key === "End" ? maximum : width + (event.key === "ArrowLeft" ? -20 : 20)); setWidth(next); save(next, false); },
    },
  };
}
