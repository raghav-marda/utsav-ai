"use client";

import { useMemo } from "react";
import { dueDateFor, generateTimeline } from "@/lib/timelineGenerator";
import type { EventBrief } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const EMPTY_DONE_MAP: Record<string, boolean> = {};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TimelinePanel({ brief }: { brief: EventBrief }) {
  const basePlan = useMemo(
    () => generateTimeline(brief.eventType, brief.eventDate),
    [brief.eventType, brief.eventDate]
  );
  const storageKey = `utsavai.timeline.${brief.eventType}.${brief.eventDate}`;
  const [done, setDone] = useLocalStorageState<Record<string, boolean>>(
    storageKey,
    EMPTY_DONE_MAP
  );

  function toggle(id: string) {
    setDone((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = basePlan.tasks.filter((t) => done[t.id]).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-500" aria-live="polite">
        {completedCount} of {basePlan.tasks.length} tasks completed
      </p>
      <ol className="flex flex-col gap-3" aria-label="Event countdown timeline">
        {basePlan.tasks.map((task) => {
          const due = dueDateFor(task, brief.eventDate);
          const isDone = !!done[task.id];
          return (
            <li
              key={task.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                task.daysBefore === -1 && !isDone
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  : "border-stone-200 dark:border-stone-800"
              }`}
            >
              <input
                type="checkbox"
                id={task.id}
                checked={isDone}
                onChange={() => toggle(task.id)}
                className="mt-1 h-4 w-4 accent-amber-700"
              />
              <label htmlFor={task.id} className="flex flex-1 cursor-pointer flex-col">
                <span className={isDone ? "text-stone-400 line-through" : "font-medium"}>
                  {task.title}
                </span>
                <span className="text-xs text-stone-500">
                  {task.category} ·{" "}
                  {due ? `by ${formatDate(due)}` : "Do this now — little time left"}
                </span>
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
