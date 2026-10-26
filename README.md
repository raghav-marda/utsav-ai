# UtsavAI — GenAI Celebration & Event Planner

> Built for Hack2Skill PromptWars — Challenge 5: *Celebration & Event Planner*
> "Create a GenAI-powered planning assistant that helps users organize weddings,
> birthdays, and community events with budgets, timelines, vendor checklists,
> and personalized ideas."

UtsavAI is a planning co-pilot for Indian weddings, birthdays and community
events. It covers all four requested capabilities — **budgeting, timelines,
vendor checklists, and personalized ideas** — and is built around one core
engineering decision: **money and dates are computed deterministically in
code; the LLM is only ever asked to do language** (theming, phrasing,
personalized suggestions). This keeps the numbers a user is trusting with
real rupees auditable and reproducible instead of left to an LLM's "vibes",
while still giving the creative, personalized experience GenAI is good at.

**Live demo:** _add your deployed URL here before submitting_
**Repo:** `github.com/<your-username>/utsav-ai`

---

## What it does

| Capability | How it works |
|---|---|
| **Smart budget allocator** | A rules engine (`lib/budgetAllocator.ts`) allocates a user's total budget across event-specific categories (venue, catering, decor, photography, etc.), adjusted for event type, city tier, and planning style (lean/balanced/lavish). It also runs a **feasibility check**: it compares the resulting per-guest catering spend against real Indian per-plate benchmark ranges by city tier and flags when a budget is unrealistic for the guest count — a concrete, auditable judgment an LLM would otherwise hallucinate. |
| **Countdown timeline** | A template-driven scheduler (`lib/timelineGenerator.ts`) generates a day-by-day task list (e.g. "book venue — 110 days before" for a wedding) and gracefully compresses into a "do this now" bucket when the event is close, so a last-minute planner still gets a usable plan instead of a timeline that assumes months of runway. Progress is checkable and persists in the browser. |
| **Vendor checklists** | Every vendor category (venue, caterer, photographer, decorator, etc.) ships with a fixed baseline of questions every user should ask — so the checklist is never empty, generic, or dependent on an API call succeeding. An optional **"✨ Get AI tips"** button calls Claude to add 3–5 *new*, event-specific follow-up questions and a negotiation tip, without repeating the baseline. |
| **Personalized ideas** | A chat-free "Generate ideas" panel sends the structured event brief (type, guest count, budget, style, free-text preferences) to Claude and gets back a themed set of concrete, regionally-grounded suggestions with an estimated cost impact (low/medium/high) per idea — validated against a strict schema before it's ever rendered. |

## Architecture

```
app/
  page.tsx                 — client-side orchestrator: wizard → tabs (Budget / Timeline / Vendors / Ideas)
  api/ideas/route.ts        — POST: validate → generateIdeas() → JSON
  api/vendor-brief/route.ts — POST: validate → generateVendorBrief() → JSON
lib/
  types.ts                  — shared domain types (EventBrief, BudgetPlan, TimelinePlan, ...)
  budgetAllocator.ts         — deterministic budget rules engine + feasibility checker
  timelineGenerator.ts       — deterministic timeline template engine
  vendorChecklist.ts         — static vendor question baselines per event type
  llmService.ts               — the ONLY module that calls the Anthropic API; validates responses with zod
  validation.ts               — zod schemas for every value crossing the client→server boundary
  rateLimit.ts                 — in-memory sliding-window limiter for the two LLM-backed routes
  useLocalStorageState.ts      — useSyncExternalStore-backed persistence hook (see Code Quality below)
components/                    — EventWizard, BudgetPanel, TimelinePanel, VendorPanel, IdeasPanel, Tabs, AccessibilityBar
__tests__/                     — Vitest unit tests for the deterministic engines
```

