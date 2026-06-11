"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_STYLES, buildAvatarUrl } from "@/lib/avatar";
import type { AvatarStyle } from "@/lib/avatar";

export async function updateName(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Name is required." };
  }

  const trimmed = name.trim();
  if (trimmed.length > 50) {
    return { error: "Name cannot exceed 50 characters." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmed },
    });
  } catch {
    return { error: "Could not update name. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/leagues");
  revalidatePath("/");
  return {};
}

export async function updateAvatar(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const style = formData.get("style") as string | null;
  if (!style || !AVATAR_STYLES.includes(style as AvatarStyle)) {
    return { error: "Invalid avatar style." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  if (!user) return { error: "User not found." };

  const url = buildAvatarUrl(style as AvatarStyle, user.name);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    });
  } catch {
    return { error: "Could not update avatar. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/leagues");
  revalidatePath("/");
  return {};
}
