"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorProvider } from "@/lib/error-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ErrorProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorProvider>
  );
}

