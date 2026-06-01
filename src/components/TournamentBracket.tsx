"use client";

import Link from "next/link";
import { Trophy } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import CountryFlag from "@/components/CountryFlag";
import { STAGE_COLORS } from "@/app/groups/constants";

export type BracketMatch = {
  id: string;
  stage: string;
  homeTeam: { name: string; code: string; flagUrl: string };
  awayTeam: { name: string; code: string; flagUrl: string };
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: string | null;
  status: string;
};

type Props = {
  r32: BracketMatch[];
  r16: BracketMatch[];
  quarters: BracketMatch[];
  semis: BracketMatch[];
  final: BracketMatch | null;
  thirdPlace: BracketMatch | null;
};

/* ── Match Slot ─────────────────────────────────────────────── */

function Slot({
  match,
  color,
  mirror,
}: {
  match: BracketMatch | null;
  color: string;
  mirror?: boolean;
}) {
  const finished = match?.status === "FINISHED";
  const homeWin =
    finished &&
    match &&
    (match.homeScore! > match.awayScore! ||
      (match.homeScore === match.awayScore && match.penaltyWinner === match.homeTeam.code));
  const awayWin =
    finished &&
    match &&
    (match.awayScore! > match.homeScore! ||
      (match.homeScore === match.awayScore && match.penaltyWinner === match.awayTeam.code));

  const border = mirror
    ? { borderRight: `2px solid ${color}` }
    : { borderLeft: `2px solid ${color}` };

  const row = (
    team: { code: string } | undefined,
    score: number | null | undefined,
    dim: boolean
  ) => (
    <div
      className="flex items-center gap-1 px-1 py-[3px]"
      style={{ opacity: dim ? 0.35 : 1 }}
    >
      {team ? (
        <>
          <CountryFlag code={team.code} className="w-[14px] h-[10px]" />
          <span className="text-[9px] font-bold text-on-surface flex-1 leading-none">
            {team.code}
          </span>
          <span className="text-[9px] font-display text-on-surface leading-none">
            {score ?? ""}
          </span>
        </>
      ) : (
        <span className="text-[8px] text-on-surface-variant/40 flex-1 text-center">TBD</span>
      )}
    </div>
  );

  const card = (
    <div
      className="rounded shrink-0"
      style={{
        width: 80,
        background: match ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
        border: match
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px dashed rgba(255,255,255,0.1)",
        ...border,
      }}
    >
      {row(match?.homeTeam, match?.homeScore, !!(finished && awayWin))}
      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      {row(match?.awayTeam, match?.awayScore, !!(finished && homeWin))}
    </div>
  );

  return match ? (
    <Link href={`/predictions/${match.id}`} className="hover:brightness-125 transition-all">
      {card}
    </Link>
  ) : (
    card
  );
}

/* ── Connector: merges 2 slots → 1 ─────────────────────────── */

