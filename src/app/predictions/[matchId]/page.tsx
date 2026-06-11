import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Lock, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { getTranslations, getLocale } from "next-intl/server";

import { auth } from "@/auth";
import { formatMatchDate, formatStageLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import PredictionForm from "./PredictionForm";

export const metadata = { title: "Prediction — PRODEPT 2026" };

type Props = {
  params: Promise<{ matchId: string }>;
};

export default async function PredictionMatchPage({ params }: Props) {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { matchId } = await params;

  // ── 2. Parallel DB queries ─────────────────────────────────────────────────
  const [user, match, existingPrediction] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, isAdmin: true },
    }),

    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { name: true, code: true, flagUrl: true } },
        awayTeam: { select: { name: true, code: true, flagUrl: true } },
      },
    }),

    prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId: userId,
          matchId,
        },
      },
      select: { homeScore: true, awayScore: true, penaltyWinner: true },
    }),
  ]);

  if (!user) redirect("/login");
  if (!match) notFound();

  const t = await getTranslations("predictionDetail");
  const locale = await getLocale();

  const isClosed = match.status === "FINISHED" || match.status === "LIVE" || new Date() >= match.matchDate;
  const stageLabel = formatStageLabel(match.stage, match.group, locale);

  return (
    <>
      {/* Ambient background */}
      <div
        className="vibrant-gradient fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.06 }}
        aria-hidden="true"
      />

      <Navbar user={{ ...user, image: user.image ?? undefined }} />

      <main className="w-full pt-20 pb-24 px-5 md:px-8 md:max-w-3xl lg:max-w-5xl mx-auto space-y-8 md:space-y-10">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section className="pt-6 md:pt-10 pb-2 space-y-4">
          {/* Back link */}
          <Link
            href="/predictions"
            className="inline-flex items-center gap-1 label-bold text-on-surface-variant hover:text-on-surface transition-colors no-underline"
            style={{ fontSize: "var(--text-label-bold)" }}
          >
            <ArrowLeft size={18} />
            {t("back")}
          </Link>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 md:space-y-2 min-w-0">
              <p className="label-bold text-primary-fixed tracking-widest">
                {stageLabel}
              </p>
              <h1
                className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]"
              >
                {t("title")}{" "}
                <span style={{ color: "var(--color-primary-fixed)" }}>{t("titleHighlight")}</span>
              </h1>
              <p className="text-on-surface-variant text-sm md:text-base">
                {formatMatchDate(match.matchDate, "long", locale)}
              </p>
            </div>
            <Image
              src="/logos/fifa_mundial_2026.png"
              alt="FIFA World Cup 2026"
              width={120}
              height={120}
              className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain shrink-0"
            />
          </div>
        </section>

        {/* ── Closed state ────────────────────────────────────────────────── */}
        {isClosed ? (
          <div className="glass-card p-4 md:p-6 flex flex-col items-center gap-4 text-center">
            <Lock size={48} className="text-on-surface-variant" />
            <div className="space-y-1">
              <p
                className="font-display text-on-surface"
                style={{
                  fontSize: "var(--text-headline-md)",
                }}
              >
                {t("closed")}
              </p>
              <p
                className="text-on-surface-variant"
                style={{ fontSize: "var(--text-label-bold)" }}
              >
                {match.status === "LIVE"
                  ? t("inProgress")
                  : t("ended")}
              </p>
            </div>

            {match.status === "FINISHED" &&
              match.homeScore != null &&
              match.awayScore != null && (
                <div className="flex flex-col items-center gap-1 mt-2">
                  <span className="label-bold text-on-surface-variant tracking-widest uppercase">
                    {t("finalResult")}
                  </span>
                  <span
                    className="font-display text-primary-fixed"
                    style={{
                      fontSize: "var(--text-display-sm)",
                    }}
                  >
                    {match.homeScore} – {match.awayScore}
                  </span>
                  <span
                    className="text-on-surface-variant"
                    style={{ fontSize: "var(--text-label-bold)" }}
                  >
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </span>
                </div>
              )}

            <Link
              href="/predictions"
              className="mt-2 w-full flex items-center justify-center rounded-xl py-3 label-bold transition-opacity hover:opacity-90 no-underline"
              style={{
                background: "var(--color-secondary-container)",
                color: "var(--color-on-secondary-container)",
              }}
            >
              {t("viewAll")}
            </Link>
          </div>
        ) : (
          <>
            {existingPrediction && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{
                  background: "var(--color-secondary-container)",
                  color: "var(--color-on-secondary-container)",
                }}
              >
                <PencilSimple size={18} weight="fill" className="shrink-0" />
                <p
                  className="label-bold"
                  style={{ fontSize: "var(--text-label-bold)" }}
                >
                  {t("editing", { score: `${existingPrediction.homeScore}–${existingPrediction.awayScore}` })}
                </p>
              </div>
            )}

            <PredictionForm
              matchId={matchId}
              homeTeam={{
                name: match.homeTeam.name,
                code: match.homeTeam.code,
              }}
              awayTeam={{
                name: match.awayTeam.name,
                code: match.awayTeam.code,
              }}
              isKnockout={match.stage !== "GROUP"}
              initialHomeScore={existingPrediction?.homeScore}
              initialAwayScore={existingPrediction?.awayScore}
              initialPenaltyWinner={existingPrediction?.penaltyWinner}
            />
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}
