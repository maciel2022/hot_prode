/**
 * Calculate group standings from finished matches and assign real teams
 * to Round of 32 knockout matches.
 *
 * Run with: npx tsx prisma/assign-knockout-teams.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Group standings calculation ──────────────────────────────────────────────

type Standing = {
  teamId: string;
  teamCode: string;
  teamName: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function compareStandings(a: Standing, b: Standing): number {
  // 1. Points
  if (b.points !== a.points) return b.points - a.points;
  // 2. Goal difference
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  // 3. Goals for
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  // 4. Alphabetical (tiebreaker)
  return a.teamCode.localeCompare(b.teamCode);
}

// ── Round of 32 bracket definition ───────────────────────────────────────────
// Each entry maps a match (by venue+date key) to the bracket slots.
// "1A" = 1st of Group A, "2B" = 2nd of Group B, "3rd" = best third place team

const R32_BRACKET: {
  venue: string;
  homeSlot: string; // e.g. "2A", "1E", "1A"
  awaySlot: string; // e.g. "2B", "3rd", "3rd"
}[] = [
  { venue: "SoFi Stadium, Los Angeles",           homeSlot: "2A", awaySlot: "2B" },    // Match 73
  { venue: "Gillette Stadium, Foxborough",         homeSlot: "1E", awaySlot: "3rd" },   // Match 74
  { venue: "Estadio BBVA, Monterrey",              homeSlot: "1F", awaySlot: "2C" },    // Match 75
  { venue: "NRG Stadium, Houston",                 homeSlot: "1C", awaySlot: "2F" },    // Match 76
  { venue: "MetLife Stadium, East Rutherford",     homeSlot: "1I", awaySlot: "3rd" },   // Match 77
  { venue: "AT&T Stadium, Dallas",                 homeSlot: "2E", awaySlot: "2I" },    // Match 78 (first one at Dallas)
  { venue: "Estadio Azteca, Mexico City",          homeSlot: "1A", awaySlot: "3rd" },   // Match 79
  { venue: "Mercedes-Benz Stadium, Atlanta",       homeSlot: "1L", awaySlot: "3rd" },   // Match 80
  { venue: "Levi's Stadium, Santa Clara",          homeSlot: "1D", awaySlot: "3rd" },   // Match 81
  { venue: "Lumen Field, Seattle",                 homeSlot: "1G", awaySlot: "3rd" },   // Match 82
  { venue: "BMO Field, Toronto",                   homeSlot: "2K", awaySlot: "2L" },    // Match 83
  { venue: "SoFi Stadium, Los Angeles",            homeSlot: "1H", awaySlot: "2J" },    // Match 84 (second at SoFi)
  { venue: "BC Place, Vancouver",                  homeSlot: "1B", awaySlot: "3rd" },   // Match 85
  { venue: "Hard Rock Stadium, Miami",             homeSlot: "1J", awaySlot: "2H" },    // Match 86
  { venue: "Arrowhead Stadium, Kansas City",       homeSlot: "1K", awaySlot: "3rd" },   // Match 87
  { venue: "AT&T Stadium, Dallas",                 homeSlot: "2D", awaySlot: "2G" },    // Match 88 (second at Dallas)
];

// Match dates for R32 to disambiguate same-venue matches
const R32_DATES = [
  "2026-06-28", // 73
  "2026-06-29", // 74
  "2026-06-29", // 75
  "2026-06-29", // 76
  "2026-06-30", // 77
  "2026-06-30", // 78
  "2026-06-30", // 79
  "2026-07-01", // 80
  "2026-07-01", // 81
  "2026-07-01", // 82
  "2026-07-02", // 83
  "2026-07-02", // 84
  "2026-07-02", // 85
  "2026-07-03", // 86
  "2026-07-03", // 87
  "2026-07-03", // 88
];

// ── Third-place assignment ───────────────────────────────────────────────────
// The 8 best third-placed teams are assigned to the "3rd" slots.
// We assign them in order to the slots, trying to avoid same-group clashes
// with the group winner they face.

const THIRD_PLACE_SLOTS = [
  { matchIndex: 1, facesGroupWinner: "E" },  // Match 74: 1E vs 3rd
  { matchIndex: 4, facesGroupWinner: "I" },  // Match 77: 1I vs 3rd
  { matchIndex: 6, facesGroupWinner: "A" },  // Match 79: 1A vs 3rd
  { matchIndex: 7, facesGroupWinner: "L" },  // Match 80: 1L vs 3rd
  { matchIndex: 8, facesGroupWinner: "D" },  // Match 81: 1D vs 3rd
  { matchIndex: 9, facesGroupWinner: "G" },  // Match 82: 1G vs 3rd
  { matchIndex: 12, facesGroupWinner: "B" }, // Match 85: 1B vs 3rd
  { matchIndex: 14, facesGroupWinner: "K" }, // Match 87: 1K vs 3rd
];

async function main() {
  console.log("🏆 Assigning real teams to Round of 32...\n");

  // ── 1. Get all teams ───────────────────────────────────────────────────────
  const allTeams = await prisma.team.findMany();
  const teamsByCode = new Map(allTeams.map((t) => [t.code, t]));
  const teamsById = new Map(allTeams.map((t) => [t.id, t]));

  // ── 2. Get all finished group matches ──────────────────────────────────────
  const groupMatches = await prisma.match.findMany({
    where: { stage: "GROUP", status: "FINISHED" },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  console.log(`Found ${groupMatches.length} finished group matches.\n`);

  // ── 3. Calculate standings ─────────────────────────────────────────────────
  const standingsMap = new Map<string, Standing>();

  // Initialize all teams
  for (const team of allTeams) {
    if (team.code === "TBD" || team.group === "-") continue;
    standingsMap.set(team.id, {
      teamId: team.id,
      teamCode: team.code,
      teamName: team.name,
      group: team.group,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  // Process matches
  for (const match of groupMatches) {
    if (match.homeScore == null || match.awayScore == null) continue;

    const home = standingsMap.get(match.homeTeamId);
    const away = standingsMap.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  // ── 4. Group standings by group ────────────────────────────────────────────
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const groupStandings = new Map<string, Standing[]>();

  for (const g of groups) {
    const teams = [...standingsMap.values()]
      .filter((s) => s.group === g)
      .sort(compareStandings);
    groupStandings.set(g, teams);
  }

  // Print standings
  console.log("📊 GROUP STANDINGS:\n");
  for (const g of groups) {
    const standings = groupStandings.get(g)!;
    console.log(`  Group ${g}:`);
    standings.forEach((s, i) => {
      const pos = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
      console.log(`    ${pos} ${s.teamCode} — ${s.points}pts (${s.won}W ${s.drawn}D ${s.lost}L) GD:${s.goalDifference > 0 ? "+" : ""}${s.goalDifference}`);
    });
  }

  // ── 5. Determine qualifiers ────────────────────────────────────────────────
  // 1st and 2nd from each group
  const firstPlace = new Map<string, Standing>();
  const secondPlace = new Map<string, Standing>();
  const thirdPlaceAll: Standing[] = [];

  for (const g of groups) {
    const standings = groupStandings.get(g)!;
    firstPlace.set(g, standings[0]);
    secondPlace.set(g, standings[1]);
    if (standings[2]) thirdPlaceAll.push(standings[2]);
  }

  // Best 8 third-placed teams
  thirdPlaceAll.sort(compareStandings);
  const bestThirds = thirdPlaceAll.slice(0, 8);
  const eliminatedThirds = thirdPlaceAll.slice(8);

  console.log("\n🏅 BEST 8 THIRD-PLACED TEAMS:");
  bestThirds.forEach((s, i) => {
    console.log(`    ${i + 1}. ${s.teamCode} (Group ${s.group}) — ${s.points}pts GD:${s.goalDifference > 0 ? "+" : ""}${s.goalDifference}`);
  });
  console.log("\n❌ ELIMINATED THIRDS:");
  eliminatedThirds.forEach((s) => {
    console.log(`    ${s.teamCode} (Group ${s.group}) — ${s.points}pts`);
  });

  // ── 6. Assign third-placed teams to slots ──────────────────────────────────
  // Assign avoiding same-group clashes
  const assignedThirds = new Map<number, Standing>(); // matchIndex → standing
  const usedThirds = new Set<string>();

  for (const slot of THIRD_PLACE_SLOTS) {
    // First try: find a third that is NOT from the same group as the winner they face
    let assigned = bestThirds.find(
      (t) => !usedThirds.has(t.teamId) && t.group !== slot.facesGroupWinner
    );
    // Fallback: any unassigned third
    if (!assigned) {
      assigned = bestThirds.find((t) => !usedThirds.has(t.teamId));
    }
    if (assigned) {
      assignedThirds.set(slot.matchIndex, assigned);
      usedThirds.add(assigned.teamId);
    }
  }

  // ── 7. Resolve slots to team IDs ──────────────────────────────────────────
  function resolveSlot(slot: string, matchIndex: number): string | null {
    if (slot === "3rd") {
      const third = assignedThirds.get(matchIndex);
      return third?.teamId ?? null;
    }
    const pos = slot[0]; // "1" or "2"
    const group = slot.slice(1); // "A", "B", etc.
    if (pos === "1") return firstPlace.get(group)?.teamId ?? null;
    if (pos === "2") return secondPlace.get(group)?.teamId ?? null;
    return null;
  }

  // ── 8. Get R32 matches from DB and update ──────────────────────────────────
  const r32Matches = await prisma.match.findMany({
    where: { stage: "ROUND_OF_32" },
    orderBy: { matchDate: "asc" },
  });

  console.log(`\n⚽ ROUND OF 32 ASSIGNMENTS:\n`);

  // Sort R32 matches by date to align with our bracket definition
  const sortedR32 = r32Matches.sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime());

  // Match them by index (both arrays are ordered by date)
  for (let i = 0; i < sortedR32.length && i < R32_BRACKET.length; i++) {
    const match = sortedR32[i];
    const bracket = R32_BRACKET[i];

    const homeTeamId = resolveSlot(bracket.homeSlot, i);
    const awayTeamId = resolveSlot(bracket.awaySlot, i);

    if (!homeTeamId || !awayTeamId) {
      console.log(`  ⚠️  Match ${i + 73}: Could not resolve ${bracket.homeSlot} vs ${bracket.awaySlot}`);
      continue;
    }

    const homeTeam = teamsById.get(homeTeamId);
    const awayTeam = teamsById.get(awayTeamId);

    await prisma.match.update({
      where: { id: match.id },
      data: { homeTeamId, awayTeamId },
    });

    const slotLabel = `${bracket.homeSlot} vs ${bracket.awaySlot}`;
    console.log(`  Match ${i + 73}: ${homeTeam?.code} vs ${awayTeam?.code}  (${slotLabel})`);
  }

  console.log("\n✅ Round of 32 teams assigned! You can now test knockout predictions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
