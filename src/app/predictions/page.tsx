import { redirect } from "next/navigation";
import Image from "next/image";
import { SoccerBall, Star, Target, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import MatchCard from "@/components/MatchCard";
import UpcomingMatchList from "./UpcomingMatchList";
import AnimatedSection from "@/components/AnimatedSection";
import StatsCard from "@/components/StatsCard";
import ScoringRulesModal from "@/components/ScoringRulesModal";
import HowToPlayModal from "@/components/HowToPlayModal";
import PredictionTabs from "./PredictionTabs";

export const metadata = { title: "Predictions — HOT PRODE 2026" };

export default async function PredictionsPage() {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // ── 2. Parallel DB queries ─────────────────────────────────────────────────
  const [user, scheduledMatches, finishedMatches, userPredictions] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true, isAdmin: true },
      }),

      prisma.match.findMany({
        where: {
          OR: [
            { status: "SCHEDULED" },
            // Special exception: first match stays open even when LIVE
            { id: "cmq9r6vdu001dxnofh530h4su", status: "LIVE" },
          ],
        },
        orderBy: { matchDate: "asc" },
        include: {
          homeTeam: { select: { name: true, code: true, flagUrl: true } },
          awayTeam: { select: { name: true, code: true, flagUrl: true } },
        },
      }),

      prisma.match.findMany({
        where: { status: "FINISHED" },
        orderBy: { matchDate: "desc" },
        include: {
          homeTeam: { select: { name: true, code: true, flagUrl: true } },
          awayTeam: { select: { name: true, code: true, flagUrl: true } },
        },
      }),

      prisma.prediction.findMany({
        where: { userId: userId },
        select: {
          matchId: true,
          homeScore: true,
          awayScore: true,
          penaltyWinner: true,
          points: true,
        },
      }),
    ]);

  if (!user) redirect("/login");

  const t = await getTranslations("predictions");

  function getPointsLabel(points: number): string {
    if (points === 7) return t("exactWinner");
    if (points === 6) return t("resultDiffWinner");
    if (points === 5) return t("exactOrResultWinner");
    if (points === 4) return t("resultDiff");
    if (points === 3) return t("correctResult");
    if (points === 2) return t("winnerBonus");
    if (points === 1) return t("correctDiff");
    return t("wrong");
  }

  const predictionMap = new Map(
    userPredictions.map((p) => [p.matchId, p])
  );

  // ── 3. Build upcoming content ──────────────────────────────────────────────
  const serializedMatches = scheduledMatches.map((match) => ({
    id: match.id,
    homeTeam: { name: match.homeTeam.name, code: match.homeTeam.code },
    awayTeam: { name: match.awayTeam.name, code: match.awayTeam.code },
    matchDate: match.matchDate.toISOString(),
    stage: match.stage,
    group: match.group,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    penaltyWinner: match.penaltyWinner,
  }));

  const serializedPredictions: Record<string, { homeScore: number; awayScore: number; penaltyWinner?: string | null }> = {};
  for (const match of scheduledMatches) {
    const pred = predictionMap.get(match.id);
    if (pred) {
      serializedPredictions[match.id] = {
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        penaltyWinner: pred.penaltyWinner,
      };
    }
  }

  const upcomingContent = (
    <section className="space-y-3">
      <UpcomingMatchList
        matches={serializedMatches}
        predictions={serializedPredictions}
      />
    </section>
  );

  // ── 4. Compute stats for history ────────────────────────────────────────────
  const finishedPredictions = finishedMatches
    .map((m) => predictionMap.get(m.id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  const totalPoints = finishedPredictions.reduce((sum, p) => sum + p.points, 0);
  const exactScores = finishedPredictions.filter((p) => p.points >= 5).length;
  const correctResults = finishedPredictions.filter((p) => p.points >= 3).length;
  const accuracy = finishedPredictions.length > 0
    ? Math.round((correctResults / finishedPredictions.length) * 100)
    : 0;

  // ── 5. Build history content ───────────────────────────────────────────────
  const historyContent = (
    <section className="space-y-4">
      {(
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            icon={<Star size={22} weight="fill" />}
            label={t("totalPoints")}
            value={totalPoints}
            subtitle={t("earned")}
          />
          <StatsCard
            icon={<Target size={22} weight="fill" />}
            label={t("accuracy")}
            value={`${accuracy}%`}
            subtitle={`${correctResults}/${finishedPredictions.length}`}
          />
          <StatsCard
            icon={<SoccerBall size={22} weight="fill" />}
            label={t("exactScores")}
            value={exactScores}
            subtitle={t("perfect")}
          />
          <StatsCard
            icon={<CheckCircle size={22} weight="fill" />}
            label={t("matchesPlayed")}
            value={finishedPredictions.length}
            subtitle={t("predicted")}
          />
        </div>
      )}
      {finishedMatches.length === 0 ? (
        <div className="glass-card p-4 md:p-6 text-center">
          <p
            className="text-on-surface-variant"
            style={{ fontSize: "var(--text-label-bold)" }}
          >
            {t("noFinished")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {finishedMatches.map((match) => {
            const pred = predictionMap.get(match.id);

            return (
              <MatchCard
                key={match.id}
                matchId={match.id}
                homeTeam={{ name: match.homeTeam.name, code: match.homeTeam.code }}
                awayTeam={{ name: match.awayTeam.name, code: match.awayTeam.code }}
                matchDate={match.matchDate}
                stage={match.stage}
                group={match.group}
                status={match.status}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                penaltyWinner={match.penaltyWinner}
                prediction={pred ? { homeScore: pred.homeScore, awayScore: pred.awayScore, penaltyWinner: pred.penaltyWinner } : null}
                pointsEarned={pred ? pred.points : 0}
                pointsLabel={pred ? getPointsLabel(pred.points) : null}
              />
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <>
      {/* Ambient background */}
      <div
        className="vibrant-gradient fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.06 }}
        aria-hidden="true"
      />
      <div
        className="pitch-lines fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.4 }}
        aria-hidden="true"
      />

      <Navbar user={{ ...user, image: user.image ?? undefined }} />

      <main className="w-full pt-20 pb-24 px-5 md:px-8 md:max-w-3xl lg:max-w-5xl mx-auto space-y-8 md:space-y-10">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <AnimatedSection>
          <section className="pt-6 md:pt-10 pb-2 flex items-center justify-between gap-3">
            <div className="space-y-1 md:space-y-2 min-w-0">
              <p className="label-bold text-primary-fixed tracking-widest">
                {t("topLabel")}
              </p>
              <h1
                className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]"
              >
                {t("title")}
                <span style={{ color: "var(--color-primary-fixed)" }}>{t("titleHighlight")}</span>
              </h1>
              <p className="text-on-surface-variant text-sm md:text-base">
                {t("subtitle")}
              </p>
            </div>
            <Image
              src="/logos/fifa_mundial_2026.png"
              alt="FIFA World Cup 2026"
              width={120}
              height={120}
              className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain shrink-0"
            />
          </section>
        </AnimatedSection>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <AnimatedSection delay={0.15}>
          <div className="flex justify-end mb-3">
            <div className="flex items-center gap-2">
              <HowToPlayModal />
              <ScoringRulesModal />
            </div>
          </div>
          <PredictionTabs
            upcomingCount={scheduledMatches.length}
            historyCount={finishedMatches.length}
            upcoming={upcomingContent}
            history={historyContent}
          />
        </AnimatedSection>
      </main>

      <BottomNav />
    </>
  );
}
