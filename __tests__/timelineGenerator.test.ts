import { describe, expect, it } from "vitest";
import { dueDateFor, generateTimeline } from "../lib/timelineGenerator";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe("generateTimeline", () => {
  it("returns a non-empty, ordered task list for every event type", () => {
    for (const eventType of ["wedding", "birthday", "community"] as const) {
      const plan = generateTimeline(eventType, isoDaysFromNow(180));
      expect(plan.tasks.length).toBeGreaterThan(0);
      for (let i = 1; i < plan.tasks.length; i++) {
        const prev = plan.tasks[i - 1];
        const curr = plan.tasks[i];
        if (prev.daysBefore !== -1 && curr.daysBefore !== -1) {
          expect(prev.daysBefore).toBeGreaterThanOrEqual(curr.daysBefore);
        }
      }
    }
  });

  it("compresses tasks into the do-now bucket when the event is very close", () => {
    const plan = generateTimeline("wedding", isoDaysFromNow(3));
    const overdue = plan.tasks.filter((t) => t.daysBefore === -1);
    // With only 3 days left, every task whose ideal lead time exceeds 3
    // days (which is nearly all of them for a wedding) should be bucketed.
    expect(overdue.length).toBeGreaterThan(plan.tasks.length / 2);
  });

  it("does not bucket tasks when there is ample time", () => {
    const plan = generateTimeline("birthday", isoDaysFromNow(60));
    const overdue = plan.tasks.filter((t) => t.daysBefore === -1);
    expect(overdue.length).toBe(0);
  });

  it("marks every task as not done by default", () => {
    const plan = generateTimeline("community", isoDaysFromNow(60));
    expect(plan.tasks.every((t) => t.done === false)).toBe(true);
  });
});

describe("dueDateFor", () => {
  it("returns null for do-now (overdue) tasks", () => {
    const task = { id: "x", title: "x", daysBefore: -1, category: "x", done: false };
    expect(dueDateFor(task, isoDaysFromNow(5))).toBeNull();
  });

  it("subtracts daysBefore from the event date correctly", () => {
    const eventIso = "2026-12-25T00:00:00.000Z";
    const task = { id: "x", title: "x", daysBefore: 10, category: "x", done: false };
    const due = dueDateFor(task, eventIso);
    expect(due).not.toBeNull();
    expect(due!.getUTCDate()).toBe(15);
    expect(due!.getUTCMonth()).toBe(11); // December
  });
});
