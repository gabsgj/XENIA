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
  return supabaseSingleton;
}

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
