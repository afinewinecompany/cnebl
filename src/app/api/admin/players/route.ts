/**
 * Admin Players API Route
 * POST /api/admin/players - Assign a user to a team (create player record)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createdResponse,
  validationErrorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api';
import {
  validateRequired,
  validateEnum,
  validateLength,
  mergeResults,
} from '@/lib/api/validation';
import { assignPlayerToTeam } from '@/lib/db/queries/admin-users';
import type { FieldPosition, BattingSide, ThrowingArm } from '@/types';

// Valid enum values
const FIELD_POSITIONS: readonly FieldPosition[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'
];
const BATTING_SIDES: readonly BattingSide[] = ['L', 'R', 'S'];
const THROWING_ARMS: readonly ThrowingArm[] = ['L', 'R'];

/**
 * POST /api/admin/players
 *
 * Assign a user to a team by creating a player record.
 * Requires admin or commissioner role.
 *
 * Request body:
 * {
 *   userId: string (required) - ID of the user to assign
 *   teamId: string (required) - ID of the team
 *   jerseyNumber: string (required) - Jersey number (must be unique on team)
 *   primaryPosition: FieldPosition (required) - P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH, UTIL
 *   secondaryPosition?: FieldPosition | null (optional) - Secondary position
 *   bats: BattingSide (required) - L, R, or S (switch)
 *   throws: ThrowingArm (required) - L or R
 *   isCaptain?: boolean (optional, default: false) - Whether player is team captain
 *   seasonId?: string (optional) - Season ID (defaults to current active season)
 * }
 *
 * Response (201 Created):
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     userId: string,
 *     teamId: string,
 *     seasonId: string,
 *     jerseyNumber: string,
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
 *
 * Error responses:
 * - 400 Bad Request: User already assigned or jersey number taken
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Not admin/commissioner
 * - 404 Not Found: User or team not found
 * - 422 Validation Error: Invalid input data
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON in request body');
    }

    // Validate required fields
    const validationResult = mergeResults(
      validateRequired(body.userId, 'userId'),
      validateRequired(body.teamId, 'teamId'),
      validateRequired(body.jerseyNumber, 'jerseyNumber'),
      validateRequired(body.primaryPosition, 'primaryPosition'),
      validateRequired(body.bats, 'bats'),
      validateRequired(body.throws, 'throws')
    );

    // Validate field lengths and formats
    if (body.jerseyNumber) {
      const jerseyValidation = validateLength(body.jerseyNumber as string, 'jerseyNumber', {
        min: 1,
        max: 3,
      });
      if (!jerseyValidation.valid) {
        validationResult.valid = false;
        validationResult.errors = { ...validationResult.errors, ...jerseyValidation.errors };
      }
    }

    // Validate enum values
    if (body.primaryPosition) {
      const positionValidation = validateEnum(
        body.primaryPosition as string,
        'primaryPosition',
        FIELD_POSITIONS
      );
      if (!positionValidation.valid) {
        validationResult.valid = false;
        validationResult.errors = { ...validationResult.errors, ...positionValidation.errors };
      }
    }

    if (body.secondaryPosition && body.secondaryPosition !== null) {
      const secondaryValidation = validateEnum(
        body.secondaryPosition as string,
        'secondaryPosition',
        FIELD_POSITIONS
      );
      if (!secondaryValidation.valid) {
        validationResult.valid = false;
        validationResult.errors = { ...validationResult.errors, ...secondaryValidation.errors };
      }
    }

    if (body.bats) {
      const batsValidation = validateEnum(body.bats as string, 'bats', BATTING_SIDES);
      if (!batsValidation.valid) {
        validationResult.valid = false;
        validationResult.errors = { ...validationResult.errors, ...batsValidation.errors };
      }
    }

    if (body.throws) {
      const throwsValidation = validateEnum(body.throws as string, 'throws', THROWING_ARMS);
      if (!throwsValidation.valid) {
        validationResult.valid = false;
        validationResult.errors = { ...validationResult.errors, ...throwsValidation.errors };
      }
    }

    // Return validation errors if any
    if (!validationResult.valid) {
      return validationErrorResponse(validationResult.errors);
    }

    // Create the player assignment
    try {
      const player = await assignPlayerToTeam({
        userId: body.userId as string,
        teamId: body.teamId as string,
        jerseyNumber: body.jerseyNumber as string,
        primaryPosition: body.primaryPosition as FieldPosition,
        secondaryPosition: (body.secondaryPosition as FieldPosition) || null,
        bats: body.bats as BattingSide,
        throws: body.throws as ThrowingArm,
        isCaptain: (body.isCaptain as boolean) || false,
        seasonId: (body.seasonId as string) || undefined,
      });

      return createdResponse(player);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign player';

      // Handle specific error cases
      if (message.includes('not found')) {
        return badRequestResponse(message);
      }
      if (message.includes('already assigned') || message.includes('already taken')) {
        return badRequestResponse(message);
      }

      throw error;
    }
  } catch (error) {
    console.error('[API] POST /api/admin/players error:', error);
    return internalErrorResponse('Failed to assign player to team');
  }
}
