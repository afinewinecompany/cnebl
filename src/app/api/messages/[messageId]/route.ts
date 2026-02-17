/**
 * Individual Message API Route
 * GET /api/messages/[messageId] - Get a single message
 * PATCH /api/messages/[messageId] - Edit a message
 * DELETE /api/messages/[messageId] - Soft delete a message
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
  noContentResponse,
} from '@/lib/api';
import { validateRequired } from '@/lib/api/validation';
import { validateEditMessage } from '@/lib/api/schemas/messages';
import {
  getMessageById,
  updateMessage,
  deleteMessage,
  getMessageAuthorId,
  getMessageTeamId,
  isTeamMember,
  isTeamManagerOrAdmin,
} from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ messageId: string }>;
}

/**
 * GET /api/messages/[messageId]
 *
 * Get a single message by ID. Useful for fetching updated message data
 * after edits or to check if a message exists.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team the message belongs to
 *
 * Example request:
 * GET /api/messages/msg-001
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "msg-001",
 *     "teamId": "rays",
 *     "authorId": "user-001",
 *     "content": "Great game today!",
 *     "replyToId": null,
 *     "isPinned": true,
 *     "isEdited": false,
 *     "editedAt": null,
 *     "isDeleted": false,
 *     "deletedAt": null,
 *     "createdAt": "2026-02-16T18:30:00Z",
 *     "author": {
 *       "id": "user-001",
 *       "fullName": "Mike Johnson",
 *       "avatarUrl": null
 *     },
 *     "replyTo": null
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to view messages');
    }

    const { messageId } = await params;

    // Validate message ID
    const validation = validateRequired(messageId, 'messageId');
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Get the message
    const message = await getMessageById(messageId);
    if (!message) {
      return notFoundResponse('Message', messageId);
    }

    // Check if user is a member of the team
    const isMember = await isTeamMember(session.user.id, message.teamId);
    if (!isMember) {
      return forbiddenResponse('You must be a member of this team to view messages');
    }

    return successResponse(message);
  } catch (error) {
    console.error('[API] GET /api/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to fetch message');
  }
}

/**
 * PATCH /api/messages/[messageId]
 *
 * Edit the content of a message. Only the author of the message can edit it.
 * The message will be marked as edited with an editedAt timestamp.
 *
 * Request body:
 * {
 *   "content": "Updated message text (1-2000 characters)"
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be the author of the message
 *
 * Example request:
 * PATCH /api/messages/msg-001
 * {
 *   "content": "Updated: Great game today! Final score was 7-3."
 * }
 *
 * Example response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "msg-001",
 *     "content": "Updated: Great game today! Final score was 7-3.",
 *     "isEdited": true,
 *     "editedAt": "2026-02-16T19:00:00Z",
 *     ...
 *   }
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to edit messages');
    }

    const { messageId } = await params;

    // Validate message ID
    const idValidation = validateRequired(messageId, 'messageId');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Check if message exists and get the author
    const authorId = await getMessageAuthorId(messageId);
    if (!authorId) {
      return notFoundResponse('Message', messageId);
    }

    // Check if user is the author of the message
    if (authorId !== session.user.id) {
      return forbiddenResponse('You can only edit your own messages');
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    const validation = validateEditMessage(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    // Update the message
    const message = await updateMessage(messageId, validation.data.content);
    if (!message) {
      return notFoundResponse('Message', messageId);
    }

    return successResponse(message);
  } catch (error) {
    console.error('[API] PATCH /api/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to update message');
  }
}

/**
 * DELETE /api/messages/[messageId]
 *
 * Soft delete a message. The message content will be replaced with
 * "[Message deleted]" and marked with a deletedAt timestamp.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be either:
 *   - The author of the message, OR
 *   - A team manager/admin of the team the message belongs to
 *
 * Example request:
 * DELETE /api/messages/msg-001
 *
 * Example response:
 * HTTP 204 No Content
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to delete messages');
    }

    const { messageId } = await params;

    // Validate message ID
    const idValidation = validateRequired(messageId, 'messageId');
    if (!idValidation.valid) {
      return validationErrorResponse(idValidation.errors);
    }

    // Get message author and team
    const [authorId, teamId] = await Promise.all([
      getMessageAuthorId(messageId),
      getMessageTeamId(messageId),
    ]);

    if (!authorId || !teamId) {
      return notFoundResponse('Message', messageId);
    }

    // Check authorization: user must be author OR team manager/admin
    const isAuthor = authorId === session.user.id;
    const isManagerOrAdmin = await isTeamManagerOrAdmin(session.user.id, teamId);

    if (!isAuthor && !isManagerOrAdmin) {
      return forbiddenResponse(
        'You can only delete your own messages or must be a team manager'
      );
    }

    // Soft delete the message
    const deleted = await deleteMessage(messageId);
    if (!deleted) {
      return notFoundResponse('Message', messageId);
    }

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to delete message');
  }
}
