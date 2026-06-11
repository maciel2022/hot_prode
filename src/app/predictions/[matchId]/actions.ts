"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function savePrediction(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated. Please sign in." };
  const userId = session.user.id;

  // ── 2. Extract & validate form fields ─────────────────────────────────────
  const matchId = (formData.get("matchId") as string | null)?.trim();
  const homeScoreRaw = formData.get("homeScore") as string | null;
  const awayScoreRaw = formData.get("awayScore") as string | null;

  if (!matchId) return { error: "Invalid match." };
  if (homeScoreRaw === null || homeScoreRaw === "")
    return { error: "Enter the home score." };
  if (awayScoreRaw === null || awayScoreRaw === "")
    return { error: "Enter the away score." };

  const homeScore = parseInt(homeScoreRaw, 10);
  const awayScore = parseInt(awayScoreRaw, 10);

  if (isNaN(homeScore) || homeScore < 0 || homeScore > 99)
    return { error: "Home score must be between 0 and 99." };
  if (isNaN(awayScore) || awayScore < 0 || awayScore > 99)
    return { error: "Away score must be between 0 and 99." };

  // ── 3. Verify match exists and predictions are still open ───────────────────
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, status: true, stage: true, matchDate: true },
  });

  if (!match) return { error: "Match not found." };

  // ── Special exception: first match allows predictions until 10 min before end
  const FIRST_MATCH_ID = "cmpjv3s32001dxndp0u0y8ril";
  const isFirstMatch = match.id === FIRST_MATCH_ID;

  if (isFirstMatch) {
    // Allow predictions until 10 minutes before match ends (kickoff + 110 min)
    const matchEndMinus10 = new Date(match.matchDate.getTime() + 110 * 60 * 1000);
    if (match.status === "FINISHED" || new Date() >= matchEndMinus10) {
      return { error: "Predictions for this match are already closed." };
    }
  } else {
    if (match.status !== "SCHEDULED") {
      return { error: "Predictions for this match are already closed." };
    }

    if (new Date() >= match.matchDate) {
      return { error: "Predictions for this match are already closed. The match has started." };
    }
  }

  // ── 3b. Handle penalty winner for knockout draws ──────────────────────────
  const isKnockout = match.stage !== "GROUP";
  const isDraw = homeScore === awayScore;
  const penaltyWinnerRaw = formData.get("penaltyWinner") as string | null;
  let penaltyWinner: string | null = null;

  if (isKnockout && isDraw) {
    if (!penaltyWinnerRaw || !["home", "away"].includes(penaltyWinnerRaw)) {
      return { error: "Pick who wins on penalties." };
    }
    penaltyWinner = penaltyWinnerRaw;
  }

  // ── 4. Upsert prediction ───────────────────────────────────────────────────
  await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: userId,
        matchId,
      },
    },
    create: {
      userId: userId,
      matchId,
      homeScore,
      awayScore,
      penaltyWinner,
    },
    update: {
      homeScore,
      awayScore,
      penaltyWinner,
    },
  });

  // ── 5. Redirect back to predictions list ───────────────────────────────────
  redirect("/predictions");
}
