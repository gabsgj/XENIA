"use client";

import { deriveErrorCode, ERROR_DESCRIPTIONS } from "@/lib/errors";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Utility to get the current user ID consistently across the app
export function getUserId(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID(); // Server-side fallback
  }
  
  const stored = localStorage.getItem('supabase_user_id');
  if (stored) {
    return stored;
  }
  
  // Generate new UUID and store it
  const newId = crypto.randomUUID();
  localStorage.setItem('supabase_user_id', newId);
  return newId;
}

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
    
    // Use the consistent getUserId function for authentication
    const userId = getUserId();
    
    return { "X-User-Id": userId };
  } catch {
    return {};
  }
}

// Cache TTL configuration (in ms)
const CACHE_TTL = 5000; // 5 seconds for fresh data
const STALE_TTL = 30000; // 30 seconds for stale-while-revalidate

// Internal fetch function for cache revalidation
async function doFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const body = (opts as any).body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasBody = typeof body !== "undefined" && body !== null;
  const baseHeaders: Record<string, string> = { ...(opts.headers as any), ...authHeaders } as any;
  
  if (hasBody && !isFormData && !("Content-Type" in baseHeaders)) {
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

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  // In-memory dedupe cache with stale-while-revalidate pattern
  const method = (opts.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const dedupeKey = isGet ? `GET:${path}` : '';
  const now = Date.now();
  const g: any = globalThis as any;
  
  if (isGet) {
    g.__xeniaApiCache = g.__xeniaApiCache || new Map<string, { ts: number; data: any; promise?: Promise<any> }>();
    const hit = g.__xeniaApiCache.get(dedupeKey);
    
    // Return fresh cached data immediately
    if (hit && now - hit.ts < CACHE_TTL) {
      return hit.data as T;
    }
    
    // Return stale data but trigger background refresh
    if (hit && now - hit.ts < STALE_TTL) {
      // Revalidate in background (don't await)
      if (!hit.promise) {
        hit.promise = doFetch<T>(path, opts).then(data => {
          g.__xeniaApiCache.set(dedupeKey, { ts: Date.now(), data });
          return data;
        }).catch(() => hit.data).finally(() => {
          const cached = g.__xeniaApiCache.get(dedupeKey);
          if (cached) cached.promise = undefined;
        });
      }
      return hit.data as T;
    }
    
    // Dedupe concurrent requests for same resource
    if (hit?.promise) {
      return hit.promise as Promise<T>;
    }
    
    // Create promise for this request to enable deduplication
    const promise = doFetch<T>(path, opts).then(data => {
      g.__xeniaApiCache.set(dedupeKey, { ts: Date.now(), data });
      return data;
    });
    
    g.__xeniaApiCache.set(dedupeKey, { ts: 0, data: null, promise });
    return promise;
  }
  
  // Non-GET requests don't use cache
  return doFetch<T>(path, opts);
}
