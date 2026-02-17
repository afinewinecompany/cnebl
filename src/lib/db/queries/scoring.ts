/**
 * Scoring Queries
 * Query functions for live game scoring operations
 * Currently uses mock data - will be replaced with PostgreSQL queries
 */

import { mockGames, teams } from '@/lib/mock-data';
import type { GameWithTeams, GameStatus, InningHalf } from '@/types';
import {
  calculateNextHalfInning,
  calculateTotalScore,
  isExtraInnings,
  STANDARD_INNINGS,
  MAX_OUTS,
} from '@/lib/api/schemas/scoring';

// =============================================================================
// IN-MEMORY STATE (Mock Database)
// =============================================================================

/**
 * Extended game state for scoring (in-memory mock)
 * In production, this would be stored in the database
 */
interface GameScoringState {
  id: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  currentInning: number | null;
  currentInningHalf: InningHalf | null;
  outs: number | null;
  homeInningScores: number[];
  awayInningScores: number[];
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
}

// Initialize scoring state from mock games
const scoringStateMap = new Map<string, GameScoringState>();

function initializeScoringState(): void {
  if (scoringStateMap.size > 0) return; // Already initialized

  for (const game of mockGames) {
    const status = game.status as GameStatus;
    const isInProgress = status === 'in_progress';

    scoringStateMap.set(game.id, {
      id: game.id,
      status,
      homeScore: game.homeScore ?? 0,
      awayScore: game.awayScore ?? 0,
      currentInning: isInProgress ? (game.inning ?? 1) : null,
      currentInningHalf: isInProgress
        ? game.isTopInning !== undefined
          ? game.isTopInning
            ? 'top'
            : 'bottom'
          : 'top'
        : null,
      outs: isInProgress ? 0 : null,
      homeInningScores: isInProgress
        ? generateMockInningScores(game.homeScore ?? 0, game.inning ?? 1, game.isTopInning ?? true)
        : [],
      awayInningScores: isInProgress
        ? generateMockInningScores(game.awayScore ?? 0, game.inning ?? 1, game.isTopInning ?? true)
        : [],
      notes: null,
      startedAt: status !== 'scheduled' ? `${game.date}T${game.time}:00Z` : null,
      endedAt: status === 'final' ? `${game.date}T${parseInt(game.time.split(':')[0]) + 3}:00:00Z` : null,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Generate mock inning scores that sum to the total
 */
function generateMockInningScores(
  totalScore: number,
  currentInning: number,
  isTopInning: boolean
): number[] {
  const completedInnings = isTopInning ? currentInning - 1 : currentInning;
  if (completedInnings <= 0 || totalScore === 0) {
    return new Array(Math.max(0, completedInnings)).fill(0);
  }

  const scores: number[] = [];
  let remaining = totalScore;

  for (let i = 0; i < completedInnings; i++) {
    if (i === completedInnings - 1) {
      scores.push(remaining);
    } else {
      // Random distribution
      const maxThisInning = Math.min(remaining, 5);
      const runsThisInning = Math.floor(Math.random() * (maxThisInning + 1));
      scores.push(runsThisInning);
      remaining -= runsThisInning;
    }
  }

  return scores;
}

// Initialize on module load
initializeScoringState();

// =============================================================================
// TYPES
// =============================================================================

export interface ScoringGameState {
  id: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  currentInning: number | null;
  currentInningHalf: InningHalf | null;
  outs: number | null;
  homeInningScores: number[];
  awayInningScores: number[];
  isExtraInnings: boolean;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
}

export interface ScoringActionResult {
  action: 'start' | 'score' | 'out' | 'advance' | 'end' | 'update';
  previousState: Partial<ScoringGameState>;
  newState: ScoringGameState;
  autoAdvanced?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getState(gameId: string): GameScoringState | undefined {
  initializeScoringState();
  return scoringStateMap.get(gameId);
}

function setState(gameId: string, state: GameScoringState): void {
  state.updatedAt = new Date().toISOString();
  scoringStateMap.set(gameId, state);
}

function toScoringGameState(state: GameScoringState): ScoringGameState {
  return {
    ...state,
    isExtraInnings: isExtraInnings(state.currentInning),
  };
}

function getTeamInfo(teamId: string) {
  const team = teams.find((t) => t.id === teamId);
  return team
    ? {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoUrl: null,
      }
    : null;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get current scoring state for a game
 */
export async function getGameScoringState(gameId: string): Promise<ScoringGameState | null> {
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async

  const state = getState(gameId);
  if (!state) return null;

  return toScoringGameState(state);
}

/**
 * Get game with team information and scoring state
 */
export async function getGameWithScoringState(gameId: string): Promise<GameWithTeams | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const game = mockGames.find((g) => g.id === gameId);
  const state = getState(gameId);

  if (!game || !state) return null;

  const homeTeam = getTeamInfo(game.homeTeam.id);
  const awayTeam = getTeamInfo(game.awayTeam.id);

  if (!homeTeam || !awayTeam) return null;

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
    status: state.status,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    currentInning: state.currentInning,
    currentInningHalf: state.currentInningHalf,
    outs: state.outs,
    homeInningScores: state.homeInningScores,
    awayInningScores: state.awayInningScores,
    notes: state.notes,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: state.updatedAt,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    homeTeam,
    awayTeam,
  };
}

/**
 * Start a game
 */
export async function startGame(
  gameId: string,
  options: { status?: 'warmup' | 'in_progress' } = {}
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state) return null;

  const previousState = { ...state };
  const newStatus = options.status ?? 'in_progress';

  state.status = newStatus;
  state.startedAt = new Date().toISOString();

  if (newStatus === 'in_progress') {
    state.currentInning = 1;
    state.currentInningHalf = 'top';
    state.outs = 0;
    state.homeInningScores = [];
    state.awayInningScores = [];
    state.homeScore = 0;
    state.awayScore = 0;
  }

  setState(gameId, state);

  return {
    action: 'start',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
  };
}

/**
 * Record runs for the current half-inning
 * In top half: runs go to away team
 * In bottom half: runs go to home team
 */
export async function recordScore(
  gameId: string,
  runs: number
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state || state.status !== 'in_progress') return null;

  const previousState = { ...state };
  const inning = state.currentInning ?? 1;
  const half = state.currentInningHalf ?? 'top';

  // Determine which team scored
  if (half === 'top') {
    // Away team batting in top half
    state.awayScore += runs;

    // Update inning scores array
    const inningIndex = inning - 1;
    while (state.awayInningScores.length <= inningIndex) {
      state.awayInningScores.push(0);
    }
    state.awayInningScores[inningIndex] += runs;
  } else {
    // Home team batting in bottom half
    state.homeScore += runs;

    // Update inning scores array
    const inningIndex = inning - 1;
    while (state.homeInningScores.length <= inningIndex) {
      state.homeInningScores.push(0);
    }
    state.homeInningScores[inningIndex] += runs;
  }

  setState(gameId, state);

  return {
    action: 'score',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
  };
}

/**
 * Record an out (or multiple outs for double/triple plays)
 * Auto-advances to next half-inning at 3 outs
 */
export async function recordOut(
  gameId: string,
  count: number = 1
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state || state.status !== 'in_progress') return null;

  const previousState = { ...state };
  let autoAdvanced = false;

  // Add outs
  state.outs = Math.min((state.outs ?? 0) + count, MAX_OUTS);

  // Check for auto-advance
  if (state.outs >= MAX_OUTS) {
    const currentInning = state.currentInning ?? 1;
    const currentHalf = state.currentInningHalf ?? 'top';

    // Finalize current half-inning scores
    const inningIndex = currentInning - 1;

    if (currentHalf === 'top') {
      // Ensure away team has a score entry for this inning
      while (state.awayInningScores.length <= inningIndex) {
        state.awayInningScores.push(0);
      }
    } else {
      // Ensure home team has a score entry for this inning
      while (state.homeInningScores.length <= inningIndex) {
        state.homeInningScores.push(0);
      }
    }

    // Calculate next half-inning
    const next = calculateNextHalfInning(currentInning, currentHalf);
    state.currentInning = next.inning;
    state.currentInningHalf = next.half;
    state.outs = 0;
    autoAdvanced = true;
  }

  setState(gameId, state);

  return {
    action: 'out',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
    autoAdvanced,
  };
}

/**
 * Manually advance to the next half-inning
 */
export async function advanceInning(
  gameId: string,
  options: { forceInning?: number; forceHalf?: InningHalf } = {}
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state || state.status !== 'in_progress') return null;

  const previousState = { ...state };

  if (options.forceInning !== undefined && options.forceHalf !== undefined) {
    // Force specific inning/half (for corrections)
    state.currentInning = options.forceInning;
    state.currentInningHalf = options.forceHalf;
  } else {
    // Normal advancement
    const currentInning = state.currentInning ?? 1;
    const currentHalf = state.currentInningHalf ?? 'top';

    // Finalize current half-inning scores
    const inningIndex = currentInning - 1;

    if (currentHalf === 'top') {
      while (state.awayInningScores.length <= inningIndex) {
        state.awayInningScores.push(0);
      }
    } else {
      while (state.homeInningScores.length <= inningIndex) {
        state.homeInningScores.push(0);
      }
    }

    const next = calculateNextHalfInning(currentInning, currentHalf);
    state.currentInning = next.inning;
    state.currentInningHalf = next.half;
  }

  state.outs = 0;

  setState(gameId, state);

  return {
    action: 'advance',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
  };
}

