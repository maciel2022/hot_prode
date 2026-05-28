import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { Table, Trophy, ArrowRight } from "@phosphor-icons/react/dist/ssr";

import type { MatchStage } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import MatchCard from "@/components/MatchCard";
import CountryFlag from "@/components/CountryFlag";
import AnimatedSection from "@/components/AnimatedSection";
import GroupSelector from "./GroupSelector";
import { GROUP_COLORS, KNOCKOUT_STAGES } from "./constants";

type Props = {
  searchParams: Promise<{ group?: string; phase?: string; stage?: string }>;
};

export default async function GroupsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { group: groupParam, phase: phaseParam, stage: stageParam } = await searchParams;
  const phase = phaseParam ?? "groups";
  const selectedGroup = (groupParam ?? "A").toUpperCase();
  const selectedStage = stageParam ?? "ROUND_OF_32";

  const [user, teams, groupMatches, knockoutMatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, isAdmin: true },
    }),
    phase === "groups"
      ? prisma.team.findMany({
          where: { group: selectedGroup },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    phase === "groups"
      ? prisma.match.findMany({
          where: { stage: "GROUP", group: selectedGroup, status: "FINISHED" },
          select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        })
      : Promise.resolve([]),
    phase === "knockouts"
      ? prisma.match.findMany({
          where: { stage: selectedStage as MatchStage },
          orderBy: { matchDate: "asc" },
          include: {
            homeTeam: { select: { name: true, code: true, flagUrl: true } },
            awayTeam: { select: { name: true, code: true, flagUrl: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  if (!user) redirect("/login");

  // Calculate group standings from finished matches
  type Standing = { mp: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };
  const standingsMap = new Map<string, Standing>();

  for (const team of teams) {
    standingsMap.set(team.id, { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
  }

  for (const m of groupMatches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const home = standingsMap.get(m.homeTeamId);
    const away = standingsMap.get(m.awayTeamId);
    if (home) {
      home.mp++; home.gf += m.homeScore; home.ga += m.awayScore;
      if (m.homeScore > m.awayScore) { home.w++; home.pts += 3; }
      else if (m.homeScore === m.awayScore) { home.d++; home.pts += 1; }
      else { home.l++; }
      home.gd = home.gf - home.ga;
    }
    if (away) {
      away.mp++; away.gf += m.awayScore; away.ga += m.homeScore;
      if (m.awayScore > m.homeScore) { away.w++; away.pts += 3; }
      else if (m.awayScore === m.homeScore) { away.d++; away.pts += 1; }
      else { away.l++; }
      away.gd = away.gf - away.ga;
    }
  }

  // Sort teams by PTS desc → GD desc → GF desc
  const sortedTeams = [...teams].sort((a, b) => {
    const sa = standingsMap.get(a.id)!;
    const sb = standingsMap.get(b.id)!;
    return sb.pts - sa.pts || sb.gd - sa.gd || sb.gf - sa.gf;
  });

  const groupColor = GROUP_COLORS[selectedGroup] ?? { bg: "#36ffc4", text: "#000" };
  const stageData = KNOCKOUT_STAGES.find((s) => s.key === selectedStage);
  const stageLabel = stageData?.label ?? selectedStage;
  const stageColor = { bg: stageData?.bg ?? "#7000ff", text: stageData?.text ?? "#fff" };

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
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <AnimatedSection>
        <section className="pt-6 md:pt-10 pb-2 flex items-center justify-between gap-3">
          <div className="space-y-1 md:space-y-2 min-w-0">
            <p className="label-bold text-primary-fixed tracking-widest">
              FIFA WORLD CUP 2026
            </p>
            <h1
              className="font-display text-on-surface leading-none text-[3rem] md:text-[4rem] lg:text-[5rem]"
            >
              {phase === "groups" ? (
                <>GROUP <span style={{ color: "var(--color-primary-fixed)" }}>STAGE</span></>
              ) : (
                <>KNOCK<span style={{ color: "var(--color-primary-fixed)" }}>OUTS</span></>
              )}
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base">
              USA · Mexico · Canada 2026
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

        {/* ── Selector ─────────────────────────────────────────────── */}
        <AnimatedSection delay={0.1}>
        <Suspense fallback={<div className="h-20" />}>
          <GroupSelector />
        </Suspense>
        </AnimatedSection>

        {/* ── GROUPS PHASE ─────────────────────────────────────────── */}
        {phase === "groups" && (
          <AnimatedSection delay={0.2}>
          <section className="space-y-4 md:space-y-6">
            {/* Group header */}
            <div
              className="rounded-xl md:rounded-2xl p-4 md:p-6 flex items-center gap-3 md:gap-6"
              style={{ background: `linear-gradient(135deg, ${groupColor.bg}20, ${groupColor.bg}08)`, border: `1px solid ${groupColor.bg}40` }}
            >
              <div
                className="shrink-0 w-9 h-9 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center font-display text-base md:text-3xl"
                style={{ background: groupColor.bg, color: groupColor.text }}
              >
                {selectedGroup}
              </div>
              <div>
                <h2
                  className="font-display text-on-surface leading-none text-sm md:text-2xl"
                >
                  GROUP {selectedGroup}
                </h2>
                <p className="text-on-surface-variant mt-0.5 md:mt-1 text-[0.65rem] md:text-sm">
                  {teams.length} teams · Group Stage
                </p>
              </div>
            </div>

            {/* Standings table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "color-mix(in srgb, var(--color-surface-container) 60%, transparent)",
                backdropFilter: "blur(12px) saturate(1.4)",
                WebkitBackdropFilter: "blur(12px) saturate(1.4)",
                border: `1px solid ${groupColor.bg}30`,
              }}
            >
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${groupColor.bg}, ${groupColor.bg}60)` }}
                aria-hidden="true"
              />

              {/* Table header */}
              <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-4 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_40%,transparent)]">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Table size={16} weight="fill" className="md:hidden" style={{ color: groupColor.bg }} />
                  <Table size={18} weight="fill" className="hidden md:block" style={{ color: groupColor.bg }} />
                  <span className="label-bold text-on-surface tracking-widest text-[0.65rem] md:text-sm">
                    STANDINGS
                  </span>
                </div>
                <span
                  className="label-bold tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[0.6rem] md:text-xs"
                  style={{ background: `${groupColor.bg}20`, color: groupColor.bg }}
                >
                  GROUP {selectedGroup}
                </span>
              </div>

              {/* Table — horizontal scroll only on this container */}
              <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full">
                  <thead>
                    <tr
                      className="border-b border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)]"
                      style={{ background: "var(--color-surface-container-low)" }}
                    >
                      <th className="text-left pl-4 md:pl-6 pr-1 md:pr-2 py-2.5 md:py-5 label-bold text-on-surface-variant tracking-widest text-[0.6rem] md:text-xs sticky left-0 z-10" style={{ background: "var(--color-surface-container-low)" }}>
                        TEAM
                      </th>
                      {["MP", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((col) => (
                        <th
                          key={col}
                          className={[
                            "py-2.5 md:py-5 label-bold tracking-widest text-center text-[0.6rem] md:text-xs",
                            col === "PTS" ? "pr-4 md:pr-6" : "px-1 md:px-4 lg:px-5",
                            col === "PTS" ? "" : "text-on-surface-variant",
                          ].join(" ")}
                          style={col === "PTS" ? { color: groupColor.bg } : undefined}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">
                          No teams in Group {selectedGroup} yet.
                        </td>
                      </tr>
                    ) : (
                      sortedTeams.map((team, index) => {
                        const isQualified = index < 2;
                        const s = standingsMap.get(team.id)!;
                        return (
                          <tr
                            key={team.id}
                            className="border-b border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] last:border-0 transition-colors hover:bg-[color-mix(in_srgb,var(--color-surface-container-high)_40%,transparent)]"
                          >
                            <td className="pl-4 md:pl-6 pr-1 md:pr-2 py-3 md:py-5 sticky left-0 z-10" style={{ background: "var(--color-surface-container)" }}>
                              <div className="flex items-center gap-1.5 md:gap-4">
                                <span
                                  className="shrink-0 w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[0.6rem] md:text-sm font-bold"
                                  style={
                                    isQualified
                                      ? { background: `${groupColor.bg}30`, color: groupColor.bg }
                                      : { background: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }
                                  }
                                >
                                  {index + 1}
                                </span>
                                <CountryFlag
                                  code={team.code}
                                  className="w-5 h-4 md:w-10 md:h-7 lg:w-12 lg:h-8"
                                />
                                <span className="font-semibold text-on-surface leading-tight text-[0.65rem] md:text-base lg:text-lg whitespace-nowrap">
                                  {team.name}
                                </span>
                              </div>
                            </td>
                            {/* MP, W, D, L, GF, GA, GD */}
                            {[s.mp, s.w, s.d, s.l, s.gf, s.ga, s.gd].map((val, i) => (
                              <td key={i} className="py-3 md:py-5 px-1 md:px-4 lg:px-5 text-center text-on-surface-variant tabular-nums text-[0.65rem] md:text-base lg:text-lg">
                                {val}
                              </td>
                            ))}
                            {/* PTS */}
                            <td className="py-3 md:py-5 pr-4 md:pr-6 text-center tabular-nums">
                              <span
                                className="font-display text-sm md:text-2xl lg:text-3xl"
                                style={{
                                  lineHeight: 1,
                                  color: isQualified ? groupColor.bg : "var(--color-on-surface-variant)",
                                }}
                              >
                                {s.pts}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="px-4 md:px-6 py-2 md:py-4 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: groupColor.bg }} aria-hidden="true" />
                <span className="text-on-surface-variant text-xs md:text-sm">
                  Qualifies for Knockouts
                </span>
              </div>
            </div>
          </section>
          </AnimatedSection>
        )}

        {/* ── KNOCKOUTS PHASE ──────────────────────────────────────── */}
        {phase === "knockouts" && (
          <AnimatedSection delay={0.2}>
          <section className="space-y-4 md:space-y-6">
            {/* Stage header */}
            <div
              className="rounded-xl md:rounded-2xl p-4 md:p-6 flex items-center gap-3 md:gap-6"
              style={{ background: `linear-gradient(135deg, ${stageColor.bg}20, ${stageColor.bg}08)`, border: `1px solid ${stageColor.bg}40` }}
            >
              <div
                className="shrink-0 w-9 h-9 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex items-center justify-center"
                style={{ background: stageColor.bg, color: stageColor.text }}
              >
                <Trophy size={18} weight="fill" className="md:hidden" />
                <Trophy size={28} weight="fill" className="hidden md:block" />
              </div>
              <div>
                <h2
                  className="font-display text-on-surface leading-none text-sm md:text-2xl"
                >
                  {stageLabel.toUpperCase()}
                </h2>
                <p className="text-on-surface-variant mt-0.5 md:mt-1 text-[0.65rem] md:text-sm">
                  Knockout stage · Single match
                </p>
              </div>
            </div>

            {/* Matches */}
            {knockoutMatches.length === 0 ? (
              <div className="glass-card p-4 md:p-6 text-center space-y-2 md:space-y-3">
                <Trophy size={36} className="text-on-surface-variant mx-auto md:hidden" />
                <Trophy size={48} className="text-on-surface-variant mx-auto hidden md:block" />
                <p className="text-on-surface-variant text-sm md:text-lg">
                  The {stageLabel} matches will be determined after the group stage ends.
                </p>
                <p className="text-on-surface-variant text-xs md:text-sm">
                  Check back after the group stage wraps up.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {knockoutMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    matchId={match.id}
                    homeTeam={{
                      name: match.homeTeam.name,
                      code: match.homeTeam.code,
                    }}
                    awayTeam={{
                      name: match.awayTeam.name,
                      code: match.awayTeam.code,
                    }}
                    matchDate={match.matchDate}
                    stage={match.stage}
                    status={match.status}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    penaltyWinner={match.penaltyWinner}
                  />
                ))}
              </div>
            )}

            {/* Road to the final */}
            <div className="glass-card p-4 md:p-6 rounded-xl">
              <p className="label-bold text-on-surface-variant tracking-widest mb-3 md:mb-4 text-[0.65rem] md:text-sm">
                ROAD TO THE FINAL
              </p>
              <div className="flex items-center gap-1 md:gap-3 flex-wrap md:flex-nowrap pb-2">
                {KNOCKOUT_STAGES.map((s, i) => {
                  const isActive = s.key === selectedStage;
                  return (
                    <div key={s.key} className="flex items-center gap-1 md:gap-3 shrink-0">
                      <div
                        className="px-1.5 md:px-4 py-1 md:py-2 rounded-lg text-center whitespace-nowrap text-[0.5rem] md:text-xs font-bold"
                        style={
                          isActive
                            ? { background: s.bg, color: s.text }
                            : { background: `${s.bg}15`, color: s.bg, border: `1px solid ${s.bg}30` }
                        }
                      >
                        {s.label}
                      </div>
                      {i < KNOCKOUT_STAGES.length - 1 && (
                        <ArrowRight size={10} className="text-on-surface-variant shrink-0 md:hidden" />
                      )}
                      {i < KNOCKOUT_STAGES.length - 1 && (
                        <ArrowRight size={14} className="text-on-surface-variant shrink-0 hidden md:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          </AnimatedSection>
        )}
      </main>

      <BottomNav />
    </>
  );
}
