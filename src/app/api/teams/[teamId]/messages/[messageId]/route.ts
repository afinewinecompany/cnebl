/**
 * Individual Message API Route
 * GET /api/teams/[teamId]/messages/[messageId] - Get a single message
 * PATCH /api/teams/[teamId]/messages/[messageId] - Edit a message
 * DELETE /api/teams/[teamId]/messages/[messageId] - Delete a message
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  noContentResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateCSRF, csrfErrorResponse } from '@/lib/api/csrf';
import { validateTeamId } from '@/lib/api/validation';
import {
  getMessageById,
  getMessageAuthorId,
  getMessageTeamId,
  updateMessage,
  deleteMessage,
  isTeamMember,
} from '@/lib/db/queries';
import { getTeamById } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ teamId: string; messageId: string }>;
}

/**
 * GET /api/teams/[teamId]/messages/[messageId]
 *
 * Returns a single message by ID.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to view messages');
    }

    const { teamId, messageId } = await params;

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

    // Check if user is a member of the team
    const isMember = await isTeamMember(session.user.id, teamId);
    if (!isMember) {
      return forbiddenResponse('You must be a member of this team to view messages');
    }

    // Get the message
    const message = await getMessageById(messageId);
    if (!message) {
      return notFoundResponse('Message', messageId);
    }

    // Verify message belongs to this team
    if (message.teamId !== teamId) {
      return notFoundResponse('Message', messageId);
    }

    return successResponse(message);
  } catch (error) {
    console.error('[API] GET /api/teams/[teamId]/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to fetch message');
  }
}

/**
 * PATCH /api/teams/[teamId]/messages/[messageId]
 *
 * Edit a message's content.
 *
 * Request body:
 * {
 *   "content": "Updated message content (1-2000 characters)"
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 * - User must be the author of the message
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF validation
    if (!await validateCSRF()) {
      return csrfErrorResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to edit messages');
    }

    const { teamId, messageId } = await params;

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

    // Check if user is a member of the team
    const isMember = await isTeamMember(session.user.id, teamId);
    if (!isMember) {
      return forbiddenResponse('You must be a member of this team to edit messages');
    }

    // Check if message exists and belongs to this team
    const messageTeamId = await getMessageTeamId(messageId);
    if (!messageTeamId) {
      return notFoundResponse('Message', messageId);
    }
    if (messageTeamId !== teamId) {
      return notFoundResponse('Message', messageId);
    }

    // Check if user is the author
    const authorId = await getMessageAuthorId(messageId);
    if (authorId !== session.user.id) {
      return forbiddenResponse('You can only edit your own messages');
    }

    // Parse request body
    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    // Validate content
    if (!body.content || typeof body.content !== 'string') {
      return validationErrorResponse({ content: ['Content is required'] });
    }

    const content = body.content.trim();
    if (content.length < 1) {
      return validationErrorResponse({ content: ['Content cannot be empty'] });
    }
    if (content.length > 2000) {
      return validationErrorResponse({ content: ['Content must be 2000 characters or less'] });
    }

    // Update the message
    const updatedMessage = await updateMessage(messageId, content);
    if (!updatedMessage) {
      return internalErrorResponse('Failed to update message');
    }

    return successResponse(updatedMessage);
  } catch (error) {
    console.error('[API] PATCH /api/teams/[teamId]/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to edit message');
  }
}

/**
 * DELETE /api/teams/[teamId]/messages/[messageId]
 *
 * Soft delete a message.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 * - User must be the author of the message OR a team manager/admin
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF validation
    if (!await validateCSRF()) {
      return csrfErrorResponse();
    }

    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to delete messages');
    }

    const { teamId, messageId } = await params;

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

    // Check if user is a member of the team
    const isMember = await isTeamMember(session.user.id, teamId);
    if (!isMember) {
      return forbiddenResponse('You must be a member of this team to delete messages');
    }

    // Check if message exists and belongs to this team
    const messageTeamId = await getMessageTeamId(messageId);
    if (!messageTeamId) {
      return notFoundResponse('Message', messageId);
    }
    if (messageTeamId !== teamId) {
      return notFoundResponse('Message', messageId);
    }

    // Check if user is the author OR a manager of THIS team OR an admin
    const authorId = await getMessageAuthorId(messageId);
    const isAuthor = authorId === session.user.id;
    // Manager can only delete in their own team's chat
    const isTeamManager = session.user.teamId === teamId && session.user.role === 'manager';
    // Admins and commissioners can delete anywhere
    const isAdmin = ['admin', 'commissioner'].includes(session.user.role);

    if (!isAuthor && !isTeamManager && !isAdmin) {
      return forbiddenResponse('You can only delete your own messages');
    }

    // Delete the message
    const deleted = await deleteMessage(messageId);
    if (!deleted) {
      return internalErrorResponse('Failed to delete message');
    }

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/teams/[teamId]/messages/[messageId] error:', error);
    return internalErrorResponse('Failed to delete message');
  }
}
