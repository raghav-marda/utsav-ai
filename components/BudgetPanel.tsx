"use client";

import { useMemo } from "react";
import { allocateBudget, checkFeasibility } from "@/lib/budgetAllocator";
import type { EventBrief } from "@/lib/types";

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function BudgetPanel({ brief }: { brief: EventBrief }) {
  const plan = useMemo(() => allocateBudget(brief), [brief]);
  const feasibility = useMemo(() => checkFeasibility(brief, plan), [brief, plan]);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="status"
        className={`rounded-lg border p-4 text-sm ${
          feasibility.feasible
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
            : "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        }`}
      >
        <strong>{feasibility.feasible ? "Feasibility check: looks reasonable." : "Feasibility check: heads up."}</strong>{" "}
        {feasibility.message}
      </div>

      <div className="flex items-baseline justify-between border-b border-stone-200 pb-3 dark:border-stone-800">
        <span className="text-sm text-stone-500">Total budget</span>
        <span className="text-2xl font-bold">{formatInr(plan.totalInr)}</span>
      </div>

      <ul className="flex flex-col gap-4" aria-label="Budget breakdown by category">
        {plan.categories.map((c) => (
          <li key={c.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{c.label}</span>
              <span className="whitespace-nowrap text-sm text-stone-600 dark:text-stone-400">
                {formatInr(c.amountInr)} · {c.percent.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
              role="progressbar"
              aria-valuenow={Math.round(c.percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${c.label}: ${c.percent.toFixed(1)}% of budget`}
            >
              <div
                className="h-full rounded-full bg-amber-700"
                style={{ width: `${Math.min(100, c.percent)}%` }}
              />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">{c.rationale}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-stone-400">
        Allocated: {formatInr(plan.allocatedInr)} of {formatInr(plan.totalInr)} — budget math is
        computed deterministically, not by the AI, so it always adds up exactly.
      </p>
    </div>
  );
}
