import { redirect } from "next/navigation";
import Image from "next/image";
import { Crown, Medal, Trophy } from "@phosphor-icons/react/dist/ssr";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AnimatedSection from "@/components/AnimatedSection";

export const metadata = { title: "Leaderboard — PRODEPT 2026" };

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, allUsers, pointsAgg, countsAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, isAdmin: true },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, image: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      _sum: { points: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      _count: true,
    }),
  ]);

  if (!user) redirect("/login");

  // Build lookup maps from aggregated data
  const pointsMap = new Map(pointsAgg.map((p) => [p.userId, p._sum.points ?? 0]));
  const countsMap = new Map(countsAgg.map((c) => [c.userId, c._count]));

  // Build ranked list
  const ranked = allUsers
    .map((u) => ({
      id: u.id,
      name: u.name,
      image: u.image,
      totalPoints: pointsMap.get(u.id) ?? 0,
      totalPredictions: countsMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalPredictions - a.totalPredictions);

  const myIndex = ranked.findIndex((u) => u.id === userId);
  const myRank = myIndex >= 0 ? myIndex + 1 : ranked.length + 1;
  const top3 = ranked.slice(0, 3);

  // Podium icons
  const PODIUM_ICONS = [
    { Icon: Crown, color: "#FFD700", label: "1st" },
    { Icon: Medal, color: "#C0C0C0", label: "2nd" },
    { Icon: Medal, color: "#CD7F32", label: "3rd" },
  ];

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

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
        {/* Header */}
        <AnimatedSection>
          <section className="pt-6 md:pt-10 pb-2 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="label-bold text-primary-fixed tracking-widest">
                FIFA WORLD CUP 2026
              </p>
              <h1 className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]">
                LEADER
                <span style={{ color: "var(--color-primary-fixed)" }}>BOARD</span>
              </h1>
              <p className="text-on-surface-variant text-sm">
                You are ranked <span className="text-primary-fixed font-bold">#{myRank}</span> of {ranked.length} players
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

        {/* Podium — Top 3 */}
        {top3.length > 0 && (
          <AnimatedSection delay={0.15}>
            <section className="space-y-3">
              <h2 className="label-bold text-gold uppercase tracking-widest">
                <Trophy size={14} weight="fill" className="inline mr-1" />
                Top Predictors
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {/* Reorder for visual podium: 2nd, 1st, 3rd */}
                {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
                  if (!entry) return <div key={visualIdx} />;
                  const actualRank = ranked.indexOf(entry) + 1;
                  const podium = PODIUM_ICONS[actualRank - 1];
                  const isMe = entry.id === userId;
                  const isFirst = actualRank === 1;

                  return (
                    <div
                      key={entry.id}
                      className={[
                        "glass-card flex flex-col items-center gap-2 py-4 px-2 text-center relative",
                        isFirst ? "md:-mt-4" : "",
                        isMe ? "ring-2 ring-primary-fixed" : "",
                      ].join(" ")}
                    >
                      {podium && (
                        <podium.Icon
                          size={isFirst ? 28 : 22}
                          weight="fill"
                          style={{ color: podium.color }}
                        />
                      )}
                      {entry.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={entry.image}
                          alt={entry.name}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2"
                          style={{ borderColor: podium?.color ?? "var(--color-outline-variant)" }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 font-bold text-sm select-none"
                          style={{
                            borderColor: podium?.color ?? "var(--color-outline-variant)",
                            background: "var(--color-surface-container-high)",
                            color: "var(--color-on-surface)",
                          }}
                        >
                          {getInitials(entry.name)}
                        </div>
                      )}
                      <p className="text-on-surface font-bold text-xs md:text-sm truncate max-w-full">
                        {entry.name}
                        {isMe && (
                          <span className="text-primary-fixed ml-1 text-[0.6rem]">YOU</span>
                        )}
                      </p>
                      <p
                        className="font-display tabular-nums"
                        style={{
                          color: podium?.color ?? "var(--color-primary-fixed)",
                          fontSize: isFirst ? "var(--text-headline-md)" : "1.25rem",
                          lineHeight: 1,
                        }}
                      >
                        {entry.totalPoints}
                      </p>
                      <span className="label-bold text-on-surface-variant" style={{ fontSize: "0.6rem" }}>
                        {entry.totalPredictions} picks
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </AnimatedSection>
        )}

        {/* Full rankings */}
        <AnimatedSection delay={0.25}>
          <section className="space-y-3">
            <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
              Full Rankings
            </h2>
            <div className="space-y-2">
              {ranked.map((entry, idx) => {
                const rank = idx + 1;
                const isMe = entry.id === userId;

                return (
                  <div
                    key={entry.id}
                    className={[
                      "flex items-center gap-3 rounded-full px-3 py-2 transition-all",
                      isMe
                        ? "border-2 border-primary-fixed"
                        : "border border-outline-variant",
                    ].join(" ")}
                    style={
                      isMe
                        ? {
                            background: "color-mix(in srgb, var(--color-primary-fixed) 10%, var(--color-surface-container))",
                            boxShadow: "0 0 16px color-mix(in srgb, var(--color-primary-fixed) 25%, transparent)",
                          }
                        : { background: "var(--color-surface-container)" }
                    }
                  >
                    {/* Rank */}
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 font-bold text-sm select-none"
                      style={
                        rank <= 3
                          ? {
                              background: PODIUM_ICONS[rank - 1].color,
                              color: rank === 1 ? "#1a1200" : rank === 2 ? "#1a1a1a" : "#1a0a00",
                            }
                          : {
                              background: "var(--color-surface-container-high)",
                              color: "var(--color-on-surface-variant)",
                            }
                      }
                    >
                      {rank}
                    </span>

                    {/* Name */}
                    <span
                      className={[
                        "flex-1 min-w-0 truncate font-semibold",
                        isMe ? "text-primary-fixed" : "text-on-surface",
                      ].join(" ")}
                      style={{ fontSize: "var(--text-body-md)" }}
                    >
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 label-bold text-primary-fixed-dim" style={{ fontSize: "0.6875rem" }}>
                          YOU
                        </span>
                      )}
                    </span>

                    {/* Predictions count */}
                    <span
                      className="shrink-0 text-on-surface-variant"
                      style={{ fontSize: "var(--text-label-bold)" }}
                    >
                      {entry.totalPredictions} picks
                    </span>

                    {/* Points */}
                    <span className="shrink-0 font-display tabular-nums text-primary-fixed text-lg" style={{ lineHeight: 1 }}>
                      {entry.totalPoints}
                    </span>
                    <span className="shrink-0 label-bold text-on-surface-variant" style={{ fontSize: "var(--text-label-bold)" }}>
                      pts
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </AnimatedSection>
      </main>

      <BottomNav />
    </>
  );
}
