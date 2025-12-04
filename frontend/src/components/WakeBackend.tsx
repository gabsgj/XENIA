"use client";
import { useEffect } from "react";

const WAKE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`;

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
    // Wake backend only once when the app loads
    const wakeBackend = async () => {
      try {
        await fetchWithTimeout(WAKE_URL, 5000);
        console.log('Backend wake call successful');
      } catch (error) {
        // Silently ignore errors - warming is best-effort
        console.log('Backend wake call failed (non-critical):', error);
      }
    };

    // Call once immediately when component mounts
    wakeBackend();
  }, []);

  return null;
}
