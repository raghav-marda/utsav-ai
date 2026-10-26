import type { EventType, VendorCategory } from "./types";

// Base, deterministic question sets per vendor category. These are the
// questions every user should ask regardless of what an LLM says — the LLM
// layer (lib/llmService.ts) only ADDS personalized follow-ups on top of
// this fixed, always-present baseline, so the checklist is never empty or
// generic even if the AI call fails or is skipped.

const WEDDING_VENDORS: VendorCategory[] = [
  {
    id: "venue",
    label: "Venue",
    essential: true,
    baseQuestions: [
      "What is included in the rental (tables, chairs, parking, power backup)?",
      "Is there a cancellation / rescheduling policy?",
      "What are the noise and timing restrictions?",
      "Is outside catering/decor allowed?",
    ],
  },
  {
    id: "caterer",
    label: "Caterer",
    essential: true,
    baseQuestions: [
      "What is the per-plate rate and what's included?",
      "Can you accommodate dietary restrictions (Jain, vegan, allergies)?",
      "What is the minimum guaranteed headcount?",
      "Do you provide service staff and cleanup?",
    ],
  },
  {
    id: "photographer",
    label: "Photographer / Videographer",
    essential: true,
    baseQuestions: [
      "How many photographers/videographers will be present?",
      "What is the turnaround time for edited photos/videos?",
      "Is a pre-wedding shoot included?",
      "Who owns the raw footage/files?",
    ],
  },
  {
    id: "decorator",
    label: "Decorator",
    essential: true,
    baseQuestions: [
      "Can I see photos of 2-3 recent setups?",
      "Is setup/teardown time included in the quote?",
      "What happens if the venue has restrictions on flowers/fixtures?",
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment / DJ",
    essential: false,
    baseQuestions: [
      "What equipment do you bring vs. need from the venue?",
      "Can you take song requests in advance?",
      "What is the backup plan for equipment failure?",
    ],
  },
  {
    id: "transport",
    label: "Transport",
    essential: false,
    baseQuestions: [
      "How many vehicles are included and for how many hours?",
      "Is a driver's allowance/stay included for outstation events?",
    ],
  },
];

const BIRTHDAY_VENDORS: VendorCategory[] = [
  {
    id: "venue",
    label: "Venue",
    essential: true,
    baseQuestions: [
      "Is the venue available for the full setup + event + teardown window?",
      "Are outside decorators/caterers allowed?",
      "Is there a kids' play area or safety consideration needed?",
    ],
  },
  {
    id: "caterer",
    label: "Caterer / Snacks",
    essential: true,
    baseQuestions: [
      "What is the per-head rate for the chosen menu?",
      "Can you handle allergies (nuts, dairy)?",
    ],
  },
  {
    id: "cake",
    label: "Cake",
    essential: true,
    baseQuestions: [
      "What flavours and sizes are available for the guest count?",
      "How far in advance do you need the order confirmed?",
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment (magician, games, DJ)",
    essential: false,
    baseQuestions: [
      "How long is the act/performance?",
      "Do you bring your own equipment?",
      "Is the content age-appropriate for the group?",
    ],
  },
  {
    id: "decorator",
    label: "Decor / Balloons",
    essential: false,
    baseQuestions: [
      "Can the theme be customized?",
      "What's the setup time needed before guests arrive?",
    ],
  },
];

const COMMUNITY_VENDORS: VendorCategory[] = [
  {
    id: "venue",
    label: "Venue / Ground",
    essential: true,
    baseQuestions: [
      "What permissions or NOCs are required from local authorities?",
      "Is there a backup plan for weather (indoor space, tent)?",
      "What are the power and water access points?",
    ],
  },
  {
    id: "catering",
    label: "Catering / Refreshments",
    essential: true,
    baseQuestions: [
      "Can the vendor scale for an uncertain/approximate headcount?",
      "What's the minimum order and refund policy for no-shows?",
    ],
  },
  {
    id: "sound",
    label: "Sound & Stage",
    essential: true,
    baseQuestions: [
      "What's the backup for power/equipment failure?",
      "Is a sound permission required for the locality/time?",
    ],
  },
  {
    id: "volunteers",
    label: "Volunteer Coordination",
    essential: true,
    baseQuestions: [
      "Who is responsible for registration/crowd management?",
      "Is there a point-of-contact list with phone numbers for the day?",
    ],
  },
  {
    id: "prizes",
    label: "Prizes / Giveaways",
    essential: false,
    baseQuestions: [
      "Are prizes sponsored or purchased — who confirms delivery date?",
    ],
  },
];

export function vendorCategoriesFor(eventType: EventType): VendorCategory[] {
  switch (eventType) {
    case "wedding":
      return WEDDING_VENDORS;
    case "birthday":
      return BIRTHDAY_VENDORS;
    case "community":
      return COMMUNITY_VENDORS;
  }
}
