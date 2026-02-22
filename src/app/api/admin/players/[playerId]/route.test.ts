/**
 * Admin Single Player API Route Tests
 * Tests for GET, PATCH, DELETE /api/admin/players/[playerId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-users', () => ({
  getPlayerById: vi.fn(),
  updatePlayerAssignment: vi.fn(),
  removePlayerFromTeam: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  getPlayerById,
  updatePlayerAssignment,
  removePlayerFromTeam,
} from '@/lib/db/queries/admin-users';

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

const mockPlayer = {
  id: 'player-123',
  userId: 'user-123',
  teamId: 'team-1',
  seasonId: 'season-2026',
  jerseyNumber: '42',
  primaryPosition: 'SS',
  secondaryPosition: '2B',
  bats: 'R',
  throws: 'R',
  isActive: true,
  isCaptain: false,
  joinedAt: '2026-01-15T00:00:00.000Z',
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
  user: {
    id: 'user-123',
    fullName: 'John Player',
    email: 'john@example.com',
    avatarUrl: null,
    role: 'player',
  },
  team: {
    id: 'team-1',
    name: 'Boston Bombers',
    abbreviation: 'BOS',
    primaryColor: '#1a365d',
  },
};

const mockParams = Promise.resolve({ playerId: 'player-123' });

function createRequest(method: string, body?: unknown): NextRequest {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new NextRequest(
    new URL('http://localhost:3000/api/admin/players/player-123'),
    options
  );
}

function createInvalidJsonRequest(): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/players/player-123'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: 'not valid json',
  });
}

describe('GET /api/admin/players/[playerId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getPlayerById).mockResolvedValue(mockPlayer);
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
    it('returns player details with user and team info', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockPlayer);
      expect(body.data.user).toBeDefined();
      expect(body.data.team).toBeDefined();
    });

    it('returns 404 for non-existent player', async () => {
      vi.mocked(getPlayerById).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Player');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getPlayerById).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('PATCH /api/admin/players/[playerId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(updatePlayerAssignment).mockResolvedValue({
      ...mockPlayer,
      jerseyNumber: '99',
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Successful Updates', () => {
    it('updates jersey number', async () => {
      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ jerseyNumber: '99' })
      );
    });

    it('updates primary position', async () => {
      await PATCH(createRequest('PATCH', { primaryPosition: 'CF' }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ primaryPosition: 'CF' })
      );
    });

    it('updates secondary position', async () => {
      await PATCH(createRequest('PATCH', { secondaryPosition: 'LF' }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ secondaryPosition: 'LF' })
      );
    });

    it('clears secondary position with null', async () => {
      await PATCH(createRequest('PATCH', { secondaryPosition: null }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ secondaryPosition: null })
      );
    });

    it('updates batting side', async () => {
      await PATCH(createRequest('PATCH', { bats: 'L' }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ bats: 'L' })
      );
    });

    it('updates throwing arm', async () => {
      await PATCH(createRequest('PATCH', { throws: 'L' }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ throws: 'L' })
      );
    });

    it('updates captain status', async () => {
      await PATCH(createRequest('PATCH', { isCaptain: true }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ isCaptain: true })
      );
    });

    it('updates active status', async () => {
      await PATCH(createRequest('PATCH', { isActive: false }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ isActive: false })
      );
    });

    it('transfers player to different team', async () => {
      await PATCH(createRequest('PATCH', { teamId: 'team-2' }), { params: mockParams });

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({ teamId: 'team-2' })
      );
    });

    it('updates multiple fields at once', async () => {
      await PATCH(
        createRequest('PATCH', {
          jerseyNumber: '1',
          primaryPosition: 'P',
          isCaptain: true,
        }),
        { params: mockParams }
      );

      expect(updatePlayerAssignment).toHaveBeenCalledWith(
        'player-123',
        expect.objectContaining({
          jerseyNumber: '1',
          primaryPosition: 'P',
          isCaptain: true,
        })
      );
    });
  });

  describe('Validation', () => {
    it('returns 400 for invalid JSON', async () => {
      const response = await PATCH(createInvalidJsonRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('Invalid JSON');
    });

    it('returns 400 when no valid update fields provided', async () => {
      const response = await PATCH(createRequest('PATCH', { invalidField: 'value' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toContain('No valid update fields');
    });

    it('validates jerseyNumber min length', async () => {
      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.jerseyNumber).toBeDefined();
    });

    it('validates jerseyNumber max length', async () => {
      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '1234' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.jerseyNumber).toBeDefined();
    });

    it('validates primaryPosition enum', async () => {
      const response = await PATCH(createRequest('PATCH', { primaryPosition: 'INVALID' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.primaryPosition).toBeDefined();
    });

    it('validates secondaryPosition enum', async () => {
      const response = await PATCH(createRequest('PATCH', { secondaryPosition: 'INVALID' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.secondaryPosition).toBeDefined();
    });

    it('validates bats enum', async () => {
      const response = await PATCH(createRequest('PATCH', { bats: 'INVALID' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.bats).toBeDefined();
    });

    it('validates throws enum', async () => {
      const response = await PATCH(createRequest('PATCH', { throws: 'INVALID' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.throws).toBeDefined();
    });

    it('validates isCaptain is boolean', async () => {
      const response = await PATCH(createRequest('PATCH', { isCaptain: 'true' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.isCaptain).toBeDefined();
    });

    it('validates isActive is boolean', async () => {
      const response = await PATCH(createRequest('PATCH', { isActive: 'false' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.isActive).toBeDefined();
    });

    it('accepts all valid positions', async () => {
      const validPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'];

      for (const position of validPositions) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(updatePlayerAssignment).mockResolvedValue(mockPlayer);

        const response = await PATCH(createRequest('PATCH', { primaryPosition: position }), {
          params: mockParams,
        });

        expect(response.status).toBe(200);
      }
    });

    it('accepts all valid batting sides', async () => {
      for (const bats of ['L', 'R', 'S']) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(updatePlayerAssignment).mockResolvedValue(mockPlayer);

        const response = await PATCH(createRequest('PATCH', { bats }), { params: mockParams });

        expect(response.status).toBe(200);
      }
    });

    it('accepts all valid throwing arms', async () => {
      for (const throws_ of ['L', 'R']) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(updatePlayerAssignment).mockResolvedValue(mockPlayer);

        const response = await PATCH(createRequest('PATCH', { throws: throws_ }), {
          params: mockParams,
        });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('returns 404 when player not found', async () => {
      vi.mocked(updatePlayerAssignment).mockRejectedValue(new Error('Player not found'));

      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when jersey number is taken', async () => {
      vi.mocked(updatePlayerAssignment).mockRejectedValue(
        new Error('Jersey number 99 is already taken on this team')
      );

      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('already taken');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected database error', async () => {
      vi.mocked(updatePlayerAssignment).mockRejectedValue(new Error('Connection failed'));

      const response = await PATCH(createRequest('PATCH', { jerseyNumber: '99' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('DELETE /api/admin/players/[playerId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(removePlayerFromTeam).mockResolvedValue(undefined);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows admin users', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });

    it('allows commissioner users', async () => {
      vi.mocked(auth).mockResolvedValue(mockCommissionerSession);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });
  });

  describe('Successful Deletion', () => {
    it('removes player from team', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
      expect(removePlayerFromTeam).toHaveBeenCalledWith('player-123');
    });
  });

  describe('Business Logic Errors', () => {
    it('returns 404 when player not found', async () => {
      vi.mocked(removePlayerFromTeam).mockRejectedValue(new Error('Player not found'));

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 400 when player already removed', async () => {
      vi.mocked(removePlayerFromTeam).mockImplementation(() => {
        throw new Error('Player already removed from team');
      });

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('already removed');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected database error', async () => {
      vi.mocked(removePlayerFromTeam).mockRejectedValue(new Error('Connection failed'));

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
