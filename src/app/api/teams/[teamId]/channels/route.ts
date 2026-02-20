/**
 * Team Channels API Route
 * GET /api/teams/[teamId]/channels - Get channel metadata and stats
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateTeamId } from '@/lib/api/validation';
import { getTeamById, isTeamMember, isTeamManagerOrAdmin, getTeamChannelStats } from '@/lib/db/queries';
import { ROLE_LEVELS } from '@/types/auth';
import {
  TEAM_CHANNELS,
  canUserPostToChannel,
  canUserViewTeamMessages,
} from '@/lib/constants/channels';
import type { ChannelType } from '@/types/database.types';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]/channels
 *
 * Returns channel metadata including message counts and permissions.
 *
 * Response:
 * {
 *   "channels": [
 *     {
 *       "id": "important",
 *       "name": "Important",
 *       "description": "Announcements from team management",
 *       "canWrite": true,
 *       "messageCount": 12,
 *       "lastMessageAt": "2026-02-16T20:00:00Z",
 *       "pinnedCount": 3
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to view team channels');
    }

    const { teamId } = await params;

    // Validate team ID
    const teamValidation = validateTeamId(teamId);
    if (!teamValidation.valid) {
      return validationErrorResponse(teamValidation.errors);
    }

    // Check if team exists
    const team = await getTeamById(teamId);
    if (!team) {
      return notFoundResponse('Team', teamId);
    }

    // Check authorization
    const userRole = session.user.role;
    const isMember = await isTeamMember(session.user.id, teamId);
    const isManager = await isTeamManagerOrAdmin(session.user.id, teamId);

    // Check if user can view this team's channels
    const canView = canUserViewTeamMessages(userRole, isMember, isManager);
    if (!canView) {
      return forbiddenResponse('You must be a member of this team to view channels');
    }

    // Get channel statistics
    const stats = await getTeamChannelStats(teamId);

    // Build response with permissions
    const channels = TEAM_CHANNELS.map((channel) => {
      const channelType = channel.type as ChannelType;
      const channelStats = stats[channelType];

      return {
        id: channelType,
        name: channel.name,
        description: channel.description,
        icon: channel.icon,
        canWrite: canUserPostToChannel(userRole, isManager, channelType),
        messageCount: channelStats?.messageCount ?? 0,
        lastMessageAt: channelStats?.lastMessageAt ?? null,
        pinnedCount: channelStats?.pinnedCount ?? 0,
      };
    });

    return successResponse({ channels });
  } catch (error) {
    console.error('[API] GET /api/teams/[teamId]/channels error:', error);
    return internalErrorResponse('Failed to fetch channels');
  }
}
