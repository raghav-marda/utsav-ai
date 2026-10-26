import type { EventType, TimelinePlan, TimelineTask } from "./types";

// ---------------------------------------------------------------------------
// Deterministic timeline templates. A countdown plan is a scheduling problem
// (today + N days before the event), not a language problem, so it is pure
// data + date arithmetic — no LLM call, no latency, no hallucinated dates.
// ---------------------------------------------------------------------------

interface TaskTemplate {
  title: string;
  daysBefore: number;
  category: string;
}

const WEDDING_TASKS: TaskTemplate[] = [
  { title: "Finalize guest list & budget", daysBefore: 120, category: "Planning" },
  { title: "Book venue(s)", daysBefore: 110, category: "Venue" },
  { title: "Shortlist & book caterer", daysBefore: 100, category: "Catering" },
  { title: "Book photographer & videographer", daysBefore: 90, category: "Photography" },
  { title: "Book decorator", daysBefore: 85, category: "Decor" },
  { title: "Finalize outfits & jewellery orders", daysBefore: 75, category: "Attire" },
  { title: "Send save-the-dates", daysBefore: 60, category: "Invitations" },
  { title: "Book entertainment / DJ / band", daysBefore: 55, category: "Entertainment" },
  { title: "Finalize menu tasting", daysBefore: 45, category: "Catering" },
  { title: "Send formal invitations", daysBefore: 30, category: "Invitations" },
  { title: "Confirm transport & accommodation for guests", daysBefore: 21, category: "Logistics" },
  { title: "Final headcount to caterer & venue", daysBefore: 10, category: "Catering" },
  { title: "Beauty trials (mehendi, makeup)", daysBefore: 7, category: "Attire" },
  { title: "Pack emergency kit & confirm vendor timings", daysBefore: 2, category: "Logistics" },
  { title: "Vendor payments & final walkthrough", daysBefore: 1, category: "Planning" },
];

const BIRTHDAY_TASKS: TaskTemplate[] = [
  { title: "Pick theme & finalize guest list", daysBefore: 30, category: "Planning" },
  { title: "Book venue or confirm home setup", daysBefore: 25, category: "Venue" },
  { title: "Send invitations", daysBefore: 21, category: "Invitations" },
  { title: "Book cake & confirm flavour", daysBefore: 14, category: "Cake" },
  { title: "Book entertainment (magician, games, DJ)", daysBefore: 14, category: "Entertainment" },
  { title: "Order decor & balloons", daysBefore: 10, category: "Decor" },
  { title: "Confirm catering / snacks menu", daysBefore: 7, category: "Catering" },
  { title: "Buy return gifts", daysBefore: 7, category: "Gifts" },
  { title: "Confirm final headcount", daysBefore: 3, category: "Planning" },
  { title: "Pick up cake & decor; set up venue", daysBefore: 1, category: "Logistics" },
];

const COMMUNITY_TASKS: TaskTemplate[] = [
  { title: "Define event goal, date & budget", daysBefore: 45, category: "Planning" },
  { title: "Get venue booking & local permissions", daysBefore: 35, category: "Venue" },
  { title: "Recruit volunteers & assign roles", daysBefore: 30, category: "Volunteers" },
  { title: "Book sound system & stage setup", daysBefore: 21, category: "Entertainment" },
  { title: "Launch promotion (flyers, WhatsApp groups, social posts)", daysBefore: 21, category: "Promotion" },
  { title: "Confirm catering / refreshments vendor", daysBefore: 14, category: "Catering" },
  { title: "Arrange decor & signage", daysBefore: 10, category: "Decor" },
  { title: "Finalize prize/giveaway procurement", daysBefore: 7, category: "Prizes" },
  { title: "Volunteer briefing & dry run", daysBefore: 2, category: "Volunteers" },
  { title: "Venue setup & final checks", daysBefore: 1, category: "Logistics" },
];

function templateFor(eventType: EventType): TaskTemplate[] {
  switch (eventType) {
    case "wedding":
      return WEDDING_TASKS;
    case "birthday":
      return BIRTHDAY_TASKS;
    case "community":
      return COMMUNITY_TASKS;
  }
}

/**
 * Builds the timeline, dropping any task whose ideal due-date has already
 * passed given the days remaining — and instead compresses it into an
 * "ASAP" bucket (daysBefore = -1 marks "overdue, do immediately") so a
 * last-minute planner still gets a usable, honest plan rather than a
 * template that silently assumes 4 months of runway.
 */
export function generateTimeline(eventType: EventType, eventDateIso: string): TimelinePlan {
  const template = templateFor(eventType);
  const eventDate = new Date(eventDateIso);
  const today = new Date();
  const daysRemaining = Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const tasks: TimelineTask[] = template.map((t, i) => {
    const effectiveDaysBefore = t.daysBefore > daysRemaining ? -1 : t.daysBefore;
    return {
      id: `task_${i}`,
      title: t.title,
      daysBefore: effectiveDaysBefore,
      category: t.category,
      done: false,
    };
  });

  // Keep chronological order: "do now" tasks (-1) first, then by daysBefore descending.
  tasks.sort((a, b) => {
    if (a.daysBefore === -1 && b.daysBefore === -1) return 0;
    if (a.daysBefore === -1) return -1;
    if (b.daysBefore === -1) return 1;
    return b.daysBefore - a.daysBefore;
  });

  return { eventDate: eventDateIso, tasks };
}

export function dueDateFor(task: TimelineTask, eventDateIso: string): Date | null {
  if (task.daysBefore < 0) return null; // overdue / do-now bucket
  const eventDate = new Date(eventDateIso);
  eventDate.setDate(eventDate.getDate() - task.daysBefore);
  return eventDate;
}
