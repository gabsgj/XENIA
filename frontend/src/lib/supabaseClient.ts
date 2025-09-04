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
    supabaseSingleton.auth.onAuthStateChange(async (_event: string, session: any) => {
      try {
        if (typeof window === 'undefined') return;
        const uid = session?.user?.id;
        if (uid) {
          localStorage.setItem('supabase_user_id', uid);
        } else {
          localStorage.removeItem('supabase_user_id');
        }
      } catch {/* ignore */}
    });
    // Seed immediately if session exists
    if (typeof window !== 'undefined') {
      supabaseSingleton.auth.getSession().then(({ data }: any) => {
        const uid = data?.session?.user?.id;
        if (uid) localStorage.setItem('supabase_user_id', uid);
      }).catch(()=>{});
    }
  } catch {/* ignore listener errors */}
  return supabaseSingleton;
}

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
