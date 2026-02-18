/**
 * Admin Users API Route
 * GET /api/admin/users - List all users with their player/team assignments
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import {
  paginatedResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  parsePaginationParams,
  parseSortParams,
} from '@/lib/api';
import { getAllUsersWithAssignments } from '@/lib/db/queries/admin-users';
import type { UserRole } from '@/types';

/**
 * GET /api/admin/users
 *
 * Returns a paginated list of all users with their team assignment information.
 * Requires admin or commissioner role.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50, max: 100)
 * - search: Search by name or email (optional)
 * - role: Filter by user role - 'player', 'manager', 'admin', 'commissioner' (optional)
 * - teamId: Filter by team ID (optional)
 * - assignmentStatus: Filter by assignment status - 'assigned', 'unassigned', 'all' (optional, default: 'all')
 * - isActive: Filter by active status - 'true' or 'false' (optional)
 * - sortBy: Sort field - 'name', 'email', 'team', 'createdAt' (default: 'name')
 * - sortDir: Sort direction - 'asc' or 'desc' (default: 'asc')
 *
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: string,
 *       email: string,
 *       fullName: string,
 *       phone: string | null,
 *       avatarUrl: string | null,
 *       role: UserRole,
 *       isActive: boolean,
 *       createdAt: string,
 *       playerId: string | null,
 *       teamId: string | null,
 *       teamName: string | null,
 *       teamAbbreviation: string | null,
 *       teamPrimaryColor: string | null,
 *       jerseyNumber: string | null,
 *       primaryPosition: FieldPosition | null,
 *       secondaryPosition: FieldPosition | null,
 *       bats: BattingSide | null,
 *       throws: ThrowingArm | null,
 *       isCaptain: boolean
 *     },
 *     ...
 *   ],
 *   pagination: {
 *     page: number,
 *     pageSize: number,
 *     totalItems: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPreviousPage: boolean
 *   }
 * }
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

    // Parse query parameters
    const { page, pageSize } = parsePaginationParams(searchParams);
    const { sortBy, sortDir } = parseSortParams(
      searchParams,
      ['name', 'email', 'team', 'createdAt'] as const,
      'name'
    );

    // Get filter parameters
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') as UserRole | undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const assignmentStatusParam = searchParams.get('assignmentStatus');
    const isActiveParam = searchParams.get('isActive');

    // Validate role if provided
    const validRoles: UserRole[] = ['player', 'manager', 'admin', 'commissioner'];
    const validatedRole = role && validRoles.includes(role) ? role : undefined;

    // Parse assignment status
    let assignmentStatus: 'assigned' | 'unassigned' | 'all' = 'all';
    if (assignmentStatusParam === 'assigned' || assignmentStatusParam === 'unassigned') {
      assignmentStatus = assignmentStatusParam;
    }

    // Parse isActive
    let isActive: boolean | undefined;
    if (isActiveParam === 'true') isActive = true;
    if (isActiveParam === 'false') isActive = false;

    // Fetch users with assignments
    const { users, totalCount } = await getAllUsersWithAssignments({
      search,
      role: validatedRole,
      teamId,
      assignmentStatus,
      isActive,
      page,
      pageSize,
      sortBy,
      sortDir,
    });

    return paginatedResponse(users, {
      page,
      pageSize,
      totalItems: totalCount,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/users error:', error);
    return internalErrorResponse('Failed to fetch users');
  }
}
