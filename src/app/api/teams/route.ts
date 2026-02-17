/**
 * Teams API Route
 * GET /api/teams - Returns all teams
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  internalErrorResponse,
  parseBooleanParam,
} from '@/lib/api';
import { getAllTeams } from '@/lib/db/queries';

/**
 * GET /api/teams
 *
 * Query parameters:
 * - seasonId: Filter by season (optional)
 * - active: Filter by active status (optional, boolean)
 *
 * Example requests:
 * - GET /api/teams
 * - GET /api/teams?active=true
 * - GET /api/teams?seasonId=season-2026
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const seasonId = searchParams.get('seasonId') || undefined;
    const active = parseBooleanParam(searchParams.get('active'));

    const teams = await getAllTeams({
      seasonId,
      active,
    });

    return successResponse(teams);
  } catch (error) {
    console.error('[API] GET /api/teams error:', error);
    return internalErrorResponse('Failed to fetch teams');
  }
}
