/**
 * Admin Player by ID API Route
 * GET /api/admin/players/[playerId] - Get player details
 * PATCH /api/admin/players/[playerId] - Update player assignment
 * DELETE /api/admin/players/[playerId] - Remove player from team
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  noContentResponse,
  validationErrorResponse,
  badRequestResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api';
import { validateEnum, validateLength, mergeResults, validResult } from '@/lib/api/validation';
import {
  getPlayerById,
  updatePlayerAssignment,
  removePlayerFromTeam,
} from '@/lib/db/queries/admin-users';
import type { FieldPosition, BattingSide, ThrowingArm } from '@/types';

// Valid enum values
const FIELD_POSITIONS: readonly FieldPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'
];
const BATTING_SIDES: readonly BattingSide[] = ['L', 'R', 'S'];
const THROWING_ARMS: readonly ThrowingArm[] = ['L', 'R'];

interface RouteParams {
  params: Promise<{
    playerId: string;
  }>;
}

/**
 * GET /api/admin/players/[playerId]
 *
 * Get detailed information about a specific player assignment.
 * Requires admin or commissioner role.
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     userId: string,
 *     teamId: string,
 *     seasonId: string,
 *     jerseyNumber: string | null,
 *     primaryPosition: FieldPosition,
 *     secondaryPosition: FieldPosition | null,
 *     bats: BattingSide,
 *     throws: ThrowingArm,
 *     isActive: boolean,
 *     isCaptain: boolean,
 *     joinedAt: string,
 *     createdAt: string,
 *     updatedAt: string,
 *     user: {
 *       id: string,
 *       fullName: string,
 *       email: string,
 *       avatarUrl: string | null,
 *       role: UserRole
 *     },
 *     team: {
 *       id: string,
 *       name: string,
 *       abbreviation: string,
 *       primaryColor: string | null
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const { playerId } = await params;

    if (!playerId) {
      return badRequestResponse('Player ID is required');
    }

    const player = await getPlayerById(playerId);

    if (!player) {
      return notFoundResponse('Player', playerId);
    }

    return successResponse(player);
  } catch (error) {
    console.error('[API] GET /api/admin/players/[playerId] error:', error);
    return internalErrorResponse('Failed to fetch player');
  }
}

/**
 * PATCH /api/admin/players/[playerId]
 *
 * Update a player's assignment details.
 * Requires admin or commissioner role.
 *
 * Request body (all fields optional):
 * {
 *   teamId?: string - Transfer to a different team
 *   jerseyNumber?: string - Update jersey number
 *   primaryPosition?: FieldPosition - Update primary position
 *   secondaryPosition?: FieldPosition | null - Update secondary position
 *   bats?: BattingSide - Update batting side
 *   throws?: ThrowingArm - Update throwing arm
 *   isCaptain?: boolean - Update captain status
 *   isActive?: boolean - Update active status
 * }
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   data: { ...updated player details }
 * }
 *
 * Error responses:
 * - 400 Bad Request: Jersey number taken or invalid team
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not admin/commissioner
 * - 404 Not Found: Player not found
 * - 422 Validation Error: Invalid input data
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const { playerId } = await params;

    if (!playerId) {
      return badRequestResponse('Player ID is required');
    }

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON in request body');
    }

    // Check if body has any valid update fields
    const validFields = [
      'teamId',
      'jerseyNumber',
      'primaryPosition',
      'secondaryPosition',
      'bats',
      'throws',
      'isCaptain',
      'isActive',
    ];
    const hasValidField = validFields.some((field) => body[field] !== undefined);
    if (!hasValidField) {
      return badRequestResponse('No valid update fields provided');
    }

    // Validate fields if provided
    let validationResult = validResult();

    if (body.jerseyNumber !== undefined) {
      const jerseyValidation = validateLength(body.jerseyNumber as string, 'jerseyNumber', {
        min: 1,
        max: 3,
      });
      validationResult = mergeResults(validationResult, jerseyValidation);
    }

    if (body.primaryPosition !== undefined) {
      const positionValidation = validateEnum(
        body.primaryPosition as string,
        'primaryPosition',
        FIELD_POSITIONS
      );
      validationResult = mergeResults(validationResult, positionValidation);
    }

    if (body.secondaryPosition !== undefined && body.secondaryPosition !== null) {
      const secondaryValidation = validateEnum(
        body.secondaryPosition as string,
        'secondaryPosition',
        FIELD_POSITIONS
      );
      validationResult = mergeResults(validationResult, secondaryValidation);
    }

    if (body.bats !== undefined) {
      const batsValidation = validateEnum(body.bats as string, 'bats', BATTING_SIDES);
      validationResult = mergeResults(validationResult, batsValidation);
    }

    if (body.throws !== undefined) {
      const throwsValidation = validateEnum(body.throws as string, 'throws', THROWING_ARMS);
      validationResult = mergeResults(validationResult, throwsValidation);
    }

    if (body.isCaptain !== undefined && typeof body.isCaptain !== 'boolean') {
      validationResult.valid = false;
      validationResult.errors.isCaptain = ['isCaptain must be a boolean'];
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      validationResult.valid = false;
      validationResult.errors.isActive = ['isActive must be a boolean'];
    }

    // Return validation errors if any
    if (!validationResult.valid) {
      return validationErrorResponse(validationResult.errors);
    }

    // Update the player
    try {
      const updatedPlayer = await updatePlayerAssignment(playerId, {
        teamId: body.teamId as string | undefined,
        jerseyNumber: body.jerseyNumber as string | undefined,
        primaryPosition: body.primaryPosition as FieldPosition | undefined,
        secondaryPosition:
          body.secondaryPosition !== undefined
            ? (body.secondaryPosition as FieldPosition | null)
            : undefined,
        bats: body.bats as BattingSide | undefined,
        throws: body.throws as ThrowingArm | undefined,
        isCaptain: body.isCaptain as boolean | undefined,
        isActive: body.isActive as boolean | undefined,
      });

      return successResponse(updatedPlayer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update player';

      // Handle specific error cases
      if (message.includes('not found')) {
        return notFoundResponse('Player', playerId);
      }
      if (message.includes('already taken')) {
        return badRequestResponse(message);
      }

      throw error;
    }
  } catch (error) {
    console.error('[API] PATCH /api/admin/players/[playerId] error:', error);
    return internalErrorResponse('Failed to update player');
  }
}

/**
 * DELETE /api/admin/players/[playerId]
 *
 * Remove a player from their team. This is a soft delete that sets the
 * player's isActive flag to false. The user account remains in the system.
 * Requires admin or commissioner role.
 *
 * Response (204 No Content): Success, player removed from team
 *
 * Error responses:
 * - 400 Bad Request: Player already removed
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not admin/commissioner
 * - 404 Not Found: Player not found
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const { playerId } = await params;

    if (!playerId) {
      return badRequestResponse('Player ID is required');
    }

    // Remove the player from their team
    try {
      await removePlayerFromTeam(playerId);
      return noContentResponse();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove player';

      // Handle specific error cases
      if (message.includes('not found')) {
        return notFoundResponse('Player', playerId);
      }
      if (message.includes('already removed')) {
        return badRequestResponse(message);
      }

      throw error;
    }
  } catch (error) {
    console.error('[API] DELETE /api/admin/players/[playerId] error:', error);
    return internalErrorResponse('Failed to remove player from team');
  }
}