/**
 * End a game
 */
export async function endGame(
  gameId: string,
  options: { status?: GameStatus; notes?: string } = {}
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state) return null;

  const previousState = { ...state };

  state.status = options.status ?? 'final';
  state.endedAt = new Date().toISOString();

  if (options.notes) {
    state.notes = options.notes;
  }

  // Keep inning data for final games but clear current state indicators
  if (state.status === 'final') {
    // Inning/outs stay for historical record but game is over
  }

  setState(gameId, state);

  return {
    action: 'end',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
  };
}

/**
 * Update game state (admin corrections)
 */
export async function updateGameState(
  gameId: string,
  updates: {
    currentInning?: number;
    currentInningHalf?: InningHalf;
    outs?: number;
    homeScore?: number;
    awayScore?: number;
    homeInningScores?: number[];
    awayInningScores?: number[];
    notes?: string;
  }
): Promise<ScoringActionResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const state = getState(gameId);
  if (!state) return null;

  const previousState = { ...state };

  // Apply updates
  if (updates.currentInning !== undefined) {
    state.currentInning = updates.currentInning;
  }
  if (updates.currentInningHalf !== undefined) {
    state.currentInningHalf = updates.currentInningHalf;
  }
  if (updates.outs !== undefined) {
    state.outs = updates.outs;
  }
  if (updates.homeScore !== undefined) {
    state.homeScore = updates.homeScore;
  }
  if (updates.awayScore !== undefined) {
    state.awayScore = updates.awayScore;
  }
  if (updates.homeInningScores !== undefined) {
    state.homeInningScores = updates.homeInningScores;
    state.homeScore = calculateTotalScore(updates.homeInningScores);
  }
  if (updates.awayInningScores !== undefined) {
    state.awayInningScores = updates.awayInningScores;
    state.awayScore = calculateTotalScore(updates.awayInningScores);
  }
  if (updates.notes !== undefined) {
    state.notes = updates.notes;
  }

  setState(gameId, state);

  return {
    action: 'update',
    previousState: toScoringGameState(previousState),
    newState: toScoringGameState(state),
  };
}

