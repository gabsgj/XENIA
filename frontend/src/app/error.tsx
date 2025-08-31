"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { console.error(error) }, [error]);
  const code = (error as any)?.errorCode || "500";
  const message = (error as any)?.errorMessage || error.message || "Something went wrong.";
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-3xl font-extrabold">{code} – Internal Server Error</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => reset()}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  )
}

