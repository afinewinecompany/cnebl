/**
 * Zod Validation Schemas for Game Scoring API
 *
 * Provides type-safe validation for all scoring-related endpoints.
 * Only team managers can score their games.
 */

import { z } from 'zod';
import type { GameStatus, InningHalf } from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Valid game statuses and transitions
 */
export const GAME_STATUSES: GameStatus[] = [
  'scheduled',
  'warmup',
  'in_progress',
  'final',
  'postponed',
  'cancelled',
  'suspended',
];

/**
 * Status transitions that are allowed
 * Key: current status, Value: array of valid next statuses
 */
export const VALID_STATUS_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  scheduled: ['warmup', 'in_progress', 'postponed', 'cancelled'],
  warmup: ['in_progress', 'postponed', 'cancelled'],
  in_progress: ['final', 'suspended'],
  final: [], // No transitions from final
  postponed: ['scheduled', 'cancelled'],
  cancelled: [], // No transitions from cancelled
  suspended: ['in_progress', 'cancelled'],
};

/**
 * Standard 9-inning game
 */
export const STANDARD_INNINGS = 9;

/**
 * Maximum outs per half-inning
 */
export const MAX_OUTS = 3;

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * UUID or mock ID validation (accepts both for development)
 */
export const gameIdSchema = z
  .string()
  .min(1, 'Game ID is required');

/**
 * Runs scored in a half-inning (0 or positive integer)
 */
export const runsSchema = z
  .number()
  .int('Runs must be a whole number')
  .min(0, 'Runs cannot be negative')
  .max(99, 'Runs cannot exceed 99 per half-inning');

/**
 * Inning number (1 or greater, supports extra innings)
 */
export const inningSchema = z
  .number()
  .int('Inning must be a whole number')
  .min(1, 'Inning must be at least 1');

/**
 * Inning half (top or bottom)
 */
export const inningHalfSchema = z.enum(['top', 'bottom']);

/**
 * Outs (0-3)
 */
export const outsSchema = z
  .number()
  .int('Outs must be a whole number')
  .min(0, 'Outs cannot be negative')
  .max(3, 'Outs cannot exceed 3');

/**
 * Game status enum
 */
export const gameStatusSchema = z.enum([
  'scheduled',
  'warmup',
  'in_progress',
  'final',
  'postponed',
  'cancelled',
  'suspended',
]);

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for starting a game
 * POST /api/games/[gameId]/start
 *
 * Sets game to 'in_progress', initializes inning to 1, half to 'top', outs to 0
 */
export const startGameSchema = z.object({
  // Optional: allows setting warmup status first
  status: z.enum(['warmup', 'in_progress']).optional().default('in_progress'),
});

export type StartGameInput = z.infer<typeof startGameSchema>;

/**
 * Schema for recording runs in current half-inning
 * POST /api/games/[gameId]/score
 *
 * Records runs for the current half-inning (home team in bottom, away team in top)
 */
export const recordScoreSchema = z.object({
  runs: runsSchema,
});

export type RecordScoreInput = z.infer<typeof recordScoreSchema>;

/**
 * Schema for recording an out
 * POST /api/games/[gameId]/out
 *
 * Increments outs by 1. Auto-advances to next half-inning when reaching 3 outs.
 */
export const recordOutSchema = z.object({
  // Optional: record multiple outs at once (e.g., double play)
  count: z
    .number()
    .int('Out count must be a whole number')
    .min(1, 'Must record at least 1 out')
    .max(3, 'Cannot record more than 3 outs at once')
    .optional()
    .default(1),
});

export type RecordOutInput = z.infer<typeof recordOutSchema>;

/**
 * Schema for manually advancing to next half-inning
 * POST /api/games/[gameId]/advance
 *
 * Moves to next half-inning (top -> bottom, or bottom -> next inning top)
 */
export const advanceInningSchema = z.object({
  // Optional: force specific inning/half (for corrections)
  forceInning: inningSchema.optional(),
  forceHalf: inningHalfSchema.optional(),
}).refine(
  (data) => {
    // If one force field is provided, both must be provided
    const hasForceInning = data.forceInning !== undefined;
    const hasForceHalf = data.forceHalf !== undefined;
    return hasForceInning === hasForceHalf;
  },
  { message: 'Both forceInning and forceHalf must be provided together, or neither' }
);

export type AdvanceInningInput = z.infer<typeof advanceInningSchema>;

/**
 * Schema for ending a game
 * POST /api/games/[gameId]/end
 *
 * Sets game status to 'final', records end time
 */
