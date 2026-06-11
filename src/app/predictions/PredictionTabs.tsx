"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SoccerBall, ClockCounterClockwise } from "@phosphor-icons/react";

type TabKey = "upcoming" | "history";

const TABS: { key: TabKey; labelKey: "upcoming" | "myHistory"; icon: typeof SoccerBall }[] = [
  { key: "upcoming", labelKey: "upcoming", icon: SoccerBall },
  { key: "history", labelKey: "myHistory", icon: ClockCounterClockwise },
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
  const t = useTranslations("predictions");
  const [tab, setTab] = useState<TabKey>("upcoming");
  const counts: Record<TabKey, number> = { upcoming: upcomingCount, history: historyCount };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {TABS.map(({ key, labelKey, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              role="tab"
              id={`tab-${key}`}
              aria-selected={isActive}
              aria-controls={`panel-${key}`}
              onClick={() => setTab(key)}
              className={[
                "flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-xl label-bold tracking-widest text-[0.65rem] md:text-sm transition-all cursor-pointer",
                isActive
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
            >
              <Icon size={16} weight={isActive ? "fill" : "regular"} />
              {t(labelKey)} ({counts[key]})
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
