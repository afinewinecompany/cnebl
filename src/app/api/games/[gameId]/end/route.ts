/**
 * End Game API Route
 * POST /api/games/[gameId]/end - End a game (set status to final)
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
  validateEndGame,
  validateCanEndGame,
} from '@/lib/api/schemas/scoring';
import {
  getGameScoringState,
  endGame,
  isUserGameManager,
} from '@/lib/db/queries/scoring';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/end
 *
 * End a game. Sets status to 'final' and records the end timestamp.
 *
 * Request body (optional):
 * {
 *   "status": "final" | "suspended" | "postponed" | "cancelled",  // default: "final"
 *   "notes": "Game called due to weather"  // Optional notes
 * }
 *
 * Authorization: Requires authenticated manager of one of the teams
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "action": "end",
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
      return unauthorizedResponse('Authentication required to end a game');
    }

    const { gameId } = await params;

    // Validate game ID
    const idValidation = validateGameId(gameId);
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Get full game state for validation
    const gameState = await getGameScoringState(gameId);
    if (!gameState) {
      return notFoundResponse('Game', gameId);
    }

    // Check if user is a manager
    const isManager = session.user.role === 'manager' || session.user.role === 'admin' || session.user.role === 'commissioner';
    if (!isManager) {
      return forbiddenResponse('Only team managers can end games');
    }

    // Check if user's team is involved in this game
    const userTeamId = session.user.teamId;
    const isGameManager = await isUserGameManager(gameId, session.user.id, userTeamId);
    const isAdmin = session.user.role === 'admin' || session.user.role === 'commissioner';

    if (!isGameManager && !isAdmin) {
      return forbiddenResponse('You can only end games for your team');
    }

    // Parse and validate request body
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is ok, use defaults
    }

    const validation = validateEndGame(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Check if game can be ended (only for 'final' status)
    if (validation.data.status === 'final') {
      const canEnd = validateCanEndGame({
        status: gameState.status,
        currentInning: gameState.currentInning,
        currentInningHalf: gameState.currentInningHalf,
        homeScore: gameState.homeScore,
        awayScore: gameState.awayScore,
      });

      if (!canEnd.valid) {
        return badRequestResponse(canEnd.reason);
      }
    }

    // End the game
    const result = await endGame(gameId, {
      status: validation.data.status,
      notes: validation.data.notes,
    });
    if (!result) {
      return internalErrorResponse('Failed to end game');
    }

    return successResponse(result);
  } catch (error) {
    console.error('[API] POST /api/games/[gameId]/end error:', error);
    return internalErrorResponse('Failed to end game');
  }
}
