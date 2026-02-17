"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  games: Game[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onGameClick?: (game: Game) => void;
  className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * CalendarView Component
 * Monthly calendar grid showing games on their respective dates
 *
 * @example
 * <CalendarView
 *   games={gamesData}
 *   currentDate={new Date()}
 *   onDateChange={(date) => setCurrentDate(date)}
 *   onGameClick={(game) => handleGameClick(game)}
 * />
 */
export function CalendarView({
  games,
  currentDate,
  onDateChange,
  onGameClick,
  className,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ date: Date | null; games: Game[] }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, games: [] });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayGames = games.filter((game) => game.date === dateStr);
      days.push({ date, games: dayGames });
    }

    // Fill remaining cells to complete the grid
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let i = 0; i < remainingCells; i++) {
      days.push({ date: null, games: [] });
    }

    return days;
  }, [games, year, month]);

  const goToPreviousMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get week days for mobile week view
  const weekDays = useMemo(() => {
    // Get the start of the week (Sunday) for the current date
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const days: Array<{ date: Date; games: Game[] }> = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayGames = games.filter((game) => game.date === dateStr);
      days.push({ date, games: dayGames });
    }

    return days;
  }, [games, currentDate]);

  // Get week date range for display
  const weekDateRange = useMemo(() => {
    if (weekDays.length === 0) return "";
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const startMonth = MONTH_NAMES_SHORT[start.getMonth()];
    const endMonth = MONTH_NAMES_SHORT[end.getMonth()];

    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  }, [weekDays]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    onDateChange(newDate);
  };

  return (
    <>
      {/* Mobile Week View */}
      <div className="md:hidden">
        <MobileWeekView
          weekDays={weekDays}
          weekDateRange={weekDateRange}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
          isToday={isToday}
          onGameClick={onGameClick}
          className={className}
        />
      </div>

      {/* Desktop Month View */}
      <div className="hidden md:block">
        <Card className={cn("overflow-hidden", className)}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-cream-dark bg-navy p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="text-cream-light hover:bg-navy-light hover:text-chalk"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4">
              <h2 className="font-headline text-xl font-semibold uppercase tracking-wider text-chalk">
                {MONTH_NAMES[month]} {year}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-cream-light text-cream-light hover:bg-cream-light hover:text-navy"
              >
                Today
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="text-cream-light hover:bg-navy-light hover:text-chalk"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-cream-dark bg-cream-dark">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-headline text-xs font-semibold uppercase tracking-wider text-charcoal"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayData, index) => (
              <CalendarDay
                key={index}
                date={dayData.date}
                games={dayData.games}
                isToday={isToday(dayData.date)}
                onGameClick={onGameClick}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-cream-dark bg-cream-light p-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-cardinal" />
              <span className="text-xs text-charcoal-light">Live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-navy" />
              <span className="text-xs text-charcoal-light">Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-field" />
              <span className="text-xs text-charcoal-light">Final</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gold" />
              <span className="text-xs text-charcoal-light">Postponed</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// Mobile week view component
interface MobileWeekViewProps {
  weekDays: Array<{ date: Date; games: Game[] }>;
  weekDateRange: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  isToday: (date: Date | null) => boolean;
  onGameClick?: (game: Game) => void;
  className?: string;
}

function MobileWeekView({
  weekDays,
  weekDateRange,
  onPreviousWeek,
  onNextWeek,
  onToday,
  isToday,
  onGameClick,
  className,
}: MobileWeekViewProps) {
  // Format time for display (e.g., "2:00 PM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get status indicator styles and text
  const getStatusInfo = (status: Game["status"]) => {
    switch (status) {
      case "in_progress":
        return { color: "bg-cardinal", text: "LIVE", textColor: "text-cardinal" };
      case "final":
        return { color: "bg-field", text: "Final", textColor: "text-field" };
      case "scheduled":
        return { color: "bg-navy", text: "Scheduled", textColor: "text-navy" };
      case "postponed":
        return { color: "bg-gold", text: "Postponed", textColor: "text-gold" };
      case "cancelled":
        return { color: "bg-charcoal-light", text: "Cancelled", textColor: "text-charcoal-light" };
      default:
        return { color: "bg-charcoal-light", text: "", textColor: "text-charcoal-light" };
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between border-b border-cream-dark bg-navy p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousWeek}
          className="h-11 w-11 text-cream-light hover:bg-navy-light hover:text-chalk"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="flex flex-col items-center gap-1">
          <h2 className="font-headline text-lg font-semibold uppercase tracking-wider text-chalk">
            {weekDateRange}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-7 border-cream-light px-3 text-xs text-cream-light hover:bg-cream-light hover:text-navy"
          >
            Today
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNextWeek}
          className="h-11 w-11 text-cream-light hover:bg-navy-light hover:text-chalk"
          aria-label="Next week"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Week Days List */}
      <div className="divide-y divide-cream-dark">
        {weekDays.map((dayData, index) => {
          const dayIsToday = isToday(dayData.date);
          const hasGames = dayData.games.length > 0;

          return (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-4 m-2",
                dayIsToday
                  ? "border-leather bg-gold/10"
                  : "border-cream-dark bg-chalk"
              )}
            >
              {/* Day Header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 flex-col items-center justify-center rounded-lg",
                    dayIsToday ? "bg-leather text-chalk" : "bg-cream-dark text-charcoal"
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase leading-none">
                    {WEEKDAYS[dayData.date.getDay()]}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {dayData.date.getDate()}
                  </span>
                </div>
                {dayIsToday && (
                  <span className="rounded-full bg-leather px-2 py-0.5 text-xs font-semibold text-chalk">
                    Today
                  </span>
                )}
              </div>

              {/* Games List */}
              {hasGames ? (
                <div className="space-y-2">
                  {dayData.games.map((game) => {
                    const statusInfo = getStatusInfo(game.status);
                    return (
                      <button
                        key={game.id}
                        onClick={() => onGameClick?.(game)}
                        className={cn(
                          "flex min-h-[56px] w-full flex-col gap-1 rounded-lg border border-cream-dark bg-chalk p-3 text-left transition-transform active:scale-[0.98]",
                          game.status === "in_progress" && "border-cardinal/30 bg-cardinal/5"
                        )}
                      >
                        {/* Team Matchup */}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-navy">
                            {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
                          </span>
                          {/* Status Indicator */}
                          <div className="flex items-center gap-1.5">
                            <div className={cn("h-2 w-2 rounded-full", statusInfo.color)} />
                            <span className={cn("text-xs font-medium", statusInfo.textColor)}>
                              {game.status === "in_progress" && game.inning
                                ? `${game.isTopInning ? "Top" : "Bot"} ${game.inning}`
                                : statusInfo.text}
                            </span>
                          </div>
                        </div>

                        {/* Score (if game has started) */}
                        {(game.status === "in_progress" || game.status === "final") &&
                          game.awayScore !== null &&
                          game.homeScore !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono font-semibold text-charcoal">
                                {game.awayTeam.abbreviation} {game.awayScore} - {game.homeScore}{" "}
                                {game.homeTeam.abbreviation}
                              </span>
                            </div>
                          )}

                        {/* Time and Location */}
                        <div className="flex items-center gap-2 text-xs text-charcoal-light">
                          <span>{formatTime(game.time)}</span>
                          <span>-</span>
                          <span className="truncate">
                            {game.location}
                            {game.field && ` - ${game.field}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-cream-light py-4 text-center text-sm text-charcoal-light">
                  No games scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-cream-dark bg-cream-light p-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-cardinal" />
          <span className="text-xs text-charcoal-light">Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-navy" />
          <span className="text-xs text-charcoal-light">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-field" />
          <span className="text-xs text-charcoal-light">Final</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-gold" />
          <span className="text-xs text-charcoal-light">Postponed</span>
        </div>
      </div>
    </Card>
  );
}

// Calendar day cell component
function CalendarDay({
  date,
  games,
  isToday,
  onGameClick,
}: {
  date: Date | null;
  games: Game[];
  isToday: boolean;
  onGameClick?: (game: Game) => void;
}) {
  if (!date) {
    return <div className="min-h-[100px] border-b border-r border-cream-dark bg-cream-light/50 p-1" />;
  }

  const hasGames = games.length > 0;
  const hasLiveGame = games.some((g) => g.status === "in_progress");

  return (
    <div
      className={cn(
        "min-h-[100px] border-b border-r border-cream-dark p-1 transition-colors",
        isToday && "bg-gold/10",
        hasGames && "hover:bg-cream-light"
      )}
    >
      {/* Date Number */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold",
            isToday && "bg-leather text-chalk"
          )}
        >
          {date.getDate()}
        </span>
        {hasLiveGame && (
          <div className="live-indicator scale-75">
            <span className="sr-only">Live game</span>
          </div>
        )}
      </div>

      {/* Game Pills */}
      <div className="space-y-1">
        {games.slice(0, 3).map((game) => (
          <button
            key={game.id}
            onClick={() => onGameClick?.(game)}
            className={cn(
              "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80",
              game.status === "in_progress" && "bg-cardinal text-chalk",
              game.status === "final" && "bg-field text-chalk",
              game.status === "scheduled" && "bg-navy text-chalk",
              game.status === "postponed" && "bg-gold text-charcoal-dark",
              game.status === "cancelled" && "bg-charcoal-light text-chalk"
            )}
          >
            {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
          </button>
        ))}
        {games.length > 3 && (
          <span className="block text-center text-[10px] text-charcoal-light">
            +{games.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
