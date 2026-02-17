/**
 * Message Pin API Route
 * POST /api/messages/[messageId]/pin - Toggle pin status of a message
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
import { validateRequired } from '@/lib/api/validation';
import { validateTogglePin } from '@/lib/api/schemas/messages';
import {
  toggleMessagePin,
  getMessageTeamId,
  isTeamManagerOrAdmin,
} from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ messageId: string }>;
}

/**
 * POST /api/messages/[messageId]/pin
 *
 * Toggle the pin status of a message. Pinned messages appear at the top
 * of the chat and can be fetched separately using the pinnedOnly filter.
 *
 * Only team managers and admins can pin/unpin messages.
 *
 * Request body:
 * {
 *   "isPinned": true | false
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a team manager or admin for the team the message belongs to
 *
 * Example request:
 * POST /api/messages/msg-001/pin
 * {
 *   "isPinned": true
 * }
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "msg-001",
 *     "teamId": "rays",
 *     "authorId": "user-001",
 *     "content": "Practice moved to 6pm tomorrow",
 *     "replyToId": null,
 *     "isPinned": true,
 *     "isEdited": false,
 *     "editedAt": null,
 *     "isDeleted": false,
 *     "deletedAt": null,
 *     "createdAt": "2026-02-16T18:30:00Z",
 *     "author": {
 *       "id": "user-001",
 *       "fullName": "Coach Williams",
 *       "avatarUrl": null
 *     },
 *     "replyTo": null
 *   }
 * }
 *
 * Use cases:
 * - Pin important announcements (practice changes, game reminders)
 * - Pin team rules or guidelines
 * - Unpin messages that are no longer relevant
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to pin messages');
    }

    const { messageId } = await params;

    // Validate message ID
    const idValidation = validateRequired(messageId, 'messageId');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Get the team ID for the message
    const teamId = await getMessageTeamId(messageId);
    if (!teamId) {
      return notFoundResponse('Message', messageId);
    }

    // Check if user is a team manager or admin
    const isManagerOrAdmin = await isTeamManagerOrAdmin(session.user.id, teamId);
    if (!isManagerOrAdmin) {
      return forbiddenResponse('Only team managers can pin or unpin messages');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateTogglePin(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Toggle the pin status
    const message = await toggleMessagePin(messageId, validation.data.isPinned);
    if (!message) {
      return notFoundResponse('Message', messageId);
    }

    return successResponse(message);
  } catch (error) {
    console.error('[API] POST /api/messages/[messageId]/pin error:', error);
    return internalErrorResponse('Failed to update pin status');
  }
}
