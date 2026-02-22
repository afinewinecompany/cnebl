/**
 * Admin Players API Route Tests
 * Tests for POST /api/admin/players
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-users', () => ({
  assignPlayerToTeam: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { assignPlayerToTeam } from '@/lib/db/queries/admin-users';

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

const validPlayerData = {
  userId: 'user-123',
  teamId: 'team-1',
  jerseyNumber: '42',
  primaryPosition: 'SS',
  bats: 'R',
  throws: 'R',
};

const mockCreatedPlayer = {
  id: 'player-123',
  userId: 'user-123',
  teamId: 'team-1',
  seasonId: 'season-2026',
  jerseyNumber: '42',
  primaryPosition: 'SS',
  secondaryPosition: null,
  bats: 'R',
  throws: 'R',
  isActive: true,
  isCaptain: false,
  joinedAt: '2026-02-20T00:00:00.000Z',
  createdAt: '2026-02-20T00:00:00.000Z',
  updatedAt: '2026-02-20T00:00:00.000Z',
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

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/players'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest(): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/players'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not valid json',
  });
}

describe('POST /api/admin/players', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(assignPlayerToTeam).mockResolvedValue(mockCreatedPlayer);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows admin users', async () => {
      const response = await POST(createPostRequest(validPlayerData));

      expect(response.status).toBe(201);
    });

    it('allows commissioner users', async () => {
      vi.mocked(auth).mockResolvedValue(mockCommissionerSession);

      const response = await POST(createPostRequest(validPlayerData));

      expect(response.status).toBe(201);
    });
  });

  describe('Player Assignment', () => {
    it('creates a player assignment with valid data', async () => {
      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockCreatedPlayer);
    });

    it('passes all required fields to assignPlayerToTeam', async () => {
      await POST(createPostRequest(validPlayerData));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          teamId: 'team-1',
          jerseyNumber: '42',
          primaryPosition: 'SS',
          bats: 'R',
          throws: 'R',
        })
      );
    });

    it('handles optional secondaryPosition', async () => {
      await POST(createPostRequest({
        ...validPlayerData,
        secondaryPosition: '2B',
      }));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          secondaryPosition: '2B',
        })
      );
    });

    it('handles null secondaryPosition', async () => {
      await POST(createPostRequest({
        ...validPlayerData,
        secondaryPosition: null,
      }));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          secondaryPosition: null,
        })
      );
    });

    it('handles isCaptain flag', async () => {
      await POST(createPostRequest({
        ...validPlayerData,
        isCaptain: true,
      }));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          isCaptain: true,
        })
      );
    });

    it('defaults isCaptain to false', async () => {
      await POST(createPostRequest(validPlayerData));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          isCaptain: false,
        })
      );
    });

    it('handles custom seasonId', async () => {
      await POST(createPostRequest({
        ...validPlayerData,
        seasonId: 'season-2027',
      }));

      expect(assignPlayerToTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonId: 'season-2027',
        })
      );
    });
  });

  describe('Required Field Validation', () => {
    it('validates required userId', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        userId: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.userId).toBeDefined();
    });

    it('validates required teamId', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        teamId: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.teamId).toBeDefined();
    });

    it('validates required jerseyNumber', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        jerseyNumber: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.jerseyNumber).toBeDefined();
    });

    it('validates required primaryPosition', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        primaryPosition: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.primaryPosition).toBeDefined();
    });

    it('validates required bats', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        bats: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.bats).toBeDefined();
    });

    it('validates required throws', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        throws: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.throws).toBeDefined();
    });
  });

  describe('Jersey Number Validation', () => {
    it('validates jerseyNumber min length', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        jerseyNumber: '',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.jerseyNumber).toBeDefined();
    });

    it('validates jerseyNumber max length', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        jerseyNumber: '1234',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.jerseyNumber).toBeDefined();
    });

    it('accepts valid 1-3 character jersey numbers', async () => {
      for (const jerseyNumber of ['1', '42', '999']) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(assignPlayerToTeam).mockResolvedValue(mockCreatedPlayer);

        const response = await POST(createPostRequest({
          ...validPlayerData,
          jerseyNumber,
        }));

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Position Validation', () => {
    const validPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'];

    it('validates primaryPosition is a valid position', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        primaryPosition: 'INVALID',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.primaryPosition).toBeDefined();
    });

    it('accepts all valid primary positions', async () => {
      for (const position of validPositions) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(assignPlayerToTeam).mockResolvedValue(mockCreatedPlayer);

        const response = await POST(createPostRequest({
          ...validPlayerData,
          primaryPosition: position,
        }));

        expect(response.status).toBe(201);
      }
    });

    it('validates secondaryPosition when provided', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        secondaryPosition: 'INVALID',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.secondaryPosition).toBeDefined();
    });

    it('accepts all valid secondary positions', async () => {
      for (const position of validPositions) {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockAdminSession);
        vi.mocked(assignPlayerToTeam).mockResolvedValue(mockCreatedPlayer);

        const response = await POST(createPostRequest({
          ...validPlayerData,
          secondaryPosition: position,
        }));

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Batting Side Validation', () => {
    it('validates bats is a valid value', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        bats: 'INVALID',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.bats).toBeDefined();
    });

    it('accepts L (left-handed)', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        bats: 'L',
      }));

      expect(response.status).toBe(201);
    });

    it('accepts R (right-handed)', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        bats: 'R',
      }));

      expect(response.status).toBe(201);
    });

    it('accepts S (switch-hitter)', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        bats: 'S',
      }));

      expect(response.status).toBe(201);
    });
  });

  describe('Throwing Arm Validation', () => {
    it('validates throws is a valid value', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        throws: 'INVALID',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.throws).toBeDefined();
    });

    it('accepts L (left-handed)', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        throws: 'L',
      }));

      expect(response.status).toBe(201);
    });

    it('accepts R (right-handed)', async () => {
      const response = await POST(createPostRequest({
        ...validPlayerData,
        throws: 'R',
      }));

      expect(response.status).toBe(201);
    });
  });

  describe('Business Logic Errors', () => {
    it('returns 400 when user is already assigned', async () => {
      vi.mocked(assignPlayerToTeam).mockRejectedValue(
        new Error('User is already assigned to a team')
      );

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('already assigned');
    });

    it('returns 400 when jersey number is taken', async () => {
      vi.mocked(assignPlayerToTeam).mockRejectedValue(
        new Error('Jersey number 42 is already taken on this team')
      );

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('already taken');
    });

    it('returns 400 when user not found', async () => {
      vi.mocked(assignPlayerToTeam).mockRejectedValue(
        new Error('User not found')
      );

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('not found');
    });

    it('returns 400 when team not found', async () => {
      vi.mocked(assignPlayerToTeam).mockRejectedValue(
        new Error('Team not found')
      );

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('returns 400 for invalid JSON', async () => {
      const response = await POST(createInvalidJsonRequest());
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Invalid JSON');
    });

    it('returns 500 on unexpected database error', async () => {
      vi.mocked(assignPlayerToTeam).mockRejectedValue(new Error('Connection failed'));

      const response = await POST(createPostRequest(validPlayerData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
