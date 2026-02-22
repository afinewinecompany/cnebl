/**
 * Admin Game Cancel API Route Tests
 * Tests for POST /api/admin/games/[gameId]/cancel
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
  return new NextRequest(new URL('http://localhost:3000/api/admin/games/game-1/cancel'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/admin/games/[gameId]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAdminGameById).mockResolvedValue(mockScheduledGame);
    vi.mocked(updateGame).mockResolvedValue({ ...mockScheduledGame, status: 'cancelled' });
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

  describe('Cancelling Games', () => {
    it('cancels a scheduled game', async () => {
      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.action).toBe('cancelled');
      expect(body.data.message).toContain('cancelled');
      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        status: 'cancelled',
      }));
    });

    it('cancels a postponed game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'postponed' });

      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('cancels a warmup game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'warmup' });

      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('cancels a suspended game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'suspended' });

      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('includes reason in notes', async () => {
      await POST(createRequest({ reason: 'Field unavailable' }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        notes: expect.stringContaining('Field unavailable'),
      }));
    });

    it('handles empty request body', async () => {
      const response = await POST(createRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('appends to existing notes', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({
        ...mockScheduledGame,
        notes: 'Previous note',
      });

      await POST(createRequest({ reason: 'New reason' }), { params: mockParams });

      expect(updateGame).toHaveBeenCalledWith('game-1', expect.objectContaining({
        notes: expect.stringContaining('Previous note'),
      }));
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

    it('cannot cancel a completed game', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'final' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('completed');
    });

    it('cannot cancel a game in progress', async () => {
      vi.mocked(getAdminGameById).mockResolvedValue({ ...mockScheduledGame, status: 'in_progress' });

      const response = await POST(createRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('suspend');
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
