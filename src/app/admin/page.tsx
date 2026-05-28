import { redirect } from "next/navigation";
import Image from "next/image";
import { ShieldStar } from "@phosphor-icons/react/dist/ssr";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import AnimatedSection from "@/components/AnimatedSection";
import MatchAdminCard from "./MatchAdminCard";

export const metadata = { title: "Admin — PRODEPT 2026" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, isAdmin: true },
  });

  if (!user?.isAdmin) redirect("/");

  // Fetch all matches with prediction counts
  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "asc" },
    include: {
      homeTeam: { select: { name: true, code: true } },
      awayTeam: { select: { name: true, code: true } },
      _count: { select: { predictions: true } },
    },
  });

  const liveMatches = matches.filter((m) => m.status === "LIVE");
  const scheduledMatches = matches.filter((m) => m.status === "SCHEDULED");
  const finishedMatches = matches.filter((m) => m.status === "FINISHED").reverse();

  // Stats
  const totalPredictions = await prisma.prediction.count();
  const totalUsers = await prisma.user.count();
  const finishedCount = finishedMatches.length;

  function serializeMatch(m: (typeof matches)[number]) {
    return {
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate.toISOString(),
      stage: m.stage,
      group: m.group,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      penaltyWinner: m.penaltyWinner,
      predictionsCount: m._count.predictions,
    };
  }

  return (
    <>
      <div
        className="vibrant-gradient fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.06 }}
        aria-hidden="true"
      />

      <Navbar user={{ ...user, image: user.image ?? undefined }} />

      <main className="w-full pt-20 pb-24 px-5 md:px-8 md:max-w-3xl lg:max-w-5xl mx-auto space-y-8 md:space-y-10">
        {/* Header */}
        <AnimatedSection>
          <section className="pt-6 md:pt-10 pb-2 flex items-center justify-between gap-3">
            <div className="space-y-1 md:space-y-2 min-w-0">
              <p className="label-bold text-coral tracking-widest">ADMIN PANEL</p>
              <h1 className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]">
                MATCH <span style={{ color: "var(--color-primary-fixed)" }}>CONTROL</span>
              </h1>
            </div>
            <ShieldStar size={48} weight="fill" className="text-coral shrink-0" />
          </section>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection delay={0.1}>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="font-display text-primary-fixed text-2xl">{totalUsers}</p>
              <p className="label-bold text-on-surface-variant text-xs tracking-widest">USERS</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-display text-primary-fixed text-2xl">{totalPredictions}</p>
              <p className="label-bold text-on-surface-variant text-xs tracking-widest">PREDICTIONS</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="font-display text-primary-fixed text-2xl">{finishedCount}/{matches.length}</p>
              <p className="label-bold text-on-surface-variant text-xs tracking-widest">FINISHED</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Live matches */}
        {liveMatches.length > 0 && (
          <AnimatedSection delay={0.15}>
            <section className="space-y-3">
              <h2 className="label-bold text-coral uppercase tracking-widest">
                Live Now ({liveMatches.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveMatches.map((m) => (
                  <MatchAdminCard key={m.id} match={serializeMatch(m)} />
                ))}
              </div>
            </section>
          </AnimatedSection>
        )}

        {/* Scheduled matches */}
        <AnimatedSection delay={0.2}>
          <section className="space-y-3">
            <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
              Scheduled ({scheduledMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scheduledMatches.map((m) => (
                <MatchAdminCard key={m.id} match={serializeMatch(m)} />
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Finished matches */}
        {finishedMatches.length > 0 && (
          <AnimatedSection delay={0.25}>
            <section className="space-y-3">
              <h2 className="label-bold text-on-surface-variant uppercase tracking-widest">
                Finished ({finishedMatches.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {finishedMatches.map((m) => (
                  <MatchAdminCard key={m.id} match={serializeMatch(m)} />
                ))}
              </div>
            </section>
          </AnimatedSection>
        )}
      </main>
    </>
  );
}
