"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InningIndicator } from "./InningIndicator";
import { OutsDisplay } from "./OutsDisplay";
import type { Game, Team, GameStatus } from "@/types";

interface LiveScoreboardProps {
  /** Game data with inning scores */
  game: Pick<
    Game,
    | "id"
    | "status"
    | "homeScore"
    | "awayScore"
    | "currentInning"
    | "currentInningHalf"
    | "outs"
    | "homeInningScores"
    | "awayInningScores"
  >;
  /** Home team data */
  homeTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  /** Away team data */
  awayTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  /** Show hits column (H) */
  showHits?: boolean;
  /** Home team hits */
  homeHits?: number;
  /** Away team hits */
  awayHits?: number;
  /** Show errors column (E) */
  showErrors?: boolean;
  /** Home team errors */
  homeErrors?: number;
  /** Away team errors */
  awayErrors?: number;
  /** Optional className */
  className?: string;
}

/**
 * LiveScoreboard Component
 * Full baseball scoreboard with classic line score display
 * Shows inning-by-inning scores, R/H/E totals, and game status
 *
 * Inspired by classic stadium scoreboards with retro Heritage Diamond styling
 *
 * @example
 * <LiveScoreboard
 *   game={gameData}
 *   homeTeam={homeTeam}
 *   awayTeam={awayTeam}
 *   showHits
 *   homeHits={8}
 *   awayHits={6}
 * />
 */
