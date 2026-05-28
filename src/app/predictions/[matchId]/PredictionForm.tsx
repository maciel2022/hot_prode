"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trophy } from "@phosphor-icons/react/dist/ssr";
import { savePrediction } from "./actions";
import CountryFlag from "@/components/CountryFlag";

type Team = {
  name: string;
  code: string;
};

type Props = {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  isKnockout: boolean;
  initialHomeScore?: number;
  initialAwayScore?: number;
  initialPenaltyWinner?: string | null;
};

function TeamFlag({ team }: { team: Team }) {
  return (
    <div className="flex flex-col items-center gap-2 md:gap-3">
      <CountryFlag
        code={team.code}
        className="w-14 h-10 md:w-20 md:h-14"
      />
      <span
        className="font-display text-on-surface text-center leading-tight max-w-[5rem] md:max-w-[7rem] text-sm md:text-[2rem]"
        style={{ lineHeight: 1.1 }}
      >
        {team.name}
      </span>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-display text-label-bold py-4 rounded-xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 text-white"
      style={{ background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)", color: "#003d2e" }}
    >
      {pending ? "LOCKING IN..." : "LOCK IT IN"}
    </button>
  );
}

const initialState = { error: undefined, success: false };

export default function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  isKnockout,
  initialHomeScore,
  initialAwayScore,
  initialPenaltyWinner,
}: Props) {
  const [state, formAction] = useActionState(savePrediction, initialState);
  const [homeScore, setHomeScore] = useState(initialHomeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(initialAwayScore?.toString() ?? "");
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(initialPenaltyWinner ?? null);

  const isDraw = homeScore !== "" && awayScore !== "" && homeScore === awayScore;
  const showPenaltyPicker = isKnockout && isDraw;

  return (
    <form action={formAction} className="glass-card p-4 md:p-6 space-y-8">
      <input type="hidden" name="matchId" value={matchId} />
      {showPenaltyPicker && (
        <input type="hidden" name="penaltyWinner" value={penaltyWinner ?? ""} />
      )}

      <div className="flex items-center gap-2 md:gap-4">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-3 md:gap-4">
          <TeamFlag team={homeTeam} />
          <input
            type="number"
            name="homeScore"
            min={0}
            max={99}
            value={homeScore}
            onChange={(e) => {
              setHomeScore(e.target.value);
              setPenaltyWinner(null);
            }}
            required
            placeholder="0"
            className="bg-surface-container-high border border-outline-variant rounded-xl text-center font-display text-on-surface w-16 h-16 md:w-20 md:h-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ fontSize: "var(--text-headline-md)" }}
            aria-label={`Goals ${homeTeam.name}`}
          />
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center shrink-0 gap-1">
          <span
            className="font-display text-on-surface-variant text-xl md:text-[2rem]"
            style={{ lineHeight: 1 }}
          >
            VS
          </span>
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-3 md:gap-4">
          <TeamFlag team={awayTeam} />
          <input
            type="number"
            name="awayScore"
            min={0}
            max={99}
            value={awayScore}
            onChange={(e) => {
              setAwayScore(e.target.value);
              setPenaltyWinner(null);
            }}
            required
            placeholder="0"
            className="bg-surface-container-high border border-outline-variant rounded-xl text-center font-display text-on-surface w-16 h-16 md:w-20 md:h-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ fontSize: "var(--text-headline-md)" }}
            aria-label={`Goals ${awayTeam.name}`}
          />
        </div>
      </div>

      {/* Penalty winner picker — knockout draws only */}
      {showPenaltyPicker && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Trophy size={16} weight="fill" className="text-gold" />
            <p className="label-bold text-on-surface-variant tracking-widest text-center text-xs">
              WHO WINS ON PENALTIES?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPenaltyWinner("home")}
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-2 transition-all cursor-pointer border-2"
              style={{
                background: penaltyWinner === "home"
                  ? "color-mix(in srgb, var(--color-primary-fixed) 15%, var(--color-surface-container))"
                  : "var(--color-surface-container-high)",
                borderColor: penaltyWinner === "home"
                  ? "var(--color-primary-fixed)"
                  : "transparent",
              }}
            >
              <CountryFlag code={homeTeam.code} className="w-6 h-4" />
              <span
                className="font-bold truncate"
                style={{
                  color: penaltyWinner === "home" ? "var(--color-primary-fixed)" : "var(--color-on-surface)",
                  fontSize: "var(--text-body-md)",
                }}
              >
                {homeTeam.name}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPenaltyWinner("away")}
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-2 transition-all cursor-pointer border-2"
              style={{
                background: penaltyWinner === "away"
                  ? "color-mix(in srgb, var(--color-primary-fixed) 15%, var(--color-surface-container))"
                  : "var(--color-surface-container-high)",
                borderColor: penaltyWinner === "away"
                  ? "var(--color-primary-fixed)"
                  : "transparent",
              }}
            >
              <CountryFlag code={awayTeam.code} className="w-6 h-4" />
              <span
                className="font-bold truncate"
                style={{
                  color: penaltyWinner === "away" ? "var(--color-primary-fixed)" : "var(--color-on-surface)",
                  fontSize: "var(--text-body-md)",
                }}
              >
                {awayTeam.name}
              </span>
            </button>
          </div>
        </div>
      )}

      {state?.error && (
        <p
          className="text-center rounded-xl px-4 py-3"
          style={{
            background: "var(--color-error-container)",
            color: "var(--color-on-error-container)",
            fontSize: "var(--text-label-bold)",
          }}
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
