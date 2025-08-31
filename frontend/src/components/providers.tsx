"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorProvider } from "@/lib/error-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
      },
    },
  }));
  
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

