"use client";

import { useState, useMemo } from "react";
import { GameCard } from "@/components/games/GameCard";
import { CalendarView } from "@/components/games/CalendarView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  mockGames,
  teams,
  getGamesByMonth,
  getLiveGames,
  type Game,
} from "@/lib/mock-data";
import { Calendar, List, Filter, X } from "lucide-react";

type ViewMode = "calendar" | "list";
type DateFilter = "all" | "thisWeek" | "thisMonth";

/**
 * Schedule Page
 * Displays league game schedule in calendar or list view with filtering
 *
 * Features:
 * - Calendar view with monthly navigation
 * - List view of games
 * - Filter by team
 * - Filter by date range
 * - Live game indicators
 * - Mobile responsive
 */
export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get live games for the banner
  const liveGames = getLiveGames();

  // Filter games based on current selections
  const filteredGames = useMemo(() => {
    let games = [...mockGames];

    // Filter by team
    if (selectedTeam) {
      games = games.filter(
        (game) =>
          game.homeTeam.id === selectedTeam || game.awayTeam.id === selectedTeam
      );
    }

    // Filter by date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "thisWeek") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      games = games.filter((game) => {
        const gameDate = new Date(game.date);
        return gameDate >= startOfWeek && gameDate <= endOfWeek;
      });
    } else if (dateFilter === "thisMonth") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      games = games.filter((game) => {
        const gameDate = new Date(game.date);
        return gameDate >= startOfMonth && gameDate <= endOfMonth;
      });
    }

    // Sort by date
    games.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return games;
  }, [selectedTeam, dateFilter]);

  // Games for calendar view (current month only)
  const calendarGames = useMemo(() => {
    let games = getGamesByMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );

    if (selectedTeam) {
      games = games.filter(
        (game) =>
          game.homeTeam.id === selectedTeam || game.awayTeam.id === selectedTeam
      );
    }

    return games;
  }, [currentDate, selectedTeam]);

  // Group games by date for list view
  const gamesByDate = useMemo(() => {
    const grouped: Record<string, Game[]> = {};
    filteredGames.forEach((game) => {
      if (!grouped[game.date]) {
        grouped[game.date] = [];
      }
      grouped[game.date].push(game);
    });
    return grouped;
  }, [filteredGames]);

  const clearFilters = () => {
    setSelectedTeam(null);
    setDateFilter("all");
  };

  const hasActiveFilters = selectedTeam !== null || dateFilter !== "all";

  return (
    <div className="min-h-screen bg-cream">
      {/* Page Header */}
      <div className="stitch-border bg-navy py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-chalk md:text-4xl">
            Game Schedule
          </h1>
          <p className="mt-2 font-body text-cream-light">
            View upcoming games, results, and live scores
          </p>
        </div>
      </div>

      {/* Live Games Banner */}
      {liveGames.length > 0 && (
        <div className="bg-cardinal py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3">
              <div className="live-indicator">
                <span className="font-headline text-sm font-semibold uppercase tracking-wider text-chalk">
                  {liveGames.length} Live {liveGames.length === 1 ? "Game" : "Games"}
                </span>
              </div>
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                {liveGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="rounded bg-chalk/20 px-3 py-1 text-sm text-chalk transition-colors hover:bg-chalk/30"
                  >
                    {game.awayTeam.abbreviation} {game.awayScore} - {game.homeScore}{" "}
                    {game.homeTeam.abbreviation}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Controls Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-cardinal"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="danger" className="ml-1">
                  {(selectedTeam ? 1 : 0) + (dateFilter !== "all" ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Team Filter */}
                <div>
                  <label className="mb-2 block font-headline text-sm font-semibold uppercase tracking-wider text-navy">
                    Filter by Team
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        selectedTeam === null
                          ? "bg-leather text-chalk"
                          : "bg-cream-dark text-charcoal hover:bg-cream"
                      )}
                    >
                      All Teams
                    </button>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team.id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                          selectedTeam === team.id
                            ? "bg-leather text-chalk"
                            : "bg-cream-dark text-charcoal hover:bg-cream"
                        )}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="mb-2 block font-headline text-sm font-semibold uppercase tracking-wider text-navy">
                    Date Range
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all" as const, label: "All Games" },
                      { value: "thisWeek" as const, label: "This Week" },
                      { value: "thisMonth" as const, label: "This Month" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateFilter(option.value)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                          dateFilter === option.value
                            ? "bg-navy text-chalk"
                            : "bg-cream-dark text-charcoal hover:bg-cream"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <CalendarView
            games={calendarGames}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onGameClick={setSelectedGame}
          />
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-8">
            {Object.keys(gamesByDate).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-charcoal-light">
                    No games found matching your filters.
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters to see all games
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              Object.entries(gamesByDate).map(([date, games]) => {
                const gameDate = new Date(date);
                const formattedDate = gameDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });

                const isToday =
                  gameDate.toDateString() === new Date().toDateString();
                const isPast = gameDate < new Date() && !isToday;

                return (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="mb-4 flex items-center gap-3">
                      <h2
                        className={cn(
                          "font-headline text-lg font-semibold uppercase tracking-wider",
                          isToday ? "text-leather" : "text-navy"
                        )}
                      >
                        {formattedDate}
                      </h2>
                      {isToday && <Badge variant="primary">Today</Badge>}
                      {isPast && (
                        <Badge variant="outline" className="text-charcoal-light">
                          Past
                        </Badge>
                      )}
                    </div>

                    {/* Games Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {games.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          className="cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Game Detail Modal */}
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </div>
    </div>
  );
}

// Game Detail Modal Component
function GameDetailModal({
  game,
  onClose,
}: {
  game: Game;
  onClose: () => void;
}) {
  const gameDate = new Date(game.date);
  const formattedDate = gameDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(`2000-01-01T${game.time}`).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-dark/50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative border-b border-cream-dark">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-1 text-charcoal-light transition-colors hover:bg-cream-dark hover:text-charcoal"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <GameCard game={game} />

          {/* Additional Details */}
          <div className="mt-4 space-y-3 border-t border-cream-dark pt-4">
            <div>
              <span className="font-headline text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                Date & Time
              </span>
              <p className="text-charcoal">
                {formattedDate} at {formattedTime}
              </p>
            </div>
            <div>
              <span className="font-headline text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                Location
              </span>
              <p className="text-charcoal">
                {game.location} - {game.field}
              </p>
            </div>
            {game.status === "in_progress" && game.inning && (
              <div>
                <span className="font-headline text-xs font-semibold uppercase tracking-wider text-charcoal-light">
                  Current Inning
                </span>
                <p className="text-charcoal">
                  {game.isTopInning ? "Top" : "Bottom"} of the {game.inning}
                  {game.inning === 1
                    ? "st"
                    : game.inning === 2
                    ? "nd"
                    : game.inning === 3
                    ? "rd"
                    : "th"}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {game.status === "in_progress" && (
              <Button variant="danger" className="flex-1">
                Watch Live
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
