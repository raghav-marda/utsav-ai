"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

// A `useSyncExternalStore`-backed hook for state persisted to localStorage.
//
// Why not `useState` + `useEffect(() => setState(load()), [])`? That pattern
// renders once with the fallback, then immediately re-renders with the real
// value — an extra render pass, and exactly the "setState synchronously in
// an effect" anti-pattern the React team's own lint rule
// (react-hooks/set-state-in-effect) flags. useSyncExternalStore is the
// purpose-built primitive for subscribing to state that lives outside React
// (here: the browser's localStorage, which can also change in another tab),
// and it correctly returns the fallback during SSR/first paint without an
// extra effect-driven render.

type Listener = () => void;
const tabListeners = new Map<string, Set<Listener>>();

function notifyLocal(key: string) {
  tabListeners.get(key)?.forEach((l) => l());
}

export function useLocalStorageState<T>(
  key: string,
  fallback: T
): [T, (next: T | ((prev: T) => T)) => void] {
  // Captured once: callers may pass a fresh object/array literal as
  // `fallback` on every render, but the fallback value itself is not
  // expected to change across the component's lifetime.
  const fallbackRef = useRef(fallback);

  // useSyncExternalStore requires getSnapshot to return the SAME reference
  // until the underlying data changes. JSON.parse returns a fresh object on
  // every call, so we cache the parsed value keyed by the raw string.
  const cacheRef = useRef<{ key: string; raw: string | null; parsed: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    if (typeof window === "undefined") return fallbackRef.current;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallbackRef.current;
    }
    const cached = cacheRef.current;
    if (cached && cached.key === key && cached.raw === raw) return cached.parsed;

    let parsed: T = fallbackRef.current;
    if (raw !== null) {
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        parsed = fallbackRef.current;
      }
    }
    cacheRef.current = { key, raw, parsed };
    return parsed;
  }, [key]);

  const getServerSnapshot = useCallback((): T => fallbackRef.current, []);

  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      if (!tabListeners.has(key)) tabListeners.set(key, new Set());
      tabListeners.get(key)!.add(onStoreChange);

      const handleStorageEvent = (e: StorageEvent) => {
        if (e.key === key) onStoreChange();
      };
      window.addEventListener("storage", handleStorageEvent);

      return () => {
        tabListeners.get(key)?.delete(onStoreChange);
        window.removeEventListener("storage", handleStorageEvent);
      };
    },
    [key]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Quota exceeded or storage disabled — the in-memory listeners
        // still fire below so the UI stays responsive within this tab,
        // it just won't persist across reloads.
      }
      notifyLocal(key);
    },
    [key, getSnapshot]
  );

  return [value, setValue];
}
