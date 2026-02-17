"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LiveGameBanner, LiveGameBannerMultiple } from "@/components/scoreboard";
import type { GameWithTeams } from "@/types";
import { Radio, ChevronRight, AlertCircle } from "lucide-react";

/**
 * Live game data format expected from API
 */
interface LiveGamesResponse {
  success: boolean;
  data?: {
    games: GameWithTeams[];
    count: number;
    timestamp: string;
  };
  error?: string;
}

/**
 * Transform GameWithTeams to the format expected by LiveGameBanner
 */
function transformGameForBanner(game: GameWithTeams) {
  return {
    game: {
      id: game.id,
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentInning: game.currentInning,
      currentInningHalf: game.currentInningHalf,
    },
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      primaryColor: game.homeTeam.primaryColor,
      logoUrl: game.homeTeam.logoUrl,
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      primaryColor: game.awayTeam.primaryColor,
      logoUrl: game.awayTeam.logoUrl,
    },
  };
}

interface LiveGamesSectionProps {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollInterval?: number;
  /** Show multiple games side by side on desktop */
  multipleLayout?: boolean;
  /** Custom className */
  className?: string;
  /** Show a subtle message when no games are live */
  showNoGamesMessage?: boolean;
}

/**
 * LiveGamesSection Component
 *
 * Client component that fetches and displays live games on the home page.
 * Features:
 * - Fetches live games from /api/games/live on mount
 * - Polls for updates every 30 seconds (configurable)
 * - Smooth fade transition when appearing/disappearing
 * - Score change animation
 * - Links to schedule page
 * - LIVE badge with pulse animation
 *
 * @example
 * <LiveGamesSection pollInterval={30000} />
 */
