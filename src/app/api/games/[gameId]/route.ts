/**
 * Single Game API Route
 * GET /api/games/[gameId] - Returns a single game by ID
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateGameId } from '@/lib/api/validation';
import { getGameById } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * GET /api/games/[gameId]
 *
 * Path parameters:
 * - gameId: Game identifier (required)
 *
 * Example requests:
 * - GET /api/games/game-001
 * - GET /api/games/game-004
 *
 * Response includes:
 * - Full game details with home and away team information
 * - Score and inning information for in-progress games
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Validate game ID
    const validation = validateGameId(gameId);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const game = await getGameById(gameId);

    if (!game) {
      return notFoundResponse('Game', gameId);
    }

    return successResponse(game);
  } catch (error) {
    console.error('[API] GET /api/games/[gameId] error:', error);
    return internalErrorResponse('Failed to fetch game');
  }
}
