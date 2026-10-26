"use client";

import { useState } from "react";
import EventWizard, { defaultBrief } from "@/components/EventWizard";
import BudgetPanel from "@/components/BudgetPanel";
import TimelinePanel from "@/components/TimelinePanel";
import VendorPanel from "@/components/VendorPanel";
import IdeasPanel from "@/components/IdeasPanel";
import AccessibilityBar from "@/components/AccessibilityBar";
import Tabs from "@/components/Tabs";
import type { EventBrief } from "@/lib/types";
import { useLocalStorageState } from "@/lib/useLocalStorageState";

const BRIEF_STORAGE_KEY = "utsavai.brief";
const NO_SAVED_BRIEF: EventBrief | null = null;

const TABS = [
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "vendors", label: "Vendor Checklist" },
  { id: "ideas", label: "AI Ideas" },
];

export default function Home() {
  const [brief, setBrief] = useLocalStorageState<EventBrief | null>(
    BRIEF_STORAGE_KEY,
    NO_SAVED_BRIEF
  );
  const [activeTab, setActiveTab] = useState("budget");
  // null = "no explicit choice yet" — defer to whether a saved brief exists.
  const [editingOverride, setEditingOverride] = useState<boolean | null>(null);
  const editing = editingOverride ?? brief === null;

  function handleSubmit(b: EventBrief) {
    setBrief(b);
    setEditingOverride(false);
    setActiveTab("budget");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AccessibilityBar />

      <header className="no-print border-b border-stone-200 bg-white px-4 py-5 dark:border-stone-800 dark:bg-stone-950 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-amber-800 dark:text-amber-300">
              🎉 UtsavAI
            </h1>
            <p className="text-sm text-stone-500">
              GenAI co-planner for weddings, birthdays & community events
            </p>
          </div>
          {brief && !editing && (
            <button
              type="button"
              onClick={() => setEditingOverride(true)}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
            >
              Edit event details
            </button>
          )}
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-8">
        {editing || !brief ? (
          <section aria-label="Event setup">
            <h2 className="mb-5 text-lg font-semibold">Tell us about your event</h2>
            <EventWizard initial={brief ?? defaultBrief()} onSubmit={handleSubmit} />
          </section>
        ) : (
          <section aria-label="Event plan">
            <div className="no-print mb-6 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {brief.occasion || brief.eventType} — {brief.guestCount} guests
                </h2>
                <p className="text-sm text-stone-500">
                  ₹{brief.budgetInr.toLocaleString("en-IN")} budget ·{" "}
                  {new Date(brief.eventDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full border border-amber-700 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                Export / Print plan
              </button>
            </div>

            <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

            <div className="py-6">
              {TABS.map((tab) => (
                <div
                  key={tab.id}
                  role="tabpanel"
                  id={`panel-${tab.id}`}
                  aria-labelledby={`tab-${tab.id}`}
                  hidden={activeTab !== tab.id}
                >
                  {activeTab === tab.id && tab.id === "budget" && <BudgetPanel brief={brief} />}
                  {activeTab === tab.id && tab.id === "timeline" && <TimelinePanel brief={brief} />}
                  {activeTab === tab.id && tab.id === "vendors" && <VendorPanel brief={brief} />}
                  {activeTab === tab.id && tab.id === "ideas" && <IdeasPanel brief={brief} />}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="no-print border-t border-stone-200 px-4 py-4 text-center text-xs text-stone-400 dark:border-stone-800 sm:px-8">
        UtsavAI stores your plan only in this browser — nothing is saved on a server.
      </footer>
    </div>
  );
}
