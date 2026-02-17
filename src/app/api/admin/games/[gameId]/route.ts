/**
 * Admin Single Game API Route
 * GET /api/admin/games/[gameId] - Get game details
 * PATCH /api/admin/games/[gameId] - Update game info
 * DELETE /api/admin/games/[gameId] - Delete a game
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  internalErrorResponse,
  noContentResponse,
} from '@/lib/api';
import {
  getAdminGameById,
  updateGame,
  deleteGame,
} from '@/lib/db/queries/admin-games';
import type { GameStatus } from '@/types';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * GET /api/admin/games/[gameId]
 *
 * Returns game details with full team info
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const game = await getAdminGameById(gameId);

    if (!game) {
      return notFoundResponse('Game', gameId);
    }

    return successResponse(game);
  } catch (error) {
    console.error('[API] GET /api/admin/games/[gameId] error:', error);
    return internalErrorResponse('Failed to fetch game');
  }
}

/**
 * PATCH /api/admin/games/[gameId]
 *
 * Updates game information
 *
 * Request body (all fields optional):
 * {
 *   homeTeamId?: string,
 *   awayTeamId?: string,
 *   gameDate?: string,
 *   gameTime?: string,
 *   timezone?: string,
 *   locationName?: string,
 *   locationAddress?: string,
 *   status?: GameStatus,
 *   homeScore?: number,
 *   awayScore?: number,
 *   notes?: string
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    // Get existing game
    const existingGame = await getAdminGameById(gameId);
    if (!existingGame) {
      return notFoundResponse('Game', gameId);
    }

    const body = await request.json();

    // Validate fields
    const errors: Record<string, string[]> = {};

    if (body.homeTeamId && body.awayTeamId && body.homeTeamId === body.awayTeamId) {
      errors.awayTeamId = ['Home and away teams must be different'];
    }

    if (body.homeScore !== undefined && (typeof body.homeScore !== 'number' || body.homeScore < 0)) {
      errors.homeScore = ['Home score must be a non-negative number'];
    }

    if (body.awayScore !== undefined && (typeof body.awayScore !== 'number' || body.awayScore < 0)) {
      errors.awayScore = ['Away score must be a non-negative number'];
    }

    if (body.status) {
      const validStatuses: GameStatus[] = [
        'scheduled', 'warmup', 'in_progress', 'final', 'postponed', 'cancelled', 'suspended'
      ];
      if (!validStatuses.includes(body.status)) {
        errors.status = [`Status must be one of: ${validStatuses.join(', ')}`];
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.homeTeamId) updateData.homeTeamId = body.homeTeamId;
    if (body.awayTeamId) updateData.awayTeamId = body.awayTeamId;
    if (body.gameDate) updateData.gameDate = body.gameDate;
    if (body.gameTime) updateData.gameTime = body.gameTime.includes(':') && body.gameTime.length === 5
      ? body.gameTime + ':00'
      : body.gameTime;
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.locationName !== undefined) updateData.locationName = body.locationName;
    if (body.locationAddress !== undefined) updateData.locationAddress = body.locationAddress;
    if (body.status) updateData.status = body.status;
    if (body.homeScore !== undefined) updateData.homeScore = body.homeScore;
    if (body.awayScore !== undefined) updateData.awayScore = body.awayScore;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedGame = await updateGame(gameId, updateData);

    return successResponse(updatedGame);
  } catch (error) {
    console.error('[API] PATCH /api/admin/games/[gameId] error:', error);
    return internalErrorResponse('Failed to update game');
  }
}

/**
 * DELETE /api/admin/games/[gameId]
 *
 * Deletes a game (only if not started)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Only commissioner can delete games
    if (session.user.role !== 'commissioner') {
      return forbiddenResponse('Commissioner access required to delete games');
    }

    // Get existing game
    const existingGame = await getAdminGameById(gameId);
    if (!existingGame) {
      return notFoundResponse('Game', gameId);
    }

    // Don't allow deleting games that have been played
    if (['in_progress', 'final'].includes(existingGame.status)) {
      return badRequestResponse(
        'Cannot delete a game that is in progress or has been completed. Consider cancelling instead.'
      );
    }

    await deleteGame(gameId);

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/admin/games/[gameId] error:', error);
    return internalErrorResponse('Failed to delete game');
  }
}
