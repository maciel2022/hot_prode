import { redirect } from "next/navigation";
import Image from "next/image";
import {
  ChartBar,
  Star,
  SoccerBall,
  Target,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AnimatedSection from "@/components/AnimatedSection";
import StatsCard from "@/components/StatsCard";
import CountryFlag from "@/components/CountryFlag";

export const metadata = { title: "Profile — PRODEPT 2026" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, predictions, allPoints, totalUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, isAdmin: true, createdAt: true },
    }),
    prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true, code: true } },
            awayTeam: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.prediction.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    prisma.user.count(),
  ]);

  if (!user) redirect("/login");

  const totalPoints = allPoints._sum.points ?? 0;

  // Global rank
  const usersAhead = await prisma.prediction.groupBy({
    by: ["userId"],
    _sum: { points: true },
    having: { points: { _sum: { gt: totalPoints } } },
  });
  const globalRank = usersAhead.length + 1;

  // Accuracy stats
  const finishedPredictions = predictions.filter(
    (p) => p.match.status === "FINISHED"
  );
  const exactScores = finishedPredictions.filter((p) => p.points === 5).length;
  const correctResults = finishedPredictions.filter((p) => p.points >= 3).length;
  const accuracy =
    finishedPredictions.length > 0
      ? Math.round((correctResults / finishedPredictions.length) * 100)
      : 0;

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  const joinDate = user.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
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
        {/* Profile header */}
        <AnimatedSection>
          <section className="pt-6 pb-2">
            <div className="glass-card p-6 flex flex-col items-center gap-4 text-center">
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-3 border-primary-fixed"
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border-3 border-primary-fixed font-bold text-2xl select-none"
                  style={{
                    background: "var(--color-primary-fixed)",
                    color: "var(--color-on-primary-fixed)",
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div>
                <h1
                  className="font-display text-on-surface"
                  style={{ fontSize: "var(--text-headline-md)", lineHeight: 1.2 }}
                >
                  {user.name}
                </h1>
                <p
                  className="text-on-surface-variant mt-1"
                  style={{ fontSize: "var(--text-body-md)" }}
                >
                  {user.email}
                </p>
                <p
                  className="text-on-surface-variant mt-0.5"
                  style={{ fontSize: "var(--text-label-bold)" }}
                >
                  Member since {joinDate}
                </p>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection delay={0.1}>
          <section className="space-y-3">
            <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
              Your Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard
                icon={<ChartBar size={22} weight="fill" />}
                label="Global Rank"
                value={`#${globalRank}`}
                subtitle={`of ${totalUsers}`}
              />
              <StatsCard
                icon={<Star size={22} weight="fill" />}
                label="Total Points"
                value={totalPoints}
                subtitle="earned"
              />
              <StatsCard
                icon={<Target size={22} weight="fill" />}
                label="Accuracy"
                value={`${accuracy}%`}
                subtitle={`${correctResults}/${finishedPredictions.length} correct`}
              />
              <StatsCard
                icon={<SoccerBall size={22} weight="fill" />}
                label="Exact Scores"
                value={exactScores}
                subtitle="perfect picks"
              />
            </div>
          </section>
        </AnimatedSection>

        {/* Prediction history */}
        <AnimatedSection delay={0.2}>
          <section className="space-y-3">
            <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
              Prediction History ({predictions.length})
            </h2>

            {predictions.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <SoccerBall size={40} className="text-on-surface-variant mx-auto" />
                <p className="mt-2 text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
                  No predictions yet. Make your first pick!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {predictions.map((pred) => {
                  const m = pred.match;
                  const isFinished = m.status === "FINISHED";
                  const hasResult = m.homeScore != null && m.awayScore != null;

                  return (
                    <div
                      key={pred.id}
                      className="glass-card px-4 py-3 flex items-center gap-3"
                    >
                      {/* Teams */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <CountryFlag code={m.homeTeam.code} className="w-6 h-4 shrink-0" />
                        <span className="text-on-surface font-bold text-xs truncate">
                          {m.homeTeam.code}
                        </span>
                        <span className="text-on-surface-variant text-xs">vs</span>
                        <span className="text-on-surface font-bold text-xs truncate">
                          {m.awayTeam.code}
                        </span>
                        <CountryFlag code={m.awayTeam.code} className="w-6 h-4 shrink-0" />
                      </div>

                      {/* My prediction */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="font-display tabular-nums text-primary-fixed"
                          style={{ fontSize: "0.875rem", lineHeight: 1 }}
                        >
                          {pred.homeScore} – {pred.awayScore}
                        </span>
                      </div>

                      {/* Actual result + points */}
                      {isFinished && hasResult ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-on-surface-variant text-xs">
                            ({m.homeScore} – {m.awayScore})
                          </span>
                          <span
                            className="label-bold px-2 py-0.5 rounded-full"
                            style={{
                              fontSize: "0.6875rem",
                              background:
                                pred.points >= 5
                                  ? "var(--color-gold)"
                                  : pred.points >= 3
                                    ? "var(--color-primary-container)"
                                    : "var(--color-surface-container-high)",
                              color:
                                pred.points >= 5
                                  ? "var(--color-on-gold)"
                                  : pred.points >= 3
                                    ? "var(--color-on-primary-container)"
                                    : "var(--color-on-surface-variant)",
                            }}
                          >
                            +{pred.points}
                          </span>
                          {pred.points >= 3 ? (
                            <CheckCircle size={14} weight="fill" className="text-primary-fixed" />
                          ) : (
                            <XCircle size={14} weight="fill" className="text-error" />
                          )}
                        </div>
                      ) : (
                        <span
                          className="label-bold text-on-surface-variant shrink-0"
                          style={{ fontSize: "0.6875rem" }}
                        >
                          PENDING
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </AnimatedSection>
      </main>

      <BottomNav />
    </>
  );
}