/**
 * Get all games currently in progress
 */
export async function getLiveGamesWithScoring(): Promise<GameWithTeams[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  initializeScoringState();

  const liveGames: GameWithTeams[] = [];

  for (const [gameId, state] of scoringStateMap.entries()) {
    if (state.status === 'in_progress') {
      const game = await getGameWithScoringState(gameId);
      if (game) {
        liveGames.push(game);
      }
    }
  }

  // Sort by game date/time
  liveGames.sort((a, b) => {
    const dateCompare = new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (a.gameTime ?? '').localeCompare(b.gameTime ?? '');
  });

  return liveGames;
}

/**
 * Check if a user is a manager of either team in a game
 */
export async function isUserGameManager(
  gameId: string,
  userId: string,
  userTeamId?: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const game = mockGames.find((g) => g.id === gameId);
  if (!game) return false;

  // In mock data, check if user's team matches home or away team
  // In production, this would check the teams table for managerId
  if (!userTeamId) return false;

  return userTeamId === game.homeTeam.id || userTeamId === game.awayTeam.id;
}

/**
 * Get game basic info for permission checking
 */
export async function getGameBasicInfo(gameId: string): Promise<{
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  status: GameStatus;
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const game = mockGames.find((g) => g.id === gameId);
  const state = getState(gameId);

  if (!game || !state) return null;

  return {
    id: game.id,
    homeTeamId: game.homeTeam.id,
    awayTeamId: game.awayTeam.id,
    status: state.status,
  };
}