export function LiveScoreboard({
  game,
  homeTeam,
  awayTeam,
  showHits = true,
  homeHits = 0,
  awayHits = 0,
  showErrors = true,
  homeErrors = 0,
  awayErrors = 0,
  className,
}: LiveScoreboardProps) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal || game.status === "suspended";

  // Determine max innings to display (minimum 9, expand for extras)
  const maxInnings = Math.max(
    9,
    game.homeInningScores.length,
    game.awayInningScores.length
  );

  // Create inning columns array
  const innings = Array.from({ length: maxInnings }, (_, i) => i + 1);

  const homeWinning = showScore && game.homeScore > game.awayScore;
  const awayWinning = showScore && game.awayScore > game.homeScore;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-navy via-navy-dark to-[#0a1628]",
        "border-2 border-cream/20",
        "shadow-2xl",
        className
      )}
      role="region"
      aria-label="Game Scoreboard"
    >
      {/* Top decorative rivets */}
      <div
        className="absolute top-2 left-0 right-0 flex justify-between px-4 pointer-events-none"
        aria-hidden="true"
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-charcoal border border-charcoal-light"
          />
        ))}
      </div>

      {/* Header with game status */}
      <div className="px-4 pt-6 pb-3 border-b border-cream/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive ? (
              <Badge variant="live" className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-chalk animate-pulse" />
                LIVE
              </Badge>
            ) : (
              <Badge
                variant={isFinal ? "primary" : "default"}
                className={cn(
                  "font-mono uppercase",
                  game.status === "postponed" && "bg-gold text-charcoal-dark",
                  game.status === "cancelled" && "bg-charcoal text-cream/60"
                )}
              >
                {getStatusLabel(game.status)}
              </Badge>
            )}

            {isLive && game.outs !== null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-cream/60 uppercase tracking-wider">
                  Outs
                </span>
                <OutsDisplay outs={game.outs} size="md" />
              </div>
            )}
          </div>

          <InningIndicator
            inning={game.currentInning}
            half={game.currentInningHalf}
            status={game.status}
            size="lg"
            showLabel
          />
        </div>
      </div>

      {/* Line Score Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]" role="table">
          <thead>
            <tr className="border-b border-cream/10">
              {/* Team column header */}
              <th
                className="py-2 px-4 text-left text-xs text-cream/50 font-mono uppercase tracking-wider w-32"
                scope="col"
              >
                Team
              </th>

              {/* Inning headers */}
              {innings.map((inning) => (
                <th
                  key={inning}
                  className={cn(
                    "py-2 px-1 text-center text-xs font-mono uppercase tracking-wider w-8",
                    game.currentInning === inning && isLive
                      ? "text-gold"
                      : "text-cream/50"
                  )}
                  scope="col"
                >
                  {inning}
                </th>
              ))}

              {/* Separator */}
              <th className="w-2" aria-hidden="true" />

              {/* R/H/E headers */}
              <th
                className="py-2 px-2 text-center text-xs text-gold font-mono uppercase tracking-wider w-10"
                scope="col"
              >
                R
              </th>
              {showHits && (
                <th
                  className="py-2 px-2 text-center text-xs text-cream/50 font-mono uppercase tracking-wider w-10"
                  scope="col"
                >
                  H
                </th>
              )}
              {showErrors && (
                <th
                  className="py-2 px-2 text-center text-xs text-cream/50 font-mono uppercase tracking-wider w-10"
                  scope="col"
                >
                  E
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Away Team Row */}
            <tr className="border-b border-cream/5">
              <td className="py-3 px-4">
                <TeamCell team={awayTeam} isWinning={awayWinning} />
              </td>

              {innings.map((inning) => (
                <td
                  key={inning}
                  className={cn(
                    "py-3 px-1 text-center font-mono text-sm tabular-nums",
                    game.currentInning === inning &&
                      game.currentInningHalf === "top" &&
                      isLive
                      ? "text-gold bg-gold/10"
                      : inning <= game.awayInningScores.length
                        ? "text-cream"
                        : "text-cream/30"
                  )}
                >
                  {inning <= game.awayInningScores.length
                    ? game.awayInningScores[inning - 1]
                    : inning > maxInnings
                      ? ""
                      : "-"}
                </td>
              ))}

              <td aria-hidden="true" />

              <td
                className={cn(
                  "py-3 px-2 text-center font-mono text-xl font-bold tabular-nums",
                  awayWinning ? "text-gold" : "text-cream"
                )}
              >
                {showScore ? game.awayScore : "-"}
              </td>
              {showHits && (
                <td className="py-3 px-2 text-center font-mono text-sm text-cream/70 tabular-nums">
                  {showScore ? awayHits : "-"}
                </td>
              )}
              {showErrors && (
                <td className="py-3 px-2 text-center font-mono text-sm text-cream/70 tabular-nums">
                  {showScore ? awayErrors : "-"}
                </td>
              )}
            </tr>

            {/* Home Team Row */}
            <tr>
              <td className="py-3 px-4">
                <TeamCell team={homeTeam} isWinning={homeWinning} isHome />
              </td>

              {innings.map((inning) => (
                <td
                  key={inning}
                  className={cn(
                    "py-3 px-1 text-center font-mono text-sm tabular-nums",
                    game.currentInning === inning &&
                      game.currentInningHalf === "bottom" &&
                      isLive
                      ? "text-gold bg-gold/10"
                      : inning <= game.homeInningScores.length
                        ? "text-cream"
                        : "text-cream/30"
                  )}
                >
                  {inning <= game.homeInningScores.length
                    ? game.homeInningScores[inning - 1]
                    : inning > maxInnings
                      ? ""
                      : "-"}
                </td>
              ))}

              <td aria-hidden="true" />

              <td
                className={cn(
                  "py-3 px-2 text-center font-mono text-xl font-bold tabular-nums",
                  homeWinning ? "text-gold" : "text-cream"
                )}
              >
                {showScore ? game.homeScore : "-"}
              </td>
              {showHits && (
                <td className="py-3 px-2 text-center font-mono text-sm text-cream/70 tabular-nums">
                  {showScore ? homeHits : "-"}
                </td>
              )}
              {showErrors && (
                <td className="py-3 px-2 text-center font-mono text-sm text-cream/70 tabular-nums">
                  {showScore ? homeErrors : "-"}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom decorative bar */}
      <div
        className={cn(
          "h-2 w-full",
          isLive
            ? "bg-gradient-to-r from-cardinal via-cardinal-light to-cardinal"
            : "bg-gradient-to-r from-charcoal via-charcoal-light to-charcoal"
        )}
        aria-hidden="true"
      />
    </div>
  );
}

// Team cell component
function TeamCell({
  team,
  isWinning,
  isHome,
}: {
  team: Pick<Team, "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  isWinning: boolean;
  isHome?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Team color bar */}
      <div
        className="w-1.5 h-8 rounded-full"
        style={{ backgroundColor: team.primaryColor ?? "#666" }}
        aria-hidden="true"
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-headline text-base font-bold tracking-wide",
              isWinning ? "text-gold" : "text-cream"
            )}
          >
            {team.abbreviation}
          </span>
          {isHome && (
            <span className="text-[10px] text-cream/40 uppercase tracking-wider">
              Home
            </span>
          )}
        </div>
        <span className="text-xs text-cream/50 truncate block">{team.name}</span>
      </div>
    </div>
  );
}

// Helper to get status label
function getStatusLabel(status: GameStatus): string {
  const labels: Record<GameStatus, string> = {
    scheduled: "Scheduled",
    warmup: "Warmup",
    in_progress: "Live",
    final: "Final",
    postponed: "Postponed",
    cancelled: "Cancelled",
    suspended: "Suspended",
  };
  return labels[status];
}

export default LiveScoreboard;
