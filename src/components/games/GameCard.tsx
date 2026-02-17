"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Game, GameStatus } from "@/lib/mock-data";
import { MapPin, Clock, Calendar } from "lucide-react";

interface GameCardProps {
  game: Game;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * GameCard Component
 * Displays game information with team matchup, score, and status
 *
 * @example
 * <GameCard game={gameData} />
 * <GameCard game={gameData} variant="compact" />
 */
export function GameCard({ game, variant = "default", className }: GameCardProps) {
  const {
    homeTeam,
    awayTeam,
    date,
    time,
    location,
    field,
    status,
    homeScore,
    awayScore,
    inning,
    isTopInning,
  } = game;

  const gameDate = new Date(date);
  const formattedDate = gameDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isCompact = variant === "compact";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        status === "in_progress" && "ring-1 ring-danger/30",
        className
      )}
    >
      {/* Status Banner */}
      <StatusBanner status={status} inning={inning} isTopInning={isTopInning} />

      <CardContent className={cn("p-4", isCompact && "p-3")}>
        {/* Teams and Score */}
        <div className="space-y-3">
          {/* Away Team */}
          <TeamRow
            team={awayTeam}
            score={awayScore}
            isWinner={status === "final" && awayScore !== null && homeScore !== null && awayScore > homeScore}
            status={status}
            isCompact={isCompact}
          />

          {/* Divider with @ symbol */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">@</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Home Team */}
          <TeamRow
            team={homeTeam}
            score={homeScore}
            isWinner={status === "final" && homeScore !== null && awayScore !== null && homeScore > awayScore}
            status={status}
            isCompact={isCompact}
            isHome
          />
        </div>

        {/* Game Details */}
        <div className={cn("mt-4 space-y-2 border-t border-gray-100 pt-4", isCompact && "mt-3 pt-3")}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formattedDate}</span>
            <Clock className="ml-2 h-4 w-4" aria-hidden="true" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>
              {location} - {field}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Status banner component
function StatusBanner({
  status,
  inning,
  isTopInning,
}: {
  status: GameStatus;
  inning?: number;
  isTopInning?: boolean;
}) {
  const statusConfig: Record<GameStatus, { label: string; bgClass: string; textClass: string }> = {
    scheduled: { label: "Scheduled", bgClass: "bg-gray-100", textClass: "text-gray-600" },
    in_progress: { label: `Live - ${isTopInning ? "Top" : "Bot"} ${inning}`, bgClass: "bg-danger", textClass: "text-white" },
    final: { label: "Final", bgClass: "bg-gray-800", textClass: "text-white" },
    postponed: { label: "Postponed", bgClass: "bg-warning", textClass: "text-gray-900" },
    cancelled: { label: "Cancelled", bgClass: "bg-gray-400", textClass: "text-white" },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center justify-center py-1.5",
        config.bgClass
      )}
    >
      {status === "in_progress" ? (
        <div className="live-indicator">
          <span className={cn("font-medium text-xs uppercase tracking-wider", config.textClass)}>
            {config.label}
          </span>
        </div>
      ) : (
        <span className={cn("font-medium text-xs uppercase tracking-wider", config.textClass)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Team row component
function TeamRow({
  team,
  score,
  isWinner,
  status,
  isCompact,
  isHome,
}: {
  team: { name: string; abbreviation: string; primaryColor: string };
  score: number | null;
  isWinner: boolean;
  status: GameStatus;
  isCompact?: boolean;
  isHome?: boolean;
}) {
  const showScore = status === "in_progress" || status === "final";

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {/* Team Color Indicator */}
        <div
          className="h-10 w-1.5 rounded-full"
          style={{ backgroundColor: team.primaryColor }}
          aria-hidden="true"
        />
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold",
                isCompact ? "text-sm" : "text-base",
                isWinner ? "text-success" : "text-gray-900"
              )}
            >
              {team.name}
            </span>
            {isHome && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-gray-500 border-gray-300">
                Home
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">{team.abbreviation}</span>
        </div>
      </div>

      {/* Score */}
      {showScore && (
        <span
          className={cn(
            "font-mono text-3xl font-bold tabular-nums",
            isWinner ? "text-success" : "text-gray-700"
          )}
        >
          {score ?? 0}
        </span>
      )}
    </div>
  );
}

export default GameCard;
