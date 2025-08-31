"use client";

import { deriveErrorCode, ERROR_DESCRIPTIONS } from "@/lib/errors";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ApiError = Error & {
  errorCode: string;
  errorMessage: string;
  status: number;
  details?: unknown;
  correlationId?: string | null;
};

function buildApiError(path: string, status: number, bodyText: string, jsonBody: any | null, correlationId: string | null): ApiError {
  const serverCode = jsonBody?.errorCode as string | undefined;
  const serverMsg = (jsonBody?.errorMessage as string | undefined) || (jsonBody?.error as string | undefined);
  const details = jsonBody?.details ?? jsonBody ?? bodyText;
  const derived = deriveErrorCode(path, status, serverCode);
  const message = serverMsg || ERROR_DESCRIPTIONS[derived] || "Unexpected error";
  const err = new Error(`${derived}: ${message}`) as ApiError;
  err.errorCode = derived;
  err.errorMessage = message;
  err.status = status;
  err.details = details;
  err.correlationId = correlationId;
  return err;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (typeof window === "undefined") return {};
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!envUrl || !envKey) return {};
    const { getSupabaseClient } = await import("@/lib/supabaseClient");
    const supabase = await getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return {};
    return { "X-User-Id": userId };
  } catch {
    return {};
  }
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const hasBody = typeof (opts as any).body !== "undefined" && (opts as any).body !== null;
  const baseHeaders: Record<string, string> = { ...(opts.headers as any), ...authHeaders } as any;
  if (hasBody && !("Content-Type" in baseHeaders)) {
    baseHeaders["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: baseHeaders,
    ...opts,
  });
  const correlationId = res.headers.get("x-correlation-id");
  let json: any | null = null;
  let text = "";
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      json = await res.json();
    } else {
      text = await res.text();
    }
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw buildApiError(path, res.status, text, json, correlationId);
  }
  return (json as T) ?? (JSON.parse(text || "{}") as T);
}
