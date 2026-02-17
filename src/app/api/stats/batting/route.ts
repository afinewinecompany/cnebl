/**
 * Batting Stats API Route
 * GET /api/stats/batting - Returns batting statistics with leaderboards
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
  parsePaginationParams,
  parseSortParams,
} from '@/lib/api';
import { validateStatsQueryParams } from '@/lib/api/validation';
import { getBattingStats } from '@/lib/db/queries';

/**
 * GET /api/stats/batting
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 * - seasonId: Filter by season (optional)
 * - teamId: Filter by team (optional)
 * - minAtBats: Minimum at-bats to qualify (default: 50)
 * - sortBy: Sort field - 'avg', 'homeRuns', 'rbi', 'hits', 'runs', 'stolenBases', 'ops' (default: 'avg')
 * - sortDir: Sort direction - 'asc' or 'desc' (default: 'desc')
 *
 * Example requests:
 * - GET /api/stats/batting
 * - GET /api/stats/batting?sortBy=homeRuns
 * - GET /api/stats/batting?teamId=seadogs&minAtBats=30
 * - GET /api/stats/batting?sortBy=avg&sortDir=desc
 *
 * Response includes:
 * - stats: Array of player batting statistics
 * - leaderboard: Top 5 players in key categories (avg, homeRuns, rbi, hits, stolenBases)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const { page, pageSize } = parsePaginationParams(searchParams);
    const { sortBy, sortDir } = parseSortParams(
      searchParams,
      ['avg', 'homeRuns', 'rbi', 'hits', 'runs', 'stolenBases', 'ops'] as const,
      'avg'
    );

    const seasonId = searchParams.get('seasonId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const minAtBatsParam = searchParams.get('minAtBats');
    const minAtBats = minAtBatsParam ? parseInt(minAtBatsParam, 10) : undefined;

    // Validate query parameters
    const validation = validateStatsQueryParams({ minAtBats });
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Fetch batting stats
    const { stats, leaderboard, totalCount } = await getBattingStats({
      seasonId,
      teamId,
      minAtBats,
      sortBy,
      sortDir,
      page,
      pageSize,
    });

    return successResponse({
      stats,
      leaderboard,
      pagination: {
        page,
        pageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page < Math.ceil(totalCount / pageSize),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/stats/batting error:', error);
    return internalErrorResponse('Failed to fetch batting stats');
  }
}
