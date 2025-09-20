import React from "react";

export default function Pill({ active = false, onClick, children }: { active?: boolean; onClick?: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 text-sm font-medium ${
        active ? "bg-primary text-primary-foreground border-primary shadow" : "bg-transparent text-muted-foreground border-gray-200 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
