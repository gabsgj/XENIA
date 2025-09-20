import React, { useEffect, useState } from "react";

export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`bg-white dark:bg-muted/70 shadow-sm border border-gray-100 dark:border-muted/40 rounded-lg p-6 transition-all duration-300 ease-out transform ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      } ${className}`}
    >
      {children}
    </div>
  );
}
