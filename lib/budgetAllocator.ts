import type {
  BudgetCategory,
  BudgetPlan,
  BudgetStyle,
  CityTier,
  EventBrief,
  EventType,
} from "./types";

// ---------------------------------------------------------------------------
// Deterministic budget allocation engine.
//
// Why rule-based instead of asking the LLM to "split the budget"? Money math
// must be reproducible, auditable and always sum to exactly 100% — an LLM
// will happily hallucinate a split that sums to 97% or invents a category
// that doesn't exist. So allocation percentages live here as data, the LLM
// is never asked to do arithmetic, and the UI/LLM layer only explains or
// personalizes numbers this engine already computed. This mirrors the same
// "LLM for language, code for judgments" split used across the app.
// ---------------------------------------------------------------------------

interface CategoryTemplate {
  id: string;
  label: string;
  basePercent: number;
}

const WEDDING_TEMPLATE: CategoryTemplate[] = [
  { id: "venue_catering", label: "Venue & Catering", basePercent: 36 },
  { id: "decor_styling", label: "Decor & Styling", basePercent: 12 },
  { id: "photo_video", label: "Photography & Videography", basePercent: 10 },
  { id: "attire_beauty", label: "Attire, Jewellery & Beauty", basePercent: 10 },
  { id: "entertainment", label: "Entertainment & Music", basePercent: 6 },
  { id: "invitations", label: "Invitations & Stationery", basePercent: 3 },
  { id: "transport_logistics", label: "Transport & Logistics", basePercent: 4 },
  { id: "gifts_favours", label: "Gifts & Favours", basePercent: 3 },
  { id: "planning_coordination", label: "Planner & Coordination", basePercent: 4 },
  { id: "contingency", label: "Contingency Buffer", basePercent: 12 },
];

const BIRTHDAY_TEMPLATE: CategoryTemplate[] = [
  { id: "venue_catering", label: "Venue & Catering", basePercent: 34 },
  { id: "decor_theming", label: "Decor & Theming", basePercent: 15 },
  { id: "entertainment_activities", label: "Entertainment & Activities", basePercent: 12 },
  { id: "cake_desserts", label: "Cake & Desserts", basePercent: 8 },
  { id: "photo_video", label: "Photography", basePercent: 7 },
  { id: "invitations_return_gifts", label: "Invitations & Return Gifts", basePercent: 10 },
  { id: "misc", label: "Miscellaneous", basePercent: 4 },
  { id: "contingency", label: "Contingency Buffer", basePercent: 10 },
];

const COMMUNITY_TEMPLATE: CategoryTemplate[] = [
  { id: "venue_permissions", label: "Venue & Permissions", basePercent: 18 },
  { id: "catering_refreshments", label: "Catering / Refreshments", basePercent: 24 },
  { id: "decor_stage", label: "Decor & Stage Setup", basePercent: 12 },
  { id: "sound_entertainment", label: "Sound & Entertainment", basePercent: 14 },
  { id: "promotion_invites", label: "Promotion & Invitations", basePercent: 5 },
  { id: "volunteer_logistics", label: "Volunteer & Logistics", basePercent: 8 },
  { id: "prizes_giveaways", label: "Prizes & Giveaways", basePercent: 6 },
  { id: "contingency", label: "Contingency Buffer", basePercent: 13 },
];

function templateFor(eventType: EventType): CategoryTemplate[] {
  switch (eventType) {
    case "wedding":
      return WEDDING_TEMPLATE;
    case "birthday":
      return BIRTHDAY_TEMPLATE;
    case "community":
      return COMMUNITY_TEMPLATE;
  }
}

// Style nudges shift weight between "experience" categories (decor,
// entertainment, photo) and the contingency buffer. Lean plans keep more
// buffer and spend less on flourishes; lavish plans do the opposite.
const STYLE_DELTA: Record<BudgetStyle, Record<string, number>> = {
  lean: { contingency: 5, decor_styling: -2, decor_theming: -2, decor_stage: -2, entertainment: -1, entertainment_activities: -1, sound_entertainment: -2 },
  balanced: {},
  lavish: { contingency: -4, decor_styling: 2, decor_theming: 2, decor_stage: 2, photo_video: 1, entertainment: 1, entertainment_activities: 1, sound_entertainment: 1 },
};

// Tier-3 cities get more buffer because vendor pricing is less standardized
// and travel/logistics costs are proportionally higher; tier-1 cities get a
// small shift toward venue/catering, which dominates metro pricing.
const TIER_DELTA: Record<CityTier, Record<string, number>> = {
  tier1: { venue_catering: 2, contingency: -2 },
  tier2: {},
  tier3: { contingency: 3, transport_logistics: 1, venue_catering: -2, venue_permissions: -2 },
};

function applyDeltas(
  templates: CategoryTemplate[],
  deltas: Record<string, number>[]
): CategoryTemplate[] {
  const byId = new Map(templates.map((t) => [t.id, { ...t }]));
  for (const deltaSet of deltas) {
    for (const [id, delta] of Object.entries(deltaSet)) {
      const entry = byId.get(id);
      if (entry) entry.basePercent += delta;
    }
  }
  // Floor every category at 1% so nothing disappears entirely, then
  // renormalize so the set always sums to exactly 100.
  const adjusted = Array.from(byId.values()).map((t) => ({
    ...t,
    basePercent: Math.max(1, t.basePercent),
  }));
  const sum = adjusted.reduce((s, t) => s + t.basePercent, 0);
  return adjusted.map((t) => ({ ...t, basePercent: (t.basePercent / sum) * 100 }));
}

