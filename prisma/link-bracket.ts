/**
 * Link knockout matches to their bracket feeders, so winners (and the two
 * semifinal losers, for the third-place match) advance automatically when a
 * result is submitted.
 *
 * Source matches:
 *   - Round of 32 are identified by their two team codes (already assigned).
 *   - Round of 16 onward are identified by (stage, venue), which is unique
 *     within each stage.
 *
 * Dry run:  DRY_RUN=1 npx tsx prisma/link-bracket.ts
 * Apply:    npx tsx prisma/link-bracket.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

const V = {
  PHI: "Lincoln Financial Field, Philadelphia",
  HOU: "NRG Stadium, Houston",
  NYC: "MetLife Stadium, East Rutherford",
  MEX: "Estadio Azteca, Mexico City",
  DAL: "AT&T Stadium, Dallas",
  SEA: "Lumen Field, Seattle",
  ATL: "Mercedes-Benz Stadium, Atlanta",
  VAN: "BC Place, Vancouver",
  BOS: "Gillette Stadium, Foxborough",
  LA: "SoFi Stadium, Los Angeles",
  MIA: "Hard Rock Stadium, Miami",
  KC: "Arrowhead Stadium, Kansas City",
};

type SourceRef =
  | { kind: "r32"; codes: [string, string]; type: "WINNER" | "LOSER" }
  | { kind: "stageVenue"; stage: string; venue: string; type: "WINNER" | "LOSER" };

type LinkSpec = {
  target: { stage: string; venue?: string }; // venue omitted for unique-stage targets (FINAL, THIRD_PLACE)
  home: SourceRef;
  away: SourceRef;
};

const r32 = (h: string, a: string): SourceRef => ({ kind: "r32", codes: [h, a], type: "WINNER" });
const win = (stage: string, venue: string): SourceRef => ({ kind: "stageVenue", stage, venue, type: "WINNER" });
const lose = (stage: string, venue: string): SourceRef => ({ kind: "stageVenue", stage, venue, type: "LOSER" });

const LINKS: LinkSpec[] = [
  // ── Round of 16 (sources: R32 winners) ──
  { target: { stage: "ROUND_OF_16", venue: V.PHI }, home: r32("GER", "PAR"), away: r32("FRA", "SWE") },
  { target: { stage: "ROUND_OF_16", venue: V.HOU }, home: r32("RSA", "CAN"), away: r32("NED", "MAR") },
  { target: { stage: "ROUND_OF_16", venue: V.NYC }, home: r32("BRA", "JPN"), away: r32("CIV", "NOR") },
  { target: { stage: "ROUND_OF_16", venue: V.MEX }, home: r32("MEX", "ECU"), away: r32("ENG", "COD") },
  { target: { stage: "ROUND_OF_16", venue: V.DAL }, home: r32("POR", "CRO"), away: r32("ESP", "AUT") },
  { target: { stage: "ROUND_OF_16", venue: V.SEA }, home: r32("USA", "BIH"), away: r32("BEL", "SEN") },
  { target: { stage: "ROUND_OF_16", venue: V.ATL }, home: r32("ARG", "CPV"), away: r32("AUS", "EGY") },
  { target: { stage: "ROUND_OF_16", venue: V.VAN }, home: r32("SUI", "ALG"), away: r32("COL", "GHA") },

  // ── Quarter-finals (sources: R16 winners) ──
  { target: { stage: "QUARTER", venue: V.BOS }, home: win("ROUND_OF_16", V.PHI), away: win("ROUND_OF_16", V.HOU) },
  { target: { stage: "QUARTER", venue: V.LA }, home: win("ROUND_OF_16", V.DAL), away: win("ROUND_OF_16", V.SEA) },
  { target: { stage: "QUARTER", venue: V.MIA }, home: win("ROUND_OF_16", V.NYC), away: win("ROUND_OF_16", V.MEX) },
  { target: { stage: "QUARTER", venue: V.KC }, home: win("ROUND_OF_16", V.ATL), away: win("ROUND_OF_16", V.VAN) },

  // ── Semi-finals (sources: QF winners) ──
  { target: { stage: "SEMI", venue: V.DAL }, home: win("QUARTER", V.BOS), away: win("QUARTER", V.LA) },
  { target: { stage: "SEMI", venue: V.ATL }, home: win("QUARTER", V.MIA), away: win("QUARTER", V.KC) },

  // ── Third place (sources: SEMI losers) ──
  { target: { stage: "THIRD_PLACE" }, home: lose("SEMI", V.DAL), away: lose("SEMI", V.ATL) },

  // ── Final (sources: SEMI winners) ──
  { target: { stage: "FINAL" }, home: win("SEMI", V.DAL), away: win("SEMI", V.ATL) },
];

async function main() {
  console.log(`🔗 Linking knockout bracket feeders${DRY_RUN ? " (DRY RUN)" : ""}...\n`);

  const matches = await prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } });

  const byR32Codes = (h: string, a: string) =>
    matches.find((m) => m.stage === "ROUND_OF_32" && m.homeTeam.code === h && m.awayTeam.code === a);
  const byStageVenue = (stage: string, venue: string) =>
    matches.find((m) => m.stage === stage && m.venue === venue);

  function resolve(ref: SourceRef) {
    return ref.kind === "r32" ? byR32Codes(ref.codes[0], ref.codes[1]) : byStageVenue(ref.stage, ref.venue);
  }
  function label(ref: SourceRef) {
    const m = resolve(ref);
    const who =
      ref.kind === "r32"
        ? `${ref.codes[0]}/${ref.codes[1]}`
        : `${ref.stage}@${ref.venue.split(",")[0]}`;
    return `${ref.type === "LOSER" ? "Loser" : "Winner"}(${who})${m ? "" : " ⚠️NOT FOUND"}`;
  }

  let updated = 0;
  for (const spec of LINKS) {
    const target = spec.target.venue
      ? byStageVenue(spec.target.stage, spec.target.venue)
      : matches.find((m) => m.stage === spec.target.stage);
    if (!target) {
      console.log(`  ⚠️  Target not found: ${spec.target.stage} ${spec.target.venue ?? ""}`);
      continue;
    }
    const homeSrc = resolve(spec.home);
    const awaySrc = resolve(spec.away);
    if (!homeSrc || !awaySrc) {
      console.log(`  ⚠️  Source not found for ${spec.target.stage} ${spec.target.venue ?? ""}`);
      continue;
    }

    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: target.id },
        data: {
          homeSourceMatchId: homeSrc.id,
          awaySourceMatchId: awaySrc.id,
          homeSourceType: spec.home.type,
          awaySourceType: spec.away.type,
        },
      });
    }
    updated++;
    const tname = `${spec.target.stage}@${(spec.target.venue ?? "").split(",")[0] || "—"}`;
    console.log(`  ${tname.padEnd(26)} ← home: ${label(spec.home).padEnd(34)} away: ${label(spec.away)}`);
  }

  console.log(`\n${DRY_RUN ? "🔍 DRY RUN — nothing written." : "✅ Linked"} ${updated}/${LINKS.length} target matches.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
