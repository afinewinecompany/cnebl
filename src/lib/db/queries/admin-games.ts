/**
 * Admin Games Queries
 * Query functions for admin game management and stats entry
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { mockGames, teams } from '@/lib/mock-data';
import type { GameWithTeams, GameStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface AdminGameView extends GameWithTeams {
  statsStatus: 'complete' | 'partial' | 'missing';
  homeBattingCount: number;
  awayBattingCount: number;
  homePitchingCount: number;
  awayPitchingCount: number;
}

export interface CreateGameInput {
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string;
  gameTime: string;
  timezone: string;
  locationName: string | null;
  locationAddress: string | null;
  notes: string | null;
}

// =============================================================================
// MOCK DATA
// =============================================================================

// Mock stats counts for demonstration
const mockStatsCounts: Record<string, {
  homeBatting: number;
  awayBatting: number;
  homePitching: number;
  awayPitching: number;
}> = {
  'game-001': { homeBatting: 9, awayBatting: 9, homePitching: 2, awayPitching: 3 },
  'game-002': { homeBatting: 9, awayBatting: 9, homePitching: 0, awayPitching: 0 },
  'game-003': { homeBatting: 0, awayBatting: 0, homePitching: 0, awayPitching: 0 },
};

function getStatsStatus(counts: typeof mockStatsCounts[string] | undefined): 'complete' | 'partial' | 'missing' {
  if (!counts) return 'missing';
  const hasBatting = counts.homeBatting > 0 && counts.awayBatting > 0;
  const hasPitching = counts.homePitching > 0 && counts.awayPitching > 0;

  if (hasBatting && hasPitching) return 'complete';
  if (hasBatting || hasPitching || counts.homeBatting > 0 || counts.awayBatting > 0) return 'partial';
  return 'missing';
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export interface AdminGetGamesOptions {
  seasonId?: string;
  teamId?: string;
  status?: GameStatus | GameStatus[];
  startDate?: string;
  endDate?: string;
  statsStatus?: 'complete' | 'partial' | 'missing';
  sortBy?: 'date' | 'status';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Get games with admin-specific data including stats completion status
 */
export async function getAdminGames(options: AdminGetGamesOptions = {}): Promise<{
  games: AdminGameView[];
  totalCount: number;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Transform mock games to admin view
  let games: AdminGameView[] = mockGames.map((game) => {
    const counts = mockStatsCounts[game.id];
    return {
      id: game.id,
      seasonId: 'season-2026',
      gameNumber: parseInt(game.id.replace('game-', '')),
      homeTeamId: game.homeTeam.id,
      awayTeamId: game.awayTeam.id,
      gameDate: game.date,
      gameTime: game.time + ':00',
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
      statsStatus: getStatsStatus(counts),
      homeBattingCount: counts?.homeBatting ?? 0,
      awayBattingCount: counts?.awayBatting ?? 0,
      homePitchingCount: counts?.homePitching ?? 0,
      awayPitchingCount: counts?.awayPitching ?? 0,
    };
  });

  // Filter by team
  if (options.teamId) {
    games = games.filter(
      (g) => g.homeTeamId === options.teamId || g.awayTeamId === options.teamId
    );
  }

  // Filter by status
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status];
    games = games.filter((g) => statuses.includes(g.status));
  }

  // Filter by stats status
  if (options.statsStatus) {
    games = games.filter((g) => g.statsStatus === options.statsStatus);
  }

  // Filter by date range
  if (options.startDate) {
    const start = new Date(options.startDate);
    games = games.filter((g) => new Date(g.gameDate) >= start);
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    games = games.filter((g) => new Date(g.gameDate) <= end);
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
    games.sort((a, b) => (statusOrder[a.status] - statusOrder[b.status]) * sortDir);
  } else {
    // Default: sort by date (most recent first)
    games.sort((a, b) => {
      const dateCompare = new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
      return dateCompare * sortDir;
    });
  }

  const totalCount = games.length;

  // Pagination
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paginated = games.slice(start, start + pageSize);

  return {
    games: paginated,
    totalCount,
  };
}

/**
 * Get a single game by ID with admin-specific data
 */
export async function getAdminGameById(gameId: string): Promise<AdminGameView | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const game = mockGames.find((g) => g.id === gameId);
  if (!game) return null;

  const counts = mockStatsCounts[gameId];
  return {
    id: game.id,
    seasonId: 'season-2026',
    gameNumber: parseInt(game.id.replace('game-', '')),
    homeTeamId: game.homeTeam.id,
    awayTeamId: game.awayTeam.id,
    gameDate: game.date,
    gameTime: game.time + ':00',
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
    statsStatus: getStatsStatus(counts),
    homeBattingCount: counts?.homeBatting ?? 0,
    awayBattingCount: counts?.awayBatting ?? 0,
    homePitchingCount: counts?.homePitching ?? 0,
    awayPitchingCount: counts?.awayPitching ?? 0,
  };
}

/**
 * Create a single game
 */
