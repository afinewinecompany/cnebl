/**
 * User Team Status API Route
 * GET /api/user/team-status - Check if the current user has a team assignment
 *
 * Used by FloatingChat to trigger session refresh when team info is stale.
 */

import { auth } from '@/lib/auth';
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api';
import { query } from '@/lib/db/client';

interface TeamStatusRow {
  team_id: string;
  team_name: string;
}

/**
 * GET /api/user/team-status
 *
 * Returns whether the current user has a team assignment in the database.
 * This is used to detect when session data is stale (e.g., after admin
 * assigns the user to a team while they're already logged in).
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return unauthorizedResponse('Not authenticated');
    }

    // Check if user has a team assignment in the database
    const result = await query<TeamStatusRow>(
      `SELECT p.team_id, t.name as team_name
       FROM players p
       INNER JOIN teams t ON t.id = p.team_id
       WHERE p.user_id = $1 AND p.is_active = true`,
      [session.user.id]
    );

    const hasTeam = result.rows.length > 0;
    const teamInfo = hasTeam ? {
      teamId: result.rows[0].team_id,
      teamName: result.rows[0].team_name,
    } : null;

    return successResponse({
      hasTeam,
      ...teamInfo,
    });
  } catch (error) {
    console.error('[API] Team status check error:', error);
    return internalErrorResponse('Failed to check team status');
  }
}
