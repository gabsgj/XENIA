"use client";
import { useEffect } from "react";

const WAKE_URL = "https://xenia-backend-1f0z.onrender.com/health";

function fetchWithTimeout(url: string, timeout = 5000) {
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeout);

    fetch(url, { method: "GET", cache: "no-store" })
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function WakeBackend() {
  useEffect(() => {
    let mounted = true;

    const attempt = async (delayMs: number) => {
      try {
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
        await fetchWithTimeout(WAKE_URL, 5000);
      } catch {
        // ignore; warming is best-effort
      }
    };

    // Fire-and-forget warmup attempts: immediately, then after 3s and 8s
    attempt(0);
    attempt(3000);
    attempt(8000);

    return () => {
      mounted = false; // reserved if we add state later
    };
  }, []);

  return null;
}
