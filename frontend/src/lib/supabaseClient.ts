"use client";

let supabaseSingleton: any | null = null;

export async function getSupabaseClient(): Promise<any> {
  if (supabaseSingleton) return supabaseSingleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !key) {
    console.warn("Supabase env not configured. Auth will be disabled.");
  }
  const { createClient } = await import("@supabase/supabase-js");
  supabaseSingleton = createClient(url || "", key || "");
  try {
    // Persist user id whenever auth state changes (requirement: save as supabase_user_id)
    // IMPORTANT: Only update if we get an authenticated user ID, never remove the anonymous ID
    supabaseSingleton.auth.onAuthStateChange(async (_event: string, session: any) => {
      try {
        if (typeof window === 'undefined') return;
        const uid = session?.user?.id;
        if (uid) {
          // Only overwrite with authenticated user ID
          localStorage.setItem('supabase_user_id', uid);
        }
        // DON'T remove supabase_user_id when session is null - keep anonymous ID
      } catch {/* ignore */}
    });
    // Seed immediately if session exists (only if authenticated)
    if (typeof window !== 'undefined') {
      supabaseSingleton.auth.getSession().then(({ data }: any) => {
        const uid = data?.session?.user?.id;
        // Only set if we have an authenticated user
        if (uid) localStorage.setItem('supabase_user_id', uid);
      }).catch(()=>{});
    }
  } catch {/* ignore listener errors */}
  return supabaseSingleton;
}

// Note: prefer using `getSupabaseClient()` to obtain a client instance in components
// We avoid creating a second client at module load to prevent duplicated listeners
