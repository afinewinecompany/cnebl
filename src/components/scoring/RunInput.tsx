"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RunInputProps {
  battingTeamName: string;
  battingTeamColor?: string;
  isTopInning: boolean;
  onRunsSubmit: (runs: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * RunInput Component
 * Input for recording runs with quick buttons and custom input
 *
 * Features:
 * - Quick buttons for 0, 1, 2, 3 runs
 * - "More" button reveals number input for 4+ runs
 * - Shows which team is batting with team color
 * - Large touch-friendly buttons (minimum 48x48px)
 * - Debounced to prevent double-taps
 *
 * @example
 * <RunInput
 *   battingTeamName="Red Sox"
 *   battingTeamColor="#BE1E2D"
 *   isTopInning={true}
 *   onRunsSubmit={(runs) => handleRecordRuns(runs)}
 * />
 */
export function RunInput({
  battingTeamName,
  battingTeamColor = "#1B3A5F",
  isTopInning,
  onRunsSubmit,
  disabled = false,
  className,
}: RunInputProps) {
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customRuns, setCustomRuns] = React.useState(4);
  const [lastTapTime, setLastTapTime] = React.useState(0);
  const DEBOUNCE_MS = 300;

  const handleQuickRuns = React.useCallback(
    (runs: number) => {
      const now = Date.now();
      if (now - lastTapTime < DEBOUNCE_MS) return;
      setLastTapTime(now);

      if (disabled) return;
      onRunsSubmit(runs);
    },
    [disabled, lastTapTime, onRunsSubmit]
  );

  const handleCustomSubmit = React.useCallback(() => {
    if (disabled) return;
    onRunsSubmit(customRuns);
    setShowCustomInput(false);
    setCustomRuns(4);
  }, [customRuns, disabled, onRunsSubmit]);

  const incrementCustom = () => setCustomRuns((prev) => Math.min(prev + 1, 99));
  const decrementCustom = () => setCustomRuns((prev) => Math.max(prev - 1, 4));

  const quickRunOptions = [0, 1, 2, 3];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Batting Team Indicator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: battingTeamColor }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {isTopInning ? "Top" : "Bottom"} of Inning
        </span>
      </div>

      <div
        className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-lg"
        style={{ backgroundColor: `${battingTeamColor}15` }}
      >
        <span className="font-headline text-lg font-semibold" style={{ color: battingTeamColor }}>
          {battingTeamName}
        </span>
        <span className="text-sm text-gray-500">batting</span>
      </div>

      {/* Runs Label */}
      <span className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide text-center">
        Record Runs This Inning
      </span>

      <AnimatePresence mode="wait">
        {!showCustomInput ? (
          <motion.div
            key="quick-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Quick Run Buttons Grid */}
            <div className="grid grid-cols-4 gap-3">
              {quickRunOptions.map((runs) => (
                <motion.button
                  key={runs}
                  type="button"
                  onClick={() => handleQuickRuns(runs)}
                  disabled={disabled}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    // Large touch target
                    "h-16 sm:h-20 rounded-xl",
                    "bg-white border-2 border-gray-200",
                    "hover:border-field hover:bg-field/5",
                    "active:bg-field active:border-field active:text-white",
                    "transition-all duration-150",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-field/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex flex-col items-center justify-center"
                  )}
                  aria-label={`Record ${runs} run${runs !== 1 ? "s" : ""}`}
                >
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-navy">
                    {runs}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase mt-1">
                    {runs === 1 ? "run" : "runs"}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* More Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowCustomInput(true)}
              disabled={disabled}
              className="w-full min-h-[52px] text-base"
            >
              <Plus className="h-5 w-5 mr-2" />
              4+ Runs
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="custom-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Custom Number Input */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={decrementCustom}
                disabled={disabled || customRuns <= 4}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-14 h-14 rounded-full",
                  "bg-gray-100 hover:bg-gray-200",
                  "flex items-center justify-center",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-navy/30",
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Decrease runs"
              >
                <Minus className="h-6 w-6 text-gray-700" />
              </motion.button>

              <div className="w-24 h-24 rounded-2xl bg-field/10 border-2 border-field flex items-center justify-center">
                <span className="font-mono text-4xl font-bold text-field">
                  {customRuns}
                </span>
              </div>

              <motion.button
                type="button"
                onClick={incrementCustom}
                disabled={disabled || customRuns >= 99}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-14 h-14 rounded-full",
                  "bg-gray-100 hover:bg-gray-200",
                  "flex items-center justify-center",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-4 focus-visible:ring-navy/30",
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Increase runs"
              >
                <Plus className="h-6 w-6 text-gray-700" />
              </motion.button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomRuns(4);
                }}
                disabled={disabled}
                className="flex-1 min-h-[52px]"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="success"
                size="lg"
                onClick={handleCustomSubmit}
                disabled={disabled}
                className="flex-1 min-h-[52px]"
              >
                <Check className="h-5 w-5 mr-2" />
                Record {customRuns}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RunInput;
