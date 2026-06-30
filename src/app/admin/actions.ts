"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/points";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) redirect("/");
  return session.user.id;
}

// ── Update match status ──────────────────────────────────────────────────────

export async function updateMatchStatus(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const matchId = formData.get("matchId") as string;
  const status = formData.get("status") as string;

  if (!matchId || !["SCHEDULED", "LIVE", "FINISHED"].includes(status)) {
    return { error: "Invalid match or status." };
  }

  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: status as "SCHEDULED" | "LIVE" | "FINISHED" },
    });
  } catch {
    return { error: "Could not update match status." };
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  revalidatePath("/");
  return {};
}

// ── Submit match result + recalculate points ─────────────────────────────────

export async function submitMatchResult(
  formData: FormData
): Promise<{ error?: string; recalculated?: number }> {
  await requireAdmin();

  const matchId = formData.get("matchId") as string;
  const homeScoreRaw = formData.get("homeScore") as string;
  const awayScoreRaw = formData.get("awayScore") as string;
  const penaltyWinnerRaw = formData.get("penaltyWinner") as string | null;

  if (!matchId) return { error: "Invalid match." };

  const homeScore = parseInt(homeScoreRaw, 10);
  const awayScore = parseInt(awayScoreRaw, 10);

  if (isNaN(homeScore) || homeScore < 0 || homeScore > 99) {
    return { error: "Home score must be between 0 and 99." };
  }
  if (isNaN(awayScore) || awayScore < 0 || awayScore > 99) {
    return { error: "Away score must be between 0 and 99." };
  }

  // Fetch match to check stage
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { stage: true },
  });
  if (!match) return { error: "Match not found." };

  const isKnockout = match.stage !== "GROUP";
  const isDraw = homeScore === awayScore;
  let penaltyWinner: string | null = null;

  if (isKnockout && isDraw) {
    if (!penaltyWinnerRaw || !["home", "away"].includes(penaltyWinnerRaw)) {
      return { error: "Select the penalty winner for this knockout draw." };
    }
    penaltyWinner = penaltyWinnerRaw;
  }

  // Update match scores + set status to FINISHED
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, penaltyWinner, status: "FINISHED" },
    });
  } catch {
    return { error: "Could not update match result." };
  }

  // Recalculate points for all predictions on this match
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  let recalculated = 0;
  for (const pred of predictions) {
    const points = calculatePoints(
      pred.homeScore,
      pred.awayScore,
      homeScore,
      awayScore,
      isKnockout,
      pred.penaltyWinner,
      penaltyWinner,
    );

    await prisma.prediction.update({
      where: { id: pred.id },
      data: { points },
    });
    recalculated++;
  }

  // Advance the bracket: write this match's winner (or loser) into the
  // next-round slots that are fed by it.
  if (isKnockout) {
    await advanceBracket(matchId);
  }

  revalidatePath("/admin");
  revalidatePath("/predictions");
  revalidatePath("/leagues");
  revalidatePath("/groups");
  revalidatePath("/");
  return { recalculated };
}

// ── Bracket auto-advance ───────────────────────────────────────────────────
// When a knockout match finishes, propagate its winner (and, for the
// third-place match, the semifinal losers) into the matches that reference it
// as a source. Re-running on an edited result simply overwrites the slot.

async function advanceBracket(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      penaltyWinner: true,
    },
  });
  if (!match || match.homeScore == null || match.awayScore == null) return;

  let winnerId: string;
  let loserId: string;
  if (match.homeScore > match.awayScore) {
    winnerId = match.homeTeamId;
    loserId = match.awayTeamId;
  } else if (match.awayScore > match.homeScore) {
    winnerId = match.awayTeamId;
    loserId = match.homeTeamId;
  } else if (match.penaltyWinner === "home") {
    winnerId = match.homeTeamId;
    loserId = match.awayTeamId;
  } else if (match.penaltyWinner === "away") {
    winnerId = match.awayTeamId;
    loserId = match.homeTeamId;
  } else {
    return; // draw with no penalty winner — cannot resolve
  }

  const dependents = await prisma.match.findMany({
    where: {
      OR: [{ homeSourceMatchId: matchId }, { awaySourceMatchId: matchId }],
    },
    select: {
      id: true,
      homeSourceMatchId: true,
      awaySourceMatchId: true,
      homeSourceType: true,
      awaySourceType: true,
    },
  });

  for (const dep of dependents) {
    const data: { homeTeamId?: string; awayTeamId?: string } = {};
    if (dep.homeSourceMatchId === matchId) {
      data.homeTeamId = dep.homeSourceType === "LOSER" ? loserId : winnerId;
    }
    if (dep.awaySourceMatchId === matchId) {
      data.awayTeamId = dep.awaySourceType === "LOSER" ? loserId : winnerId;
    }
    if (data.homeTeamId || data.awayTeamId) {
      await prisma.match.update({ where: { id: dep.id }, data });
    }
  }
}
