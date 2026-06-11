/**
 * Simulate all group stage matches with random scores.
 * Run with: npx tsx prisma/simulate-groups.ts
 */

import { PrismaClient } from "@prisma/client";
import { calculatePoints } from "../src/lib/points";

const prisma = new PrismaClient();

function randomScore(): number {
  // Weighted random: more realistic scores (0-3 common, 4-5 rare)
  const weights = [25, 30, 25, 12, 5, 3]; // 0,1,2,3,4,5
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 1;
}

async function main() {
  // Get all group stage matches that are SCHEDULED
  const matches = await prisma.match.findMany({
    where: { stage: "GROUP", status: "SCHEDULED" },
    orderBy: { matchDate: "asc" },
  });

  console.log(`Found ${matches.length} group stage matches to simulate.\n`);

  for (const match of matches) {
    const homeScore = randomScore();
    const awayScore = randomScore();

    // Update match with result
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore,
        awayScore,
        status: "FINISHED",
      },
    });

    // Recalculate points for all predictions on this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId: match.id },
    });

    for (const pred of predictions) {
      const points = calculatePoints(
        pred.homeScore,
        pred.awayScore,
        homeScore,
        awayScore,
        false, // group stage, no knockout bonus
      );

      await prisma.prediction.update({
        where: { id: pred.id },
        data: { points },
      });
    }

    console.log(`  Match ${match.id.slice(0, 8)}... → ${homeScore}-${awayScore} (${predictions.length} predictions updated)`);
  }

  console.log(`\n✅ Simulated ${matches.length} group stage matches.`);
  console.log("Now you can test knockout predictions with penalty tiebreakers!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
