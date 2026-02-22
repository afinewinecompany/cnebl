/**
 * Message Pin API Route Tests
 * Tests for PATCH /api/teams/[teamId]/messages/[messageId]/pin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getTeamById: vi.fn(),
  getMessageTeamId: vi.fn(),
  toggleMessagePin: vi.fn(),
  isTeamMember: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  getTeamById,
  getMessageTeamId,
  toggleMessagePin,
  isTeamMember,
} from '@/lib/db/queries';

// Test data
const mockPlayerSession = {
  user: { id: 'user-1', email: 'player@example.com', role: 'player', teamId: 'team-1' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockManagerSession = {
  user: { id: 'manager-1', email: 'manager@example.com', role: 'manager', teamId: 'team-1' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockCommissionerSession = {
  user: { id: 'commissioner-1', email: 'commissioner@example.com', role: 'commissioner' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockTeam = {
  id: 'team-1',
  name: 'Boston Bombers',
};

const mockMessage = {
  id: 'msg-1',
  teamId: 'team-1',
  authorId: 'user-1',
  content: 'Hello team!',
  isPinned: false,
  createdAt: '2026-02-20T10:00:00.000Z',
};

const mockParams = Promise.resolve({ teamId: 'team-1', messageId: 'msg-1' });

function createRequest(body: unknown): NextRequest {
  return new NextRequest(
    new URL('http://localhost:3000/api/teams/team-1/messages/msg-1/pin'),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

describe('PATCH /api/teams/[teamId]/messages/[messageId]/pin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockManagerSession);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(getMessageTeamId).mockResolvedValue('team-1');
    vi.mocked(toggleMessagePin).mockResolvedValue({ ...mockMessage, isPinned: true });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(isTeamMember).mockResolvedValue(false);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('member');
    });

    it('returns 403 for regular players (cannot pin)', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.message).toContain('managers');
    });

    it('allows managers to pin messages', async () => {
      vi.mocked(auth).mockResolvedValue(mockManagerSession);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('allows admins to pin messages', async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('allows commissioners to pin messages', async () => {
      vi.mocked(auth).mockResolvedValue(mockCommissionerSession);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Pin Operations', () => {
    it('pins a message', async () => {
      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isPinned).toBe(true);
      expect(toggleMessagePin).toHaveBeenCalledWith('msg-1', true);
    });

    it('unpins a message', async () => {
      vi.mocked(toggleMessagePin).mockResolvedValue({ ...mockMessage, isPinned: false });

      const response = await PATCH(createRequest({ isPinned: false }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.isPinned).toBe(false);
      expect(toggleMessagePin).toHaveBeenCalledWith('msg-1', false);
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent message', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue(null);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 when message belongs to different team', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue('team-2');

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 422 for missing isPinned', async () => {
      const response = await PATCH(createRequest({}), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.isPinned).toBeDefined();
    });

    it('returns 422 for non-boolean isPinned', async () => {
      const response = await PATCH(createRequest({ isPinned: 'true' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.isPinned).toBeDefined();
    });

    it('returns 422 for invalid JSON', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/teams/team-1/messages/msg-1/pin'),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: 'not valid json',
        }
      );

      const response = await PATCH(request, { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(toggleMessagePin).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('returns 500 when toggleMessagePin returns null', async () => {
      vi.mocked(toggleMessagePin).mockResolvedValue(null);

      const response = await PATCH(createRequest({ isPinned: true }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