export const endGameSchema = z.object({
  // Optional: allow setting other end statuses
  status: z.enum(['final', 'suspended', 'postponed', 'cancelled']).optional().default('final'),
  // Optional: notes about why game ended (e.g., rain delay)
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type EndGameInput = z.infer<typeof endGameSchema>;

/**
 * Schema for updating full game state (admin correction)
 * PATCH /api/games/[gameId]/state
 */
export const updateGameStateSchema = z.object({
  currentInning: inningSchema.optional(),
  currentInningHalf: inningHalfSchema.optional(),
  outs: outsSchema.optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  homeInningScores: z.array(z.number().int().min(0)).optional(),
  awayInningScores: z.array(z.number().int().min(0)).optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateGameStateInput = z.infer<typeof updateGameStateSchema>;

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Game state after scoring action
 */
export const gameStateResponseSchema = z.object({
  id: z.string(),
  status: gameStatusSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  currentInning: z.number().nullable(),
  currentInningHalf: inningHalfSchema.nullable(),
  outs: z.number().nullable(),
  homeInningScores: z.array(z.number()),
  awayInningScores: z.array(z.number()),
  isExtraInnings: z.boolean(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export type GameStateResponse = z.infer<typeof gameStateResponseSchema>;

/**
 * Scoring action result
 */
export const scoringActionResponseSchema = z.object({
  action: z.enum(['start', 'score', 'out', 'advance', 'end', 'update']),
  previousState: gameStateResponseSchema.partial(),
  newState: gameStateResponseSchema,
  autoAdvanced: z.boolean().optional(), // True if 3 outs triggered auto-advance
});

export type ScoringActionResponse = z.infer<typeof scoringActionResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Generic validation helper that returns typed result
 */
function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return { success: false, errors };
  };
}

/**
 * Validate start game request
 */
export const validateStartGame = createValidator(startGameSchema);

/**
 * Validate record score request
 */
export const validateRecordScore = createValidator(recordScoreSchema);

/**
 * Validate record out request
 */
export const validateRecordOut = createValidator(recordOutSchema);

/**
 * Validate advance inning request
 */
export const validateAdvanceInning = createValidator(advanceInningSchema);

/**
 * Validate end game request
 */
export const validateEndGame = createValidator(endGameSchema);

/**
 * Validate update game state request
 */
export const validateUpdateGameState = createValidator(updateGameStateSchema);

// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: GameStatus,
  newStatus: GameStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Validate that a game can be started
 */
export function validateCanStartGame(game: {
  status: GameStatus;
}): { valid: true } | { valid: false; reason: string } {
  if (game.status === 'in_progress') {
    return { valid: false, reason: 'Game is already in progress' };
  }

  if (game.status === 'final') {
    return { valid: false, reason: 'Game has already ended' };
  }

  if (game.status === 'cancelled') {
    return { valid: false, reason: 'Game has been cancelled' };
  }

  if (!['scheduled', 'warmup', 'suspended'].includes(game.status)) {
    return { valid: false, reason: `Cannot start game with status '${game.status}'` };
  }

  return { valid: true };
}

/**
 * Validate that scoring actions can be performed
 */
export function validateCanScore(game: {
  status: GameStatus;
}): { valid: true } | { valid: false; reason: string } {
  if (game.status !== 'in_progress') {
    return { valid: false, reason: 'Can only score games that are in progress' };
  }

  return { valid: true };
}

/**
 * Validate that a game can be ended
 */
export function validateCanEndGame(game: {
  status: GameStatus;
  currentInning: number | null;
  currentInningHalf: InningHalf | null;
  homeScore: number;
  awayScore: number;
}): { valid: true } | { valid: false; reason: string } {
  if (game.status !== 'in_progress') {
    return { valid: false, reason: 'Can only end games that are in progress' };
  }

  // Check if game can end (must complete at least 9 innings or be tied)
  const inning = game.currentInning ?? 1;
  const half = game.currentInningHalf ?? 'top';

  // Game can end after bottom of 9th if home team is winning
  // Or after top of 9th if away team is winning
  // Or in extra innings when one team is ahead after a complete inning

  const isBottomOfInning = half === 'bottom';
  const isAtLeast9thInning = inning >= STANDARD_INNINGS;
  const homeLeads = game.homeScore > game.awayScore;
  const awayLeads = game.awayScore > game.homeScore;

  // Walk-off win (home team ahead in bottom half)
  if (isBottomOfInning && homeLeads && isAtLeast9thInning) {
    return { valid: true };
  }

  // Regulation win (away ahead after top of inning completed, or game in between innings)
  // This is a simplified check - in production, track completed innings more precisely
  if (isAtLeast9thInning && (homeLeads || awayLeads)) {
    return { valid: true };
  }

  // Allow ending early for mercy rule, weather, etc. (manager's discretion)
  // In a production system, might require admin approval for early end
  return { valid: true };
}

/**
 * Calculate the next half-inning state
 */
export function calculateNextHalfInning(
  currentInning: number,
  currentHalf: InningHalf
): { inning: number; half: InningHalf } {
  if (currentHalf === 'top') {
    return { inning: currentInning, half: 'bottom' };
  } else {
    return { inning: currentInning + 1, half: 'top' };
  }
}

/**
 * Check if game is in extra innings
 */
export function isExtraInnings(inning: number | null): boolean {
  return (inning ?? 1) > STANDARD_INNINGS;
}

/**
 * Calculate total score from inning scores array
 */
export function calculateTotalScore(inningScores: number[]): number {
  return inningScores.reduce((sum, runs) => sum + runs, 0);
}
