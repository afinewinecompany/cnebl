/**
 * Admin Single Team API Route
 * GET /api/admin/teams/[teamId] - Get team details
 * PATCH /api/admin/teams/[teamId] - Update team info
 * DELETE /api/admin/teams/[teamId] - Delete a team
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  internalErrorResponse,
  noContentResponse,
} from '@/lib/api';
import {
  getTeamByIdAdmin,
  updateTeam,
  deleteTeam,
  getTeamRosterCount,
} from '@/lib/db/queries/teams';

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/admin/teams/[teamId]
 *
 * Returns team details with admin-level information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    const team = await getTeamByIdAdmin(teamId);

    if (!team) {
      return notFoundResponse('Team', teamId);
    }

    return successResponse(team);
  } catch (error) {
    console.error('[API] GET /api/admin/teams/[teamId] error:', error);
    return internalErrorResponse('Failed to fetch team');
  }
}

/**
 * PATCH /api/admin/teams/[teamId]
 *
 * Updates team information
 *
 * Request body (all fields optional):
 * {
 *   name?: string,
 *   abbreviation?: string,
 *   primaryColor?: string,
 *   secondaryColor?: string,
 *   logoUrl?: string,
 *   isActive?: boolean,
 *   managerId?: string | null
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return forbiddenResponse('Admin access required');
    }

    // Get existing team
    const existingTeam = await getTeamByIdAdmin(teamId);
    if (!existingTeam) {
      return notFoundResponse('Team', teamId);
    }

    const body = await request.json();

    // Validation
    const errors: Record<string, string[]> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        errors.name = ['Team name cannot be empty'];
      } else if (body.name.length > 100) {
        errors.name = ['Team name must be 100 characters or less'];
      }
    }

    if (body.abbreviation !== undefined) {
      if (typeof body.abbreviation !== 'string') {
        errors.abbreviation = ['Abbreviation must be a string'];
      } else if (body.abbreviation.length < 2 || body.abbreviation.length > 4) {
        errors.abbreviation = ['Abbreviation must be 2-4 characters'];
      }
    }

    // Validate hex colors if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (body.primaryColor !== undefined && body.primaryColor !== null && !hexColorRegex.test(body.primaryColor)) {
      errors.primaryColor = ['Primary color must be a valid hex color (e.g., #FF0000)'];
    }
    if (body.secondaryColor !== undefined && body.secondaryColor !== null && !hexColorRegex.test(body.secondaryColor)) {
      errors.secondaryColor = ['Secondary color must be a valid hex color (e.g., #0000FF)'];
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      errors.isActive = ['isActive must be a boolean'];
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.abbreviation !== undefined) updateData.abbreviation = body.abbreviation.toUpperCase().trim();
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.managerId !== undefined) updateData.managerId = body.managerId;

    const updatedTeam = await updateTeam(teamId, updateData);

    return successResponse(updatedTeam);
  } catch (error) {
    console.error('[API] PATCH /api/admin/teams/[teamId] error:', error);
    return internalErrorResponse('Failed to update team');
  }
}

/**
 * DELETE /api/admin/teams/[teamId]
 *
 * Deletes a team
 * - Only commissioner can delete teams
 * - Team must have no active players
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Only commissioner can delete teams
    if (session.user.role !== 'commissioner') {
      return forbiddenResponse('Commissioner access required to delete teams');
    }

    // Get existing team
    const existingTeam = await getTeamByIdAdmin(teamId);
    if (!existingTeam) {
      return notFoundResponse('Team', teamId);
    }

    // Check if team has active players
    const rosterCount = await getTeamRosterCount(teamId);
    if (rosterCount > 0) {
      return badRequestResponse(
        `Cannot delete team with ${rosterCount} active player(s). Remove or reassign players first.`
      );
    }

    await deleteTeam(teamId);

    return noContentResponse();
  } catch (error) {
    console.error('[API] DELETE /api/admin/teams/[teamId] error:', error);
    return internalErrorResponse('Failed to delete team');
  }
}
