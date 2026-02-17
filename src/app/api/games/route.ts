/**
 * Games API Route
 * GET /api/games - Returns games with filtering and pagination
 */

import { NextRequest } from 'next/server';
import {
  paginatedResponse,
  validationErrorResponse,
  internalErrorResponse,
  parsePaginationParams,
  parseSortParams,
  parseArrayParam,
} from '@/lib/api';
import { validateGamesQueryParams } from '@/lib/api/validation';
import { getGames } from '@/lib/db/queries';
import type { GameStatus } from '@/types';

/**
 * GET /api/games
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
 *
 * Example requests:
 * - GET /api/games
 * - GET /api/games?status=scheduled
 * - GET /api/games?status=in_progress,final
 * - GET /api/games?teamId=seadogs&startDate=2026-02-01
 * - GET /api/games?page=2&pageSize=10&sortBy=date&sortDir=desc
 */
export async function GET(request: NextRequest) {
  try {
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

    // Validate query parameters
    const validation = validateGamesQueryParams({
      startDate,
      endDate,
      status: statusParam,
    });

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Parse status (can be single value or comma-separated)
    let status: GameStatus | GameStatus[] | undefined;
    if (statusParam) {
      const statuses = parseArrayParam(statusParam) as GameStatus[];
      status = statuses.length === 1 ? statuses[0] : statuses;
    }

    // Fetch games
    const { games, totalCount } = await getGames({
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
    console.error('[API] GET /api/games error:', error);
    return internalErrorResponse('Failed to fetch games');
  }
}