function rationaleFor(
  template: CategoryTemplate,
  brief: EventBrief,
  amountInr: number
): string {
  const perGuest = brief.guestCount > 0 ? Math.round(amountInr / brief.guestCount) : amountInr;
  switch (template.id) {
    case "venue_catering":
    case "catering_refreshments":
      return `Covers venue hire and food for ~${brief.guestCount} guests (~₹${perGuest.toLocaleString(
        "en-IN"
      )}/guest) — the single largest line item for a ${brief.cityTier.replace(
        "tier",
        "Tier-"
      )} ${brief.eventType}.`;
    case "contingency":
      return `Held back for vendor overruns, weather or last-minute additions. Kept higher for a "${brief.style}" style and ${brief.cityTier.replace(
        "tier",
        "Tier-"
      )} market where vendor pricing varies more.`;
    default:
      return `Scaled for ${brief.guestCount} guests and a "${brief.style}" style ${brief.occasion || brief.eventType}.`;
  }
}

export function allocateBudget(brief: EventBrief): BudgetPlan {
  const base = templateFor(brief.eventType);
  const adjusted = applyDeltas(base, [STYLE_DELTA[brief.style], TIER_DELTA[brief.cityTier]]);

  let allocatedInr = 0;
  const categories: BudgetCategory[] = adjusted.map((t, i) => {
    // Round every category except the last to the nearest ₹100; give the
    // last category whatever remains so the total matches exactly.
    const isLast = i === adjusted.length - 1;
    const raw = (t.basePercent / 100) * brief.budgetInr;
    const amountInr = isLast
      ? brief.budgetInr - allocatedInr
      : Math.round(raw / 100) * 100;
    allocatedInr += amountInr;
    return {
      id: t.id,
      label: t.label,
      percent: Math.round((amountInr / brief.budgetInr) * 1000) / 10,
      amountInr,
      rationale: rationaleFor(t, brief, amountInr),
    };
  });

  const contingency = categories.find((c) => c.id === "contingency");

  return {
    totalInr: brief.budgetInr,
    categories,
    allocatedInr,
    contingencyInr: contingency?.amountInr ?? 0,
  };
}

/** Per-guest catering cost benchmarks (₹, plate rate) used for the feasibility check below. */
const PER_GUEST_BENCHMARK: Record<CityTier, Record<EventType, [number, number]>> = {
  tier1: { wedding: [900, 3000], birthday: [400, 1200], community: [150, 500] },
  tier2: { wedding: [600, 2000], birthday: [300, 900], community: [100, 350] },
  tier3: { wedding: [400, 1400], birthday: [200, 600], community: [70, 250] },
};

export interface FeasibilityResult {
  feasible: boolean;
  perGuestCateringInr: number;
  benchmarkRange: [number, number];
  message: string;
}

/**
 * Deterministic sanity check: does the catering/venue allocation support a
 * realistic per-guest spend for this city tier and event type? This is the
 * kind of objective, auditable judgment that should never be left to an
 * LLM's "vibes" — it's a lookup against a fixed benchmark table.
 */
export function checkFeasibility(brief: EventBrief, plan: BudgetPlan): FeasibilityResult {
  const cateringCategory = plan.categories.find((c) =>
    ["venue_catering", "catering_refreshments"].includes(c.id)
  );
  const cateringInr = cateringCategory?.amountInr ?? 0;
  const perGuest = brief.guestCount > 0 ? cateringInr / brief.guestCount : 0;
  const [low, high] = PER_GUEST_BENCHMARK[brief.cityTier][brief.eventType];

  if (perGuest < low) {
    return {
      feasible: false,
      perGuestCateringInr: Math.round(perGuest),
      benchmarkRange: [low, high],
      message: `Your budget gives ~₹${Math.round(perGuest).toLocaleString(
        "en-IN"
      )}/guest for venue & catering, below the typical ₹${low}–₹${high} range for a ${brief.cityTier.replace(
        "tier",
        "Tier-"
      )} ${brief.eventType}. Consider trimming the guest list, raising the budget, or choosing a lower-cost venue format.`,
    };
  }
  if (perGuest > high * 1.5) {
    return {
      feasible: true,
      perGuestCateringInr: Math.round(perGuest),
      benchmarkRange: [low, high],
      message: `Your per-guest spend (~₹${Math.round(perGuest).toLocaleString(
        "en-IN"
      )}) is well above the typical range — plenty of room for a premium experience.`,
    };
  }
  return {
    feasible: true,
    perGuestCateringInr: Math.round(perGuest),
    benchmarkRange: [low, high],
    message: `Per-guest venue & catering spend (~₹${Math.round(perGuest).toLocaleString(
      "en-IN"
    )}) is within the typical ₹${low}–₹${high} range for this event type and city tier.`,
  };
}
