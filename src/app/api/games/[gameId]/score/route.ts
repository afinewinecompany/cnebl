/**
 * Record Score API Route
 * POST /api/games/[gameId]/score - Record runs for current half-inning
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
  validateRecordScore,
  validateCanScore,
} from '@/lib/api/schemas/scoring';
import {
  getGameBasicInfo,
  recordScore,
  isUserGameManager,
} from '@/lib/db/queries/scoring';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/score
 *
 * Record runs scored in the current half-inning.
 * - Top half: runs added to away team
 * - Bottom half: runs added to home team
 *
 * Request body:
 * {
 *   "runs": 2  // Number of runs to add (0 or positive integer)
 * }
 *
 * Authorization: Requires authenticated manager of one of the teams
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "action": "score",
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
      return unauthorizedResponse('Authentication required to record scores');
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
      return forbiddenResponse('Only team managers can record scores');
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
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON in request body');
    }

    const validation = validateRecordScore(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Record the score
    const result = await recordScore(gameId, validation.data.runs);
    if (!result) {
      return internalErrorResponse('Failed to record score');
    }

    return successResponse(result);
  } catch (error) {
    console.error('[API] POST /api/games/[gameId]/score error:', error);
    return internalErrorResponse('Failed to record score');
  }
}
