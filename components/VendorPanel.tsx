"use client";

import { useState } from "react";
import { vendorCategoriesFor } from "@/lib/vendorChecklist";
import type { EventBrief } from "@/lib/types";
import type { VendorBriefResponse } from "@/lib/llmService";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const EMPTY_CHECKED_MAP: Record<string, boolean> = {};

interface AiState {
  loading: boolean;
  error: string | null;
  data: VendorBriefResponse | null;
}

export default function VendorPanel({ brief }: { brief: EventBrief }) {
  const categories = vendorCategoriesFor(brief.eventType);
  const storageKey = `utsavai.vendorChecklist.${brief.eventType}`;
  const [checked, setChecked] = useLocalStorageState<Record<string, boolean>>(
    storageKey,
    EMPTY_CHECKED_MAP
  );
  const [ai, setAi] = useState<Record<string, AiState>>({});

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function fetchAiTips(categoryId: string) {
    setAi((s) => ({ ...s, [categoryId]: { loading: true, error: null, data: null } }));
    try {
      const res = await fetch("/api/vendor-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, vendorCategoryId: categoryId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed.");
      }
      const data = (await res.json()) as VendorBriefResponse;
      setAi((s) => ({ ...s, [categoryId]: { loading: false, error: null, data } }));
    } catch (err) {
      setAi((s) => ({
        ...s,
        [categoryId]: {
          loading: false,
          error: err instanceof Error ? err.message : "Something went wrong.",
          data: null,
        },
      }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => {
        const state = ai[cat.id];
        return (
          <section
            key={cat.id}
            className="rounded-lg border border-stone-200 p-4 dark:border-stone-800"
            aria-labelledby={`vendor-${cat.id}-heading`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id={`vendor-${cat.id}-heading`} className="font-semibold">
                {cat.label}
                {cat.essential && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    essential
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => fetchAiTips(cat.id)}
                disabled={state?.loading}
                className="no-print shrink-0 rounded-full border border-amber-700 px-3 py-1 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                {state?.loading ? "Thinking…" : "✨ Get AI tips"}
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {cat.baseQuestions.map((q, i) => {
                const key = `${cat.id}:${i}`;
                return (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      id={key}
                      checked={!!checked[key]}
                      onChange={() => toggle(key)}
                      className="mt-0.5 h-4 w-4 accent-amber-700"
                    />
                    <label htmlFor={key} className={checked[key] ? "text-stone-400 line-through" : ""}>
                      {q}
                    </label>
                  </li>
                );
              })}
            </ul>

            {state?.error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {state.error}
              </p>
            )}

            {state?.data && (
              <div className="mt-3 rounded-md bg-stone-50 p-3 text-sm dark:bg-stone-900">
                <p className="mb-2 font-medium text-stone-700 dark:text-stone-300">
                  Personalized follow-ups:
                </p>
                <ul className="mb-3 flex flex-col gap-2">
                  {state.data.followUpQuestions.map((q, i) => {
                    const key = `${cat.id}:ai:${i}`;
                    return (
                      <li key={key} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={!!checked[key]}
                          onChange={() => toggle(key)}
                          className="mt-0.5 h-4 w-4 accent-amber-700"
                        />
                        <label htmlFor={key} className={checked[key] ? "text-stone-400 line-through" : ""}>
                          {q}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-stone-600 dark:text-stone-400">
                  <strong>Tip:</strong> {state.data.negotiationTip}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
