/**
 * Advance Inning API Route
 * POST /api/games/[gameId]/advance - Manually advance to next half-inning
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse,
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateGameId } from '@/lib/api/validation';
import {
  validateAdvanceInning,
  validateCanScore,
} from '@/lib/api/schemas/scoring';
import {
  getGameBasicInfo,
  advanceInning,
  isUserGameManager,
} from '@/lib/db/queries/scoring';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/advance
 *
 * Manually advance to the next half-inning.
 * - Top -> Bottom of same inning
 * - Bottom -> Top of next inning
 *
 * Useful when 3 outs weren't recorded in order (e.g., correction scenarios).
 *
 * Request body (optional):
 * {
 *   "forceInning": 5,      // Force specific inning (for corrections)
 *   "forceHalf": "bottom"  // Force specific half (must be paired with forceInning)
 * }
 *
 * Authorization: Requires authenticated manager of one of the teams
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "action": "advance",
 *     "previousState": { ... },
 *     "newState": { ... }
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required to advance inning');
    }

    const { gameId } = await params;

    // Validate game ID
    const idValidation = validateGameId(gameId);
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Get game info
    const game = await getGameBasicInfo(gameId);
    if (!game) {
      return notFoundResponse('Game', gameId);
    }

    // Check if user is a manager
    const isManager = session.user.role === 'manager' || session.user.role === 'admin' || session.user.role === 'commissioner';
    if (!isManager) {
      return forbiddenResponse('Only team managers can advance innings');
    }

    // Check if user's team is involved in this game
    const userTeamId = session.user.teamId;
    const isGameManager = await isUserGameManager(gameId, session.user.id, userTeamId);
    const isAdmin = session.user.role === 'admin' || session.user.role === 'commissioner';

    if (!isGameManager && !isAdmin) {
      return forbiddenResponse('You can only score games for your team');
    }

    // Check if game is in progress
    const canScore = validateCanScore({ status: game.status });
    if (!canScore.valid) {
      return badRequestResponse(canScore.reason);
    }

    // Parse and validate request body
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is ok, use natural advancement
    }

    const validation = validateAdvanceInning(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Advance the inning
    const result = await advanceInning(gameId, {
      forceInning: validation.data.forceInning,
      forceHalf: validation.data.forceHalf,
    });
    if (!result) {
      return internalErrorResponse('Failed to advance inning');
    }

    return successResponse(result);
  } catch (error) {
    console.error('[API] POST /api/games/[gameId]/advance error:', error);
    return internalErrorResponse('Failed to advance inning');
  }
}
