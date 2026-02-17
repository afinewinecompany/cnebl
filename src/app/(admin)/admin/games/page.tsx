'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  GameStatusBadge,
  GameCalendar,
  GameCalendarCompact,
} from '@/components/admin';
import {
  Search,
  Filter,
  Calendar,
  List,
  Grid3X3,
  Plus,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Play,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameWithTeams, TeamWithManager, GameStatus } from '@/types';

// View modes
type ViewMode = 'list' | 'calendar';

// Status filter options
const STATUS_OPTIONS: { value: GameStatus | 'all'; label: string; icon?: React.ElementType }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar },
  { value: 'in_progress', label: 'Live', icon: Play },
  { value: 'final', label: 'Final', icon: CheckCircle2 },
  { value: 'postponed', label: 'Postponed', icon: PauseCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

/**
 * Admin Games Page
 *
 * Full game management interface with calendar/list views,
 * filtering, and quick actions.
 */
export default function AdminGamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [teams, setTeams] = useState<TeamWithManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load games and teams
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch games
        const gamesRes = await fetch('/api/admin/games?pageSize=100');
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData.data || []);
        }

        // Fetch teams
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Team filter
      if (selectedTeam !== 'all') {
        if (game.homeTeamId !== selectedTeam && game.awayTeamId !== selectedTeam) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && game.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const gameDate = parseISO(game.gameDate);
        if (isBefore(gameDate, startOfDay(parseISO(startDate)))) {
          return false;
        }
      }
      if (endDate) {
        const gameDate = parseISO(game.gameDate);
        if (isAfter(gameDate, endOfDay(parseISO(endDate)))) {
          return false;
        }
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesHome = game.homeTeam.name.toLowerCase().includes(query);
        const matchesAway = game.awayTeam.name.toLowerCase().includes(query);
        const matchesLocation = game.locationName?.toLowerCase().includes(query);
        if (!matchesHome && !matchesAway && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [games, selectedTeam, selectedStatus, startDate, endDate, searchQuery]);

  // Game stats summary
  const gameStats = useMemo(() => {
    return {
      total: games.length,
      scheduled: games.filter((g) => g.status === 'scheduled').length,
      live: games.filter((g) => g.status === 'in_progress').length,
      final: games.filter((g) => g.status === 'final').length,
      postponed: games.filter((g) => ['postponed', 'cancelled', 'suspended'].includes(g.status)).length,
    };
  }, [games]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTeam('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchQuery || selectedTeam !== 'all' || selectedStatus !== 'all' || startDate || endDate;

  const handleGameClick = (game: GameWithTeams) => {
    router.push(`/admin/games/${game.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-navy uppercase tracking-wide">
            Game Management
          </h1>
          <p className="text-charcoal-light font-body mt-1">
            Schedule, manage, and track all league games
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/games/new">
            <Plus className="w-4 h-4 mr-2" />
            New Game
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedStatus === 'all' ? 'ring-2 ring-navy' : 'hover:shadow-md'
          )}
          onClick={() => setSelectedStatus('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-light">Total Games</p>
                <p className="text-2xl font-bold font-mono text-navy">{gameStats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedStatus === 'scheduled' ? 'ring-2 ring-gray-500' : 'hover:shadow-md'
          )}
          onClick={() => setSelectedStatus('scheduled')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-light">Scheduled</p>
                <p className="text-2xl font-bold font-mono text-gray-600">{gameStats.scheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedStatus === 'in_progress' ? 'ring-2 ring-cardinal' : 'hover:shadow-md'
          )}
          onClick={() => setSelectedStatus('in_progress')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-light">Live Now</p>
                <p className="text-2xl font-bold font-mono text-cardinal">{gameStats.live}</p>
              </div>
              <Play className="w-8 h-8 text-cardinal" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            selectedStatus === 'final' ? 'ring-2 ring-gray-800' : 'hover:shadow-md'
          )}
          onClick={() => setSelectedStatus('final')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-light">Completed</p>
                <p className="text-2xl font-bold font-mono text-gray-800">{gameStats.final}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search teams or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Team Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-navy focus:border-navy"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as GameStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-navy focus:border-navy"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 w-40"
                />
              </div>
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}

            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 transition-colors',
                  viewMode === 'list' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'px-3 py-2 transition-colors',
                  viewMode === 'calendar' ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Display */}
      {viewMode === 'calendar' ? (
        <GameCalendar
          games={filteredGames}
          onGameClick={handleGameClick}
          onDateClick={(date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            setStartDate(dateStr);
            setEndDate(dateStr);
            setViewMode('list');
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredGames.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No games found</h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more games.'
                    : 'No games have been scheduled yet.'}
                </p>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link href="/admin/games/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule First Game
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredGames.map((game) => (
              <Link key={game.id} href={`/admin/games/${game.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Game Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          {/* Away Team */}
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: game.awayTeam.primaryColor || '#374151' }}
                            >
                              {game.awayTeam.abbreviation}
                            </div>
                            <span className="font-medium text-gray-900">
                              {game.awayTeam.name}
                            </span>
                          </div>

                          {/* Score or @ */}
                          {['in_progress', 'final'].includes(game.status) ? (
                            <div className="flex items-center gap-2 font-mono text-xl">
                              <span className="font-bold">{game.awayScore}</span>
                              <span className="text-gray-400">-</span>
                              <span className="font-bold">{game.homeScore}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">@</span>
                          )}

                          {/* Home Team */}
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: game.homeTeam.primaryColor || '#374151' }}
                            >
                              {game.homeTeam.abbreviation}
                            </div>
                            <span className="font-medium text-gray-900">
                              {game.homeTeam.name}
                            </span>
                          </div>
                        </div>

                        {/* Date & Location */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {format(parseISO(game.gameDate), 'MMM d, yyyy')}
                            {game.gameTime && ` at ${format(parseISO(`2000-01-01T${game.gameTime}`), 'h:mm a')}`}
                          </span>
                          {game.locationName && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>{game.locationName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-4">
                        <GameStatusBadge status={game.status} />
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Results summary */}
      {filteredGames.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {filteredGames.length} of {games.length} games
        </p>
      )}
    </div>
  );
}
