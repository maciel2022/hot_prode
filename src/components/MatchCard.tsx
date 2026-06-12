"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { SoccerBall, CheckCircle, XCircle, MinusCircle, Clock, Circle, Trophy } from "@phosphor-icons/react";
import { formatMatchDate, formatStageLabel } from "@/lib/format";
import CountryFlag from "@/components/CountryFlag";
import { savePrediction } from "@/app/predictions/[matchId]/actions";
import { useTranslations, useLocale } from "next-intl";
import { translateCountry } from "@/lib/countries";

type Team = {
  name: string;
  code: string;
};

type Prediction = {
  homeScore: number;
  awayScore: number;
  penaltyWinner?: string | null;
};

type Props = {
  homeTeam: Team;
  awayTeam: Team;
  matchDate: Date;
  stage: string;
  group?: string | null;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  penaltyWinner?: string | null;
  matchId: string;
  showPredictButton?: boolean;
  prediction?: Prediction | null;
  pointsEarned?: number | null;
  pointsLabel?: string | null;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onPredictionSaved?: (prediction: Prediction) => void;
};

function TeamDisplay({ team, locale }: { team: Team; locale: string }) {
  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 flex-1 min-w-0">
      <CountryFlag
        code={team.code}
        className="w-14 h-10 md:w-20 md:h-14 lg:w-24 lg:h-16"
      />
      <span
        className="text-on-surface text-center leading-tight max-w-[6rem] md:max-w-[10rem] truncate"
        style={{ fontSize: "var(--text-label-bold)", fontWeight: 700 }}
        title={translateCountry(team.name, locale)}
      >
        {translateCountry(team.name, locale)}
      </span>
    </div>
  );
}

function InlineSubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("predictionDetail");

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 md:py-3 font-bold label-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      style={{
        background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
        color: "#003d2e",
      }}
    >
      <SoccerBall size={18} weight="fill" />
      {pending ? t("lockingIn") : t("lockItIn")}
    </button>
  );
}

const initialFormState = { error: undefined as string | undefined, success: false };

