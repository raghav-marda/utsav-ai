import { describe, expect, it } from "vitest";
import { allocateBudget, checkFeasibility } from "../lib/budgetAllocator";
import type { EventBrief } from "../lib/types";

function makeBrief(overrides: Partial<EventBrief> = {}): EventBrief {
  return {
    eventType: "wedding",
    occasion: "Reception",
    guestCount: 300,
    budgetInr: 1_500_000,
    cityTier: "tier2",
    eventDate: "2026-12-01",
    style: "balanced",
    preferences: "",
    ...overrides,
  };
}

describe("allocateBudget", () => {
  it("always allocates exactly the total budget, no drift", () => {
    for (const eventType of ["wedding", "birthday", "community"] as const) {
      for (const budget of [50_000, 150_000, 1_234_567, 10_000_000]) {
        const plan = allocateBudget(makeBrief({ eventType, budgetInr: budget }));
        expect(plan.allocatedInr).toBe(budget);
        const sum = plan.categories.reduce((s, c) => s + c.amountInr, 0);
        expect(sum).toBe(budget);
      }
    }
  });

  it("produces every category with a non-negative amount", () => {
    const plan = allocateBudget(makeBrief());
    for (const c of plan.categories) {
      expect(c.amountInr).toBeGreaterThanOrEqual(0);
      expect(c.percent).toBeGreaterThanOrEqual(0);
    }
  });

  it("gives a lean style a larger contingency than a lavish style", () => {
    const lean = allocateBudget(makeBrief({ style: "lean" }));
    const lavish = allocateBudget(makeBrief({ style: "lavish" }));
    const leanContingency = lean.categories.find((c) => c.id === "contingency")!;
    const lavishContingency = lavish.categories.find((c) => c.id === "contingency")!;
    expect(leanContingency.amountInr).toBeGreaterThan(lavishContingency.amountInr);
  });

  it("produces different category sets for different event types", () => {
    const wedding = allocateBudget(makeBrief({ eventType: "wedding" }));
    const birthday = allocateBudget(makeBrief({ eventType: "birthday" }));
    const weddingIds = wedding.categories.map((c) => c.id).sort();
    const birthdayIds = birthday.categories.map((c) => c.id).sort();
    expect(weddingIds).not.toEqual(birthdayIds);
  });

  it("is deterministic — same input always yields same output", () => {
    const brief = makeBrief();
    const plan1 = allocateBudget(brief);
    const plan2 = allocateBudget(brief);
    expect(plan1).toEqual(plan2);
  });

  it("handles a very small budget without producing negative or NaN amounts", () => {
    const plan = allocateBudget(makeBrief({ budgetInr: 1000, guestCount: 10 }));
    for (const c of plan.categories) {
      expect(Number.isFinite(c.amountInr)).toBe(true);
      expect(c.amountInr).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("checkFeasibility", () => {
  it("flags infeasible when per-guest catering spend is below benchmark", () => {
    const brief = makeBrief({ guestCount: 1000, budgetInr: 100_000, cityTier: "tier1" });
    const plan = allocateBudget(brief);
    const result = checkFeasibility(brief, plan);
    expect(result.feasible).toBe(false);
  });

  it("marks feasible when per-guest catering spend sits within benchmark", () => {
    const brief = makeBrief({ guestCount: 200, budgetInr: 3_000_000, cityTier: "tier2" });
    const plan = allocateBudget(brief);
    const result = checkFeasibility(brief, plan);
    expect(result.feasible).toBe(true);
  });
});
