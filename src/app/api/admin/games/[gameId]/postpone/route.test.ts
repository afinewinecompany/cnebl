/**
 * Admin Game Postpone API Route Tests
 * Tests for POST /api/admin/games/[gameId]/postpone
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-games', () => ({
  getAdminGameById: vi.fn(),
  updateGame: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getAdminGameById, updateGame } from '@/lib/db/queries/admin-games';

// Test data
const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockPlayerSession = {
  user: { id: 'player-1', email: 'player@example.com', role: 'player' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockScheduledGame = {
  id: 'game-1',
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  gameDate: '2026-04-15',
  gameTime: '18:00:00',
  status: 'scheduled',
  notes: null,
};

const mockParams = Promise.resolve({ gameId: 'game-1' });

function createRequest(body?: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/games/game-1/postpone'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/admin/games/[gameId]/postpone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAdminGameById).mockResolvedValue(mockScheduledGame);
    vi.mocked(updateGame).mockResolvedValue({ ...mockScheduledGame, status: 'postponed' });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Postponing Games', () => {
    it('postpones a scheduled game', async () => {
      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.action).toBe('postponed');
      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        status: 'postponed',
      }));
    });

    it('postpones a warmup game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'warmup' });

      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('postpones a suspended game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'suspended' });

      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('includes reason in notes', async () => {
      await POST(createRequest({ reason: 'Weather delay' }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        notes: expect.stringContaining('Weather delay'),
      }));
    });

    it('handles empty request body', async () => {
      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });
  });

  describe('Rescheduling', () => {
    it('reschedules with new date', async () => {
      vi.mocked(updateGame).mockResolvedValue({ ...mockScheduledGame, status: 'scheduled', gameDate: '2026-05-01' });

      const response = await POST(createRequest({
        rescheduleDate: '2026-05-01',
      }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.action).toBe('rescheduled');
      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        status: 'scheduled',
        gameDate: '2026-05-01',
      }));
    });

    it('reschedules with new date and time', async () => {
      await POST(createRequest({
        rescheduleDate: '2026-05-01',
        rescheduleTime: '19:00',
      }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        gameDate: '2026-05-01',
        gameTime: '19:00:00',
      }));
    });

    it('includes reschedule info in message', async () => {
      vi.mocked(updateGame).mockResolvedValue({ ...mockScheduledGame, status: 'scheduled' });

      const response = await POST(createRequest({
        rescheduleDate: '2026-05-01',
      }), { params: mockParams });
      const body = await response.json();

      expect(body.data.message).toContain('2026-05-01');
    });
  });

  describe('Status Validation', () => {
    it('returns 404 for non-existent game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue(null);

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('cannot postpone a game in progress', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'in_progress' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('in_progress');
    });

    it('cannot postpone a final game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'final' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('cannot postpone a cancelled game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'cancelled' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('cannot postpone an already postponed game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'postponed' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(updateGame).mockRejectedValue(new Error('Database error'));

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
