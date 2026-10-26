"use client";

import { useEffect } from "react";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const STORAGE_KEY = "utsavai.accessibility";

interface A11yState {
  highContrast: boolean;
  largeText: boolean;
}

const DEFAULT_A11Y_STATE: A11yState = { highContrast: false, largeText: false };

export default function AccessibilityBar() {
  const [state, setState] = useLocalStorageState<A11yState>(STORAGE_KEY, DEFAULT_A11Y_STATE);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", state.highContrast);
    document.documentElement.classList.toggle("large-text", state.largeText);
  }, [state]);

  return (
    <div
      className="no-print flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-100 px-4 py-2 text-sm dark:border-stone-800 dark:bg-stone-900"
      role="region"
      aria-label="Accessibility settings"
    >
      <span className="font-medium text-stone-600 dark:text-stone-400">Accessibility:</span>
      <button
        type="button"
        aria-pressed={state.highContrast}
        onClick={() => setState((s) => ({ ...s, highContrast: !s.highContrast }))}
        className="rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-200 aria-pressed:bg-amber-700 aria-pressed:text-white dark:border-stone-700 dark:hover:bg-stone-800"
      >
        High contrast
      </button>
      <button
        type="button"
        aria-pressed={state.largeText}
        onClick={() => setState((s) => ({ ...s, largeText: !s.largeText }))}
        className="rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-200 aria-pressed:bg-amber-700 aria-pressed:text-white dark:border-stone-700 dark:hover:bg-stone-800"
      >
        Large text
      </button>
    </div>
  );
}
