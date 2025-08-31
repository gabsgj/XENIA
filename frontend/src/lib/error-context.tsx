"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ERROR_DESCRIPTIONS } from "@/lib/errors";

export type AppErrorPayload = {
  errorCode: string;
  errorMessage?: string;
  details?: unknown;
  correlationId?: string | null;
};

type ErrorContextType = {
  pushError: (err: AppErrorPayload) => void;
  lastError: AppErrorPayload | null;
  clear: () => void;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [lastError, setLastError] = useState<AppErrorPayload | null>(null);
  const counter = useRef(0);

  const pushError = useCallback((err: AppErrorPayload) => {
    setLastError(err);
    const description = err.errorMessage || ERROR_DESCRIPTIONS[err.errorCode] || "An error occurred";
    const id = `${err.errorCode}-${counter.current++}`;
    toast.error(`${err.errorCode}`, {
      id,
      description,
      duration: 6000,
      action: err.correlationId
        ? { label: "Copy CID", onClick: () => navigator.clipboard.writeText(String(err.correlationId)) }
        : undefined,
    });
  }, []);

  const clear = useCallback(() => setLastError(null), []);

  const value = useMemo(() => ({ pushError, lastError, clear }), [pushError, lastError, clear]);
  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

export function useErrorContext(): ErrorContextType {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useErrorContext must be used within ErrorProvider");
  return ctx;
}

