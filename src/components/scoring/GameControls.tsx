"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Play, Square, Pause, Undo2, ChevronRight, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoringConfirmDialog } from "./ScoringConfirmDialog";
import { cn } from "@/lib/utils";
import type { GameStatus } from "@/types";

export interface GameAction {
  type: "start" | "end" | "suspend" | "undo" | "advance";
  timestamp: Date;
  description: string;
}

export interface GameControlsProps {
  gameStatus: GameStatus;
  currentInning: number | null;
  currentInningHalf: "top" | "bottom" | null;
  canUndo: boolean;
  lastAction?: GameAction;
  onStartGame: () => void;
  onEndGame: () => void;
  onSuspendGame: () => void;
  onUndoLastAction: () => void;
  onAdvanceInning: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * GameControls Component
 * Game flow controls for managers
 *
 * Features:
 * - "Start Game" button for scheduled games
 * - "End Game" / "Mark as Final" with confirmation
 * - "Suspend Game" for weather delays
 * - "Undo Last Action" when available
 * - "Advance Inning" for moving to next half-inning
 * - All buttons have large touch targets
 *
 * @example
 * <GameControls
 *   gameStatus="in_progress"
 *   currentInning={5}
 *   currentInningHalf="top"
 *   canUndo={true}
 *   onStartGame={handleStart}
 *   onEndGame={handleEnd}
 *   onSuspendGame={handleSuspend}
 *   onUndoLastAction={handleUndo}
 *   onAdvanceInning={handleAdvance}
 * />
 */
export function GameControls({
  gameStatus,
  currentInning,
  currentInningHalf,
  canUndo,
  lastAction,
  onStartGame,
  onEndGame,
  onSuspendGame,
  onUndoLastAction,
  onAdvanceInning,
  isLoading = false,
  disabled = false,
  className,
}: GameControlsProps) {
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = React.useState(false);
  const [showUndoDialog, setShowUndoDialog] = React.useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = React.useState(false);

  const isScheduled = gameStatus === "scheduled" || gameStatus === "warmup";
  const isInProgress = gameStatus === "in_progress";
  const isSuspended = gameStatus === "suspended";

  const getNextInningText = () => {
    if (!currentInning || !currentInningHalf) return "Next Half-Inning";
    if (currentInningHalf === "top") {
      return `Bottom of ${currentInning}`;
    } else {
      return `Top of ${currentInning + 1}`;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Action */}
      {isScheduled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            type="button"
            variant="success"
            size="xl"
            onClick={onStartGame}
            disabled={disabled || isLoading}
            className="w-full min-h-[60px] text-lg"
          >
            <Play className="h-6 w-6 mr-3" />
            Start Game
          </Button>
        </motion.div>
      )}

      {isSuspended && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            type="button"
            variant="success"
            size="xl"
            onClick={onStartGame}
            disabled={disabled || isLoading}
            className="w-full min-h-[60px] text-lg"
          >
            <Play className="h-6 w-6 mr-3" />
            Resume Game
          </Button>
        </motion.div>
      )}

      {isInProgress && (
        <div className="space-y-3">
          {/* Advance to Next Inning */}
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={() => setShowAdvanceDialog(true)}
            disabled={disabled || isLoading}
            className="w-full min-h-[56px] text-base"
          >
            <ChevronRight className="h-5 w-5 mr-2" />
            Advance to {getNextInningText()}
          </Button>

          {/* Secondary Controls Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Suspend Game */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setShowSuspendDialog(true)}
              disabled={disabled || isLoading}
              className="min-h-[52px]"
            >
              <Pause className="h-5 w-5 mr-2" />
              Suspend
            </Button>

            {/* End Game */}
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={() => setShowEndDialog(true)}
              disabled={disabled || isLoading}
              className="min-h-[52px]"
            >
              <Square className="h-5 w-5 mr-2" />
              End Game
            </Button>
          </div>

          {/* Undo Action */}
          {canUndo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowUndoDialog(true)}
                disabled={disabled || isLoading}
                className="w-full min-h-[52px]"
              >
                <Undo2 className="h-5 w-5 mr-2" />
                Undo Last Action
                {lastAction && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({lastAction.description})
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Weather/Suspension Notice for suspended games */}
      {isSuspended && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-gold/10 rounded-lg border border-gold/20"
        >
          <CloudRain className="h-5 w-5 text-gold flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-800">Game Suspended</p>
            <p className="text-gray-600">
              Tap "Resume Game" when ready to continue play.
            </p>
          </div>
        </motion.div>
      )}

      {/* Confirmation Dialogs */}
      <ScoringConfirmDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
        onConfirm={() => {
          onEndGame();
          setShowEndDialog(false);
        }}
        title="End Game?"
        message="This will mark the game as final. All scoring will be locked and the result will be recorded in standings."
        confirmText="Mark as Final"
        cancelText="Keep Playing"
        variant="danger"
        isLoading={isLoading}
      />

      <ScoringConfirmDialog
        isOpen={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={() => {
          onSuspendGame();
          setShowSuspendDialog(false);
        }}
        title="Suspend Game?"
        message="This will pause the game due to weather or other delay. You can resume play later from this exact point."
        confirmText="Suspend Game"
        cancelText="Continue Playing"
        variant="warning"
        isLoading={isLoading}
      />

      <ScoringConfirmDialog
        isOpen={showUndoDialog}
        onClose={() => setShowUndoDialog(false)}
        onConfirm={() => {
          onUndoLastAction();
          setShowUndoDialog(false);
        }}
        title="Undo Last Action?"
        message={
          lastAction
            ? `This will undo: "${lastAction.description}". This cannot be re-done.`
            : "This will undo your last scoring action."
        }
        confirmText="Undo"
        cancelText="Cancel"
        variant="info"
        isLoading={isLoading}
      />

      <ScoringConfirmDialog
        isOpen={showAdvanceDialog}
        onClose={() => setShowAdvanceDialog(false)}
        onConfirm={() => {
          onAdvanceInning();
          setShowAdvanceDialog(false);
        }}
        title={`Advance to ${getNextInningText()}?`}
        message="This will record the current half-inning score and move to the next half-inning. Outs will be reset to 0."
        confirmText="Advance"
        cancelText="Stay Here"
        variant="info"
        isLoading={isLoading}
      />
    </div>
  );
}

export default GameControls;
