import type { EventBrief } from "./types";
import type { IdeaResponse, VendorBriefResponse } from "./llmService";

// Deterministic content used when the LLM is unavailable (no API key, free
// quota exhausted, network error, malformed output). The app degrades to
// curated, budget-aware suggestions instead of showing an error — the AI
// layer is an enhancement, never a single point of failure.

type Impact = "low" | "medium" | "high";
interface Idea {
  title: string;
  detail: string;
  estimatedCostImpact: Impact;
}

const IDEAS: Record<EventBrief["eventType"], { theme: string; ideas: Idea[] }> = {
  wedding: {
    theme: "Heritage Marigold & Brass",
    ideas: [
      { title: "Marigold-and-mogra mandap", detail: "Seasonal local flowers cost far less than imported ones and photograph beautifully; add brass diyas and urlis for warmth.", estimatedCostImpact: "medium" },
      { title: "Live regional folk act at sangeet", detail: "A local folk troupe or dhol group adds authenticity and usually costs less than a headline DJ.", estimatedCostImpact: "medium" },
      { title: "Regional thali-style menu", detail: "A focused menu of 2 live counters plus a regional thali keeps per-plate cost predictable and reduces waste.", estimatedCostImpact: "low" },
      { title: "Handwritten digital invites", detail: "Send a designed e-invite with a WhatsApp RSVP link; print physical cards only for elders and close family.", estimatedCostImpact: "low" },
      { title: "Plantable return gifts", detail: "Seed-paper cards or small potted tulsi plants are memorable, sustainable and cheap at volume.", estimatedCostImpact: "low" },
    ],
  },
  birthday: {
    theme: "Adventure Explorers Party",
    ideas: [
      { title: "Treasure-hunt activity", detail: "A clue-based hunt around the venue keeps kids busy for an hour with almost no cost.", estimatedCostImpact: "low" },
      { title: "DIY craft or cupcake station", detail: "Guests decorate their own cupcakes or craft; doubles as the return gift.", estimatedCostImpact: "low" },
      { title: "Themed backdrop and balloon arch", detail: "One strong photo corner gives more impact than scattered decor.", estimatedCostImpact: "medium" },
      { title: "Magician or puppet show", detail: "A 30-minute act is a reliable crowd-pleaser; book early for weekends.", estimatedCostImpact: "medium" },
      { title: "Custom cake plus smash cupcakes", detail: "A small custom cake for the photo moment and cupcakes for serving avoids waste.", estimatedCostImpact: "low" },
    ],
  },
  community: {
    theme: "Neighbourhood Mela",
    ideas: [
      { title: "Volunteer-run food stalls", detail: "Let residents run stalls on a small revenue share to cut catering cost and add variety.", estimatedCostImpact: "low" },
      { title: "Open-mic and talent stage", detail: "Local performers need only a sound system, keeping entertainment cost low.", estimatedCostImpact: "low" },
      { title: "Kids' zone with games", detail: "Simple traditional games and a face-painting corner keep families staying longer.", estimatedCostImpact: "low" },
      { title: "Sponsor wall", detail: "Offer nearby businesses a banner spot in exchange for prizes or funds.", estimatedCostImpact: "low" },
      { title: "Rain-plan tent", detail: "Pre-book a tent or covered backup space; weather is the biggest outdoor risk.", estimatedCostImpact: "medium" },
    ],
  },
};

export function fallbackIdeas(brief: EventBrief): IdeaResponse {
  const base = IDEAS[brief.eventType];
  const tight = brief.style === "lean";
  const ideas = tight
    ? [...base.ideas].sort((a, b) => rank(a.estimatedCostImpact) - rank(b.estimatedCostImpact))
    : base.ideas;
  return {
    theme: base.theme,
    summary: `Curated ${brief.style} ideas for ${brief.guestCount} guests on a ₹${brief.budgetInr.toLocaleString("en-IN")} budget.`,
    ideas: ideas.slice(0, 5),
  };
}

function rank(i: Impact): number {
  return i === "low" ? 0 : i === "medium" ? 1 : 2;
}

export function fallbackVendorBrief(vendorLabel: string): VendorBriefResponse {
  return {
    followUpQuestions: [
      `Can you share 2-3 recent references for ${vendorLabel.toLowerCase()} work of a similar size?`,
      "What is your payment schedule, and what is the refund policy if the date changes?",
      "Is there a written quote listing exactly what is included and excluded?",
    ],
    negotiationTip:
      "Get at least three quotes, ask for a package discount for booking early, and pay in milestones rather than upfront in full.",
  };
}
