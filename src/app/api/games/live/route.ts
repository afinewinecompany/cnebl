/**
 * Live Games API Route
 * GET /api/games/live - Get all games currently in progress
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  internalErrorResponse,
} from '@/lib/api';
import { getLiveGamesWithScoring } from '@/lib/db/queries/scoring';

/**
 * GET /api/games/live
 *
 * Returns all games that are currently in progress with full scoring state.
 * This endpoint is public and does not require authentication.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "games": [
 *       {
 *         "id": "game-004",
 *         "status": "in_progress",
 *         "homeTeam": { ... },
 *         "awayTeam": { ... },
 *         "homeScore": 4,
 *         "awayScore": 3,
 *         "currentInning": 6,
 *         "currentInningHalf": "bottom",
 *         "outs": 1,
 *         "homeInningScores": [0, 2, 0, 1, 0, 1],
 *         "awayInningScores": [1, 0, 0, 2, 0, 0],
 *         ...
 *       }
 *     ],
 *     "count": 1,
 *     "timestamp": "2026-02-16T14:30:00.000Z"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get all live games
    const games = await getLiveGamesWithScoring();

    return successResponse({
      games,
      count: games.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] GET /api/games/live error:', error);
    return internalErrorResponse('Failed to fetch live games');
  }
}
