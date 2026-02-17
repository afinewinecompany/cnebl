/**
 * Admin Game Cancel API Route
 * POST /api/admin/games/[gameId]/cancel - Cancel a game
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api';
import { getAdminGameById, updateGame } from '@/lib/db/queries/admin-games';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/admin/games/[gameId]/cancel
 *
 * Cancels a game
 *
 * Request body:
 * {
 *   reason?: string
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Cannot cancel a completed game
    if (existingGame.status === 'final') {
      return badRequestResponse(
        'Cannot cancel a completed game. The game has already been marked as final.'
      );
    }

    // Cannot cancel a game that's currently in progress (warn them to suspend first)
    if (existingGame.status === 'in_progress') {
      return badRequestResponse(
        'Cannot cancel a game in progress. Please suspend the game first, then cancel if needed.'
      );
    }

    const body = await request.json().catch(() => ({}));

    // Build notes with cancellation info
    let notes = existingGame.notes || '';
    const timestamp = new Date().toISOString();

    if (body.reason) {
      notes += `\n[${timestamp}] Cancelled: ${body.reason}`;
    } else {
      notes += `\n[${timestamp}] Game cancelled`;
    }

    // Update the game
    const updatedGame = await updateGame(gameId, {
      status: 'cancelled',
      notes: notes.trim(),
    });

    return successResponse({
      game: updatedGame,
      action: 'cancelled',
      message: 'Game has been cancelled',
    });
  } catch (error) {
    console.error('[API] POST /api/admin/games/[gameId]/cancel error:', error);
    return internalErrorResponse('Failed to cancel game');
  }
}
