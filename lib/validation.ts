import { z } from "zod";

// Every value that crosses the client→server boundary is validated here
// before it touches budget logic, timeline logic, or an LLM prompt. This is
// the single choke point: API routes never trust `await req.json()` output
// directly.

export const EventBriefSchema = z.object({
  eventType: z.enum(["wedding", "birthday", "community"]),
  occasion: z.string().trim().max(120).default(""),
  guestCount: z.coerce.number().int().min(1).max(100_000),
  budgetInr: z.coerce.number().int().min(1_000).max(1_000_000_000),
  cityTier: z.enum(["tier1", "tier2", "tier3"]),
  eventDate: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
  style: z.enum(["lean", "balanced", "lavish"]),
  // Free text — this is the one field that ends up near an LLM prompt, so it
  // gets a hard length cap here in addition to the truncation applied again
  // in llmService.ts (defense in depth).
  preferences: z.string().trim().max(800).default(""),
});

export const IdeaRequestSchema = z.object({
  brief: EventBriefSchema,
  focusArea: z.string().trim().max(80).optional(),
});

export const VendorBriefRequestSchema = z.object({
  brief: EventBriefSchema,
  vendorCategoryId: z.string().trim().max(80),
});
