/**
 * Restore demo DB: reset all group matches to SCHEDULED,
 * reassign TBD to knockout matches, remove simulation data.
 *
 * Run with: npx tsx prisma/restore-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Restoring demo database...\n");

  // 1. Reset all group stage matches to SCHEDULED with no scores
  const groupResult = await prisma.match.updateMany({
    where: { stage: "GROUP" },
    data: {
      status: "SCHEDULED",
      homeScore: null,
      awayScore: null,
      penaltyWinner: null,
    },
  });
  console.log(`  ✓ Reset ${groupResult.count} group stage matches to SCHEDULED.`);

  // 2. Get TBD team
  const tbdTeam = await prisma.team.findUnique({ where: { code: "TBD" } });
  if (!tbdTeam) {
    console.log("  ⚠️  TBD team not found, skipping knockout reset.");
  } else {
    // 3. Reset all knockout matches to TBD teams
    const knockoutResult = await prisma.match.updateMany({
      where: {
        stage: { in: ["ROUND_OF_32", "ROUND_OF_16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"] },
      },
      data: {
        homeTeamId: tbdTeam.id,
        awayTeamId: tbdTeam.id,
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null,
        penaltyWinner: null,
      },
    });
    console.log(`  ✓ Reset ${knockoutResult.count} knockout matches to TBD.`);
  }

  // 4. Reset all prediction points to 0
  const predResult = await prisma.prediction.updateMany({
    data: { points: 0 },
  });
  console.log(`  ✓ Reset points for ${predResult.count} predictions.`);

  console.log("\n✅ Demo database restored!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
