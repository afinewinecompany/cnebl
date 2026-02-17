/**
 * Pitching Stats API Route
 * GET /api/stats/pitching - Returns pitching statistics with leaderboards
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
import { getPitchingStats } from '@/lib/db/queries';

/**
 * GET /api/stats/pitching
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 * - seasonId: Filter by season (optional)
 * - teamId: Filter by team (optional)
 * - minInningsPitched: Minimum innings to qualify (default: 20)
 * - sortBy: Sort field - 'era', 'wins', 'strikeouts', 'saves', 'whip' (default: 'era')
 * - sortDir: Sort direction - 'asc' or 'desc' (default: 'asc' for ERA/WHIP, 'desc' for others)
 *
 * Example requests:
 * - GET /api/stats/pitching
 * - GET /api/stats/pitching?sortBy=wins&sortDir=desc
 * - GET /api/stats/pitching?teamId=mariners&minInningsPitched=15
 * - GET /api/stats/pitching?sortBy=strikeouts
 *
 * Response includes:
 * - stats: Array of player pitching statistics
 * - leaderboard: Top 5 players in key categories (era, wins, strikeouts, saves, whip)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const { page, pageSize } = parsePaginationParams(searchParams);

    // For pitching stats, default sort direction is ascending for ERA/WHIP
    const sortByParam = searchParams.get('sortBy') as
      | 'era'
      | 'wins'
      | 'strikeouts'
      | 'saves'
      | 'whip'
      | null;
    const sortDirParam = searchParams.get('sortDir');

    const sortBy = sortByParam || 'era';
    // ERA and WHIP are better when lower, so default to ascending
    const defaultDir = ['era', 'whip'].includes(sortBy) ? 'asc' : 'desc';
    const sortDir = sortDirParam === 'asc' || sortDirParam === 'desc' ? sortDirParam : defaultDir;

    const seasonId = searchParams.get('seasonId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const minIPParam = searchParams.get('minInningsPitched');
    const minInningsPitched = minIPParam ? parseInt(minIPParam, 10) : undefined;

    // Validate query parameters
    const validation = validateStatsQueryParams({ minInningsPitched });
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Fetch pitching stats
    const { stats, leaderboard, totalCount } = await getPitchingStats({
      seasonId,
      teamId,
      minInningsPitched,
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
    console.error('[API] GET /api/stats/pitching error:', error);
    return internalErrorResponse('Failed to fetch pitching stats');
  }
}
