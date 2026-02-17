/**
 * Admin Game Postpone API Route
 * POST /api/admin/games/[gameId]/postpone - Postpone a game
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
} from '@/lib/api';
import { getAdminGameById, updateGame } from '@/lib/db/queries/admin-games';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/admin/games/[gameId]/postpone
 *
 * Postpones a scheduled game with optional reschedule date
 *
 * Request body:
 * {
 *   reason?: string,
 *   rescheduleDate?: string (YYYY-MM-DD),
 *   rescheduleTime?: string (HH:MM)
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

    // Can only postpone scheduled, warmup, or suspended games
    if (!['scheduled', 'warmup', 'suspended'].includes(existingGame.status)) {
      return badRequestResponse(
        `Cannot postpone a game with status "${existingGame.status}". Only scheduled, warmup, or suspended games can be postponed.`
      );
    }

    const body = await request.json().catch(() => ({}));

    // Build notes with reason and reschedule info
    let notes = existingGame.notes || '';
    const timestamp = new Date().toISOString();

    if (body.reason) {
      notes += `\n[${timestamp}] Postponed: ${body.reason}`;
    } else {
      notes += `\n[${timestamp}] Game postponed`;
    }

    if (body.rescheduleDate) {
      notes += ` - Rescheduled to ${body.rescheduleDate}`;
      if (body.rescheduleTime) {
        notes += ` at ${body.rescheduleTime}`;
      }
    }

    // Update the game
    const updateData: Record<string, unknown> = {
      status: 'postponed',
      notes: notes.trim(),
    };

    // If reschedule date provided, create the update
    // The actual rescheduling will update the date/time fields
    if (body.rescheduleDate) {
      updateData.gameDate = body.rescheduleDate;
      if (body.rescheduleTime) {
        updateData.gameTime = body.rescheduleTime.includes(':') && body.rescheduleTime.length === 5
          ? body.rescheduleTime + ':00'
          : body.rescheduleTime;
      }
      // Change status back to scheduled since we have a new date
      updateData.status = 'scheduled';
      updateData.notes = notes.trim().replace('Postponed:', 'Rescheduled from postponement:');
    }

    const updatedGame = await updateGame(gameId, updateData);

    return successResponse({
      game: updatedGame,
      action: body.rescheduleDate ? 'rescheduled' : 'postponed',
      message: body.rescheduleDate
        ? `Game has been rescheduled to ${body.rescheduleDate}`
        : 'Game has been postponed',
    });
  } catch (error) {
    console.error('[API] POST /api/admin/games/[gameId]/postpone error:', error);
    return internalErrorResponse('Failed to postpone game');
  }
}
