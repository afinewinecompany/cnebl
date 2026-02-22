/**
 * Admin Games API Route Tests
 * Tests for GET /api/admin/games and POST /api/admin/games
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/admin-games', () => ({
  getAdminGames: vi.fn(),
  createGame: vi.fn(),
  createGameSeries: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getAdminGames, createGame, createGameSeries } from '@/lib/db/queries/admin-games';

// Test data
const mockAdminSession = {
  user: {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockCommissionerSession = {
  user: {
    id: 'commissioner-1',
    email: 'commissioner@example.com',
    role: 'commissioner',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockPlayerSession = {
  user: {
    id: 'player-1',
    email: 'player@example.com',
    role: 'player',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const mockGames = [
  {
    id: 'game-1',
    homeTeamId: 'team-1',
    awayTeamId: 'team-2',
    gameDate: '2026-04-15',
    gameTime: '18:00:00',
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  },
  {
    id: 'game-2',
    homeTeamId: 'team-2',
    awayTeamId: 'team-1',
    gameDate: '2026-04-22',
    gameTime: '14:00:00',
    status: 'final',
    homeScore: 5,
    awayScore: 3,
  },
];

const validGameData = {
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  gameDate: '2026-04-15',
  gameTime: '18:00',
  timezone: 'America/New_York',
  locationName: 'Veterans Field',
};

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/games');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: 'GET' });
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/games'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/games', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAdminGames).mockResolvedValue({
      games: mockGames,
      totalCount: mockGames.length,
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
      vi.mocked(auth).mockResolvedValue(mockAdminSession);

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
    it('returns paginated games', async () => {
      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockGames);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.totalItems).toBe(mockGames.length);
    });

    it('passes pagination parameters to query', async () => {
      await GET(createGetRequest({ page: '2', pageSize: '10' }));

      expect(getAdminGames).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        })
      );
    });

    it('passes filter parameters to query', async () => {
      await GET(createGetRequest({
        seasonId: 'season-2026',
        teamId: 'team-1',
        status: 'scheduled',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      }));

      expect(getAdminGames).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonId: 'season-2026',
          teamId: 'team-1',
          status: 'scheduled',
          startDate: '2026-04-01',
          endDate: '2026-04-30',
        })
      );
    });

    it('handles comma-separated status values', async () => {
      await GET(createGetRequest({ status: 'scheduled,in_progress' }));

      expect(getAdminGames).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['scheduled', 'in_progress'],
        })
      );
    });

    it('passes sort parameters to query', async () => {
      await GET(createGetRequest({ sortBy: 'status', sortDir: 'desc' }));

      expect(getAdminGames).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'status',
          sortDir: 'desc',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getAdminGames).mockRejectedValue(new Error('Database error'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('fetch games');
    });
  });
});

describe('POST /api/admin/games', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(createGame).mockResolvedValue({
      id: 'new-game-1',
      ...validGameData,
      gameTime: '18:00:00',
      status: 'scheduled',
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await POST(createPostRequest(validGameData));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await POST(createPostRequest(validGameData));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Single Game Creation', () => {
    it('creates a game with valid data', async () => {
      const response = await POST(createPostRequest(validGameData));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('new-game-1');
    });

    it('validates required homeTeamId', async () => {
      const response = await POST(createPostRequest({
        ...validGameData,
        homeTeamId: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.homeTeamId).toBeDefined();
    });

    it('validates required awayTeamId', async () => {
      const response = await POST(createPostRequest({
        ...validGameData,
        awayTeamId: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.awayTeamId).toBeDefined();
    });

    it('validates required gameDate', async () => {
      const response = await POST(createPostRequest({
        ...validGameData,
        gameDate: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.gameDate).toBeDefined();
    });

    it('validates required gameTime', async () => {
      const response = await POST(createPostRequest({
        ...validGameData,
        gameTime: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.gameTime).toBeDefined();
    });

    it('prevents same team playing itself', async () => {
      const response = await POST(createPostRequest({
        ...validGameData,
        homeTeamId: 'team-1',
        awayTeamId: 'team-1',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.awayTeamId).toBeDefined();
      expect(body.error.details.errors.awayTeamId[0]).toContain('different');
    });

    it('adds seconds to gameTime', async () => {
      await POST(createPostRequest(validGameData));

      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({
          gameTime: '18:00:00',
        })
      );
    });

    it('uses default timezone if not provided', async () => {
      const { timezone, ...dataWithoutTimezone } = validGameData;
      await POST(createPostRequest(dataWithoutTimezone));

      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: 'America/New_York',
        })
      );
    });

    it('handles optional fields', async () => {
      await POST(createPostRequest({
        ...validGameData,
        locationName: 'Test Field',
        locationAddress: '123 Main St',
        notes: 'Test notes',
      }));

      expect(createGame).toHaveBeenCalledWith(
        expect.objectContaining({
          locationName: 'Test Field',
          locationAddress: '123 Main St',
          notes: 'Test notes',
        })
      );
    });
  });

  describe('Game Series Creation', () => {
    const seriesData = {
      games: [
        {
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          gameDate: '2026-04-15',
          gameTime: '18:00',
        },
        {
          homeTeamId: 'team-2',
          awayTeamId: 'team-1',
          gameDate: '2026-04-22',
          gameTime: '14:00',
        },
      ],
    };

    beforeEach(() => {
      vi.mocked(createGameSeries).mockResolvedValue([
        { id: 'game-1', ...seriesData.games[0] },
        { id: 'game-2', ...seriesData.games[1] },
      ]);
    });

    it('creates multiple games in a series', async () => {
      const response = await POST(createPostRequest(seriesData));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('2 games');
      expect(body.data.games).toHaveLength(2);
    });

    it('validates each game in series', async () => {
      const response = await POST(createPostRequest({
        games: [
          { homeTeamId: 'team-1', awayTeamId: 'team-2', gameDate: '2026-04-15' },
          { homeTeamId: 'team-2' },
        ],
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.game1).toBeDefined();
      expect(body.error.details.errors.game2).toBeDefined();
    });

    it('prevents same team in series game', async () => {
      const response = await POST(createPostRequest({
        games: [
          {
            homeTeamId: 'team-1',
            awayTeamId: 'team-1',
            gameDate: '2026-04-15',
            gameTime: '18:00',
          },
        ],
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.game1[0]).toContain('different');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(createGame).mockRejectedValue(new Error('Database error'));

      const response = await POST(createPostRequest(validGameData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
