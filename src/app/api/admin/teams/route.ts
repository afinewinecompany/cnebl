/**
 * Admin Teams API Route
 * GET /api/admin/teams - Returns all teams with admin-level details
 * POST /api/admin/teams - Create a new team
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api';
import {
  getAllTeamsAdmin,
  createTeam,
  getTeamById,
} from '@/lib/db/queries/teams';

/**
 * GET /api/admin/teams
 *
 * Returns all teams with admin-level details including:
 * - Manager information
 * - Roster counts
 * - Full team data
 *
 * Query parameters:
 * - seasonId: Filter by season (optional)
 * - active: Filter by active status (optional, boolean)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') || undefined;
    const activeParam = searchParams.get('active');
    const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

    const teams = await getAllTeamsAdmin({
      seasonId,
      active,
    });

    return successResponse(teams);
  } catch (error) {
    console.error('[API] GET /api/admin/teams error:', error);
    return internalErrorResponse('Failed to fetch teams');
  }
}

/**
 * POST /api/admin/teams
 *
 * Creates a new team
 *
 * Request body:
 * {
 *   name: string (required),
 *   abbreviation: string (required, 2-4 characters),
 *   primaryColor: string (optional, hex color),
 *   secondaryColor: string (optional, hex color),
 *   isActive: boolean (optional, defaults to true),
 *   seasonId: string (optional, defaults to current season)
 * }
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

    const body = await request.json();

    // Validation
    const errors: Record<string, string[]> = {};

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.name = ['Team name is required'];
    } else if (body.name.length > 100) {
      errors.name = ['Team name must be 100 characters or less'];
    }

    if (!body.abbreviation || typeof body.abbreviation !== 'string') {
      errors.abbreviation = ['Team abbreviation is required'];
    } else if (body.abbreviation.length < 2 || body.abbreviation.length > 4) {
      errors.abbreviation = ['Abbreviation must be 2-4 characters'];
    }

    // Validate hex colors if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (body.primaryColor && !hexColorRegex.test(body.primaryColor)) {
      errors.primaryColor = ['Primary color must be a valid hex color (e.g., #FF0000)'];
    }
    if (body.secondaryColor && !hexColorRegex.test(body.secondaryColor)) {
      errors.secondaryColor = ['Secondary color must be a valid hex color (e.g., #0000FF)'];
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors);
    }

    // Generate team ID from name (kebab-case)
    const teamId = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Check if team ID already exists
    const existingTeam = await getTeamById(teamId);
    if (existingTeam) {
      return badRequestResponse('A team with this name already exists');
    }

    // Create the team
    const newTeam = await createTeam({
      id: teamId,
      name: body.name.trim(),
      abbreviation: body.abbreviation.toUpperCase().trim(),
      primaryColor: body.primaryColor || null,
      secondaryColor: body.secondaryColor || null,
      isActive: body.isActive !== false,
      seasonId: body.seasonId || 'season-2026',
    });

    return createdResponse(newTeam);
  } catch (error) {
    console.error('[API] POST /api/admin/teams error:', error);
    return internalErrorResponse('Failed to create team');
  }
}