export function LiveGamesSection({
  pollInterval = 30000,
  multipleLayout = false,
  className,
  showNoGamesMessage = false,
}: LiveGamesSectionProps) {
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Track previous scores for animation
  const prevScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [animatingScores, setAnimatingScores] = useState<Set<string>>(new Set());

  /**
   * Fetch live games from the API
   */
  const fetchLiveGames = useCallback(async () => {
    try {
      const response = await fetch("/api/games/live", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch live games: ${response.status}`);
      }

      const data: LiveGamesResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to fetch live games");
      }

      const newGames = data.data.games;

      // Check for score changes and trigger animations
      const newAnimating = new Set<string>();
      for (const game of newGames) {
        const prevScores = prevScoresRef.current.get(game.id);
        if (prevScores) {
          if (prevScores.home !== game.homeScore || prevScores.away !== game.awayScore) {
            newAnimating.add(game.id);
          }
        }
        // Update stored scores
        prevScoresRef.current.set(game.id, {
          home: game.homeScore,
          away: game.awayScore,
        });
      }

      // Trigger animation state
      if (newAnimating.size > 0) {
        setAnimatingScores(newAnimating);
        // Clear animation after 1 second
        setTimeout(() => {
          setAnimatingScores(new Set());
        }, 1000);
      }

      setGames(newGames);
      setError(null);

      // Trigger fade in if we have games
      if (newGames.length > 0 && !isVisible) {
        // Small delay for smoother transition
        setTimeout(() => setIsVisible(true), 50);
      } else if (newGames.length === 0 && isVisible) {
        setIsVisible(false);
      }
    } catch (err) {
      console.error("[LiveGamesSection] Error fetching live games:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch live games");
    } finally {
      setIsLoading(false);
    }
  }, [isVisible]);

  // Initial fetch and polling
  useEffect(() => {
    fetchLiveGames();

    // Set up polling
    const interval = setInterval(fetchLiveGames, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchLiveGames, pollInterval]);

  // Transform games for banner component
  const bannerGames = games.map(transformGameForBanner);

  // Don't render anything during initial load
  if (isLoading) {
    return null;
  }

  // Show subtle error message if there's an error
  if (error && games.length === 0) {
    return null; // Silently fail - don't show error on home page
  }

  // Show no games message if requested
  if (games.length === 0 && showNoGamesMessage) {
    return (
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-navy-dark/90 to-navy/90 backdrop-blur-sm rounded-xl border border-cream/10 p-4">
            <div className="flex items-center justify-center gap-3 text-cream/60">
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">No live games right now</span>
              <span className="text-cream/40">|</span>
              <Link
                href="/schedule"
                className="text-sm text-gold hover:text-gold/80 transition-colors inline-flex items-center gap-1 group"
              >
                View schedule
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No games and no message requested
  if (games.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
        className
      )}
      aria-label="Live Games"
    >
      <div className="container mx-auto px-4">
        {/* Score change animation overlay effect */}
        <div className={cn(
          "relative",
          animatingScores.size > 0 && "animate-score-flash"
        )}>
          {multipleLayout && bannerGames.length > 1 ? (
            <LiveGameBannerMultiple
              games={bannerGames}
              gameDetailUrl="/schedule"
            />
          ) : (
            <LiveGameBanner
              games={bannerGames}
              autoScrollInterval={5000}
              gameDetailUrl="/schedule"
              showNavigation={true}
            />
          )}
        </div>

        {/* View all link */}
        <div className="mt-3 text-center">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 text-sm text-cream/70 hover:text-gold transition-colors group"
          >
            <span>View full schedule</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Score change animation styles */}
      <style jsx>{`
        @keyframes score-flash {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
        .animate-score-flash {
          animation: score-flash 0.5s ease-in-out 2;
        }
      `}</style>
    </section>
  );
}

/**
 * LiveGamesBar Component
 *
 * A fixed/sticky bar variant of the live games section.
 * Can be positioned at the top of the page below the header.
 *
 * @example
 * <LiveGamesBar />
 */
export function LiveGamesBar({
  pollInterval = 30000,
  className,
}: Pick<LiveGamesSectionProps, "pollInterval" | "className">) {
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchLiveGames = useCallback(async () => {
    try {
      const response = await fetch("/api/games/live", { cache: "no-store" });
      if (!response.ok) return;

      const data: LiveGamesResponse = await response.json();
      if (!data.success || !data.data) return;

      setGames(data.data.games);
      if (data.data.games.length > 0 && !isVisible) {
        setTimeout(() => setIsVisible(true), 50);
      } else if (data.data.games.length === 0 && isVisible) {
        setIsVisible(false);
      }
    } catch {
      // Silently fail
    }
  }, [isVisible]);

  useEffect(() => {
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLiveGames, pollInterval]);

  // Auto-rotate through games
  useEffect(() => {
    if (games.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [games.length]);

  if (games.length === 0) {
    return null;
  }

  const currentGame = games[currentIndex];

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-cardinal via-cardinal-dark to-cardinal",
        "border-b border-cardinal-light/20",
        "transition-all duration-300 ease-out",
        isVisible
          ? "opacity-100 max-h-16 py-2"
          : "opacity-0 max-h-0 py-0 overflow-hidden",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <Link
          href="/schedule"
          className="flex items-center justify-center gap-4 text-cream hover:text-white transition-colors"
        >
          {/* LIVE Badge */}
          <Badge variant="live" size="sm" className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </Badge>

          {/* Game Info */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <span style={{ color: currentGame.awayTeam.primaryColor ?? "#fff" }}>
              {currentGame.awayTeam.abbreviation}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {currentGame.awayScore}
            </span>
            <span className="text-cream/60">-</span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {currentGame.homeScore}
            </span>
            <span style={{ color: currentGame.homeTeam.primaryColor ?? "#fff" }}>
              {currentGame.homeTeam.abbreviation}
            </span>
          </div>

          {/* Inning */}
          <span className="text-xs text-cream/80 uppercase tracking-wide">
            {currentGame.currentInningHalf === "top" ? "Top" : "Bot"}{" "}
            {currentGame.currentInning}
          </span>

          {/* Multiple games indicator */}
          {games.length > 1 && (
            <span className="text-xs text-cream/60">
              +{games.length - 1} more
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-cream/60" />
        </Link>
      </div>
    </div>
  );
}

export default LiveGamesSection;
