/**
 * Message Pin API Route
 * PATCH /api/teams/[teamId]/messages/[messageId]/pin - Toggle pin status
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
import {
  getMessageTeamId,
  toggleMessagePin,
  isTeamMember,
} from '@/lib/db/queries';
import { getTeamById } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ teamId: string; messageId: string }>;
}

/**
 * PATCH /api/teams/[teamId]/messages/[messageId]/pin
 *
 * Toggle the pin status of a message.
 *
 * Request body:
 * {
 *   "isPinned": true | false
 * }
 *
 * Authorization:
 * - User must be authenticated
 * - User must be a member of the team
 * - User must be a manager, admin, or commissioner
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('You must be logged in to pin messages');
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
      return forbiddenResponse('You must be a member of this team to pin messages');
    }

    // Check if user has pin permission (manager or above)
    const canPin = ['manager', 'admin', 'commissioner'].includes(session.user.role);
    if (!canPin) {
      return forbiddenResponse('Only team managers can pin messages');
    }

    // Check if message exists and belongs to this team
    const messageTeamId = await getMessageTeamId(messageId);
    if (!messageTeamId) {
      return notFoundResponse('Message', messageId);
    }
    if (messageTeamId !== teamId) {
      return notFoundResponse('Message', messageId);
    }

    // Parse request body
    let body: { isPinned?: boolean };
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse({ body: ['Invalid JSON in request body'] });
    }

    // Validate isPinned
    if (typeof body.isPinned !== 'boolean') {
      return validationErrorResponse({ isPinned: ['isPinned must be a boolean'] });
    }

    // Update the pin status
    const updatedMessage = await toggleMessagePin(messageId, body.isPinned);
    if (!updatedMessage) {
      return internalErrorResponse('Failed to update pin status');
    }

    return successResponse(updatedMessage);
  } catch (error) {
    console.error('[API] PATCH /api/teams/[teamId]/messages/[messageId]/pin error:', error);
    return internalErrorResponse('Failed to update pin status');
  }
}
