/**
 * Admin Users API Route Tests
 * Tests for GET /api/admin/users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-users', () => ({
  getAllUsersWithAssignments: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getAllUsersWithAssignments } from '@/lib/db/queries/admin-users';

// Test data
const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockCommissionerSession = {
  user: { id: 'commissioner-1', email: 'commissioner@example.com', role: 'commissioner' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockPlayerSession = {
  user: { id: 'player-1', email: 'player@example.com', role: 'player' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockUsers = [
  {
    id: 'user-1',
    email: 'player1@example.com',
    fullName: 'John Player',
    phone: '555-1234',
    avatarUrl: null,
    role: 'player',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    playerId: 'player-1',
    teamId: 'team-1',
    teamName: 'Boston Bombers',
    teamAbbreviation: 'BOS',
    teamPrimaryColor: '#1a365d',
    jerseyNumber: '42',
    primaryPosition: 'SS',
    secondaryPosition: '2B',
    bats: 'R',
    throws: 'R',
    isCaptain: true,
  },
  {
    id: 'user-2',
    email: 'player2@example.com',
    fullName: 'Jane Unassigned',
    phone: null,
    avatarUrl: null,
    role: 'player',
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z',
    playerId: null,
    teamId: null,
    teamName: null,
    teamAbbreviation: null,
    teamPrimaryColor: null,
    jerseyNumber: null,
    primaryPosition: null,
    secondaryPosition: null,
    bats: null,
    throws: null,
    isCaptain: false,
  },
];

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/users');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAllUsersWithAssignments).mockResolvedValue({
      users: mockUsers,
      totalCount: mockUsers.length,
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Authentication');
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Admin');
    });

    it('allows admin users', async () => {
      const response = await GET(createGetRequest());

      expect(response.status).toBe(200);
    });

    it('allows commissioner users', async () => {
      vi.mocked(auth).mockResolvedValue(mockCommissionerSession);

      const response = await GET(createGetRequest());

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Responses', () => {
    it('returns paginated users with assignments', async () => {
      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockUsers);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.totalItems).toBe(mockUsers.length);
    });

    it('includes team and player details for assigned users', async () => {
      const response = await GET(createGetRequest());
      const body = await response.json();

      const assignedUser = body.data[0];
      expect(assignedUser.teamId).toBe('team-1');
      expect(assignedUser.teamName).toBe('Boston Bombers');
      expect(assignedUser.jerseyNumber).toBe('42');
      expect(assignedUser.primaryPosition).toBe('SS');
    });

    it('returns null team fields for unassigned users', async () => {
      const response = await GET(createGetRequest());
      const body = await response.json();

      const unassignedUser = body.data[1];
      expect(unassignedUser.teamId).toBeNull();
      expect(unassignedUser.playerId).toBeNull();
    });
  });

  describe('Pagination', () => {
    it('passes pagination parameters to query', async () => {
      await GET(createGetRequest({ page: '2', pageSize: '25' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 25,
        })
      );
    });

    it('uses default pagination when not provided', async () => {
      await GET(createGetRequest());

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });
  });

  describe('Filtering', () => {
    it('passes search parameter to query', async () => {
      await GET(createGetRequest({ search: 'john' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
        })
      );
    });

    it('passes role filter to query', async () => {
      await GET(createGetRequest({ role: 'player' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'player',
        })
      );
    });

    it('validates role values', async () => {
      await GET(createGetRequest({ role: 'invalid_role' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          role: undefined,
        })
      );
    });

    it('accepts valid roles: player, manager, admin, commissioner', async () => {
      const validRoles = ['player', 'manager', 'admin', 'commissioner'];

      for (const role of validRoles) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(getAllUsersWithAssignments).mockResolvedValue({ users: [], totalCount: 0 });

        await GET(createGetRequest({ role }));

        expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
          expect.objectContaining({ role })
        );
      }
    });

    it('passes teamId filter to query', async () => {
      await GET(createGetRequest({ teamId: 'team-1' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-1',
        })
      );
    });

    it('passes assignmentStatus filter to query', async () => {
      await GET(createGetRequest({ assignmentStatus: 'assigned' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentStatus: 'assigned',
        })
      );
    });

    it('accepts assignmentStatus: assigned, unassigned', async () => {
      for (const status of ['assigned', 'unassigned']) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(getAllUsersWithAssignments).mockResolvedValue({ users: [], totalCount: 0 });

        await GET(createGetRequest({ assignmentStatus: status }));

        expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
          expect.objectContaining({ assignmentStatus: status })
        );
      }
    });

    it('defaults assignmentStatus to all', async () => {
      await GET(createGetRequest());

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentStatus: 'all',
        })
      );
    });

    it('passes isActive=true filter to query', async () => {
      await GET(createGetRequest({ isActive: 'true' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });

    it('passes isActive=false filter to query', async () => {
      await GET(createGetRequest({ isActive: 'false' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('Sorting', () => {
    it('passes sort parameters to query', async () => {
      await GET(createGetRequest({ sortBy: 'email', sortDir: 'desc' }));

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'email',
          sortDir: 'desc',
        })
      );
    });

    it('defaults sortBy to name', async () => {
      await GET(createGetRequest());

      expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'name',
        })
      );
    });

    it('accepts valid sortBy values: name, email, team, createdAt', async () => {
      const validSorts = ['name', 'email', 'team', 'createdAt'];

      for (const sortBy of validSorts) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(getAllUsersWithAssignments).mockResolvedValue({ users: [], totalCount: 0 });

        await GET(createGetRequest({ sortBy }));

        expect(getAllUsersWithAssignments).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getAllUsersWithAssignments).mockRejectedValue(new Error('Database error'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('fetch users');
    });
  });
});
