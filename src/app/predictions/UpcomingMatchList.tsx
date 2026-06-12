"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { SoccerBall } from "@phosphor-icons/react";
import { showToast } from "nextjs-toast-notify";
import MatchCard from "@/components/MatchCard";

type Team = {
  name: string;
  code: string;
};

type Prediction = {
  homeScore: number;
  awayScore: number;
  penaltyWinner?: string | null;
};

type SerializedMatch = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  matchDate: string; // ISO string
  stage: string;
  group: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: string | null;
};

type Props = {
  matches: SerializedMatch[];
  predictions: Record<string, Prediction>;
};

export default function UpcomingMatchList({ matches, predictions: initialPredictions }: Props) {
  const t = useTranslations("predictionDetail");
  const tPredictions = useTranslations("predictions");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [localPredictions, setLocalPredictions] = useState<Record<string, Prediction>>(initialPredictions);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleToggleExpand = useCallback((matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  const handlePredictionSaved = useCallback(
    (matchId: string, prediction: Prediction) => {
      // Update local predictions
      setLocalPredictions((prev) => ({ ...prev, [matchId]: prediction }));

      // Show toast
      showToast.success(t("saved"), {
        duration: 4000,
        position: "bottom-right",
        transition: "swingInverted",
      });

      // Find next unpredicted match
      const currentIndex = matches.findIndex((m) => m.id === matchId);
      const nextUnpredicted = matches.find(
        (m, i) => i > currentIndex && !localPredictions[m.id] && m.id !== matchId
      );

      if (nextUnpredicted) {
        // Collapse current, expand next after a short delay for smooth transition
        setExpandedMatchId(null);
        setTimeout(() => {
          setExpandedMatchId(nextUnpredicted.id);
          // Scroll to next card
          const el = cardRefs.current[nextUnpredicted.id];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 400);
      } else {
        // No more matches to predict
        setExpandedMatchId(null);
        showToast.success(t("allDone"), {
          duration: 4000,
          position: "bottom-right",
          transition: "swingInverted",
        });
      }
    },
    [matches, localPredictions, t]
  );

  if (matches.length === 0) {
    return (
      <div className="glass-card p-4 md:p-6 text-center">
        <SoccerBall size={40} className="text-on-surface-variant mx-auto" />
        <p className="mt-2 text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
          {tPredictions("noUpcoming")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {matches.map((match) => {
        const pred = localPredictions[match.id] ?? null;
        return (
          <div key={match.id} ref={(el) => { cardRefs.current[match.id] = el; }}>
            <MatchCard
              matchId={match.id}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              matchDate={new Date(match.matchDate)}
              stage={match.stage}
              group={match.group}
              status={match.status}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              penaltyWinner={match.penaltyWinner}
              showPredictButton
              prediction={pred}
              expandable
              expanded={expandedMatchId === match.id}
              onToggleExpand={() => handleToggleExpand(match.id)}
              onPredictionSaved={(prediction) => handlePredictionSaved(match.id, prediction)}
            />
          </div>
        );
      })}
    </div>
  );
}
