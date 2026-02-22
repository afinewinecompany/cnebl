/**
 * Individual Message API Route Tests
 * Tests for GET, PATCH, DELETE /api/teams/[teamId]/messages/[messageId]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock CSRF
vi.mock('@/lib/api/csrf', () => ({
  validateCSRF: vi.fn(() => Promise.resolve(true)),
  csrfErrorResponse: vi.fn(() => {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      { success: false, error: { code: 'CSRF_ERROR', message: 'Invalid CSRF token' } },
      { status: 403 }
    );
  }),
}));

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getTeamById: vi.fn(),
  getMessageById: vi.fn(),
  getMessageAuthorId: vi.fn(),
  getMessageTeamId: vi.fn(),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn(),
  isTeamMember: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { validateCSRF } from '@/lib/api/csrf';
import {
  getTeamById,
  getMessageById,
  getMessageAuthorId,
  getMessageTeamId,
  updateMessage,
  deleteMessage,
  isTeamMember,
} from '@/lib/db/queries';

// Test data
const mockPlayerSession = {
  user: { id: 'user-1', email: 'player@example.com', role: 'player', teamId: 'team-1' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockOtherPlayerSession = {
  user: { id: 'user-2', email: 'other@example.com', role: 'player', teamId: 'team-1' },
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

const mockTeam = {
  id: 'team-1',
  name: 'Boston Bombers',
};

const mockMessage = {
  id: 'msg-1',
  teamId: 'team-1',
  authorId: 'user-1',
  content: 'Hello team!',
  channel: 'general',
  isPinned: false,
  isEdited: false,
  isDeleted: false,
  createdAt: '2026-02-20T10:00:00.000Z',
  author: { id: 'user-1', fullName: 'John Player', avatarUrl: null },
};

const mockParams = Promise.resolve({ teamId: 'team-1', messageId: 'msg-1' });

function createRequest(method: string, body?: unknown): NextRequest {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return new NextRequest(
    new URL('http://localhost:3000/api/teams/team-1/messages/msg-1'),
    options
  );
}

describe('GET /api/teams/[teamId]/messages/[messageId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockPlayerSession);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(getMessageById).mockResolvedValue(mockMessage);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(isTeamMember).mockResolvedValue(false);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows team members', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Responses', () => {
    it('returns message details', async () => {
      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockMessage);
    });

    it('returns 404 for non-existent message', async () => {
      vi.mocked(getMessageById).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 when message belongs to different team', async () => {
      vi.mocked(getMessageById).mockResolvedValue({ ...mockMessage, teamId: 'team-2' });

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe('Team Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getMessageById).mockRejectedValue(new Error('Database error'));

      const response = await GET(createRequest('GET'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('PATCH /api/teams/[teamId]/messages/[messageId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockPlayerSession);
    vi.mocked(validateCSRF).mockResolvedValue(true);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(getMessageTeamId).mockResolvedValue('team-1');
    vi.mocked(getMessageAuthorId).mockResolvedValue('user-1');
    vi.mocked(updateMessage).mockResolvedValue({
      ...mockMessage,
      content: 'Updated content',
      isEdited: true,
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 403 for invalid CSRF', async () => {
      vi.mocked(validateCSRF).mockResolvedValue(false);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('CSRF_ERROR');
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(isTeamMember).mockResolvedValue(false);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('returns 403 when not the author', async () => {
      vi.mocked(getMessageAuthorId).mockResolvedValue('other-user');

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.message).toContain('own messages');
    });

    it('allows author to edit their message', async () => {
      const response = await PATCH(createRequest('PATCH', { content: 'Updated content' }), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Updates', () => {
    it('updates message content', async () => {
      const response = await PATCH(createRequest('PATCH', { content: 'Updated content' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.content).toBe('Updated content');
      expect(body.data.isEdited).toBe(true);
    });

    it('calls updateMessage with correct parameters', async () => {
      await PATCH(createRequest('PATCH', { content: 'New content' }), { params: mockParams });

      expect(updateMessage).toHaveBeenCalledWith('msg-1', 'New content');
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent message', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 when message belongs to different team', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue('team-2');

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 422 for missing content', async () => {
      const response = await PATCH(createRequest('PATCH', {}), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.content).toBeDefined();
    });

    it('returns 422 for empty content', async () => {
      const response = await PATCH(createRequest('PATCH', { content: '' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.content).toBeDefined();
    });

    it('returns 422 for whitespace-only content', async () => {
      const response = await PATCH(createRequest('PATCH', { content: '   ' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.content).toBeDefined();
    });

    it('returns 422 for content over 2000 characters', async () => {
      const response = await PATCH(createRequest('PATCH', { content: 'A'.repeat(2001) }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.content).toBeDefined();
    });

    it('returns 422 for invalid JSON', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/teams/team-1/messages/msg-1'),
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
      vi.mocked(updateMessage).mockRejectedValue(new Error('Database error'));

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('returns 500 when update returns null', async () => {
      vi.mocked(updateMessage).mockResolvedValue(null);

      const response = await PATCH(createRequest('PATCH', { content: 'Updated' }), {
        params: mockParams,
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('DELETE /api/teams/[teamId]/messages/[messageId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockPlayerSession);
    vi.mocked(validateCSRF).mockResolvedValue(true);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(getMessageTeamId).mockResolvedValue('team-1');
    vi.mocked(getMessageAuthorId).mockResolvedValue('user-1');
    vi.mocked(deleteMessage).mockResolvedValue(true);
  });

  describe('Authentication & Authorization', () => {
    it('returns 403 for invalid CSRF', async () => {
      vi.mocked(validateCSRF).mockResolvedValue(false);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('CSRF_ERROR');
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(isTeamMember).mockResolvedValue(false);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('returns 403 when not the author (for regular players)', async () => {
      vi.mocked(auth).mockResolvedValue(mockOtherPlayerSession);
      vi.mocked(getMessageAuthorId).mockResolvedValue('user-1');

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.message).toContain('own messages');
    });

    it('allows author to delete their message', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });

    it('allows manager to delete any message in their team', async () => {
      vi.mocked(auth).mockResolvedValue(mockManagerSession);
      vi.mocked(getMessageAuthorId).mockResolvedValue('other-user');

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });

    it('allows admin to delete any message', async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession);
      vi.mocked(getMessageAuthorId).mockResolvedValue('other-user');

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
    });
  });

  describe('Successful Deletion', () => {
    it('deletes the message', async () => {
      const response = await DELETE(createRequest('DELETE'), { params: mockParams });

      expect(response.status).toBe(204);
      expect(deleteMessage).toHaveBeenCalledWith('msg-1');
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 for non-existent message', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue(null);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 404 when message belongs to different team', async () => {
      vi.mocked(getMessageTeamId).mockResolvedValue('team-2');

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(deleteMessage).mockRejectedValue(new Error('Database error'));

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('returns 500 when delete returns false', async () => {
      vi.mocked(deleteMessage).mockResolvedValue(false);

      const response = await DELETE(createRequest('DELETE'), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
