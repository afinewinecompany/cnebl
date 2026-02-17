/**
 * Seasons API Route
 * GET /api/seasons - List all seasons
 * POST /api/seasons - Create a new season (admin/commissioner only)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import {
  parseListSeasonsQuery,
  validateCreateSeason,
} from '@/lib/api/schemas/seasons';
import {
  getAllSeasons,
  createSeason,
  canManageSeasons,
} from '@/lib/db/queries/seasons';

/**
 * GET /api/seasons
 *
 * Returns a paginated list of all seasons. This endpoint is public
 * but stats may be limited for non-admin users.
 *
 * Query parameters:
 * - year: Filter by year (optional)
 * - activeOnly: If 'true', only return active seasons
 * - page: Page number for pagination (default: 1)
 * - pageSize: Number of items per page (default: 20, max: 100)
 *
 * Example requests:
 * - GET /api/seasons
 * - GET /api/seasons?year=2026
 * - GET /api/seasons?activeOnly=true
 * - GET /api/seasons?page=2&pageSize=10
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "seasons": [
 *       {
 *         "id": "season-2026",
 *         "name": "CNEBL 2026 Summer Season",
 *         "year": 2026,
 *         "startDate": "2026-04-15",
 *         "endDate": "2026-09-30",
 *         "isActive": true,
 *         "registrationOpen": true,
 *         "createdAt": "2025-12-01T00:00:00Z",
 *         "updatedAt": "2026-02-16T00:00:00Z",
 *         "stats": {
 *           "gamesPlayed": 35,
 *           "gamesScheduled": 60,
 *           "teamsCount": 6,
 *           "playersCount": 83
 *         }
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "pageSize": 20,
 *       "totalItems": 4,
 *       "totalPages": 1,
 *       "hasNextPage": false,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = parseListSeasonsQuery(searchParams);

    // Fetch seasons
    const result = await getAllSeasons({
      year: query.year,
      activeOnly: query.activeOnly,
      page: query.page,
      pageSize: query.pageSize,
    });

    return successResponse(result);
  } catch (error) {
    console.error('[API] GET /api/seasons error:', error);
    return internalErrorResponse('Failed to fetch seasons');
  }
}

/**
 * POST /api/seasons
 *
 * Create a new season. Only administrators and commissioners can create seasons.
 *
 * Request body:
 * {
 *   "name": "CNEBL 2027 Summer Season",
 *   "year": 2027,
 *   "startDate": "2027-04-15",
 *   "endDate": "2027-09-30",
 *   "isActive": false (optional - default: false),
 *   "registrationOpen": false (optional - default: false),
 *   "copyFromSeasonId": "season-2026" (optional - copy settings from existing season)
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must have 'admin' or 'commissioner' role
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "season-new-001",
 *     "name": "CNEBL 2027 Summer Season",
 *     "year": 2027,
 *     "startDate": "2027-04-15",
 *     "endDate": "2027-09-30",
 *     "isActive": false,
 *     "registrationOpen": false,
 *     "createdAt": "2026-02-16T20:00:00Z",
 *     "updatedAt": "2026-02-16T20:00:00Z",
 *     "stats": {
 *       "gamesPlayed": 0,
 *       "gamesScheduled": 0,
 *       "teamsCount": 0,
 *       "playersCount": 0
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to create seasons');
    }

    // Check authorization - must be admin or commissioner
    const canManage = await canManageSeasons(session.user.role);
    if (!canManage) {
      return forbiddenResponse('Only administrators and commissioners can create seasons');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateCreateSeason(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Create the season
    const season = await createSeason(validation.data);

    return createdResponse(season);
  } catch (error) {
    console.error('[API] POST /api/seasons error:', error);
    return internalErrorResponse('Failed to create season');
  }
}