export async function createGame(input: CreateGameInput): Promise<GameWithTeams> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Find teams
  const homeTeam = teams.find((t) => t.id === input.homeTeamId);
  const awayTeam = teams.find((t) => t.id === input.awayTeamId);

  if (!homeTeam || !awayTeam) {
    throw new Error('Invalid team ID');
  }

  const newGame: GameWithTeams = {
    id: `game-${Date.now()}`,
    seasonId: 'season-2026',
    gameNumber: mockGames.length + 1,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    gameDate: input.gameDate,
    gameTime: input.gameTime,
    timezone: input.timezone,
    locationName: input.locationName,
    locationAddress: input.locationAddress,
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    currentInning: null,
    currentInningHalf: null,
    outs: null,
    homeInningScores: [],
    awayInningScores: [],
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    endedAt: null,
    homeTeam: {
      id: homeTeam.id,
      name: homeTeam.name,
      abbreviation: homeTeam.abbreviation,
      primaryColor: homeTeam.primaryColor,
      secondaryColor: homeTeam.secondaryColor,
      logoUrl: null,
    },
    awayTeam: {
      id: awayTeam.id,
      name: awayTeam.name,
      abbreviation: awayTeam.abbreviation,
      primaryColor: awayTeam.primaryColor,
      secondaryColor: awayTeam.secondaryColor,
      logoUrl: null,
    },
  };

  return newGame;
}

/**
 * Create multiple games (series)
 */
export async function createGameSeries(inputs: CreateGameInput[]): Promise<GameWithTeams[]> {
  const games: GameWithTeams[] = [];
  for (const input of inputs) {
    const game = await createGame(input);
    games.push(game);
  }
  return games;
}

/**
 * Get stats summary for games
 */
export async function getGameStatsSummary(): Promise<{
  totalFinalGames: number;
  completeStats: number;
  partialStats: number;
  missingStats: number;
}> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const finalGames = mockGames.filter((g) => g.status === 'final');
  let complete = 0;
  let partial = 0;
  let missing = 0;

  finalGames.forEach((game) => {
    const status = getStatsStatus(mockStatsCounts[game.id]);
    if (status === 'complete') complete++;
    else if (status === 'partial') partial++;
    else missing++;
  });

  return {
    totalFinalGames: finalGames.length,
    completeStats: complete,
    partialStats: partial,
    missingStats: missing,
  };
}

/**
 * Update a game
 * In production, this would update the database record
 */
export async function updateGame(
  gameId: string,
  updates: Record<string, unknown>
): Promise<GameWithTeams> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Find the game
  const game = mockGames.find((g) => g.id === gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  // For mock purposes, we just return the game with updates applied
  // In production, this would actually update the database
  const homeTeam = updates.homeTeamId
    ? teams.find((t) => t.id === updates.homeTeamId) || game.homeTeam
    : game.homeTeam;
  const awayTeam = updates.awayTeamId
    ? teams.find((t) => t.id === updates.awayTeamId) || game.awayTeam
    : game.awayTeam;

  const updatedGame: GameWithTeams = {
    id: game.id,
    seasonId: 'season-2026',
    gameNumber: parseInt(game.id.replace('game-', '')),
    homeTeamId: (updates.homeTeamId as string) || game.homeTeam.id,
    awayTeamId: (updates.awayTeamId as string) || game.awayTeam.id,
    gameDate: (updates.gameDate as string) || game.date,
    gameTime: (updates.gameTime as string) || game.time + ':00',
    timezone: (updates.timezone as string) || 'America/New_York',
    locationName: updates.locationName !== undefined
      ? (updates.locationName as string | null)
      : game.location,
    locationAddress: updates.locationAddress !== undefined
      ? (updates.locationAddress as string | null)
      : `${game.field}, ${game.location}`,
    status: (updates.status as GameStatus) || game.status as GameStatus,
    homeScore: updates.homeScore !== undefined
      ? (updates.homeScore as number)
      : (game.homeScore ?? 0),
    awayScore: updates.awayScore !== undefined
      ? (updates.awayScore as number)
      : (game.awayScore ?? 0),
    currentInning: game.inning ?? null,
    currentInningHalf: game.isTopInning !== undefined
      ? (game.isTopInning ? 'top' : 'bottom')
      : null,
    outs: null,
    homeInningScores: [],
    awayInningScores: [],
    notes: updates.notes !== undefined ? (updates.notes as string | null) : null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    startedAt: game.status !== 'scheduled' ? `${game.date}T${game.time}:00Z` : null,
    endedAt: game.status === 'final'
      ? `${game.date}T${parseInt(game.time.split(':')[0]) + 3}:00:00Z`
      : null,
    homeTeam: {
      id: homeTeam.id,
      name: homeTeam.name,
      abbreviation: homeTeam.abbreviation,
      primaryColor: homeTeam.primaryColor,
      secondaryColor: homeTeam.secondaryColor,
      logoUrl: null,
    },
    awayTeam: {
      id: awayTeam.id,
      name: awayTeam.name,
      abbreviation: awayTeam.abbreviation,
      primaryColor: awayTeam.primaryColor,
      secondaryColor: awayTeam.secondaryColor,
      logoUrl: null,
    },
  };

  return updatedGame;
}

/**
 * Delete a game
 * In production, this would delete the database record
 */
export async function deleteGame(gameId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const gameIndex = mockGames.findIndex((g) => g.id === gameId);
  if (gameIndex === -1) {
    throw new Error('Game not found');
  }

  // In mock mode, we don't actually delete
  // In production, this would delete from the database
}
