/**
 * Team Messages API Route Tests
 * Tests for GET and POST /api/teams/[teamId]/messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

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
  getTeamMessages: vi.fn(),
  createMessage: vi.fn(),
  isTeamMember: vi.fn(),
  isTeamManagerOrAdmin: vi.fn(),
}));

// Mock channel permissions
vi.mock('@/lib/constants/channels', () => ({
  canUserPostToChannel: vi.fn(() => true),
  canUserViewTeamMessages: vi.fn(() => true),
}));

import { auth } from '@/lib/auth';
import { validateCSRF } from '@/lib/api/csrf';
import {
  getTeamById,
  getTeamMessages,
  createMessage,
  isTeamMember,
  isTeamManagerOrAdmin,
} from '@/lib/db/queries';
import { canUserPostToChannel, canUserViewTeamMessages } from '@/lib/constants/channels';

// Test data
const mockPlayerSession = {
  user: { id: 'user-1', email: 'player@example.com', role: 'player', teamId: 'team-1' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockManagerSession = {
  user: { id: 'user-2', email: 'manager@example.com', role: 'manager', teamId: 'team-1' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockAdminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockTeam = {
  id: 'team-1',
  name: 'Boston Bombers',
  abbreviation: 'BOS',
};

const mockMessages = [
  {
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
  },
  {
    id: 'msg-2',
    teamId: 'team-1',
    authorId: 'user-2',
    content: 'Practice at 5pm!',
    channel: 'general',
    isPinned: true,
    isEdited: false,
    isDeleted: false,
    createdAt: '2026-02-20T09:00:00.000Z',
    author: { id: 'user-2', fullName: 'Jane Manager', avatarUrl: null },
  },
];

const mockParams = Promise.resolve({ teamId: 'team-1' });

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/teams/team-1/messages');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: 'GET' });
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/teams/team-1/messages'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/teams/[teamId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockPlayerSession);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(isTeamManagerOrAdmin).mockResolvedValue(false);
    vi.mocked(canUserViewTeamMessages).mockReturnValue(true);
    vi.mocked(getTeamMessages).mockResolvedValue({
      messages: mockMessages,
      cursor: { next: 'msg-3', previous: null },
      hasMore: true,
      totalPinned: 1,
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createGetRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(canUserViewTeamMessages).mockReturnValue(false);

      const response = await GET(createGetRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('member');
    });

    it('allows team members', async () => {
      const response = await GET(createGetRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });

    it('allows admins to view any team messages', async () => {
      vi.mocked(auth).mockResolvedValue(mockAdminSession);
      vi.mocked(isTeamMember).mockResolvedValue(false);
      vi.mocked(canUserViewTeamMessages).mockReturnValue(true);

      const response = await GET(createGetRequest(), { params: mockParams });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful Responses', () => {
    it('returns messages with pagination', async () => {
      const response = await GET(createGetRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.messages).toEqual(mockMessages);
      expect(body.data.hasMore).toBe(true);
      expect(body.data.totalPinned).toBe(1);
    });

    it('passes cursor parameter', async () => {
      await GET(createGetRequest({ cursor: 'msg-5' }), { params: mockParams });

      expect(getTeamMessages).toHaveBeenCalledWith(
        'team-1',
        expect.objectContaining({ cursor: 'msg-5' })
      );
    });

    it('passes limit parameter', async () => {
      await GET(createGetRequest({ limit: '20' }), { params: mockParams });

      expect(getTeamMessages).toHaveBeenCalledWith(
        'team-1',
        expect.objectContaining({ limit: 20 })
      );
    });

    it('passes direction parameter', async () => {
      await GET(createGetRequest({ direction: 'newer' }), { params: mockParams });

      expect(getTeamMessages).toHaveBeenCalledWith(
        'team-1',
        expect.objectContaining({ direction: 'newer' })
      );
    });

    it('passes pinnedOnly parameter', async () => {
      await GET(createGetRequest({ pinnedOnly: 'true' }), { params: mockParams });

      expect(getTeamMessages).toHaveBeenCalledWith(
        'team-1',
        expect.objectContaining({ pinnedOnly: true })
      );
    });

    it('passes channel parameter', async () => {
      await GET(createGetRequest({ channel: 'important' }), { params: mockParams });

      expect(getTeamMessages).toHaveBeenCalledWith(
        'team-1',
        expect.objectContaining({ channel: 'important' })
      );
    });
  });

  describe('Team Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await GET(createGetRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getTeamMessages).mockRejectedValue(new Error('Database error'));

      const response = await GET(createGetRequest(), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('POST /api/teams/[teamId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockPlayerSession);
    vi.mocked(validateCSRF).mockResolvedValue(true);
    vi.mocked(getTeamById).mockResolvedValue(mockTeam);
    vi.mocked(isTeamMember).mockResolvedValue(true);
    vi.mocked(isTeamManagerOrAdmin).mockResolvedValue(false);
    vi.mocked(canUserPostToChannel).mockReturnValue(true);
    vi.mocked(createMessage).mockResolvedValue({
      id: 'msg-new',
      teamId: 'team-1',
      authorId: 'user-1',
      content: 'New message',
      channel: 'general',
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      author: { id: 'user-1', fullName: 'John Player', avatarUrl: null },
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 403 for invalid CSRF', async () => {
      vi.mocked(validateCSRF).mockResolvedValue(false);

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('CSRF_ERROR');
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-team members', async () => {
      vi.mocked(isTeamMember).mockResolvedValue(false);
      vi.mocked(isTeamManagerOrAdmin).mockResolvedValue(false);

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('returns 403 when user cannot post to channel', async () => {
      vi.mocked(canUserPostToChannel).mockReturnValue(false);

      const response = await POST(
        createPostRequest({ content: 'Hello', channel: 'important' }),
        { params: mockParams }
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.message).toContain('Important');
    });

    it('allows team members to post', async () => {
      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });

      expect(response.status).toBe(201);
    });

    it('allows managers to post', async () => {
      vi.mocked(auth).mockResolvedValue(mockManagerSession);
      vi.mocked(isTeamManagerOrAdmin).mockResolvedValue(true);

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });

      expect(response.status).toBe(201);
    });
  });

  describe('Message Creation', () => {
    it('creates a message with valid content', async () => {
      const response = await POST(
        createPostRequest({ content: 'Hello team!' }),
        { params: mockParams }
      );
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('msg-new');
    });

    it('passes content to createMessage', async () => {
      await POST(createPostRequest({ content: 'Test message' }), { params: mockParams });

      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-1',
          authorId: 'user-1',
          content: 'Test message',
        })
      );
    });

    it('handles replyToId', async () => {
      await POST(
        createPostRequest({ content: 'Reply', replyToId: 'msg-1' }),
        { params: mockParams }
      );

      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          replyToId: 'msg-1',
        })
      );
    });

    it('handles channel parameter', async () => {
      await POST(
        createPostRequest({ content: 'Important', channel: 'important' }),
        { params: mockParams }
      );

      expect(createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'important',
        })
      );
    });
  });

  describe('Validation', () => {
    it('returns 404 for non-existent team', async () => {
      vi.mocked(getTeamById).mockResolvedValue(null);

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it('returns 422 for invalid JSON', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/teams/team-1/messages'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not valid json',
        }
      );

      const response = await POST(request, { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.body).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(createMessage).mockRejectedValue(new Error('Database error'));

      const response = await POST(createPostRequest({ content: 'Hello' }), { params: mockParams });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
