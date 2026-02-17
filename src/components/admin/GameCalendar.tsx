'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { GameStatusBadge, getStatusColor } from './GameStatusBadge';
import type { GameWithTeams, GameStatus } from '@/types';

interface GameCalendarProps {
  games: GameWithTeams[];
  onGameClick?: (game: GameWithTeams) => void;
  onDateClick?: (date: Date) => void;
  className?: string;
}

/**
 * GameCalendar Component
 *
 * Displays a calendar view of games with color-coded status indicators.
 * Supports month navigation and game/date click handlers.
 */
export function GameCalendar({
  games,
  onGameClick,
  onDateClick,
  className,
}: GameCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group games by date
  const gamesByDate = useMemo(() => {
    const grouped: Record<string, GameWithTeams[]> = {};
    games.forEach((game) => {
      const dateKey = game.gameDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(game);
    });
    return grouped;
  }, [games]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Get games for a specific date
  const getGamesForDate = (date: Date): GameWithTeams[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return gamesByDate[dateKey] || [];
  };

  // Get status summary for a date
  const getStatusSummary = (gamesOnDate: GameWithTeams[]): { status: GameStatus; count: number }[] => {
    const statusCounts: Record<GameStatus, number> = {
      scheduled: 0,
      warmup: 0,
      in_progress: 0,
      final: 0,
      postponed: 0,
      cancelled: 0,
      suspended: 0,
    };

    gamesOnDate.forEach((game) => {
      statusCounts[game.status]++;
    });

    return (Object.entries(statusCounts) as [GameStatus, number][])
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon-sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            Scheduled
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-cardinal animate-pulse" />
            Live
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-gray-800" />
            Final
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Postponed/Suspended
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-t border-b border-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-xs font-semibold text-gray-500 text-center uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dayIsToday = isToday(day);
            const gamesOnDate = getGamesForDate(day);
            const hasGames = gamesOnDate.length > 0;
            const statusSummary = getStatusSummary(gamesOnDate);
            const hasLiveGame = gamesOnDate.some((g) => g.status === 'in_progress');

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[100px] border-b border-r border-gray-200 p-1 relative transition-colors',
                  !isCurrentMonth && 'bg-gray-50',
                  hasGames && 'hover:bg-blue-50/50 cursor-pointer',
                  hasLiveGame && 'bg-cardinal/5'
                )}
                onClick={() => {
                  if (onDateClick && isCurrentMonth) {
                    onDateClick(day);
                  }
                }}
              >
                {/* Date number */}
                <div
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1',
                    dayIsToday && 'bg-navy text-white',
                    !dayIsToday && isCurrentMonth && 'text-gray-900',
                    !isCurrentMonth && 'text-gray-400'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Games indicator dots */}
                {hasGames && (
                  <div className="flex flex-wrap gap-0.5 mb-1">
                    {statusSummary.map(({ status, count }) => (
                      <div
                        key={status}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          status === 'in_progress' && 'animate-pulse'
                        )}
                        style={{ backgroundColor: getStatusColor(status) }}
                        title={`${count} ${status.replace('_', ' ')}`}
                      />
                    ))}
                  </div>
                )}

                {/* Game previews (max 2) */}
                <div className="space-y-0.5">
                  {gamesOnDate.slice(0, 2).map((game) => (
                    <button
                      key={game.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onGameClick?.(game);
                      }}
                      className={cn(
                        'w-full text-left px-1 py-0.5 rounded text-[10px] truncate',
                        'hover:bg-gray-100 transition-colors',
                        game.status === 'in_progress' && 'bg-cardinal/10 text-cardinal font-medium',
                        game.status === 'final' && 'text-gray-600',
                        game.status === 'scheduled' && 'text-gray-700'
                      )}
                    >
                      <span className="font-medium">{game.awayTeam.abbreviation}</span>
                      <span className="text-gray-400 mx-0.5">@</span>
                      <span className="font-medium">{game.homeTeam.abbreviation}</span>
                      {game.status === 'final' && (
                        <span className="ml-1 text-gray-500">
                          {game.awayScore}-{game.homeScore}
                        </span>
                      )}
                    </button>
                  ))}

                  {gamesOnDate.length > 2 && (
                    <div className="text-[10px] text-gray-500 px-1">
                      +{gamesOnDate.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * GameCalendarCompact
 *
 * A smaller calendar view that shows just dots for games.
 * Useful for sidebars or dashboard widgets.
 */
export function GameCalendarCompact({
  games,
  onDateSelect,
  selectedDate,
  className,
}: {
  games: GameWithTeams[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group games by date
  const gamesByDate = useMemo(() => {
    const grouped: Record<string, GameWithTeams[]> = {};
    games.forEach((game) => {
      const dateKey = game.gameDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(game);
    });
    return grouped;
  }, [games]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 px-2 py-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-[10px] text-gray-400 text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const dayIsToday = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const gamesOnDate = gamesByDate[dateKey] || [];
          const hasGames = gamesOnDate.length > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasLiveGame = gamesOnDate.some((g) => g.status === 'in_progress');

          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(day)}
              disabled={!isCurrentMonth}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded text-xs',
                'transition-colors relative',
                isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-300 cursor-default',
                isSelected && 'bg-navy text-white hover:bg-navy',
                dayIsToday && !isSelected && 'font-bold text-navy'
              )}
            >
              {format(day, 'd')}
              {hasGames && (
                <div
                  className={cn(
                    'absolute bottom-0.5 w-1 h-1 rounded-full',
                    hasLiveGame ? 'bg-cardinal animate-pulse' : 'bg-gray-400',
                    isSelected && 'bg-white'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GameCalendar;
