"use client";

import { useId, useState } from "react";
import type { BudgetStyle, CityTier, EventBrief, EventType } from "@/lib/types";

interface Props {
  initial: EventBrief;
  onSubmit: (brief: EventBrief) => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "community", label: "Community Event" },
];

const CITY_TIERS: { value: CityTier; label: string }[] = [
  { value: "tier1", label: "Tier-1 (Metro: Mumbai, Delhi, Bengaluru...)" },
  { value: "tier2", label: "Tier-2 (e.g. Jaipur, Nagpur, Indore...)" },
  { value: "tier3", label: "Tier-3 / Town" },
];

const STYLES: { value: BudgetStyle; label: string }[] = [
  { value: "lean", label: "Lean — essentials first" },
  { value: "balanced", label: "Balanced" },
  { value: "lavish", label: "Lavish — go all out" },
];

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function EventWizard({ initial, onSubmit }: Props) {
  const [form, setForm] = useState<EventBrief>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const idPrefix = useId();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.occasion.trim()) errs.occasion = "Please describe the occasion.";
    if (form.guestCount < 1) errs.guestCount = "Guest count must be at least 1.";
    if (form.budgetInr < 1000) errs.budgetInr = "Budget must be at least ₹1,000.";
    if (!form.eventDate) errs.eventDate = "Please pick an event date.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-stone-700 dark:text-stone-300">
          Event type
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event type">
          {EVENT_TYPES.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                form.eventType === t.value
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-stone-300 bg-white hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
              }`}
            >
              <input
                type="radio"
                name="eventType"
                value={t.value}
                checked={form.eventType === t.value}
                onChange={() => setForm((f) => ({ ...f, eventType: t.value }))}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-occasion`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Occasion / name
          </label>
          <input
            id={`${idPrefix}-occasion`}
            type="text"
            value={form.occasion}
            onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
            placeholder="e.g. Sangeet + Reception, Priya's 10th birthday"
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            aria-invalid={!!errors.occasion}
            aria-describedby={errors.occasion ? `${idPrefix}-occasion-err` : undefined}
          />
          {errors.occasion && (
            <p id={`${idPrefix}-occasion-err`} className="text-sm text-red-600">
              {errors.occasion}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-date`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Event date
          </label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            min={todayPlus(0)}
            value={form.eventDate.slice(0, 10)}
            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            aria-invalid={!!errors.eventDate}
            aria-describedby={errors.eventDate ? `${idPrefix}-date-err` : undefined}
          />
          {errors.eventDate && (
            <p id={`${idPrefix}-date-err`} className="text-sm text-red-600">
              {errors.eventDate}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-guests`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Guest count
          </label>
          <input
            id={`${idPrefix}-guests`}
            type="number"
            min={1}
            value={form.guestCount}
            onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))}
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            aria-invalid={!!errors.guestCount}
            aria-describedby={errors.guestCount ? `${idPrefix}-guests-err` : undefined}
          />
          {errors.guestCount && (
            <p id={`${idPrefix}-guests-err`} className="text-sm text-red-600">
              {errors.guestCount}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-budget`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Total budget (₹)
          </label>
          <input
            id={`${idPrefix}-budget`}
            type="number"
            min={1000}
            step={1000}
            value={form.budgetInr}
            onChange={(e) => setForm((f) => ({ ...f, budgetInr: Number(e.target.value) }))}
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
            aria-invalid={!!errors.budgetInr}
            aria-describedby={errors.budgetInr ? `${idPrefix}-budget-err` : undefined}
          />
          {errors.budgetInr && (
            <p id={`${idPrefix}-budget-err`} className="text-sm text-red-600">
              {errors.budgetInr}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-tier`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            City tier
          </label>
          <select
            id={`${idPrefix}-tier`}
            value={form.cityTier}
            onChange={(e) => setForm((f) => ({ ...f, cityTier: e.target.value as CityTier }))}
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          >
            {CITY_TIERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-style`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Planning style
          </label>
          <select
            id={`${idPrefix}-style`}
            value={form.style}
            onChange={(e) => setForm((f) => ({ ...f, style: e.target.value as BudgetStyle }))}
            className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-prefs`} className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Preferences & vibe (optional)
        </label>
        <textarea
          id={`${idPrefix}-prefs`}
          value={form.preferences}
          onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
          placeholder="e.g. outdoor venue, pastel colours, vegetarian-only menu, regional folk music..."
          rows={3}
          maxLength={800}
          className="rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <button
        type="submit"
        className="self-start rounded-full bg-amber-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-800"
      >
        Build my plan →
      </button>
    </form>
  );
}

export function defaultBrief(): EventBrief {
  return {
    eventType: "wedding",
    occasion: "",
    guestCount: 200,
    budgetInr: 1_000_000,
    cityTier: "tier2",
    eventDate: todayPlus(90),
    style: "balanced",
    preferences: "",
  };
}
