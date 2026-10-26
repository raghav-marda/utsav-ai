"use client";

import { useState } from "react";
import type { EventBrief } from "@/lib/types";
import type { IdeaResponse } from "@/lib/llmService";

const IMPACT_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
};

export default function IdeasPanel({ brief }: { brief: EventBrief }) {
  const [focusArea, setFocusArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IdeaResponse | null>(null);

  async function fetchIdeas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, focusArea: focusArea || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed.");
      }
      const json = await res.json();
      setData(json.ideas as IdeaResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="focus-area" className="sr-only">
          Optional focus area for ideas
        </label>
        <input
          id="focus-area"
          type="text"
          value={focusArea}
          onChange={(e) => setFocusArea(e.target.value)}
          placeholder="Optional: focus on decor, food, entertainment…"
          maxLength={80}
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="button"
          onClick={fetchIdeas}
          disabled={loading}
          className="rounded-full bg-amber-700 px-5 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {loading ? "Generating…" : data ? "Regenerate ideas" : "✨ Generate personalized ideas"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">{data.theme}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">{data.summary}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {data.ideas.map((idea, i) => (
              <li key={i} className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{idea.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_COLOR[idea.estimatedCostImpact]}`}
                  >
                    {idea.estimatedCostImpact} cost
                  </span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400">{idea.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!data && !loading && !error && (
        <p className="text-sm text-stone-500">
          Click &ldquo;Generate personalized ideas&rdquo; for a theme and concrete suggestions
          tailored to your event type, guest count, budget and preferences.
        </p>
      )}
    </div>
  );
}
