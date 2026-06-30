import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pentru server (Route Handlers, Server Components).
 * Citește sesiunea din cookie-uri, deci `supabase.auth.getUser()` știe
 * cine e userul logat.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Apelat dintr-un Server Component fără context de scriere.
            // Poate fi ignorat dacă ai un middleware care reîmprospătează sesiunea.
          }
        },
      },
    }
  );
}
