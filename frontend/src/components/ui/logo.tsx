"use client";

import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  variant?: "default" | "icon-only";
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12",
  xl: "w-16 h-16"
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl", 
  xl: "text-3xl"
};

export function Logo({ 
  size = "md", 
  className = "", 
  showText = true, 
  variant = "default" 
}: LogoProps) {
  const logoSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  const LogoIcon = () => (
    <div className={`${logoSize} ${className}`}>
      <svg viewBox="0 0 32 32" className="w-full h-full text-primary" fill="currentColor">
        {/* Book base */}
        <path d="M2 24 L30 24 L28 28 L4 28 Z" fill="currentColor"/>
        
        {/* Book pages */}
        <path d="M4 24 L28 24 L26 20 L16 20 L16 6 L6 6 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
        <path d="M16 20 L26 20 L28 24 L16 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
        
        {/* Brain circle */}
        <circle cx="16" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        
        {/* Brain bubble pointer */}
        <path d="M12 18 L10 22 L16 20 Z" fill="currentColor"/>
        
        {/* Brain outline */}
        <path d="M12 8 C10 7, 8 8, 8 10 C7 9, 6 10, 6 12 C6 14, 7 15, 9 15 C8 16, 8 18, 10 19 C12 20, 14 19, 16 17 C18 19, 20 20, 22 19 C24 18, 24 16, 23 15 C25 15, 26 14, 26 12 C26 10, 25 9, 24 10 C24 8, 23 7, 22 8 C22 7, 20 6, 18 7 C17 6, 15 6, 14 7 C13 6, 12 7, 12 8 Z" 
              fill="none" stroke="currentColor" strokeWidth="1"/>
        
        {/* Brain neural connections */}
        <circle cx="12" cy="12" r="0.8" fill="currentColor"/>
        <circle cx="16" cy="10" r="0.8" fill="currentColor"/>
        <circle cx="20" cy="13" r="0.8" fill="currentColor"/>
        <circle cx="14" cy="15" r="0.8" fill="currentColor"/>
        
        {/* Neural pathways */}
        <path d="M12 12 L16 10 M16 10 L20 13 M12 12 L14 15 M20 13 L14 15" 
              stroke="currentColor" strokeWidth="0.5" fill="none"/>
      </svg>
    </div>
  );

  if (variant === "icon-only" || !showText) {
    return <LogoIcon />;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon />
      <span className={`font-bold ${textSize} tracking-tight text-foreground`}>
        XENIA
      </span>
    </div>
  );
}
