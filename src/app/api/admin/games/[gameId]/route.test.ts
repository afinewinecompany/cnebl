/**
 * Admin Single Game API Route Tests
 * Tests for GET, PATCH, DELETE /api/admin/games/[gameId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-games', () => ({
  getAdminGameById: vi.fn(),
  updateGame: vi.fn(),
  deleteGame: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getAdminGameById, updateGame, deleteGame } from '@/lib/db/queries/admin-games';

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

const mockGame = {
  id: 'game-1',
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  gameDate: '2026-04-15',
  gameTime: '18:00:00',
  timezone: 'America/New_York',
  status: 'scheduled',
  homeScore: null,
  awayScore: null,
  locationName: 'Veterans Field',
  notes: null,
};

const mockParams = Promise.resolve({ gameId: 'game-1' });

function createRequest(method: string, body?: unknown): NextRequest {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new NextRequest(new URL('http://localhost:3000/api/admin/games/game-1'), options);
}

describe('GET /api/admin/games/[gameId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAdminGameById).mockResolvedValue(mockGame);
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
  });

  describe('Successful Responses', () => {
    it('returns game details', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockGame);
    });

    it('returns 404 for non-existent game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Game');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getAdminGameById).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('PATCH /api/admin/games/[gameId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAdminGameById).mockResolvedValue(mockGame);
    vi.mocked(updateGame).mockResolvedValue({ ...mockGame, status: 'in_progress' });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { status: 'in_progress' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await PATCH(createRequest('PATCH', { status: 'in_progress' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Successful Updates', () => {
    it('updates game status', async () => {
      const response = await PATCH(createRequest('PATCH', { status: 'in_progress' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({ status: 'in_progress' }));
    });

    it('updates game scores', async () => {
      await PATCH(createRequest('PATCH', { homeScore: 5, awayScore: 3 }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        homeScore: 5,
        awayScore: 3,
      }));
    });

    it('updates game date and time', async () => {
      await PATCH(createRequest('PATCH', {
        gameDate: '2026-05-01',
        gameTime: '19:00',
      }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        gameDate: '2026-05-01',
        gameTime: '19:00:00',
      }));
    });

    it('updates location', async () => {
      await PATCH(createRequest('PATCH', {
        locationName: 'New Field',
        locationAddress: '456 New St',
      }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        locationName: 'New Field',
        locationAddress: '456 New St',
      }));
    });

    it('updates notes', async () => {
      await PATCH(createRequest('PATCH', { notes: 'Updated notes' }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        notes: 'Updated notes',
      }));
    });

    it('allows clearing optional fields with null/empty', async () => {
      await PATCH(createRequest('PATCH', {
        locationName: '',
        notes: '',
      }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        locationName: '',
        notes: '',
      }));
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { status: 'final' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('validates same teams cannot play each other', async () => {
      const response = await PATCH(createRequest('PATCH', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-1',
      }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.awayTeamId).toBeDefined();
    });

    it('validates homeScore is non-negative number', async () => {
      const response = await PATCH(createRequest('PATCH', { homeScore: -1 }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.homeScore).toBeDefined();
    });

    it('validates awayScore is non-negative number', async () => {
      const response = await PATCH(createRequest('PATCH', { awayScore: -1 }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.awayScore).toBeDefined();
    });

    it('validates status is a valid value', async () => {
      const response = await PATCH(createRequest('PATCH', { status: 'invalid_status' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.status).toBeDefined();
    });

    it('accepts all valid statuses', async () => {
      const validStatuses = ['scheduled', 'warmup', 'in_progress', 'final', 'postponed', 'cancelled', 'suspended'];

      for (const status of validStatuses) {
        vi.mocked(updateGame).mockResolvedValue({ ...mockGame, status });
        const response = await PATCH(createRequest('PATCH', { status }), { params: mockParams });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(updateGame).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(createRequest('PATCH', { status: 'final' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('DELETE /api/admin/games/[gameId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockCommissionerSession);
    vi.mocked(getAdminGameById).mockResolvedValue(mockGame);
    vi.mocked(deleteGame).mockResolvedValue(undefined);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-commissioner users', async () => {
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
    it('deletes a scheduled game', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
      expect(deleteGame).toHaveBeenCalledWith('game-1');
    });

    it('deletes a postponed game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockGame, status: 'postponed' });

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });

    it('deletes a cancelled game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockGame, status: 'cancelled' });

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('prevents deleting games in progress', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockGame, status: 'in_progress' });

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('in progress');
    });

    it('prevents deleting completed games', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockGame, status: 'final' });

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('completed');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(deleteGame).mockRejectedValue(new Error('Database error'));

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