function Connector({ dir = "right" }: { dir?: "right" | "left" }) {
  const side = dir === "right" ? "borderRight" : "borderLeft";
  return (
    <div className="flex flex-col shrink-0" style={{ width: 10 }}>
      <div className="flex-1" style={{ [side]: "1px solid rgba(255,255,255,0.1)", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
      <div className="flex-1" style={{ [side]: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
    </div>
  );
}

function HLine() {
  return <div className="shrink-0 self-center" style={{ width: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }} />;
}

/* ── Column of matches ──────────────────────────────────────── */

function Col({
  matches,
  stage,
  mirror,
  gap,
}: {
  matches: (BracketMatch | null)[];
  stage: string;
  mirror?: boolean;
  gap: number;
}) {
  return (
    <div className="flex flex-col justify-around shrink-0" style={{ gap }}>
      {matches.map((m, i) => (
        <Slot key={m?.id ?? `${stage}-${i}`} match={m} color={STAGE_COLORS[stage] || "#666"} mirror={mirror} />
      ))}
    </div>
  );
}

/* ── Column of connectors ───────────────────────────────────── */

function ConnCol({ count, dir, gap }: { count: number; dir?: "right" | "left"; gap: number }) {
  return (
    <div className="flex flex-col justify-around shrink-0" style={{ gap }}>
      {Array.from({ length: count }, (_, i) => (
        <Connector key={i} dir={dir} />
      ))}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */

function split<T>(arr: T[]): [T[], T[]] {
  const m = Math.ceil(arr.length / 2);
  return [arr.slice(0, m), arr.slice(m)];
}

function pad(matches: BracketMatch[], n: number): (BracketMatch | null)[] {
  const r: (BracketMatch | null)[] = [...matches];
  while (r.length < n) r.push(null);
  return r;
}

/* ── Main ───────────────────────────────────────────────────── */

export default function TournamentBracket({ r32, r16, quarters, semis, final: fin, thirdPlace }: Props) {
  const t = useTranslations("groups");

  const [r32L, r32R] = split(pad(r32, 16));
  const [r16L, r16R] = split(pad(r16, 8));
  const [qfL, qfR] = split(pad(quarters, 4));
  const [sfL, sfR] = split(pad(semis, 2));

  // Slot height ~28px. Gaps double each round to keep vertical alignment.
  const G0 = 2;   // R32
  const G1 = 30;  // R16
  const G2 = 66;  // QF
  const G3 = 138; // SF

  return (
    <div
      className="rounded-xl relative"
      style={{ maxWidth: "100%", overflow: "hidden" }}
    >
      {/* Stadium background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img
          src="/images/backgraound_fifa_2026.png"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <p className="label-bold text-on-surface-variant tracking-widest text-[0.65rem] md:text-sm">
          {t("roadToFinal")}
        </p>
      </div>

      <div
        className="overflow-x-auto pb-4 px-4 md:px-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex items-center w-max">
          {/* LEFT: R32 → R16 → QF → SF */}
          <Col matches={r32L} stage="ROUND_OF_32" gap={G0} />
          <ConnCol count={4} dir="right" gap={G1} />
          <HLine />
          <Col matches={r16L} stage="ROUND_OF_16" gap={G1} />
          <ConnCol count={2} dir="right" gap={G2} />
          <HLine />
          <Col matches={qfL} stage="QUARTER" gap={G2} />
          <ConnCol count={1} dir="right" gap={G3} />
          <HLine />
          <Col matches={sfL} stage="SEMI" gap={G3} />

          {/* Line → Final */}
          <div className="shrink-0 self-center" style={{ width: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }} />

          {/* CENTER */}
          <div className="flex flex-col items-center gap-2 shrink-0 mx-1">
            <Trophy size={20} weight="fill" style={{ color: "#FFD700" }} />
            <Slot match={fin} color={STAGE_COLORS.FINAL} />
            {thirdPlace && (
              <>
                <p className="text-[7px] text-on-surface-variant font-bold tracking-wider mt-1">
                  {t("thirdPlace").toUpperCase()}
                </p>
                <Slot match={thirdPlace} color={STAGE_COLORS.THIRD_PLACE} />
              </>
            )}
          </div>

          {/* Line ← Final */}
          <div className="shrink-0 self-center" style={{ width: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }} />

          {/* RIGHT: SF ← QF ← R16 ← R32 */}
          <Col matches={sfR} stage="SEMI" mirror gap={G3} />
          <HLine />
          <ConnCol count={1} dir="left" gap={G3} />
          <Col matches={qfR} stage="QUARTER" mirror gap={G2} />
          <HLine />
          <ConnCol count={2} dir="left" gap={G2} />
          <Col matches={r16R} stage="ROUND_OF_16" mirror gap={G1} />
          <HLine />
          <ConnCol count={4} dir="left" gap={G1} />
          <Col matches={r32R} stage="ROUND_OF_32" mirror gap={G0} />
        </div>
      </div>
    </div>
  );
}
