"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_COOKIE } from "@/lib/athlete";

/** Troca o atleta em foco. A RLS garante que só valha para atletas acessíveis. */
export async function switchAthlete(athleteId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COOKIE, athleteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
