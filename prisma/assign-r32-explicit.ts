/**
 * Assign Round of 32 teams from the REAL bracket (ground truth provided by admin),
 * matching DB R32 matches in chronological order to an explicit (home, away) list.
 *
 * Dry run:  DRY_RUN=1 npx tsx prisma/assign-r32-explicit.ts
 * Apply:    npx tsx prisma/assign-r32-explicit.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

// Real Round of 32, in chronological order (home, away) by team code.
// Verified against the FIFA venue/date order, which matches the DB date order.
const R32: { home: string; away: string }[] = [
  { home: "RSA", away: "CAN" }, // Match 73 — Jun 28
  { home: "GER", away: "PAR" }, // Match 74 — Jun 29
  { home: "NED", away: "MAR" }, // Match 75 — Jun 29
  { home: "BRA", away: "JPN" }, // Match 76 — Jun 29
  { home: "FRA", away: "SWE" }, // Match 77 — Jun 30
  { home: "CIV", away: "NOR" }, // Match 78 — Jun 30
  { home: "MEX", away: "ECU" }, // Match 79 — Jun 30
  { home: "ENG", away: "COD" }, // Match 80 — Jul 1
  { home: "USA", away: "BIH" }, // Match 81 — Jul 1
  { home: "BEL", away: "SEN" }, // Match 82 — Jul 1
  { home: "POR", away: "CRO" }, // Match 83 — Jul 2
  { home: "ESP", away: "AUT" }, // Match 84 — Jul 2
  { home: "SUI", away: "ALG" }, // Match 85 — Jul 3
  { home: "ARG", away: "CPV" }, // Match 86 — Jul 3
  { home: "COL", away: "GHA" }, // Match 87 — Jul 3
  { home: "AUS", away: "EGY" }, // Match 88 — Jul 3
];

async function main() {
  console.log(`🏆 Assigning Round of 32 teams${DRY_RUN ? " (DRY RUN)" : ""}...\n`);

  const allTeams = await prisma.team.findMany();
  const byCode = new Map(allTeams.map((t) => [t.code, t]));

  const matches = await prisma.match.findMany({
    where: { stage: "ROUND_OF_32" },
    orderBy: { matchDate: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  if (matches.length !== R32.length) {
    throw new Error(`Expected ${R32.length} R32 matches, found ${matches.length}. Aborting.`);
  }

  // Validate every code resolves before touching the DB
  for (const { home, away } of R32) {
    if (!byCode.get(home)) throw new Error(`Unknown team code: ${home}`);
    if (!byCode.get(away)) throw new Error(`Unknown team code: ${away}`);
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const home = byCode.get(R32[i].home)!;
    const away = byCode.get(R32[i].away)!;
    const date = m.matchDate.toISOString().slice(0, 10);
    const from = `${m.homeTeam.code} vs ${m.awayTeam.code}`;
    const to = `${home.code} vs ${away.code}`;

    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: m.id },
        data: { homeTeamId: home.id, awayTeamId: away.id },
      });
    }
    console.log(`  Match ${i + 73} (${date}): ${from.padEnd(12)} -> ${to}   ${home.name} vs ${away.name}`);
  }

  console.log(DRY_RUN ? "\n🔍 DRY RUN — nothing written." : "\n✅ Round of 32 teams assigned.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
