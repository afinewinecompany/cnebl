"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScoreboardCompact } from "./ScoreboardCompact";
import type { Game, Team } from "@/types";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";

interface LiveGameData {
  game: Pick<
    Game,
    | "id"
    | "status"
    | "homeScore"
    | "awayScore"
    | "currentInning"
    | "currentInningHalf"
  >;
  homeTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
  awayTeam: Pick<Team, "id" | "name" | "abbreviation" | "primaryColor" | "logoUrl">;
}

interface LiveGameBannerProps {
  /** Array of live games to display (1-3 recommended) */
  games: LiveGameData[];
  /** Auto-scroll interval in ms (default 5000ms, set to 0 to disable) */
  autoScrollInterval?: number;
  /** Base URL for game detail links */
  gameDetailUrl?: string;
  /** Show navigation arrows */
  showNavigation?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * LiveGameBanner Component
 * Banner for home page showing live games with auto-scroll
 * Displays 1-3 live games in compact format with navigation
 *
 * @example
 * <LiveGameBanner games={liveGames} autoScrollInterval={5000} />
 */
export function LiveGameBanner({
  games,
  autoScrollInterval = 5000,
  gameDetailUrl = "/games",
  showNavigation = true,
  className,
}: LiveGameBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const hasMultipleGames = games.length > 1;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
  }, [games.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
  }, [games.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (
      !hasMultipleGames ||
      isPaused ||
      autoScrollInterval === 0 ||
      games.length === 0
    ) {
      return;
    }

    const interval = setInterval(goToNext, autoScrollInterval);
    return () => clearInterval(interval);
  }, [hasMultipleGames, isPaused, autoScrollInterval, games.length, goToNext]);

  // Don't render if no games
  if (games.length === 0) {
    return null;
  }

  const currentGame = games[currentIndex];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-r from-navy-dark via-navy to-navy-dark",
        "border border-cream/10",
        "shadow-lg",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Live Games"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cream/10 bg-navy-dark/50">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cardinal animate-pulse" aria-hidden="true" />
          <span className="text-sm font-headline font-semibold text-cream uppercase tracking-wider">
            Live Now
          </span>
          <Badge variant="live" size="sm">
            {games.length} Game{games.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Navigation controls */}
        {hasMultipleGames && showNavigation && (
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="p-1 rounded hover:bg-cream/10 transition-colors focus-ring"
              aria-label="Previous game"
            >
              <ChevronLeft className="w-4 h-4 text-cream/70" />
            </button>

            {/* Dots indicator */}
            <div className="flex items-center gap-1 px-2">
              {games.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    idx === currentIndex
                      ? "bg-gold w-3"
                      : "bg-cream/30 hover:bg-cream/50"
                  )}
                  aria-label={`Go to game ${idx + 1}`}
                  aria-current={idx === currentIndex ? "true" : undefined}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-1 rounded hover:bg-cream/10 transition-colors focus-ring"
              aria-label="Next game"
            >
              <ChevronRight className="w-4 h-4 text-cream/70" />
            </button>
          </div>
        )}
      </div>

      {/* Game Content */}
      <div className="p-4">
        <Link
          href={`${gameDetailUrl}/${currentGame.game.id}`}
          className="block focus-ring rounded-lg"
        >
          <ScoreboardCompact
            game={currentGame.game}
            homeTeam={currentGame.homeTeam}
            awayTeam={currentGame.awayTeam}
            showLiveBadge={false}
            className="hover:border-gold/30 transition-colors"
          />
        </Link>
      </div>

      {/* Bottom progress bar for auto-scroll */}
      {hasMultipleGames && autoScrollInterval > 0 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream/10">
          <div
            className="h-full bg-gold animate-progress"
            style={{
              animationDuration: `${autoScrollInterval}ms`,
            }}
          />
        </div>
      )}

      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * LiveGameBannerMultiple Component
 * Shows multiple live games side by side (desktop) or stacked (mobile)
 */
export function LiveGameBannerMultiple({
  games,
  gameDetailUrl = "/games",
  className,
}: Omit<LiveGameBannerProps, "autoScrollInterval" | "showNavigation">) {
  if (games.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-gradient-to-r from-navy-dark via-navy to-navy-dark",
        "border border-cream/10",
        "shadow-lg",
        className
      )}
      role="region"
      aria-label="Live Games"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cream/10 bg-navy-dark/50">
        <Radio className="w-4 h-4 text-cardinal animate-pulse" aria-hidden="true" />
        <span className="text-sm font-headline font-semibold text-cream uppercase tracking-wider">
          Live Now
        </span>
        <Badge variant="live" size="sm">
          {games.length} Game{games.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Games Grid */}
      <div
        className={cn(
          "grid gap-4 p-4",
          games.length === 1 && "grid-cols-1",
          games.length === 2 && "grid-cols-1 md:grid-cols-2",
          games.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {games.slice(0, 3).map((gameData) => (
          <Link
            key={gameData.game.id}
            href={`${gameDetailUrl}/${gameData.game.id}`}
            className="block focus-ring rounded-lg"
          >
            <ScoreboardCompact
              game={gameData.game}
              homeTeam={gameData.homeTeam}
              awayTeam={gameData.awayTeam}
              className="h-full hover:border-gold/30 transition-colors"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LiveGameBanner;
