"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunInput } from "./RunInput";
import { OutsInput } from "./OutsInput";
import { GameControls, type GameAction } from "./GameControls";
import { ScoringConfirmDialog } from "./ScoringConfirmDialog";
import type { Game, GameWithTeams, InningHalf } from "@/types";

export interface ScoringPanelProps {
  game: GameWithTeams;
  onUpdateGame: (updates: Partial<Game>) => Promise<void>;
  className?: string;
}

interface ScoringState {
  homeScore: number;
  awayScore: number;
  currentInning: number;
  currentInningHalf: InningHalf;
  outs: number;
  homeInningScores: number[];
  awayInningScores: number[];
  pendingRuns: number | null;
}

interface ActionHistoryEntry extends GameAction {
  previousState: Partial<ScoringState>;
}

/**
 * ScoringPanel Component
 * Main scoring interface for team managers
 *
 * Features:
 * - Current game state display (inning, outs, score)
 * - Large, touch-friendly buttons optimized for field use
 * - Run recording (0, 1, 2, 3, 4+ with custom input)
 * - Outs tracking with auto-advance at 3 outs
 * - Game flow controls (start, end, suspend, undo)
 * - Confirmation dialogs for destructive actions
 * - Mobile-first responsive design
 * - Landscape tablet support
 *
 * @example
 * <ScoringPanel
 *   game={gameData}
 *   onUpdateGame={async (updates) => await updateGame(game.id, updates)}
 * />
 */
