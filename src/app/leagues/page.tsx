import { redirect } from "next/navigation";
import Image from "next/image";
import { Globe, Lock, ShareNetwork, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import LeaderboardRow from "@/components/LeaderboardRow";
import AnimatedSection from "@/components/AnimatedSection";
import CreateLeagueModal from "./CreateLeagueModal";
import JoinLeagueModal from "./JoinLeagueModal";
import LeaveLeagueButton from "./LeaveLeagueButton";
import DeleteLeagueButton from "./DeleteLeagueButton";

export default async function LeaguesPage() {
  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const currentUserId = session.user.id;

  // ── 2. Parallel DB queries ────────────────────────────────────────────────────
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, email: true, image: true, isAdmin: true },
    }),
    prisma.leagueMember.findMany({
      where: { userId: currentUserId },
      include: {
        league: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    predictions: {
                      select: { points: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
  ]);
  if (!user) redirect("/login");

  const t = await getTranslations("leagues");

  // ── 4. Build league view models ───────────────────────────────────────────────
  type MemberEntry = {
    userId: string;
    name: string;
    totalPoints: number;
  };

  type LeagueView = {
    id: string;
    name: string;
    code: string;
    isGlobal: boolean;
    ownerId: string;
    members: MemberEntry[];
    myPoints: number;
    myRank: number;
  };

  const leagueViews: LeagueView[] = memberships.map(({ league }) => {
    const members: MemberEntry[] = league.members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        totalPoints: m.user.predictions.reduce((sum, p) => sum + p.points, 0),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const myEntry = members.find((m) => m.userId === currentUserId);
    const myPoints = myEntry?.totalPoints ?? 0;
    const myRank = members.filter((m) => m.totalPoints > myPoints).length + 1;

    return {
      id: league.id,
      name: league.name,
      code: league.code,
      isGlobal: league.isGlobal,
      ownerId: league.ownerId,
      members,
      myPoints,
      myRank,
    };
  });

  // ── 5. Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Ambient background */}
      <div
        className="vibrant-gradient fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.05 }}
        aria-hidden="true"
      />
      <div
        className="pitch-lines fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.4 }}
        aria-hidden="true"
      />

      <Navbar user={{ ...user, image: user.image ?? undefined }} />

      <main className="w-full pt-20 pb-24 px-5 md:px-8 md:max-w-3xl lg:max-w-5xl mx-auto space-y-8 md:space-y-10">
        {/* ── Hero section ────────────────────────────────────────────────── */}
        <AnimatedSection>
        <section className="pt-6 md:pt-10 pb-2 flex items-center justify-between gap-3">
          <div className="space-y-1 md:space-y-2 min-w-0">
            <p className="label-bold text-primary-fixed tracking-widest">
              {t("topLabel")}
            </p>
            <h1
              className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]"
            >
              {t("title")}{" "}
              <span style={{ color: "var(--color-primary-fixed)" }}>{t("titleHighlight")}</span>
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base">
              {leagueViews.length === 0
                ? t("emptySubtitle")
                : leagueViews.length === 1
                  ? t("leagueCount_one", { count: 1 })
                  : t("leagueCount_other", { count: leagueViews.length })}
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

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <AnimatedSection delay={0.1}>
        <section className="space-y-3">
          <CreateLeagueModal />
          <JoinLeagueModal />
        </section>
        </AnimatedSection>

        {/* ── My Leagues list ──────────────────────────────────────────────── */}
        <AnimatedSection delay={0.2}>
        {leagueViews.length > 0 ? (
          <section className="space-y-4 md:space-y-6">
            <h2 className="label-bold text-primary-fixed uppercase tracking-widest">
              {t("yourLeagues")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {leagueViews.map((league) => {
              const top3 = league.members.slice(0, 3);
              const myRankInTop3 = top3.findIndex(
                (m) => m.userId === currentUserId
              );
              const myEntryOutsideTop3 =
                myRankInTop3 === -1
                  ? league.members.find((m) => m.userId === currentUserId)
                  : null;

              return (
                <div key={league.id} className="glass-card p-4 md:p-6 space-y-5">
                  {/* League header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h3
                        className="font-display text-on-surface leading-tight truncate"
                        style={{
                          fontSize: "var(--text-headline-md)",
                          lineHeight: 1.1,
                        }}
                      >
                        {league.name}
                      </h3>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full label-bold"
                        style={{
                          background: league.isGlobal
                            ? "color-mix(in srgb, var(--color-secondary-container) 20%, transparent)"
                            : "color-mix(in srgb, var(--color-primary-fixed) 12%, transparent)",
                          color: league.isGlobal
                            ? "var(--color-secondary)"
                            : "var(--color-primary-fixed-dim)",
                          border: `1px solid ${
                            league.isGlobal
                              ? "color-mix(in srgb, var(--color-secondary-container) 40%, transparent)"
                              : "color-mix(in srgb, var(--color-primary-fixed) 30%, transparent)"
                          }`,
                          fontSize: "0.6875rem",
                        }}
                      >
                        {league.isGlobal ? (
                          <Globe size={14} weight="fill" />
                        ) : (
                          <Lock size={14} weight="fill" />
                        )}
                        {league.isGlobal ? t("classicLeague") : t("privateLeague")}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className="font-display text-primary-fixed leading-none tabular-nums"
                        style={{
                          fontSize: "var(--text-headline-md)",
                        }}
                      >
                        #{league.myRank}
                      </p>
                      <p
                        className="text-on-surface-variant"
                        style={{ fontSize: "var(--text-label-bold)" }}
                      >
                        {t("yourRank")}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-lg p-3 space-y-0.5"
                      style={{ background: "var(--color-surface-container-high)" }}
                    >
                      <p
                        className="label-bold text-on-surface-variant tracking-widest"
                        style={{ fontSize: "0.625rem" }}
                      >
                        {t("totalPoints")}
                      </p>
                      <p
                        className="font-display text-primary-fixed tabular-nums leading-none"
                        style={{
                          fontSize: "var(--text-headline-md)",
                        }}
                      >
                        {league.myPoints}
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-3 space-y-0.5"
                      style={{ background: "var(--color-surface-container-high)" }}
                    >
                      <p
                        className="label-bold text-on-surface-variant tracking-widest"
                        style={{ fontSize: "0.625rem" }}
                      >
                        {t("members")}
                      </p>
                      <p
                        className="font-display text-primary-fixed tabular-nums leading-none"
                        style={{
                          fontSize: "var(--text-headline-md)",
                        }}
                      >
                        {league.members.length}
                      </p>
                    </div>
                  </div>

                  {/* Invite code */}
                  {!league.isGlobal && (
                    <div
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ background: "var(--color-surface-container-low)" }}
                    >
                      <ShareNetwork size={16} className="text-on-surface-variant shrink-0" />
                      <span
                        className="text-on-surface-variant flex-1"
                        style={{ fontSize: "var(--text-label-bold)" }}
                      >
                        {t("inviteCode")}
                      </span>
                      <span
                        className="font-display text-primary-fixed tracking-wider md:tracking-widest tabular-nums text-sm md:text-[1.25rem]"
                      >
                        {league.code}
                      </span>
                    </div>
                  )}

                  {/* Leave / Delete league (private only) */}
                  {!league.isGlobal && (
                    <div className="flex justify-end gap-2">
                      {league.ownerId === currentUserId ? (
                        <DeleteLeagueButton leagueId={league.id} leagueName={league.name} />
                      ) : (
                        <LeaveLeagueButton leagueId={league.id} leagueName={league.name} />
                      )}
                    </div>
                  )}

                  {/* Mini leaderboard */}
                  {top3.length > 0 && (
                    <div className="space-y-2">
                      <p className="label-bold text-on-surface-variant tracking-widest">
                        {t("standings")}
                      </p>
                      <div className="space-y-2">
                        {top3.map((member, idx) => (
                          <LeaderboardRow
                            key={member.userId}
                            rank={idx + 1}
                            name={member.name}
                            points={member.totalPoints}
                            isCurrentUser={member.userId === currentUserId}
                          />
                        ))}
                        {myEntryOutsideTop3 && (
                          <>
                            <div className="flex items-center gap-2 px-2">
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background:
                                    "color-mix(in srgb, var(--color-outline-variant) 40%, transparent)",
                                }}
                              />
                              <span
                                className="text-on-surface-variant"
                                style={{ fontSize: "0.625rem" }}
                              >
                                ···
                              </span>
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background:
                                    "color-mix(in srgb, var(--color-outline-variant) 40%, transparent)",
                                }}
                              />
                            </div>
                            <LeaderboardRow
                              rank={league.myRank}
                              name={myEntryOutsideTop3.name}
                              points={myEntryOutsideTop3.totalPoints}
                              isCurrentUser
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </section>
        ) : (
          <div className="glass-card p-4 md:p-6 text-center space-y-3">
            <UsersThree size={48} className="text-on-surface-variant mx-auto" />
            <p
              className="text-on-surface-variant"
              style={{ fontSize: "var(--text-body-lg)" }}
            >
              {t("noLeagues")}
            </p>
            <p
              className="text-on-surface-variant"
              style={{ fontSize: "var(--text-label-bold)" }}
            >
              {t("noLeaguesHint")}
            </p>
          </div>
        )}
        </AnimatedSection>
      </main>

      <BottomNav />
    </>
  );
}
