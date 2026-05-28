"use client";

import { useState } from "react";
import { SoccerBall, ClockCounterClockwise } from "@phosphor-icons/react";

type TabKey = "upcoming" | "history";

const TABS: { key: TabKey; label: string; icon: typeof SoccerBall }[] = [
  { key: "upcoming", label: "UPCOMING", icon: SoccerBall },
  { key: "history", label: "MY HISTORY", icon: ClockCounterClockwise },
];

type Props = {
  upcomingCount: number;
  historyCount: number;
  upcoming: React.ReactNode;
  history: React.ReactNode;
};

export default function PredictionTabs({
  upcomingCount,
  historyCount,
  upcoming,
  history,
}: Props) {
  const [tab, setTab] = useState<TabKey>("upcoming");
  const counts: Record<TabKey, number> = { upcoming: upcomingCount, history: historyCount };

  return (
    <div className="space-y-6">
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "var(--color-surface-container)" }}
        role="tablist"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              role="tab"
              id={`tab-${key}`}
              aria-selected={isActive}
              aria-controls={`panel-${key}`}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg label-bold tracking-widest text-xs transition-all cursor-pointer"
              style={{
                background: isActive
                  ? key === "history"
                    ? "linear-gradient(135deg, var(--color-secondary-container) 0%, #5800cc 100%)"
                    : "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)"
                  : "transparent",
                color: isActive
                  ? key === "history" ? "#fff" : "#003d2e"
                  : "var(--color-on-surface-variant)",
              }}
            >
              <Icon size={16} weight={isActive ? "fill" : "regular"} />
              {label} ({counts[key]})
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "upcoming" ? upcoming : history}
      </div>
    </div>
  );
}
