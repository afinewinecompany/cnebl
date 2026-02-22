/**
 * Admin Single Team API Route Tests
 * Tests for GET, PATCH, DELETE /api/admin/teams/[teamId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/teams', () => ({
  getTeamByIdAdmin: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeamRosterCount: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  getTeamByIdAdmin,
  updateTeam,
  deleteTeam,
  getTeamRosterCount,
} from '@/lib/db/queries/teams';

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

const mockTeam = {
  id: 'boston-bombers',
  name: 'Boston Bombers',
  abbreviation: 'BOS',
  primaryColor: '#1a365d',
  secondaryColor: '#c53030',
  logoUrl: null,
  isActive: true,
  seasonId: 'season-2026',
  createdAt: '2024-01-01T00:00:00.000Z',
  managerId: null,
  rosterCount: 15,
};

const mockParams = Promise.resolve({ teamId: 'boston-bombers' });

function createRequest(method: string, body?: unknown): NextRequest {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new NextRequest(
    new URL('http://localhost:3000/api/admin/teams/boston-bombers'),
    options
  );
}

describe('GET /api/admin/teams/[teamId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getTeamByIdAdmin).mockResolvedValue(mockTeam);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows admin users', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('allows commissioner users', async () => {
      vi.mocked(auth).mockResolvedValue(mockCommissionerSession);

      const response = await GET(createRequest('GET'), { params: mockParams });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Responses', () => {
    it('returns team details', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockTeam);
    });

    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamByIdAdmin).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Team');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getTeamByIdAdmin).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('PATCH /api/admin/teams/[teamId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getTeamByIdAdmin).mockResolvedValue(mockTeam);
    vi.mocked(updateTeam).mockResolvedValue({ ...mockTeam, name: 'Updated Bombers' });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Successful Updates', () => {
    it('updates team name', async () => {
      const response = await PATCH(createRequest('PATCH', { name: 'Updated Bombers' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ name: 'Updated Bombers' })
      );
    });

    it('updates team abbreviation', async () => {
      await PATCH(createRequest('PATCH', { abbreviation: 'UPD' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ abbreviation: 'UPD' })
      );
    });

    it('converts abbreviation to uppercase', async () => {
      await PATCH(createRequest('PATCH', { abbreviation: 'upd' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ abbreviation: 'UPD' })
      );
    });

    it('updates primary color', async () => {
      await PATCH(createRequest('PATCH', { primaryColor: '#FF0000' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ primaryColor: '#FF0000' })
      );
    });

    it('updates secondary color', async () => {
      await PATCH(createRequest('PATCH', { secondaryColor: '#00FF00' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ secondaryColor: '#00FF00' })
      );
    });

    it('updates logo URL', async () => {
      await PATCH(createRequest('PATCH', { logoUrl: 'https://example.com/logo.png' }), {
        params: mockParams,
      });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ logoUrl: 'https://example.com/logo.png' })
      );
    });

    it('updates isActive status', async () => {
      await PATCH(createRequest('PATCH', { isActive: false }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ isActive: false })
      );
    });

    it('updates manager ID', async () => {
      await PATCH(createRequest('PATCH', { managerId: 'user-123' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ managerId: 'user-123' })
      );
    });

    it('clears manager ID with null', async () => {
      await PATCH(createRequest('PATCH', { managerId: null }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ managerId: null })
      );
    });

    it('trims whitespace from name', async () => {
      await PATCH(createRequest('PATCH', { name: '  New Team Name  ' }), { params: mockParams });

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({ name: 'New Team Name' })
      );
    });

    it('updates multiple fields at once', async () => {
      await PATCH(
        createRequest('PATCH', {
          name: 'New Name',
          abbreviation: 'NEW',
          primaryColor: '#123456',
        }),
        { params: mockParams }
      );

      expect(updateTeam).toHaveBeenCalledWith(
        'boston-bombers',
        expect.objectContaining({
          name: 'New Name',
          abbreviation: 'NEW',
          primaryColor: '#123456',
        })
      );
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamByIdAdmin).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('validates name cannot be empty', async () => {
      const response = await PATCH(createRequest('PATCH', { name: '' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates name cannot be whitespace only', async () => {
      const response = await PATCH(createRequest('PATCH', { name: '   ' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates name max length', async () => {
      const response = await PATCH(createRequest('PATCH', { name: 'A'.repeat(101) }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates abbreviation min length', async () => {
      const response = await PATCH(createRequest('PATCH', { abbreviation: 'A' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.abbreviation).toBeDefined();
    });

    it('validates abbreviation max length', async () => {
      const response = await PATCH(createRequest('PATCH', { abbreviation: 'ABCDE' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.abbreviation).toBeDefined();
    });

    it('validates primaryColor is valid hex', async () => {
      const response = await PATCH(createRequest('PATCH', { primaryColor: 'not-a-color' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.primaryColor).toBeDefined();
    });

    it('validates secondaryColor is valid hex', async () => {
      const response = await PATCH(createRequest('PATCH', { secondaryColor: 'invalid' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.secondaryColor).toBeDefined();
    });

    it('accepts 3-character hex colors', async () => {
      const response = await PATCH(createRequest('PATCH', { primaryColor: '#F00' }), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
    });

    it('allows null colors', async () => {
      const response = await PATCH(
        createRequest('PATCH', { primaryColor: null, secondaryColor: null }),
        { params: mockParams }
      );

      expect(response.status).toBe(200);
    });

    it('validates isActive is a boolean', async () => {
      const response = await PATCH(createRequest('PATCH', { isActive: 'true' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.isActive).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(updateTeam).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(createRequest('PATCH', { name: 'New Name' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('DELETE /api/admin/teams/[teamId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockCommissionerSession);
    vi.mocked(getTeamByIdAdmin).mockResolvedValue(mockTeam);
    vi.mocked(getTeamRosterCount).mockResolvedValue(0);
    vi.mocked(deleteTeam).mockResolvedValue(undefined);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for admin users (not commissioner)', async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Commissioner');
    });

    it('returns 403 for player users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows commissioner users', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });
  });

  describe('Successful Deletion', () => {
    it('deletes a team with no players', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
      expect(deleteTeam).toHaveBeenCalledWith('boston-bombers');
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamByIdAdmin).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('prevents deleting teams with active players', async () => {
      vi.mocked(getTeamRosterCount).mockResolvedValue(15);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('15 active player');
    });

    it('prevents deleting teams with 1 player', async () => {
      vi.mocked(getTeamRosterCount).mockResolvedValue(1);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('1 active player');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(deleteTeam).mockRejectedValue(new Error('Database error'));

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
