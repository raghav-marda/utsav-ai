import { describe, expect, it } from "vitest";
import { EventBriefSchema, IdeaRequestSchema, VendorBriefRequestSchema } from "../lib/validation";

const VALID_BRIEF = {
  eventType: "wedding",
  occasion: "Reception",
  guestCount: 200,
  budgetInr: 1_000_000,
  cityTier: "tier2",
  eventDate: "2026-12-01",
  style: "balanced",
  preferences: "outdoor venue",
};

describe("EventBriefSchema", () => {
  it("accepts a well-formed brief", () => {
    expect(EventBriefSchema.safeParse(VALID_BRIEF).success).toBe(true);
  });

  it("rejects an invalid eventType", () => {
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, eventType: "anniversary" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric guestCount string that cannot coerce", () => {
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, guestCount: "many" });
    expect(result.success).toBe(false);
  });

  it("rejects a guestCount of 0", () => {
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, guestCount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a budget below the minimum", () => {
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, budgetInr: 500 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date string", () => {
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, eventDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("truncates preferences longer than the cap via refinement failure", () => {
    const tooLong = "x".repeat(10_000);
    const result = EventBriefSchema.safeParse({ ...VALID_BRIEF, preferences: tooLong });
    expect(result.success).toBe(false);
  });

  it("defaults preferences to an empty string when omitted", () => {
    const { preferences, ...rest } = VALID_BRIEF;
    void preferences;
    const result = EventBriefSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.preferences).toBe("");
  });
});

describe("IdeaRequestSchema", () => {
  it("accepts a brief with no focusArea", () => {
    expect(IdeaRequestSchema.safeParse({ brief: VALID_BRIEF }).success).toBe(true);
  });

  it("accepts a brief with a focusArea", () => {
    expect(
      IdeaRequestSchema.safeParse({ brief: VALID_BRIEF, focusArea: "decor" }).success
    ).toBe(true);
  });

  it("rejects a missing brief", () => {
    expect(IdeaRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("VendorBriefRequestSchema", () => {
  it("accepts a valid vendor category request", () => {
    expect(
      VendorBriefRequestSchema.safeParse({ brief: VALID_BRIEF, vendorCategoryId: "venue" })
        .success
    ).toBe(true);
  });

  it("rejects a missing vendorCategoryId", () => {
    expect(VendorBriefRequestSchema.safeParse({ brief: VALID_BRIEF }).success).toBe(false);
  });
});
