"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InningIndicator } from "./InningIndicator";
import type { Game, Team, GameStatus } from "@/types";

interface ScoreboardCompactProps {
  /** Game data */
  game: Pick<
    Game,
    | "id"
    | "status"
    | "homeScore"
    | "awayScore"
    | "currentInning"
    | "currentInningHalf"
  >;
  /** Home team data */
  homeTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  /** Away team data */
  awayTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  /** Show the LIVE badge */
  showLiveBadge?: boolean;
  /** Optional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * ScoreboardCompact Component
 * Compact scoreboard for banners, cards, and list views
 * Shows teams, score, and current status in a condensed format
 *
 * @example
 * <ScoreboardCompact game={game} homeTeam={home} awayTeam={away} />
 */
export function ScoreboardCompact({
  game,
  homeTeam,
  awayTeam,
  showLiveBadge = true,
  className,
  onClick,
}: ScoreboardCompactProps) {
  const isLive = game.status === "in_progress";
  const isFinal = game.status === "final";
  const showScore = isLive || isFinal;

  const homeWinning = showScore && game.homeScore > game.awayScore;
  const awayWinning = showScore && game.awayScore > game.homeScore;

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg overflow-hidden",
        "bg-gradient-to-br from-navy via-navy-dark to-navy",
        "border border-cream/10",
        "shadow-lg",
        onClick && "cursor-pointer hover:border-gold/30 transition-colors focus-ring",
        className
      )}
      {...(onClick && { type: "button" })}
    >
      {/* Live indicator glow effect */}
      {isLive && (
        <div
          className="absolute inset-0 bg-cardinal/5 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="relative p-3 sm:p-4">
        {/* Header with status */}
        <div className="flex items-center justify-between mb-3">
          {isLive && showLiveBadge ? (
            <Badge variant="live" size="sm" className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-chalk animate-pulse" />
              LIVE
            </Badge>
          ) : (
            <InningIndicator
              inning={game.currentInning}
              half={game.currentInningHalf}
              status={game.status}
              size="sm"
            />
          )}

          {isLive && (
            <InningIndicator
              inning={game.currentInning}
              half={game.currentInningHalf}
              status={game.status}
              size="sm"
              showLabel
            />
          )}
        </div>

        {/* Teams and Scores */}
        <div className="space-y-2">
          {/* Away Team */}
          <TeamRowCompact
            team={awayTeam}
            score={showScore ? game.awayScore : null}
            isWinning={awayWinning}
            isLeading={awayWinning && isLive}
          />

          {/* Home Team */}
          <TeamRowCompact
            team={homeTeam}
            score={showScore ? game.homeScore : null}
            isWinning={homeWinning}
            isLeading={homeWinning && isLive}
            isHome
          />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          isLive ? "bg-cardinal" : isFinal ? "bg-charcoal" : "bg-navy-light"
        )}
        aria-hidden="true"
      />
    </Component>
  );
}

// Internal component for team row
function TeamRowCompact({
  team,
  score,
  isWinning,
  isLeading,
  isHome,
}: {
  team: Pick<Team, "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  score: number | null;
  isWinning: boolean;
  isLeading: boolean;
  isHome?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        {/* Team color indicator */}
        <div
          className="w-1 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: team.primaryColor ?? "#666" }}
          aria-hidden="true"
        />

        {/* Team info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-headline text-sm font-semibold truncate",
                isWinning || isLeading ? "text-gold" : "text-cream"
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
        </div>
      </div>

      {/* Score */}
      {score !== null && (
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            isWinning || isLeading ? "text-gold" : "text-cream"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export default ScoreboardCompact;
