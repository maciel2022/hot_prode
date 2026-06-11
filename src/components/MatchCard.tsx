"use client";

import Link from "next/link";
import { SoccerBall, CheckCircle, XCircle, MinusCircle, Clock, Circle } from "@phosphor-icons/react";
import { formatMatchDate, formatStageLabel } from "@/lib/format";
import CountryFlag from "@/components/CountryFlag";
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
}: Props) {
  const t = useTranslations("match");
  const locale = useLocale();
  const now = new Date();
  const kickoff = new Date(matchDate);
  const durationMs = stage === "GROUP" ? 2 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
  const matchEndTime = new Date(kickoff.getTime() + durationMs);

  // DB status takes priority; time-based logic fills in when admin hasn't updated yet
  const isFinished = status === "FINISHED" || (status !== "FINISHED" && now >= matchEndTime);
  const isLive = !isFinished && (status === "LIVE" || now >= kickoff);
  // Special exception: first match allows predictions until 10 min before end
  const FIRST_MATCH_ID = "cmq9r6vdu001dxnofh530h4su";
  const isFirstMatch = matchId === FIRST_MATCH_ID;
  const isLocked = isFirstMatch
    ? now >= new Date(kickoff.getTime() + 110 * 60 * 1000)
    : now >= kickoff;
  const stageLabel = formatStageLabel(stage, group, locale);

  return (
    <article className="glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4">
      {/* Stage / Group label */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="label-bold text-on-surface-variant"
          style={{ fontSize: "var(--text-label-bold)" }}
        >
          {stageLabel}
        </span>
        <span
          className="label-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1"
          style={
            isFinished
              ? {
                  fontSize: "0.6875rem",
                  background: "rgba(229, 57, 53, 0.2)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(229, 57, 53, 0.4)",
                }
              : isLive
                ? {
                    fontSize: "0.6875rem",
                    background: "rgba(255, 210, 63, 0.2)",
                    color: "#ffe066",
                    border: "1px solid rgba(255, 210, 63, 0.4)",
                  }
                : {
                    fontSize: "0.6875rem",
                    background: "rgba(54, 255, 196, 0.12)",
                    color: "var(--color-primary-fixed)",
                    border: "1px solid rgba(54, 255, 196, 0.25)",
                  }
          }
        >
          {isFinished ? (
            <XCircle size={12} weight="fill" />
          ) : isLive ? (
            <Circle size={10} weight="fill" className="animate-pulse" />
          ) : (
            <Clock size={12} weight="fill" />
          )}
          {isFinished ? t("finished") : isLive ? t("live") : t("scheduled")}
        </span>
      </div>

      {/* Teams row */}
      <div className="flex items-center gap-2 md:gap-6 lg:gap-10 md:py-4">
        <TeamDisplay team={homeTeam} locale={locale} />

        {/* VS / Score / Prediction center */}
        <div className="flex flex-col items-center shrink-0 gap-1 px-2 md:px-6">
          {isFinished && homeScore != null && awayScore != null ? (
            <div className="flex flex-col items-center gap-1">
              <span
                className="font-display text-primary-fixed tabular-nums"
                style={{
                  fontSize: "var(--text-headline-md)",
                  lineHeight: 1,
                }}
              >
                {homeScore} – {awayScore}
              </span>
              {penaltyWinner && (
                <span className="label-bold text-gold" style={{ fontSize: "0.6875rem" }}>
                  {t("pen")}
                </span>
              )}
              {prediction && (
                <span
                  className="label-bold text-on-surface-variant tabular-nums"
                  style={{ fontSize: "0.6875rem" }}
                >
                  {t("myPick")}: {prediction.homeScore} – {prediction.awayScore}
                  {prediction.penaltyWinner && (
                    <span className="text-gold"> ({t("pen")})</span>
                  )}
                </span>
              )}
            </div>
          ) : prediction ? (
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="font-display text-primary-fixed tabular-nums"
                style={{
                  fontSize: "var(--text-headline-md)",
                  lineHeight: 1,
                }}
              >
                {prediction.homeScore} – {prediction.awayScore}
              </span>
              <span
                className="label-bold text-on-surface-variant uppercase tracking-widest"
                style={{ fontSize: "0.6875rem" }}
              >
                {t("myPick")}
              </span>
            </div>
          ) : (
            <span
              className="font-display text-on-surface-variant"
              style={{
                fontSize: "var(--text-headline-md)",
                lineHeight: 1,
              }}
            >
              VS
            </span>
          )}
        </div>

        <TeamDisplay team={awayTeam} locale={locale} />
      </div>

      {/* Date */}
      <p
        className="text-on-surface-variant text-center"
        style={{ fontSize: "var(--text-label-bold)", lineHeight: "var(--text-label-bold--line-height)" }}
        suppressHydrationWarning
      >
        {formatMatchDate(matchDate, "short", locale)}
      </p>

      {/* Points result (finished matches with pointsEarned prop) */}
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
            <span className="text-on-surface-variant" style={{ fontSize: "0.6875rem" }}>
              {pointsLabel ?? ""}
            </span>
          </div>
          <span
            className="label-bold px-3 py-1 rounded-full shrink-0"
            style={{
              background: pointsEarned >= 5
                ? "var(--color-gold)"
                : pointsEarned >= 3
                  ? "var(--color-primary-container)"
                  : "var(--color-surface-container-high)",
              color: pointsEarned >= 5
                ? "var(--color-on-gold)"
                : pointsEarned >= 3
                  ? "var(--color-on-primary-container)"
                  : "var(--color-on-surface-variant)",
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
            style={{
              background: "var(--color-surface-container)",
              color: "var(--color-on-surface-variant)",
              fontSize: "var(--text-label-bold)",
            }}
          >
            {t("zeroPts")}
          </span>
        </div>
      )}

      {/* Predict button */}
      {showPredictButton && !isFinished && !isLocked && (
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
      )}
    </article>
  );
}
