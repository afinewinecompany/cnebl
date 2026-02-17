"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OutsInputProps {
  outs: number;
  onOutsChange: (outs: number) => void;
  onThreeOuts?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * OutsInput Component
 * Touch-friendly outs tracker with visual feedback
 *
 * Features:
 * - 3 large tappable circles (minimum 48x48px for accessibility)
 * - Visual feedback on tap with scale animation
 * - Filled circles indicate recorded outs
 * - Auto-advance callback when 3 outs reached
 * - Accessible with keyboard navigation and ARIA labels
 *
 * @example
 * <OutsInput
 *   outs={2}
 *   onOutsChange={(outs) => setOuts(outs)}
 *   onThreeOuts={() => setShowAdvanceDialog(true)}
 * />
 */
export function OutsInput({
  outs,
  onOutsChange,
  onThreeOuts,
  disabled = false,
  className,
}: OutsInputProps) {
  const [lastTapTime, setLastTapTime] = React.useState(0);
  const DEBOUNCE_MS = 300; // Prevent accidental double-taps

  const handleOutClick = React.useCallback(
    (outNumber: number) => {
      const now = Date.now();
      if (now - lastTapTime < DEBOUNCE_MS) return;
      setLastTapTime(now);

      if (disabled) return;

      // If clicking an already-filled out, unfill it (and all after it)
      if (outNumber <= outs) {
        onOutsChange(outNumber - 1);
      } else {
        // Fill up to this out
        const newOuts = outNumber;
        onOutsChange(newOuts);

        // Trigger callback when 3 outs reached
        if (newOuts === 3 && onThreeOuts) {
          // Small delay to allow visual feedback before dialog
          setTimeout(() => {
            onThreeOuts();
          }, 300);
        }
      }
    },
    [outs, onOutsChange, onThreeOuts, disabled, lastTapTime]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, outNumber: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOutClick(outNumber);
      }
    },
    [handleOutClick]
  );

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
        Outs
      </span>

      <div
        className="flex items-center gap-4"
        role="group"
        aria-label={`Outs: ${outs} of 3`}
      >
        {[1, 2, 3].map((outNumber) => {
          const isFilled = outNumber <= outs;
          return (
            <motion.button
              key={outNumber}
              type="button"
              onClick={() => handleOutClick(outNumber)}
              onKeyDown={(e) => handleKeyDown(e, outNumber)}
              disabled={disabled}
              whileTap={{ scale: 0.9 }}
              className={cn(
                // Base styles - large touch target
                "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full",
                "border-4 transition-all duration-200",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-navy/30",
                // Filled state
                isFilled
                  ? "bg-cardinal border-cardinal shadow-lg"
                  : "bg-white border-gray-300 hover:border-cardinal/50",
                // Disabled state
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Out ${outNumber}: ${isFilled ? "recorded" : "not recorded"}`}
              aria-pressed={isFilled}
            >
              {/* Inner circle indicator */}
              <motion.div
                initial={false}
                animate={{
                  scale: isFilled ? 1 : 0,
                  opacity: isFilled ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-2 rounded-full bg-white/20"
              />

              {/* Out number */}
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "font-mono text-xl font-bold",
                  isFilled ? "text-white" : "text-gray-400"
                )}
              >
                {outNumber}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Quick reset button */}
      {outs > 0 && !disabled && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={() => onOutsChange(0)}
          className={cn(
            "mt-3 px-4 py-2 text-sm text-gray-500 hover:text-cardinal",
            "underline underline-offset-4 transition-colors",
            "min-h-[44px] flex items-center justify-center"
          )}
        >
          Clear outs
        </motion.button>
      )}
    </div>
  );
}

export default OutsInput;
