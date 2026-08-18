import "server-only";
import { cookies } from "next/headers";
import { normalizarTema, TEMA_COOKIE, type Tema } from "@/lib/tema";

/** Server Component / Server Action: lê o tema do cookie. */
export async function lerTema(): Promise<Tema> {
  const store = await cookies();
  return normalizarTema(store.get(TEMA_COOKIE)?.value);
}
