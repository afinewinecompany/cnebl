/**
 * Single Team API Route
 * GET /api/teams/[teamId] - Returns a single team by ID
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateTeamId } from '@/lib/api/validation';
import { getTeamById } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]
 *
 * Path parameters:
 * - teamId: Team identifier (required)
 *
 * Example requests:
 * - GET /api/teams/seadogs
 * - GET /api/teams/mariners
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;

    // Validate team ID
    const validation = validateTeamId(teamId);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const team = await getTeamById(teamId);

    if (!team) {
      return notFoundResponse('Team', teamId);
    }

    return successResponse(team);
  } catch (error) {
    console.error('[API] GET /api/teams/[teamId] error:', error);
    return internalErrorResponse('Failed to fetch team');
  }
}
