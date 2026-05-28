"use client";

import { useState } from "react";
import { Trophy, ArrowsClockwise, Lightning } from "@phosphor-icons/react/dist/ssr";
import CountryFlag from "@/components/CountryFlag";
import { submitMatchResult, updateMatchStatus } from "./actions";

type Props = {
  match: {
    id: string;
    homeTeam: { name: string; code: string };
    awayTeam: { name: string; code: string };
    matchDate: string;
    stage: string;
    group: string | null;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    penaltyWinner: string | null;
    predictionsCount: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-secondary-container text-on-secondary-container",
  LIVE: "bg-coral text-on-coral",
  FINISHED: "bg-surface-container-high text-on-surface-variant",
};

export default function MatchAdminCard({ match }: Props) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formHomeScore, setFormHomeScore] = useState(match.homeScore?.toString() ?? "");
  const [formAwayScore, setFormAwayScore] = useState(match.awayScore?.toString() ?? "");
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(match.penaltyWinner);

  const isKnockout = match.stage !== "GROUP";
  const isFormDraw = formHomeScore !== "" && formAwayScore !== "" && formHomeScore === formAwayScore;
  const showPenaltyPicker = isKnockout && isFormDraw;

  const stageLabel = match.group
    ? `${match.stage.replace(/_/g, " ")} — ${match.group}`
    : match.stage.replace(/_/g, " ");

  const date = new Date(match.matchDate);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleSubmitResult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitMatchResult(formData);

    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Result saved. ${result.recalculated} predictions recalculated.`);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setPending(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.set("matchId", match.id);
    formData.set("status", newStatus);

    const result = await updateMatchStatus(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Status updated to ${newStatus}.`);
    }
  }

  return (
    <article className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="label-bold text-on-surface-variant"
          style={{ fontSize: "var(--text-label-bold)" }}
        >
          {stageLabel}
        </span>
        <span
          className={`label-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[match.status] ?? ""}`}
          style={{ fontSize: "0.6875rem" }}
        >
          {match.status}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CountryFlag code={match.homeTeam.code} className="w-8 h-6" />
          <span className="text-on-surface font-bold text-sm truncate">
            {match.homeTeam.name}
          </span>
        </div>
        <span className="text-on-surface-variant text-xs font-bold shrink-0">VS</span>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-on-surface font-bold text-sm truncate text-right">
            {match.awayTeam.name}
          </span>
          <CountryFlag code={match.awayTeam.code} className="w-8 h-6" />
        </div>
      </div>

      {/* Date + predictions count */}
      <div className="flex items-center justify-between text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
        <span>{dateStr}</span>
        <span>{match.predictionsCount} predictions</span>
      </div>

      {/* Current result if finished */}
      {match.status === "FINISHED" && match.homeScore != null && match.awayScore != null && (
        <div className="flex items-center justify-center gap-2 py-1">
          <Trophy size={16} weight="fill" className="text-gold" />
          <span className="font-display text-primary-fixed" style={{ fontSize: "var(--text-headline-md)" }}>
            {match.homeScore} – {match.awayScore}
          </span>
        </div>
      )}

      {/* Status controls */}
      {match.status !== "FINISHED" && (
        <div className="flex gap-2">
          {match.status === "SCHEDULED" && (
            <button
              onClick={() => handleStatusChange("LIVE")}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 label-bold tracking-widest text-xs transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--color-coral)", color: "#fff" }}
            >
              <Lightning size={14} weight="fill" />
              SET LIVE
            </button>
          )}
          {match.status === "LIVE" && (
            <button
              onClick={() => handleStatusChange("SCHEDULED")}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 label-bold tracking-widest text-xs transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--color-surface-container-high)", color: "var(--color-on-surface)" }}
            >
              <ArrowsClockwise size={14} />
              REVERT
            </button>
          )}
        </div>
      )}

      {/* Result form */}
      {match.status !== "SCHEDULED" && (
        <form onSubmit={handleSubmitResult} className="space-y-3 pt-2 border-t border-outline-variant">
          <input type="hidden" name="matchId" value={match.id} />
          {showPenaltyPicker && (
            <input type="hidden" name="penaltyWinner" value={penaltyWinner ?? ""} />
          )}
          <p className="label-bold text-on-surface-variant tracking-widest text-xs">
            {match.status === "FINISHED" ? "UPDATE RESULT" : "ENTER FINAL RESULT"}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                name="homeScore"
                type="number"
                min={0}
                max={99}
                value={formHomeScore}
                onChange={(e) => { setFormHomeScore(e.target.value); setPenaltyWinner(null); }}
                placeholder="H"
                required
                className="w-full rounded-lg px-3 py-2 text-center text-on-surface font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary-fixed"
                style={{
                  background: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-outline-variant)",
                  fontSize: "var(--text-body-md)",
                }}
              />
            </div>
            <span className="text-on-surface-variant font-bold text-sm">–</span>
            <div className="flex-1">
              <input
                name="awayScore"
                type="number"
                min={0}
                max={99}
                value={formAwayScore}
                onChange={(e) => { setFormAwayScore(e.target.value); setPenaltyWinner(null); }}
                placeholder="A"
                required
                className="w-full rounded-lg px-3 py-2 text-center text-on-surface font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary-fixed"
                style={{
                  background: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-outline-variant)",
                  fontSize: "var(--text-body-md)",
                }}
              />
            </div>
          </div>
          {showPenaltyPicker && (
            <div className="space-y-2">
              <p className="label-bold text-gold tracking-widest text-xs text-center">
                PENALTY WINNER
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPenaltyWinner("home")}
                  className="rounded-lg py-2 text-xs font-bold cursor-pointer border-2 transition-all"
                  style={{
                    background: penaltyWinner === "home" ? "color-mix(in srgb, var(--color-primary-fixed) 15%, var(--color-surface-container))" : "var(--color-surface-container-high)",
                    borderColor: penaltyWinner === "home" ? "var(--color-primary-fixed)" : "transparent",
                    color: penaltyWinner === "home" ? "var(--color-primary-fixed)" : "var(--color-on-surface)",
                  }}
                >
                  {match.homeTeam.name}
                </button>
                <button
                  type="button"
                  onClick={() => setPenaltyWinner("away")}
                  className="rounded-lg py-2 text-xs font-bold cursor-pointer border-2 transition-all"
                  style={{
                    background: penaltyWinner === "away" ? "color-mix(in srgb, var(--color-primary-fixed) 15%, var(--color-surface-container))" : "var(--color-surface-container-high)",
                    borderColor: penaltyWinner === "away" ? "var(--color-primary-fixed)" : "transparent",
                    color: penaltyWinner === "away" ? "var(--color-primary-fixed)" : "var(--color-on-surface)",
                  }}
                >
                  {match.awayTeam.name}
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg py-2.5 label-bold tracking-widest text-xs transition-opacity disabled:opacity-50 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
              color: "#003d2e",
            }}
          >
            {pending ? "SAVING..." : "SAVE RESULT & CALCULATE POINTS"}
          </button>
        </form>
      )}

      {/* Feedback */}
      {error && (
        <p className="text-error text-xs font-bold">{error}</p>
      )}
      {message && (
        <p className="text-primary-fixed text-xs font-bold">{message}</p>
      )}
    </article>
  );
}
