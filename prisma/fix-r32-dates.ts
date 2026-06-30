/**
 * Set Round of 32 match dates/venues to the official FIFA schedule,
 * keyed by the two teams in each match (robust — no positional zip).
 * Times below are venue-local; toUTC converts to the stored UTC instant.
 *
 * Dry run:  DRY_RUN=1 npx tsx prisma/fix-r32-dates.ts
 * Apply:    npx tsx prisma/fix-r32-dates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

function toUTC(date: string, time: string, utcOffset: number): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(h - utcOffset, m, 0, 0);
  return d;
}

// Keyed by home+away code. Times are venue-local (offset = venue UTC offset).
const R32_DATES: { home: string; away: string; date: Date; venue: string }[] = [
  { home: "RSA", away: "CAN", date: toUTC("2026-06-28", "12:00", -7), venue: "SoFi Stadium, Los Angeles" },
  { home: "BRA", away: "JPN", date: toUTC("2026-06-29", "12:00", -5), venue: "NRG Stadium, Houston" },
  { home: "GER", away: "PAR", date: toUTC("2026-06-29", "16:30", -4), venue: "Gillette Stadium, Foxborough" },
  { home: "NED", away: "MAR", date: toUTC("2026-06-29", "19:00", -6), venue: "Estadio BBVA, Monterrey" },
  { home: "CIV", away: "NOR", date: toUTC("2026-06-30", "12:00", -5), venue: "AT&T Stadium, Dallas" },
  { home: "FRA", away: "SWE", date: toUTC("2026-06-30", "17:00", -4), venue: "MetLife Stadium, East Rutherford" },
  { home: "MEX", away: "ECU", date: toUTC("2026-06-30", "19:00", -6), venue: "Estadio Azteca, Mexico City" },
  { home: "ENG", away: "COD", date: toUTC("2026-07-01", "12:00", -4), venue: "Mercedes-Benz Stadium, Atlanta" },
  { home: "BEL", away: "SEN", date: toUTC("2026-07-01", "13:00", -7), venue: "Lumen Field, Seattle" },
  { home: "USA", away: "BIH", date: toUTC("2026-07-01", "17:00", -7), venue: "Levi's Stadium, Santa Clara" },
  { home: "ESP", away: "AUT", date: toUTC("2026-07-02", "12:00", -7), venue: "SoFi Stadium, Los Angeles" },
  { home: "POR", away: "CRO", date: toUTC("2026-07-02", "19:00", -4), venue: "BMO Field, Toronto" },
  { home: "SUI", away: "ALG", date: toUTC("2026-07-02", "20:00", -7), venue: "BC Place, Vancouver" },
  { home: "AUS", away: "EGY", date: toUTC("2026-07-03", "13:00", -5), venue: "AT&T Stadium, Dallas" },
  { home: "ARG", away: "CPV", date: toUTC("2026-07-03", "18:00", -4), venue: "Hard Rock Stadium, Miami" },
  { home: "COL", away: "GHA", date: toUTC("2026-07-03", "20:30", -5), venue: "Arrowhead Stadium, Kansas City" },
];

async function main() {
  console.log(`📅 Setting Round of 32 dates${DRY_RUN ? " (DRY RUN)" : ""}...\n`);

  const allTeams = await prisma.team.findMany();
  const byCode = new Map(allTeams.map((t) => [t.code, t]));

  const matches = await prisma.match.findMany({
    where: { stage: "ROUND_OF_32" },
    include: { homeTeam: true, awayTeam: true },
  });

  let updated = 0;
  for (const fix of R32_DATES) {
    const home = byCode.get(fix.home);
    const away = byCode.get(fix.away);
    if (!home || !away) throw new Error(`Unknown team code: ${fix.home}/${fix.away}`);

    const match = matches.find((m) => m.homeTeamId === home.id && m.awayTeamId === away.id);
    if (!match) {
      console.log(`  ⚠️  No R32 match found for ${fix.home} vs ${fix.away}`);
      continue;
    }

    const before = `${match.matchDate.toISOString()}  ${match.venue}`;
    const after = `${fix.date.toISOString()}  ${fix.venue}`;
    const arg = new Date(fix.date.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");

    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: match.id },
        data: { matchDate: fix.date, venue: fix.venue },
      });
    }
    updated++;
    console.log(`  ${fix.home} vs ${fix.away}`);
    console.log(`      before: ${before}`);
    console.log(`      after:  ${after}   (ARG ${arg})`);
  }

  console.log(`\n${DRY_RUN ? "🔍 DRY RUN — nothing written." : "✅ Updated"} ${updated}/16 R32 matches.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
