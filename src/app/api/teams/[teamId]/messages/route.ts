/**
 * Team Messages API Route
 * GET /api/teams/[teamId]/messages - List team messages (paginated)
 * POST /api/teams/[teamId]/messages - Send a new message
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateCSRF, csrfErrorResponse } from '@/lib/api/csrf';
import { validateTeamId } from '@/lib/api/validation';
import {
  parseListMessagesQuery,
  validateCreateMessage,
} from '@/lib/api/schemas/messages';
import {
  getTeamMessages,
  createMessage,
  isTeamMember,
  isTeamManagerOrAdmin,
} from '@/lib/db/queries';
import { getTeamById } from '@/lib/db/queries';
import { ROLE_LEVELS } from '@/types/auth';
import { canUserPostToChannel, canUserViewTeamMessages } from '@/lib/constants/channels';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/teams/[teamId]/messages
 *
 * Returns paginated messages for a team chat. Uses cursor-based pagination
 * for efficient loading of message history.
 *
 * Query parameters:
 * - cursor: Message ID to start from (optional)
 * - limit: Number of messages to return (default: 50, max: 100)
 * - direction: 'older' or 'newer' relative to cursor (default: 'older')
 * - pinnedOnly: If 'true', only return pinned messages
 *
 * Response includes:
 * - messages: Array of message objects with author info
 * - cursor: { next, previous } for pagination
 * - hasMore: Boolean indicating if more messages exist
 * - totalPinned: Count of pinned messages in the team
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 *
 * Example requests:
 * - GET /api/teams/rays/messages
 * - GET /api/teams/rays/messages?limit=20
 * - GET /api/teams/rays/messages?cursor=msg-005&direction=older
 * - GET /api/teams/rays/messages?pinnedOnly=true
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "messages": [
 *       {
 *         "id": "msg-001",
 *         "teamId": "rays",
 *         "authorId": "user-001",
 *         "content": "Great game today!",
 *         "replyToId": null,
 *         "isPinned": false,
 *         "isEdited": false,
 *         "editedAt": null,
 *         "isDeleted": false,
 *         "deletedAt": null,
 *         "createdAt": "2026-02-16T18:30:00Z",
 *         "author": {
 *           "id": "user-001",
 *           "fullName": "Mike Johnson",
 *           "avatarUrl": null
 *         },
 *         "replyTo": null
 *       }
 *     ],
 *     "cursor": {
 *       "next": "msg-010",
 *       "previous": null
 *     },
 *     "hasMore": true,
 *     "totalPinned": 2
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to view team messages');
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
    const userRoleLevel = ROLE_LEVELS[userRole] ?? 1;
    const isAdmin = userRoleLevel >= ROLE_LEVELS.admin;
    const isMember = await isTeamMember(session.user.id, teamId);
    const isManager = await isTeamManagerOrAdmin(session.user.id, teamId);

    // Admins can view any team's messages, others must be team members
    const canView = canUserViewTeamMessages(userRole, isMember, isManager);
    if (!canView) {
      return forbiddenResponse('You must be a member of this team to view messages');
    }

    // Parse query parameters (now includes channel)
    const { searchParams } = new URL(request.url);
    const query = parseListMessagesQuery(searchParams);

    // Fetch messages for the specified channel
    const result = await getTeamMessages(teamId, {
      channel: query.channel,
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      pinnedOnly: query.pinnedOnly,
    });

    return successResponse(result);
  } catch (error) {
    console.error('[API] GET /api/teams/[teamId]/messages error:', error);
    return internalErrorResponse('Failed to fetch messages');
  }
}

/**
 * POST /api/teams/[teamId]/messages
 *
 * Send a new message to the team chat.
 *
 * Request body:
 * {
 *   "content": "Message text (1-2000 characters)",
 *   "replyToId": "msg-001" (optional - ID of message being replied to)
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 *
 * Example request:
 * POST /api/teams/rays/messages
 * {
 *   "content": "Great practice today everyone!",
 *   "replyToId": null
 * }
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "msg-new-001",
 *     "teamId": "rays",
 *     "authorId": "user-001",
 *     "content": "Great practice today everyone!",
 *     "replyToId": null,
 *     "isPinned": false,
 *     "isEdited": false,
 *     "editedAt": null,
 *     "isDeleted": false,
 *     "deletedAt": null,
 *     "createdAt": "2026-02-16T20:00:00Z",
 *     "author": {
 *       "id": "user-001",
 *       "fullName": "Mike Johnson",
 *       "avatarUrl": null
 *     },
 *     "replyTo": null
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF validation
    if (!await validateCSRF()) {
      return csrfErrorResponse();
    }

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to send messages');
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
    const userRoleLevel = ROLE_LEVELS[userRole] ?? 1;
    const isAdmin = userRoleLevel >= ROLE_LEVELS.admin;
    const isMember = await isTeamMember(session.user.id, teamId);
    const isManager = await isTeamManagerOrAdmin(session.user.id, teamId);

    // Admins can post to any team, others must be team members
    if (!isAdmin && !isMember && !isManager) {
      return forbiddenResponse('You must be a member of this team to send messages');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateCreateMessage(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const channel = validation.data.channel;

    // Check if user can post to this channel
    const canPost = canUserPostToChannel(userRole, isManager, channel);
    if (!canPost) {
      return forbiddenResponse('Only team managers can post to the Important channel');
    }

    // Create the message with channel
    const message = await createMessage({
      teamId,
      authorId: session.user.id,
      content: validation.data.content,
      channel: channel,
      replyToId: validation.data.replyToId ?? null,
    });

    return createdResponse(message);
  } catch (error) {
    console.error('[API] POST /api/teams/[teamId]/messages error:', error);
    return internalErrorResponse('Failed to send message');
  }
}
