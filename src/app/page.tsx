import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChartBar, Star, UsersThree, CaretRight, SoccerBall } from "@phosphor-icons/react/dist/ssr";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import MatchCard from "@/components/MatchCard";
import StatsCard from "@/components/StatsCard";
import AnimatedSection from "@/components/AnimatedSection";

export default async function HomePage() {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // ── 2. Parallel DB queries ─────────────────────────────────────────────────
  const [user, nextMatch, predictionsAggregate, leagueCount, allPoints] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true, isAdmin: true },
      }),

      prisma.match.findFirst({
        where: { status: "SCHEDULED" },
        orderBy: { matchDate: "asc" },
        include: {
          homeTeam: { select: { name: true, code: true, flagUrl: true } },
          awayTeam: { select: { name: true, code: true, flagUrl: true } },
        },
      }),

      prisma.prediction.count({
        where: { userId: userId },
      }),

      prisma.leagueMember.count({
        where: {
          userId: userId,
          league: { isGlobal: false },
        },
      }),

      prisma.prediction.aggregate({
        where: { userId: userId },
        _sum: { points: true },
      }),
    ]);

  if (!user) redirect("/login");

  // ── 2b. Fetch user prediction for next match (if any) ─────────────────────
  const nextMatchPrediction = nextMatch
    ? await prisma.prediction.findUnique({
        where: {
          userId_matchId: {
            userId: userId,
            matchId: nextMatch.id,
          },
        },
        select: { homeScore: true, awayScore: true, penaltyWinner: true },
      })
    : null;

  // ── 3. Compute global rank ─────────────────────────────────────────────────
  const totalPoints = allPoints._sum.points ?? 0;

  const usersAhead = await prisma.prediction.groupBy({
    by: ["userId"],
    _sum: { points: true },
    having: {
      points: { _sum: { gt: totalPoints } },
    },
  });
  const globalRank = usersAhead.length + 1;

  // ── 4. Render ──────────────────────────────────────────────────────────────
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
        {/* ── Hero section ──────────────────────────────────────────────── */}
        <AnimatedSection>
          <section className="relative pt-6 md:pt-10 pb-2 overflow-hidden">
            <span
              className="absolute inset-0 hidden lg:flex items-center justify-center select-none pointer-events-none font-display leading-none text-on-surface"
              style={{
                fontSize: "var(--text-display-xl)",
                lineHeight: "var(--text-display-xl--line-height)",
                opacity: 0.06,
                letterSpacing: "-0.02em",
              }}
              aria-hidden="true"
            >
              PRODEPT
            </span>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="space-y-1 md:space-y-2 min-w-0">
                <p className="label-bold text-primary-fixed tracking-widest">
                  FIFA WORLD CUP 2026
                </p>
                <h1
                  className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]"
                >
                  MY{" "}
                  <span style={{ color: "var(--color-primary-fixed)" }}>PRODE</span>
                </h1>
                <p className="text-on-surface-variant text-sm md:text-base">
                  Welcome, {user.name.split(" ")[0]}
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
        </AnimatedSection>

        {/* ── Next Match ────────────────────────────────────────────────── */}
        <AnimatedSection delay={0.15}>
        <section className="space-y-3">
          <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
            Your Next Big Call
          </h2>

          {nextMatch ? (
            <MatchCard
              matchId={nextMatch.id}
              homeTeam={{
                name: nextMatch.homeTeam.name,
                code: nextMatch.homeTeam.code,
              }}
              awayTeam={{
                name: nextMatch.awayTeam.name,
                code: nextMatch.awayTeam.code,
              }}
              matchDate={nextMatch.matchDate}
              stage={nextMatch.stage}
              group={nextMatch.group}
              status={nextMatch.status}
              homeScore={nextMatch.homeScore}
              awayScore={nextMatch.awayScore}
              penaltyWinner={nextMatch.penaltyWinner}
              showPredictButton
              prediction={nextMatchPrediction ?? null}
            />
          ) : (
            <div className="glass-card p-4 md:p-6 text-center">
              <SoccerBall size={40} className="text-on-surface-variant mx-auto" />
              <p
                className="mt-2 text-on-surface-variant"
                style={{ fontSize: "var(--text-label-bold)" }}
              >
                No upcoming matches scheduled.
              </p>
            </div>
          )}
        </section>
        </AnimatedSection>

        {/* ── Stats Bento Grid ──────────────────────────────────────────── */}
        <AnimatedSection delay={0.3}>
        <section className="space-y-3">
          <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
            Your Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <StatsCard
              icon={<ChartBar size={22} weight="fill" />}
              label="Global Rank"
              value={`#${globalRank}`}
              subtitle={`${predictionsAggregate} predictions`}
            />

            <StatsCard
              icon={<Star size={22} weight="fill" />}
              label="Total Points"
              value={totalPoints}
              subtitle="earned"
            />

            {/* Private Leagues */}
            <Link
              href="/leagues"
              className="col-span-2 md:col-span-1 glass-card p-4 md:p-6 flex items-center gap-4 no-underline group transition-opacity hover:opacity-80"
              aria-label="View my private leagues"
            >
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-secondary-container)" }}
              >
                <UsersThree size={24} weight="fill" className="text-on-secondary-container" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="label-bold text-on-surface-variant tracking-widest"
                  style={{ fontSize: "var(--text-label-bold)" }}
                >
                  Private Leagues
                </p>
                <p
                  className="font-display text-on-surface mt-0.5 leading-tight"
                  style={{
                    fontSize: "var(--text-headline-md)",
                    lineHeight: 1,
                  }}
                >
                  {leagueCount}
                  <span
                    className="text-on-surface-variant ml-2 font-body"
                    style={{
                      fontSize: "var(--text-label-bold)",
                      fontWeight: 400,
                    }}
                  >
                    {leagueCount === 1 ? "league" : "leagues"}
                  </span>
                </p>
              </div>

              <CaretRight size={22} className="text-on-surface-variant shrink-0 group-hover:text-primary-fixed transition-colors" />
            </Link>
          </div>
        </section>
        </AnimatedSection>
      </main>

      <BottomNav />
    </>
  );
}
