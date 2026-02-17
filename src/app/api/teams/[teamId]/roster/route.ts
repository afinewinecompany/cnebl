/**
 * Team Roster API Route
 * GET /api/teams/[teamId]/roster - Returns a team's roster
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateTeamId } from '@/lib/api/validation';
import { getTeamRoster } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]/roster
 *
 * Path parameters:
 * - teamId: Team identifier (required)
 *
 * Example requests:
 * - GET /api/teams/seadogs/roster
 * - GET /api/teams/mariners/roster
 *
 * Response includes:
 * - team: Basic team information
 * - players: Array of players with user details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;

    // Validate team ID
    const validation = validateTeamId(teamId);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const roster = await getTeamRoster(teamId);

    if (!roster) {
      return notFoundResponse('Team', teamId);
    }

    return successResponse(roster);
  } catch (error) {
    console.error('[API] GET /api/teams/[teamId]/roster error:', error);
    return internalErrorResponse('Failed to fetch team roster');
  }
}
