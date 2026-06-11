"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Generate a random 6-character alphanumeric code (uppercase)
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit confusable chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Create League ─────────────────────────────────────────────────────────────

export async function createLeague(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "League name is required." };
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 60) {
    return { error: "Name cannot exceed 60 characters." };
  }

  // Handle custom or auto-generated invite code
  const VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rawCode = formData.get("code");
  const customCode =
    typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";

  let code = "";

  if (customCode.length > 0) {
    // Validate custom code
    if (customCode.length !== 6) {
      return { error: "Custom code must be exactly 6 characters." };
    }
    if (![...customCode].every((c) => VALID_CHARS.includes(c))) {
      return { error: "Code can only contain letters (A-Z, no I/O) and numbers (2-9)." };
    }
    const existing = await prisma.league.findUnique({
      where: { code: customCode },
    });
    if (existing) {
      return { error: "That code is already taken. Try another one." };
    }
    code = customCode;
  } else {
    // Generate a unique invite code (retry up to 5 times on collision)
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode();
      const existing = await prisma.league.findUnique({
        where: { code: candidate },
      });
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return { error: "Could not generate a unique code. Please try again." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: {
          name: trimmedName,
          code,
          isGlobal: false,
          ownerId: userId,
        },
      });

      await tx.leagueMember.create({
        data: {
          leagueId: league.id,
          userId: userId,
        },
      });
    });
  } catch {
    return { error: "Could not create the league. Please try again." };
  }

  revalidatePath("/leagues");
  return {};
}

// ── Join League ───────────────────────────────────────────────────────────────

export async function joinLeague(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const code = formData.get("code");
  if (typeof code !== "string" || code.trim().length === 0) {
    return { error: "Invite code is required." };
  }

  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode.length !== 6) {
    return { error: "Code must be 6 characters." };
  }

  const league = await prisma.league.findUnique({
    where: { code: normalizedCode },
  });

  if (!league) {
    return { error: "No league found with that code." };
  }

  // Check if already a member
  const existing = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: userId,
      },
    },
  });

  if (existing) {
    return { error: "You are already a member of this league." };
  }

  try {
    await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: userId,
      },
    });
  } catch {
    return { error: "Could not join the league. Please try again." };
  }

  revalidatePath("/leagues");
  return {};
}

// ── Delete League ────────────────────────────────────────────────────────────

export async function deleteLeague(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const leagueId = formData.get("leagueId") as string;
  if (!leagueId) return { error: "Invalid league." };

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { isGlobal: true, ownerId: true },
  });

  if (!league) return { error: "League not found." };
  if (league.isGlobal) return { error: "Cannot delete the main league." };
  if (league.ownerId !== userId) return { error: "Only the owner can delete this league." };

  try {
    await prisma.league.delete({
      where: { id: leagueId },
    });
  } catch {
    return { error: "Could not delete the league. Please try again." };
  }

  revalidatePath("/leagues");
  return {};
}

// ── Leave League ─────────────────────────────────────────────────────────────

export async function leaveLeague(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const leagueId = formData.get("leagueId") as string;
  if (!leagueId) return { error: "Invalid league." };

  // Prevent leaving global leagues or owner leaving own league
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { isGlobal: true, ownerId: true },
  });

  if (!league) return { error: "League not found." };
  if (league.isGlobal) return { error: "You cannot leave the main league." };
  if (league.ownerId === userId) return { error: "Owners cannot leave their own league." };

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });

  if (!membership) return { error: "You are not a member of this league." };

  try {
    await prisma.leagueMember.delete({
      where: { id: membership.id },
    });
  } catch {
    return { error: "Could not leave the league. Please try again." };
  }

  revalidatePath("/leagues");
  return {};
}
