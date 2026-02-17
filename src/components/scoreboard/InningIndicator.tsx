"use client";

import { cn } from "@/lib/utils";
import type { GameStatus, InningHalf } from "@/types";
import { ChevronUp, ChevronDown } from "lucide-react";

interface InningIndicatorProps {
  /** Current inning number */
  inning: number | null;
  /** Top or bottom of inning */
  half: InningHalf | null;
  /** Game status */
  status: GameStatus;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show text label (e.g., "Top 7th") */
  showLabel?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * InningIndicator Component
 * Displays current inning with arrow indicating top/bottom half
 * Shows "Final" or other status for completed/special games
 *
 * @example
 * <InningIndicator inning={7} half="top" status="in_progress" />
 * <InningIndicator inning={9} half={null} status="final" />
 */
export function InningIndicator({
  inning,
  half,
  status,
  size = "md",
  showLabel = false,
  className,
}: InningIndicatorProps) {
  // Handle non-in-progress states
  if (status === "final") {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold uppercase tracking-wider",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          "text-cream",
          className
        )}
      >
        <span className="bg-charcoal/80 px-2 py-0.5 rounded">Final</span>
      </div>
    );
  }

  if (status === "postponed") {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold uppercase tracking-wider",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          "text-gold",
          className
        )}
      >
        <span className="bg-charcoal/80 px-2 py-0.5 rounded">PPD</span>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold uppercase tracking-wider",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          "text-gold",
          className
        )}
      >
        <span className="bg-charcoal/80 px-2 py-0.5 rounded">SUSP</span>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold uppercase tracking-wider",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          "text-charcoal-light",
          className
        )}
      >
        <span className="bg-charcoal/80 px-2 py-0.5 rounded">CAN</span>
      </div>
    );
  }

  if (status === "scheduled" || status === "warmup") {
    return (
      <div
        className={cn(
          "flex items-center justify-center font-mono font-bold uppercase tracking-wider",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          "text-cream/70",
          className
        )}
      >
        <span>{status === "warmup" ? "Warmup" : "---"}</span>
      </div>
    );
  }

  // In-progress game
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const getOrdinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="status"
      aria-label={`${half === "top" ? "Top" : "Bottom"} of the ${getOrdinal(inning ?? 1)}`}
    >
      {/* Arrow indicator */}
      <div className="flex flex-col items-center">
        {half === "top" ? (
          <ChevronUp
            className={cn(iconSizes[size], "text-gold")}
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className={cn(iconSizes[size], "text-gold")}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Inning number */}
      <span
        className={cn(
          "font-mono font-bold text-cream tabular-nums",
          textSizes[size]
        )}
      >
        {inning ?? "-"}
      </span>

      {/* Optional text label */}
      {showLabel && (
        <span className="ml-1 text-xs text-cream/60 uppercase tracking-wide">
          {half === "top" ? "Top" : "Bot"}
        </span>
      )}
    </div>
  );
}

export default InningIndicator;