export function ScoringPanel({
  game,
  onUpdateGame,
  className,
}: ScoringPanelProps) {
  // Local state for optimistic updates
  const [state, setState] = React.useState<ScoringState>({
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    currentInning: game.currentInning ?? 1,
    currentInningHalf: game.currentInningHalf ?? "top",
    outs: game.outs ?? 0,
    homeInningScores: game.homeInningScores ?? [],
    awayInningScores: game.awayInningScores ?? [],
    pendingRuns: null,
  });

  const [actionHistory, setActionHistory] = React.useState<ActionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showThreeOutsDialog, setShowThreeOutsDialog] = React.useState(false);
  const [gameStatus, setGameStatus] = React.useState(game.status);

  // Sync with game prop when it changes from server
  React.useEffect(() => {
    setState({
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentInning: game.currentInning ?? 1,
      currentInningHalf: game.currentInningHalf ?? "top",
      outs: game.outs ?? 0,
      homeInningScores: game.homeInningScores ?? [],
      awayInningScores: game.awayInningScores ?? [],
      pendingRuns: null,
    });
    setGameStatus(game.status);
  }, [game]);

  const battingTeam = state.currentInningHalf === "top" ? game.awayTeam : game.homeTeam;
  const isInProgress = gameStatus === "in_progress";

  const recordAction = React.useCallback(
    (action: Omit<GameAction, "timestamp">, previousState: Partial<ScoringState>) => {
      const entry: ActionHistoryEntry = {
        ...action,
        timestamp: new Date(),
        previousState,
      };
      setActionHistory((prev) => [...prev.slice(-9), entry]); // Keep last 10 actions
    },
    []
  );

  const handleRunsSubmit = React.useCallback(
    async (runs: number) => {
      const previousState: Partial<ScoringState> = {
        homeScore: state.homeScore,
        awayScore: state.awayScore,
        homeInningScores: [...state.homeInningScores],
        awayInningScores: [...state.awayInningScores],
      };

      // Calculate new scores
      const isHome = state.currentInningHalf === "bottom";
      const newHomeScore = isHome ? state.homeScore + runs : state.homeScore;
      const newAwayScore = isHome ? state.awayScore : state.awayScore + runs;

      // Update inning scores array
      const inningIndex = state.currentInning - 1;
      const newHomeInningScores = [...state.homeInningScores];
      const newAwayInningScores = [...state.awayInningScores];

      if (isHome) {
        newHomeInningScores[inningIndex] = (newHomeInningScores[inningIndex] ?? 0) + runs;
      } else {
        newAwayInningScores[inningIndex] = (newAwayInningScores[inningIndex] ?? 0) + runs;
      }

      // Optimistic update
      setState((prev) => ({
        ...prev,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        homeInningScores: newHomeInningScores,
        awayInningScores: newAwayInningScores,
      }));

      recordAction(
        {
          type: "advance",
          description: `${runs} run${runs !== 1 ? "s" : ""} for ${battingTeam.name}`,
        },
        previousState
      );

      // Persist to server
      setIsLoading(true);
      try {
        await onUpdateGame({
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          homeInningScores: newHomeInningScores,
          awayInningScores: newAwayInningScores,
        });
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          ...previousState,
        }));
        console.error("Failed to update game:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [state, battingTeam.name, onUpdateGame, recordAction]
  );

  const handleOutsChange = React.useCallback(
    async (newOuts: number) => {
      const previousState: Partial<ScoringState> = { outs: state.outs };

      // Optimistic update
      setState((prev) => ({ ...prev, outs: newOuts }));

      recordAction(
        {
          type: "advance",
          description: `Outs: ${state.outs} -> ${newOuts}`,
        },
        previousState
      );

      // Persist
      setIsLoading(true);
      try {
        await onUpdateGame({ outs: newOuts });
      } catch (error) {
        setState((prev) => ({ ...prev, ...previousState }));
        console.error("Failed to update outs:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [state.outs, onUpdateGame, recordAction]
  );

  const handleThreeOuts = React.useCallback(() => {
    setShowThreeOutsDialog(true);
  }, []);

  const handleAdvanceInning = React.useCallback(async () => {
    const previousState: Partial<ScoringState> = {
      currentInning: state.currentInning,
      currentInningHalf: state.currentInningHalf,
      outs: state.outs,
    };

    let newInning = state.currentInning;
    let newHalf: InningHalf = state.currentInningHalf;

    if (state.currentInningHalf === "top") {
      newHalf = "bottom";
    } else {
      newHalf = "top";
      newInning = state.currentInning + 1;
    }

    // Ensure inning score arrays are properly sized
    const newHomeInningScores = [...state.homeInningScores];
    const newAwayInningScores = [...state.awayInningScores];
    while (newHomeInningScores.length < newInning) {
      newHomeInningScores.push(0);
    }
    while (newAwayInningScores.length < newInning) {
      newAwayInningScores.push(0);
    }

    // Optimistic update
    setState((prev) => ({
      ...prev,
      currentInning: newInning,
      currentInningHalf: newHalf,
      outs: 0,
      homeInningScores: newHomeInningScores,
      awayInningScores: newAwayInningScores,
    }));

    recordAction(
      {
        type: "advance",
        description: `Advanced to ${newHalf === "top" ? "Top" : "Bottom"} of ${newInning}`,
      },
      previousState
    );

    setIsLoading(true);
    try {
      await onUpdateGame({
        currentInning: newInning,
        currentInningHalf: newHalf,
        outs: 0,
        homeInningScores: newHomeInningScores,
        awayInningScores: newAwayInningScores,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, ...previousState }));
      console.error("Failed to advance inning:", error);
    } finally {
      setIsLoading(false);
    }
  }, [state, onUpdateGame, recordAction]);

  const handleStartGame = React.useCallback(async () => {
    setGameStatus("in_progress");
    setIsLoading(true);
    try {
      await onUpdateGame({
        status: "in_progress",
        currentInning: 1,
        currentInningHalf: "top",
        outs: 0,
        startedAt: new Date().toISOString(),
      });
      recordAction({ type: "start", description: "Game started" }, {});
    } catch (error) {
      setGameStatus(game.status);
      console.error("Failed to start game:", error);
    } finally {
      setIsLoading(false);
    }
  }, [game.status, onUpdateGame, recordAction]);

  const handleEndGame = React.useCallback(async () => {
    setGameStatus("final");
    setIsLoading(true);
    try {
      await onUpdateGame({
        status: "final",
        endedAt: new Date().toISOString(),
      });
      recordAction({ type: "end", description: "Game ended" }, {});
    } catch (error) {
      setGameStatus("in_progress");
      console.error("Failed to end game:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdateGame, recordAction]);

  const handleSuspendGame = React.useCallback(async () => {
    setGameStatus("suspended");
    setIsLoading(true);
    try {
      await onUpdateGame({ status: "suspended" });
      recordAction({ type: "suspend", description: "Game suspended" }, {});
    } catch (error) {
      setGameStatus("in_progress");
      console.error("Failed to suspend game:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdateGame, recordAction]);

  const handleUndoLastAction = React.useCallback(async () => {
    const lastAction = actionHistory[actionHistory.length - 1];
    if (!lastAction) return;

    const updates = lastAction.previousState;
    setState((prev) => ({ ...prev, ...updates }));
    setActionHistory((prev) => prev.slice(0, -1));

    setIsLoading(true);
    try {
      await onUpdateGame(updates as Partial<Game>);
    } catch (error) {
      console.error("Failed to undo action:", error);
    } finally {
      setIsLoading(false);
    }
  }, [actionHistory, onUpdateGame]);

  const lastAction = actionHistory[actionHistory.length - 1];

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        // Landscape tablet layout
        "lg:max-w-4xl",
        className
      )}
    >
      {/* Game Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="overflow-hidden">
          {/* Status Banner */}
          <div
            className={cn(
              "py-2 px-4 text-center",
              gameStatus === "in_progress" && "bg-cardinal",
              gameStatus === "suspended" && "bg-gold",
              gameStatus === "final" && "bg-gray-800",
              (gameStatus === "scheduled" || gameStatus === "warmup") && "bg-navy"
            )}
          >
            {gameStatus === "in_progress" ? (
              <div className="live-indicator justify-center">
                <span className="text-white font-medium text-sm uppercase tracking-wider">
                  Live - {state.currentInningHalf === "top" ? "Top" : "Bot"} {state.currentInning}
                </span>
              </div>
            ) : (
              <span className="text-white font-medium text-sm uppercase tracking-wider">
                {gameStatus === "scheduled" && "Scheduled"}
                {gameStatus === "warmup" && "Warmup"}
                {gameStatus === "suspended" && "Suspended"}
                {gameStatus === "final" && "Final"}
              </span>
            )}
          </div>

          <CardContent className="p-4 sm:p-6">
            {/* Scoreboard */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Away Team */}
              <div className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: game.awayTeam.primaryColor ?? "#1B3A5F" }}
                />
                <p className="font-headline text-lg font-semibold text-navy truncate">
                  {game.awayTeam.abbreviation}
                </p>
                <p className="text-xs text-gray-500 truncate">{game.awayTeam.name}</p>
                <p className="font-mono text-4xl sm:text-5xl font-bold text-navy mt-2">
                  {state.awayScore}
                </p>
                {state.currentInningHalf === "top" && isInProgress && (
                  <Badge variant="live" size="sm" className="mt-2">
                    Batting
                  </Badge>
                )}
              </div>

              {/* VS / Inning Info */}
              <div className="text-center">
                <div className="text-2xl font-headline text-gray-300 mb-2">vs</div>
                {isInProgress && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      {state.currentInningHalf === "top" ? "Top" : "Bottom"} {state.currentInning}
                    </p>
                    <p className="text-xs text-gray-400">
                      {state.outs} out{state.outs !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Home Team */}
              <div className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: game.homeTeam.primaryColor ?? "#1B3A5F" }}
                />
                <p className="font-headline text-lg font-semibold text-navy truncate">
                  {game.homeTeam.abbreviation}
                </p>
                <p className="text-xs text-gray-500 truncate">{game.homeTeam.name}</p>
                <p className="font-mono text-4xl sm:text-5xl font-bold text-navy mt-2">
                  {state.homeScore}
                </p>
                {state.currentInningHalf === "bottom" && isInProgress && (
                  <Badge variant="live" size="sm" className="mt-2">
                    Batting
                  </Badge>
                )}
              </div>
            </div>

            {/* Line Score (Innings) - Show on larger screens or when game is final */}
            {(isInProgress || gameStatus === "final") && state.homeInningScores.length > 0 && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-100 overflow-x-auto"
                >
                  <table className="w-full min-w-[300px] text-center text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase">
                        <th className="py-1 px-2 text-left">Team</th>
                        {state.homeInningScores.map((_, i) => (
                          <th key={i} className="py-1 px-2 font-mono">
                            {i + 1}
                          </th>
                        ))}
                        <th className="py-1 px-3 font-semibold">R</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr>
                        <td className="py-1 px-2 text-left font-sans font-medium">
                          {game.awayTeam.abbreviation}
                        </td>
                        {state.awayInningScores.map((score, i) => (
                          <td key={i} className="py-1 px-2">
                            {score ?? "-"}
                          </td>
                        ))}
                        <td className="py-1 px-3 font-bold">{state.awayScore}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-left font-sans font-medium">
                          {game.homeTeam.abbreviation}
                        </td>
                        {state.homeInningScores.map((score, i) => (
                          <td key={i} className="py-1 px-2">
                            {score ?? "-"}
                          </td>
                        ))}
                        <td className="py-1 px-3 font-bold">{state.homeScore}</td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Scoring Controls - Only show when game is in progress */}
      {isInProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0"
        >
          {/* Outs Section */}
          <Card className="p-6">
            <OutsInput
              outs={state.outs}
              onOutsChange={handleOutsChange}
              onThreeOuts={handleThreeOuts}
              disabled={isLoading}
            />
          </Card>

          {/* Runs Section */}
          <Card className="p-6">
            <RunInput
              battingTeamName={battingTeam.name}
              battingTeamColor={battingTeam.primaryColor ?? undefined}
              isTopInning={state.currentInningHalf === "top"}
              onRunsSubmit={handleRunsSubmit}
              disabled={isLoading}
            />
          </Card>
        </motion.div>
      )}

      {/* Game Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <Card className="p-6">
          <GameControls
            gameStatus={gameStatus}
            currentInning={state.currentInning}
            currentInningHalf={state.currentInningHalf}
            canUndo={actionHistory.length > 0}
            lastAction={lastAction}
            onStartGame={handleStartGame}
            onEndGame={handleEndGame}
            onSuspendGame={handleSuspendGame}
            onUndoLastAction={handleUndoLastAction}
            onAdvanceInning={handleAdvanceInning}
            isLoading={isLoading}
            disabled={gameStatus === "final"}
          />
        </Card>
      </motion.div>

      {/* Three Outs Dialog - Prompt to advance inning */}
      <ScoringConfirmDialog
        isOpen={showThreeOutsDialog}
        onClose={() => setShowThreeOutsDialog(false)}
        onConfirm={() => {
          handleAdvanceInning();
          setShowThreeOutsDialog(false);
        }}
        title="3 Outs Recorded"
        message={`Ready to advance to the ${
          state.currentInningHalf === "top"
            ? `bottom of inning ${state.currentInning}`
            : `top of inning ${state.currentInning + 1}`
        }?`}
        confirmText="Advance"
        cancelText="Stay Here"
        variant="success"
        isLoading={isLoading}
      />
    </div>
  );
}

export default ScoringPanel;