**No database.** The app is intentionally stateless on the server: the event
brief and all checklist/timeline progress live in the browser's
`localStorage` only. This shrinks the attack surface (nothing to secure or
back up, no PII ever stored server-side) and keeps the whole app deployable
as a handful of serverless functions. The trade-off — state doesn't sync
across devices — is acceptable for a single-user planning tool and is an
explicit, documented choice rather than an oversight.

## How this maps to the evaluation criteria

**Code quality** — Strict TypeScript throughout, zero `any`. Domain types
centralized in `lib/types.ts` so every module agrees on one shape. A custom
`useLocalStorageState` hook built on `useSyncExternalStore` (not the common
`useState` + `useEffect(() => setState(load()))` pattern, which causes an
extra render pass and is flagged by React's own `react-hooks/set-state-in-effect`
lint rule) — the project builds clean with zero ESLint errors. Business
logic (budget math, timeline scheduling) is pure, framework-free functions
in `lib/`, fully decoupled from React and from the LLM layer.

**Security** — The API key lives only in a server-side env var, never
reaches the client. Every request body is validated with `zod` before it
touches any logic (`lib/validation.ts`) — nothing from `req.json()` is
trusted directly. The one free-text field that reaches a prompt
(`preferences`) is length-capped twice (schema + prompt layer) and wrapped
in a clearly delimited block with an explicit system-prompt instruction to
treat it as content, not commands — a concrete, if partial, mitigation
against prompt injection. LLM responses are parsed and validated against a
`zod` schema before being rendered; malformed output throws and surfaces a
clean error instead of rendering garbage. Both LLM-backed routes are rate
limited per client IP.

**Efficiency** — Deterministic logic (budget, timeline) runs instantly,
client-side, with zero network round-trip — the LLM is only invoked for the
two tasks that genuinely need it (ideas, vendor follow-ups), and only on
explicit user action, not automatically. No database, no bundled datasets —
the entire committed repo is well under the 10MB constraint.

**Testing** — 14 Vitest unit tests cover the two deterministic engines:
budget allocation always sums to exactly the input total (no rounding
drift) across event types, budgets, and styles; it's provably deterministic
(same input → same output); it handles small/edge-case budgets without
`NaN`; the feasibility checker correctly flags unrealistic per-guest
spend. The timeline generator is tested for correct ordering, correct
"do-now" compression under time pressure, and correct due-date arithmetic.
Run with `npm test`.

**Accessibility** — Every form control has an associated `<label>` and
`aria-describedby` error text; the tab interface follows the WAI-ARIA tabs
pattern with full roving-arrow-key keyboard navigation; progress bars and
live regions use proper ARIA roles; a visible, high-contrast focus ring is
enforced globally; a built-in **high-contrast mode** and **large-text mode**
toggle (persisted across visits) are available from every page; the whole
plan is printable/exportable via a dedicated print stylesheet.

**Problem statement alignment** — All four explicitly requested
capabilities (budgets, timelines, vendor checklists, personalized ideas)
are implemented for all three explicitly requested event types (weddings,
birthdays, community events), with India-specific budget benchmarks and
vendor categories rather than a generic, region-agnostic template.

## Running locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Testing

```bash
npm test        # Vitest — runs the 14 unit tests for lib/budgetAllocator.ts and lib/timelineGenerator.ts
npm run lint     # ESLint
npx tsc --noEmit # strict TypeScript check
```

## Deployment

This is a standard Next.js app — deploy to Vercel (recommended, zero
config) or any Node host:

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the `ANTHROPIC_API_KEY` environment variable in the Vercel project
   settings (Settings → Environment Variables).
4. Deploy. No other configuration is required.

## Gen AI services used

Anthropic Claude (`claude-sonnet-4-5` by default, configurable via
`ANTHROPIC_MODEL`) via the official `@anthropic-ai/sdk`, used in exactly two
places: generating personalized event ideas, and generating personalized
vendor follow-up questions. All other logic (budgeting, scheduling,
feasibility checks) is deterministic and does not call the model.
