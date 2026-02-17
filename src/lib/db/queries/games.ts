/**
 * Game Queries
 * Query functions for game-related data
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { mockGames, teams } from '@/lib/mock-data';
import type { GameWithTeams, GameStatus } from '@/types';

// =============================================================================
// MOCK DATA TRANSFORMERS
// =============================================================================

/**
 * Transform mock game data to API format
 */
function transformGame(game: typeof mockGames[0]): GameWithTeams {
  return {
    id: game.id,
    seasonId: 'season-2026',
    gameNumber: parseInt(game.id.replace('game-', '')),
    homeTeamId: game.homeTeam.id,
    awayTeamId: game.awayTeam.id,
    gameDate: game.date,
    gameTime: game.time + ':00', // Add seconds for consistency
    timezone: 'America/New_York',
    locationName: game.location,
    locationAddress: `${game.field}, ${game.location}`,
    status: game.status as GameStatus,
    homeScore: game.homeScore ?? 0,
    awayScore: game.awayScore ?? 0,
    currentInning: game.inning ?? null,
    currentInningHalf: game.isTopInning !== undefined ? (game.isTopInning ? 'top' : 'bottom') : null,
    outs: null,
    homeInningScores: [],
    awayInningScores: [],
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-16T00:00:00Z',
    startedAt: game.status !== 'scheduled' ? `${game.date}T${game.time}:00Z` : null,
    endedAt: game.status === 'final' ? `${game.date}T${parseInt(game.time.split(':')[0]) + 3}:00:00Z` : null,
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      primaryColor: game.homeTeam.primaryColor,
      secondaryColor: game.homeTeam.secondaryColor,
      logoUrl: null,
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      primaryColor: game.awayTeam.primaryColor,
      secondaryColor: game.awayTeam.secondaryColor,
      logoUrl: null,
    },
  };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export interface GetGamesOptions {
  seasonId?: string;
  teamId?: string;
  status?: GameStatus | GameStatus[];
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'status';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Get games with filtering and pagination
 */
export async function getGames(options: GetGamesOptions = {}): Promise<{
  games: GameWithTeams[];
  totalCount: number;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  let filtered = [...mockGames];

  // Filter by team
  if (options.teamId) {
    filtered = filtered.filter(
      (g) => g.homeTeam.id === options.teamId || g.awayTeam.id === options.teamId
    );
  }

  // Filter by status
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    filtered = filtered.filter((g) => statuses.includes(g.status as GameStatus));
  }

  // Filter by date range
  if (options.startDate) {
    const start = new Date(options.startDate);
    filtered = filtered.filter((g) => new Date(g.date) >= start);
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    filtered = filtered.filter((g) => new Date(g.date) <= end);
  }

  // Sort
  const sortDir = options.sortDir === 'asc' ? 1 : -1;
  if (options.sortBy === 'status') {
    const statusOrder: Record<string, number> = {
      in_progress: 0,
      warmup: 1,
      scheduled: 2,
      final: 3,
      postponed: 4,
      cancelled: 5,
      suspended: 6,
    };
    filtered.sort((a, b) => (statusOrder[a.status] - statusOrder[b.status]) * sortDir);
  } else {
    // Default: sort by date
    filtered.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare * sortDir;
      return a.time.localeCompare(b.time) * sortDir;
    });
  }

  const totalCount = filtered.length;

  // Pagination
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    games: paginated.map(transformGame),
    totalCount,
  };
}

/**
 * Get a single game by ID
 */
export async function getGameById(gameId: string): Promise<GameWithTeams | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const game = mockGames.find((g) => g.id === gameId);
  if (!game) return null;

  return transformGame(game);
}

/**
 * Get live games (in_progress status)
 */
export async function getLiveGames(): Promise<GameWithTeams[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  return mockGames
    .filter((g) => g.status === 'in_progress')
    .map(transformGame);
}

/**
 * Get upcoming games
 */
export async function getUpcomingGames(limit = 5): Promise<GameWithTeams[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return mockGames
    .filter((g) => {
      const gameDate = new Date(g.date);
      return gameDate >= today && g.status === 'scheduled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit)
    .map(transformGame);
}

/**
 * Get recent results
 */
export async function getRecentResults(limit = 5): Promise<GameWithTeams[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  return mockGames
    .filter((g) => g.status === 'final')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map(transformGame);
}
