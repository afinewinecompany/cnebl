/**
 * Season Activate API Route
 * POST /api/seasons/[seasonId]/activate - Set season as active
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api';
import {
  activateSeason,
  canManageSeasons,
} from '@/lib/db/queries/seasons';

interface RouteParams {
  params: Promise<{ seasonId: string }>;
}

/**
 * POST /api/seasons/[seasonId]/activate
 *
 * Set a season as the active season. This will deactivate all other seasons.
 * Only administrators and commissioners can activate seasons.
 *
 * Authorization:
 * - User must be authenticated
 * - User must have 'admin' or 'commissioner' role
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "season-2026",
 *     "name": "CNEBL 2026 Summer Season",
 *     "year": 2026,
 *     "startDate": "2026-04-15",
 *     "endDate": "2026-09-30",
 *     "isActive": true,
 *     "registrationOpen": true,
 *     "createdAt": "2025-12-01T00:00:00Z",
 *     "updatedAt": "2026-02-16T20:30:00Z",
 *     "stats": {
 *       "gamesPlayed": 35,
 *       "gamesScheduled": 60,
 *       "teamsCount": 6,
 *       "playersCount": 83
 *     }
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to activate seasons');
    }

    // Check authorization
    const canManage = await canManageSeasons(session.user.role);
    if (!canManage) {
      return forbiddenResponse('Only administrators and commissioners can activate seasons');
    }

    // Activate the season
    const season = await activateSeason(seasonId);
    if (!season) {
      return notFoundResponse('Season', seasonId);
    }

    return successResponse(season);
  } catch (error) {
    console.error('[API] POST /api/seasons/[seasonId]/activate error:', error);
    return internalErrorResponse('Failed to activate season');
  }
}
