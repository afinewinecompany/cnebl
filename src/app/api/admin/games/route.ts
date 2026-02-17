/**
 * Admin Games API Route
 * GET /api/admin/games - Returns games with filtering (admin view)
 * POST /api/admin/games - Create a new game or series
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  parsePaginationParams,
  parseSortParams,
  parseArrayParam,
} from '@/lib/api';
import { getAdminGames, createGame, createGameSeries } from '@/lib/db/queries/admin-games';
import type { GameStatus } from '@/types';

/**
 * GET /api/admin/games
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - seasonId: Filter by season (optional)
 * - teamId: Filter by team (optional)
 * - status: Filter by status (optional, can be comma-separated)
 * - startDate: Filter games on or after this date (optional, ISO format)
 * - endDate: Filter games on or before this date (optional, ISO format)
 * - sortBy: Sort field - 'date' or 'status' (default: 'date')
 * - sortDir: Sort direction - 'asc' or 'desc' (default: 'asc')
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const { page, pageSize } = parsePaginationParams(searchParams);
    const { sortBy, sortDir } = parseSortParams(
      searchParams,
      ['date', 'status'] as const,
      'date'
    );

    const seasonId = searchParams.get('seasonId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const statusParam = searchParams.get('status');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Parse status (can be single value or comma-separated)
    let status: GameStatus | GameStatus[] | undefined;
    if (statusParam) {
      const statuses = parseArrayParam(statusParam) as GameStatus[];
      status = statuses.length === 1 ? statuses[0] : statuses;
    }

    // Fetch games with admin-specific data
    const { games, totalCount } = await getAdminGames({
      seasonId,
      teamId,
      status,
      startDate,
      endDate,
      sortBy,
      sortDir,
      page,
      pageSize,
    });

    return paginatedResponse(games, {
      page,
      pageSize,
      totalItems: totalCount,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/games error:', error);
    return internalErrorResponse('Failed to fetch games');
  }
}

/**
 * POST /api/admin/games
 *
 * Request body for single game:
 * {
 *   homeTeamId: string,
 *   awayTeamId: string,
 *   gameDate: string (YYYY-MM-DD),
 *   gameTime: string (HH:MM),
 *   timezone: string,
 *   locationName?: string,
 *   locationAddress?: string,
 *   notes?: string
 * }
 *
 * Request body for series:
 * {
 *   games: [
 *     {
 *       homeTeamId: string,
 *       awayTeamId: string,
 *       gameDate: string,
 *       gameTime: string,
 *       timezone: string,
 *       locationName?: string,
 *       locationAddress?: string,
 *       notes?: string
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const body = await request.json();

    // Check if this is a series creation
    if (body.games && Array.isArray(body.games)) {
      // Validate series games
      const errors: Record<string, string[]> = {};

      body.games.forEach((game: Record<string, unknown>, index: number) => {
        const gameErrors: string[] = [];

        if (!game.homeTeamId) gameErrors.push('Home team is required');
        if (!game.awayTeamId) gameErrors.push('Away team is required');
        if (game.homeTeamId === game.awayTeamId) gameErrors.push('Home and away teams must be different');
        if (!game.gameDate) gameErrors.push('Game date is required');
        if (!game.gameTime) gameErrors.push('Game time is required');

        if (gameErrors.length > 0) {
          errors[`game${index + 1}`] = gameErrors;
        }
      });

      if (Object.keys(errors).length > 0) {
        return validationErrorResponse(errors);
      }

      // Create series
      const createdGames = await createGameSeries(body.games);
      return createdResponse({
        message: `Created ${createdGames.length} games`,
        games: createdGames,
      });
    }

    // Single game creation
    const errors: Record<string, string[]> = {};

    if (!body.homeTeamId) errors.homeTeamId = ['Home team is required'];
    if (!body.awayTeamId) errors.awayTeamId = ['Away team is required'];
    if (body.homeTeamId === body.awayTeamId) {
      errors.awayTeamId = ['Home and away teams must be different'];
    }
    if (!body.gameDate) errors.gameDate = ['Game date is required'];
    if (!body.gameTime) errors.gameTime = ['Game time is required'];

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Create single game
    const createdGame = await createGame({
      homeTeamId: body.homeTeamId,
      awayTeamId: body.awayTeamId,
      gameDate: body.gameDate,
      gameTime: body.gameTime + ':00', // Add seconds
      timezone: body.timezone || 'America/New_York',
      locationName: body.locationName || null,
      locationAddress: body.locationAddress || null,
      notes: body.notes || null,
    });

    return createdResponse(createdGame);
  } catch (error) {
    console.error('[API] POST /api/admin/games error:', error);
    return internalErrorResponse('Failed to create game');
  }
}
