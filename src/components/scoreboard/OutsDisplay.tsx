"use client";

import { cn } from "@/lib/utils";

interface OutsDisplayProps {
  /** Current number of outs (0-3) */
  outs: number | null;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional className for styling */
  className?: string;
}

/**
 * OutsDisplay Component
 * Visual counter showing current outs with filled/unfilled indicators
 * Classic baseball scoreboard style with diamond shapes
 *
 * @example
 * <OutsDisplay outs={2} />
 * <OutsDisplay outs={1} size="lg" />
 */
export function OutsDisplay({ outs, size = "md", className }: OutsDisplayProps) {
  const currentOuts = outs ?? 0;

  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
    lg: "w-5 h-5",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div
      className={cn("flex items-center", gapClasses[size], className)}
      role="img"
      aria-label={`${currentOuts} out${currentOuts !== 1 ? "s" : ""}`}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            sizeClasses[size],
            "rotate-45 border-2 transition-all duration-200",
            index < currentOuts
              ? "bg-gold border-gold shadow-[0_0_6px_rgba(201,162,39,0.5)]"
              : "bg-transparent border-cream/40"
          )}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">{currentOuts} outs</span>
    </div>
  );
}

export default OutsDisplay;
