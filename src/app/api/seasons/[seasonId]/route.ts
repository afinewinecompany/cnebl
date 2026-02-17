/**
 * Season Detail API Route
 * GET /api/seasons/[seasonId] - Get season details
 * PATCH /api/seasons/[seasonId] - Update season
 * DELETE /api/seasons/[seasonId] - Delete season
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  badRequestResponse,
  noContentResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateUpdateSeason } from '@/lib/api/schemas/seasons';
import {
  getSeasonDetail,
  updateSeason,
  deleteSeason,
  canManageSeasons,
} from '@/lib/db/queries/seasons';

interface RouteParams {
  params: Promise<{ seasonId: string }>;
}

/**
 * GET /api/seasons/[seasonId]
 *
 * Returns detailed information about a specific season including
 * teams and schedule overview.
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
 *     "updatedAt": "2026-02-16T00:00:00Z",
 *     "stats": {
 *       "gamesPlayed": 35,
 *       "gamesScheduled": 60,
 *       "teamsCount": 6,
 *       "playersCount": 83
 *     },
 *     "teams": [
 *       {
 *         "id": "rays",
 *         "name": "Rays",
 *         "abbreviation": "RAY",
 *         "primaryColor": "#092C5C",
 *         "wins": 14,
 *         "losses": 4,
 *         "ties": 0
 *       }
 *     ],
 *     "scheduleOverview": [
 *       {
 *         "month": "April 2026",
 *         "gamesCount": 8,
 *         "completedCount": 8
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    const season = await getSeasonDetail(seasonId);
    if (!season) {
      return notFoundResponse('Season', seasonId);
    }

    return successResponse(season);
  } catch (error) {
    console.error('[API] GET /api/seasons/[seasonId] error:', error);
    return internalErrorResponse('Failed to fetch season');
  }
}

/**
 * PATCH /api/seasons/[seasonId]
 *
 * Update a season. Only administrators and commissioners can update seasons.
 *
 * Request body (all fields optional):
 * {
 *   "name": "Updated Season Name",
 *   "year": 2026,
 *   "startDate": "2026-04-20",
 *   "endDate": "2026-10-05",
 *   "isActive": true,
 *   "registrationOpen": false
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must have 'admin' or 'commissioner' role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to update seasons');
    }

    // Check authorization
    const canManage = await canManageSeasons(session.user.role);
    if (!canManage) {
      return forbiddenResponse('Only administrators and commissioners can update seasons');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateUpdateSeason(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Validate date order if both are provided
    if (validation.data.startDate && validation.data.endDate) {
      if (new Date(validation.data.startDate) >= new Date(validation.data.endDate)) {
        return validationErrorResponse({
          endDate: ['End date must be after start date'],
        });
      }
    }

    // Update the season
    const season = await updateSeason(seasonId, validation.data);
    if (!season) {
      return notFoundResponse('Season', seasonId);
    }

    return successResponse(season);
  } catch (error) {
    console.error('[API] PATCH /api/seasons/[seasonId] error:', error);
    return internalErrorResponse('Failed to update season');
  }
}

/**
 * DELETE /api/seasons/[seasonId]
 *
 * Delete a season. Only commissioners can delete seasons.
 * Active seasons cannot be deleted.
 *
 * Authorization:
 * - User must be authenticated
 * - User must have 'commissioner' role
 * - Season must not be active
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { seasonId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to delete seasons');
    }

    // Check authorization - only commissioner can delete
    if (session.user.role !== 'commissioner') {
      return forbiddenResponse('Only commissioners can delete seasons');
    }

    // Delete the season
    try {
      const deleted = await deleteSeason(seasonId);
      if (!deleted) {
        return notFoundResponse('Season', seasonId);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('active')) {
        return badRequestResponse('Cannot delete an active season. Deactivate it first.');
      }
      throw error;
    }

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/seasons/[seasonId] error:', error);
    return internalErrorResponse('Failed to delete season');
  }
}
