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

    (async () => {
      try {
        // Try once immediately, don't block UI
        await fetchWithTimeout(WAKE_URL, 5000);
        if (mounted) {
          // no-op, backend should be awake
        }
      } catch (err) {
        // Swallow errors; this is a best-effort ping
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