export default function MatchCard({
  homeTeam,
  awayTeam,
  matchDate,
  stage,
  group,
  status,
  homeScore,
  awayScore,
  penaltyWinner,
  matchId,
  showPredictButton = false,
  prediction,
  pointsEarned,
  pointsLabel,
  expandable = false,
  expanded = false,
  onToggleExpand,
  onPredictionSaved,
}: Props) {
  const t = useTranslations("match");
  const tDetail = useTranslations("predictionDetail");
  const locale = useLocale();
  const now = new Date();
  const kickoff = new Date(matchDate);
  const durationMs = stage === "GROUP" ? 2 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
  const matchEndTime = new Date(kickoff.getTime() + durationMs);

  const isFinished = status === "FINISHED" || (status !== "FINISHED" && now >= matchEndTime);
  const isLive = !isFinished && (status === "LIVE" || now >= kickoff);
  const FIRST_MATCH_ID = "cmq9r6vdu001dxnofh530h4su";
  const isFirstMatch = matchId === FIRST_MATCH_ID;
  const isLocked = isFirstMatch
    ? now >= new Date(kickoff.getTime() + 110 * 60 * 1000)
    : now >= kickoff;
  const stageLabel = formatStageLabel(stage, group, locale);
  const isKnockout = stage !== "GROUP";

  // ── Inline form state (only used when expandable) ─────────────────────────
  const [formState, formAction] = useActionState(savePrediction, initialFormState);
  const [editHomeScore, setEditHomeScore] = useState(prediction?.homeScore?.toString() ?? "");
  const [editAwayScore, setEditAwayScore] = useState(prediction?.awayScore?.toString() ?? "");
  const [editPenaltyWinner, setEditPenaltyWinner] = useState<string | null>(prediction?.penaltyWinner ?? null);
  const successHandled = useRef(false);

  const editIsDraw = editHomeScore !== "" && editAwayScore !== "" && editHomeScore === editAwayScore;
  const showPenaltyPicker = expanded && isKnockout && editIsDraw;

  // Reset form when expanded changes
  useEffect(() => {
    if (expanded) {
      setEditHomeScore(prediction?.homeScore?.toString() ?? "");
      setEditAwayScore(prediction?.awayScore?.toString() ?? "");
      setEditPenaltyWinner(prediction?.penaltyWinner ?? null);
      successHandled.current = false;
    }
  }, [expanded, prediction]);

  // Handle success
  useEffect(() => {
    if (formState?.success && !successHandled.current) {
      successHandled.current = true;
      onPredictionSaved?.({
        homeScore: parseInt(editHomeScore, 10),
        awayScore: parseInt(editAwayScore, 10),
        penaltyWinner: showPenaltyPicker ? editPenaltyWinner : null,
      });
    }
  }, [formState?.success, editHomeScore, editAwayScore, editPenaltyWinner, showPenaltyPicker, onPredictionSaved]);

  // ── Center content (VS / Score / Inputs) ──────────────────────────────────
  const renderCenter = () => {
    // Editing mode: show compact score inputs in same space as VS
    if (expanded) {
      return (
        <div className="flex items-center gap-1 md:gap-1.5">
          <input
            type="number"
            name="homeScore"
            min={0}
            max={99}
            value={editHomeScore}
            onChange={(e) => {
              setEditHomeScore(e.target.value);
              setEditPenaltyWinner(null);
            }}
            required
            placeholder="0"
            className="bg-surface-container-high border border-outline-variant rounded-lg text-center font-display text-on-surface w-10 h-10 md:w-12 md:h-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ fontSize: "1.125rem" }}
            aria-label={tDetail("goalsAria", { team: homeTeam.name })}
          />
          <span className="font-display text-on-surface-variant text-xs">–</span>
          <input
            type="number"
            name="awayScore"
            min={0}
            max={99}
            value={editAwayScore}
            onChange={(e) => {
              setEditAwayScore(e.target.value);
              setEditPenaltyWinner(null);
            }}
            required
            placeholder="0"
            className="bg-surface-container-high border border-outline-variant rounded-lg text-center font-display text-on-surface w-10 h-10 md:w-12 md:h-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ fontSize: "1.125rem" }}
            aria-label={tDetail("goalsAria", { team: awayTeam.name })}
          />
        </div>
      );
    }

    // Finished: show final score + user pick
    if (isFinished && homeScore != null && awayScore != null) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-display text-primary-fixed tabular-nums"
            style={{ fontSize: "var(--text-headline-md)", lineHeight: 1 }}
          >
            {homeScore} – {awayScore}
          </span>
          {penaltyWinner && (
            <span className="label-bold text-gold" style={{ fontSize: "0.6875rem" }}>
              {t("pen")}
            </span>
          )}
          {prediction && (
            <span className="label-bold text-on-surface-variant tabular-nums" style={{ fontSize: "0.6875rem" }}>
              {t("myPick")}: {prediction.homeScore} – {prediction.awayScore}
              {prediction.penaltyWinner && <span className="text-gold"> ({t("pen")})</span>}
            </span>
          )}
        </div>
      );
    }

    // Has prediction: show it
    if (prediction) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="font-display text-primary-fixed tabular-nums"
            style={{ fontSize: "var(--text-headline-md)", lineHeight: 1 }}
          >
            {prediction.homeScore} – {prediction.awayScore}
          </span>
          <span className="label-bold text-on-surface-variant uppercase tracking-widest" style={{ fontSize: "0.6875rem" }}>
            {t("myPick")}
          </span>
        </div>
      );
    }

    // Default: VS
    return (
      <span className="font-display text-on-surface-variant" style={{ fontSize: "var(--text-headline-md)", lineHeight: 1 }}>
        VS
      </span>
    );
  };

  const cardContent = (
    <>
      {/* Stage / Group label */}
      <div className="flex items-center justify-between gap-2">
        <span className="label-bold text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
          {stageLabel}
        </span>
        <span
          className="label-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1"
          style={
            isFinished
              ? { fontSize: "0.6875rem", background: "rgba(229, 57, 53, 0.2)", color: "#ff6b6b", border: "1px solid rgba(229, 57, 53, 0.4)" }
              : isLive
                ? { fontSize: "0.6875rem", background: "rgba(255, 210, 63, 0.2)", color: "#ffe066", border: "1px solid rgba(255, 210, 63, 0.4)" }
                : { fontSize: "0.6875rem", background: "rgba(54, 255, 196, 0.12)", color: "var(--color-primary-fixed)", border: "1px solid rgba(54, 255, 196, 0.25)" }
          }
        >
          {isFinished ? <XCircle size={12} weight="fill" /> : isLive ? <Circle size={10} weight="fill" className="animate-pulse" /> : <Clock size={12} weight="fill" />}
          {isFinished ? t("finished") : isLive ? t("live") : t("scheduled")}
        </span>
      </div>

      {/* Teams row */}
      <div className="flex items-center gap-2 md:gap-6 lg:gap-10 md:py-4">
        <TeamDisplay team={homeTeam} locale={locale} />
        <div className="flex flex-col items-center justify-center shrink-0 gap-1 min-w-[5.5rem] md:min-w-[7rem]">
          {renderCenter()}
        </div>
        <TeamDisplay team={awayTeam} locale={locale} />
      </div>

      {/* Penalty picker (knockout draws while editing) */}
      {showPenaltyPicker && (
        <>
          <input type="hidden" name="penaltyWinner" value={editPenaltyWinner ?? ""} />
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Trophy size={14} weight="fill" className="text-gold" />
              <p className="label-bold text-on-surface-variant tracking-widest text-center text-[0.65rem]">
                {tDetail("penaltyQuestion")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["home", "away"] as const).map((side) => {
                const team = side === "home" ? homeTeam : awayTeam;
                const isSelected = editPenaltyWinner === side;
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setEditPenaltyWinner(side)}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 transition-all cursor-pointer border-2 text-xs"
                    style={{
                      background: isSelected
                        ? "color-mix(in srgb, var(--color-primary-fixed) 15%, var(--color-surface-container))"
                        : "var(--color-surface-container-high)",
                      borderColor: isSelected ? "var(--color-primary-fixed)" : "transparent",
                    }}
                  >
                    <CountryFlag code={team.code} className="w-5 h-3.5" />
                    <span className="font-bold truncate" style={{ color: isSelected ? "var(--color-primary-fixed)" : "var(--color-on-surface)" }}>
                      {translateCountry(team.name, locale)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Date */}
      <p
        className="text-on-surface-variant text-center"
        style={{ fontSize: "var(--text-label-bold)", lineHeight: "var(--text-label-bold--line-height)" }}
        suppressHydrationWarning
      >
        {formatMatchDate(matchDate, "short", locale)}
      </p>

      {/* Points result (finished matches) */}
      {isFinished && pointsEarned != null && prediction && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5"
          style={{
            background: pointsEarned >= 5
              ? "color-mix(in srgb, var(--color-gold) 12%, var(--color-surface-container))"
              : pointsEarned >= 3
                ? "color-mix(in srgb, var(--color-primary-fixed) 10%, var(--color-surface-container))"
                : "var(--color-surface-container-high)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {pointsEarned >= 3 ? (
              <CheckCircle size={16} weight="fill" className="text-primary-fixed shrink-0" />
            ) : (
              <XCircle size={16} weight="fill" className="text-error shrink-0" />
            )}
            <span className="text-on-surface-variant" style={{ fontSize: "0.6875rem" }}>{pointsLabel ?? ""}</span>
          </div>
          <span
            className="label-bold px-3 py-1 rounded-full shrink-0"
            style={{
              background: pointsEarned >= 5 ? "var(--color-gold)" : pointsEarned >= 3 ? "var(--color-primary-container)" : "var(--color-surface-container-high)",
              color: pointsEarned >= 5 ? "var(--color-on-gold)" : pointsEarned >= 3 ? "var(--color-on-primary-container)" : "var(--color-on-surface-variant)",
              fontSize: "var(--text-label-bold)",
            }}
          >
            {t("ptsEarned", { points: pointsEarned })}
          </span>
        </div>
      )}
      {isFinished && pointsEarned != null && !prediction && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "var(--color-surface-container-high)" }}>
          <MinusCircle size={16} className="text-on-surface-variant shrink-0" />
          <span className="text-on-surface-variant" style={{ fontSize: "0.6875rem" }}>{t("missed")}</span>
          <span
            className="ml-auto label-bold px-3 py-1 rounded-full shrink-0"
            style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)", fontSize: "var(--text-label-bold)" }}
          >
            {t("zeroPts")}
          </span>
        </div>
      )}

      {/* Error message */}
      {expanded && formState?.error && (
        <p
          className="text-center rounded-xl px-3 py-2 text-xs"
          style={{ background: "var(--color-error-container)", color: "var(--color-on-error-container)" }}
          role="alert"
          aria-live="polite"
        >
          {formState.error}
        </p>
      )}

      {/* Predict / Submit button */}
      {showPredictButton && !isFinished && !isLocked && (
        expanded ? (
          <InlineSubmitButton />
        ) : expandable ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 md:py-3 font-bold label-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
              color: "#003d2e",
            }}
          >
            <SoccerBall size={18} weight="fill" />
            {t("makeYourPick")}
          </button>
        ) : (
          <Link
            href={`/predictions/${matchId}`}
            className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 md:py-3 text-on-primary font-bold label-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] no-underline"
            style={{
              background: "linear-gradient(135deg, var(--color-primary-fixed) 0%, var(--color-primary-fixed-dim) 100%)",
              color: "#003d2e",
            }}
          >
            <SoccerBall size={18} weight="fill" />
            {t("makeYourPick")}
          </Link>
        )
      )}
    </>
  );

  // When expanded, wrap in a form; otherwise plain article
  if (expanded) {
    return (
      <form
        action={formAction}
        className="glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4 transition-all duration-300"
        style={{
          borderColor: "var(--color-primary-fixed)",
          boxShadow: "0 0 0 1px var(--color-primary-fixed), 0 0 20px rgba(54, 255, 196, 0.1)",
        }}
      >
        <input type="hidden" name="matchId" value={matchId} />
        {cardContent}
      </form>
    );
  }

  return (
    <article className="glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4">
      {cardContent}
    </article>
  );
}
