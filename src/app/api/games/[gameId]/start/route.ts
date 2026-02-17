/**
 * Start Game API Route
 * POST /api/games/[gameId]/start - Start a game (manager only)
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
  validateStartGame,
  validateCanStartGame,
} from '@/lib/api/schemas/scoring';
import {
  getGameBasicInfo,
  startGame,
  isUserGameManager,
} from '@/lib/db/queries/scoring';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/start
 *
 * Start a game. Changes status to 'in_progress' and initializes scoring state.
 *
 * Request body (optional):
 * {
 *   "status": "in_progress" | "warmup"  // default: "in_progress"
 * }
 *
 * Authorization: Requires authenticated user who is a manager of one of the teams
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "action": "start",
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
      return unauthorizedResponse('Authentication required to start a game');
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

    // Check if user is a manager of one of the teams
    const isManager = session.user.role === 'manager' || session.user.role === 'admin' || session.user.role === 'commissioner';
    if (!isManager) {
      return forbiddenResponse('Only team managers can start games');
    }

    // Check if user's team is involved in this game
    const userTeamId = session.user.teamId;
    const isGameManager = await isUserGameManager(gameId, session.user.id, userTeamId);
    const isAdmin = session.user.role === 'admin' || session.user.role === 'commissioner';

    if (!isGameManager && !isAdmin) {
      return forbiddenResponse('You can only start games for your team');
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

    const validation = validateStartGame(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Check if game can be started
    const canStart = validateCanStartGame({ status: game.status });
    if (!canStart.valid) {
      return badRequestResponse(canStart.reason);
    }

    // Start the game
    const result = await startGame(gameId, { status: validation.data.status });
    if (!result) {
      return internalErrorResponse('Failed to start game');
    }

    return successResponse(result);
  } catch (error) {
    console.error('[API] POST /api/games/[gameId]/start error:', error);
    return internalErrorResponse('Failed to start game');
  }
}
