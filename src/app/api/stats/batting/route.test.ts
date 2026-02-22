/**
 * Batting Stats API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getBattingStats: vi.fn(),
}));

// Mock validation
vi.mock('@/lib/api/validation', () => ({
  validateStatsQueryParams: vi.fn(() => ({ valid: true, errors: {} })),
}));

import { getBattingStats } from '@/lib/db/queries';
import { validateStatsQueryParams } from '@/lib/api/validation';

const mockBattingStats = {
  stats: [
    {
      playerId: 'player-1',
      playerName: 'John Smith',
      teamId: 'team-1',
      teamName: 'Sea Dogs',
      games: 20,
      atBats: 80,
      runs: 15,
      hits: 28,
      doubles: 6,
      triples: 1,
      homeRuns: 4,
      rbi: 18,
      stolenBases: 5,
      caughtStealing: 2,
      walks: 10,
      strikeouts: 15,
      avg: 0.35,
      obp: 0.42,
      slg: 0.55,
      ops: 0.97,
    },
    {
      playerId: 'player-2',
      playerName: 'Mike Johnson',
      teamId: 'team-2',
      teamName: 'River Cats',
      games: 18,
      atBats: 70,
      runs: 12,
      hits: 21,
      doubles: 4,
      triples: 0,
      homeRuns: 6,
      rbi: 20,
      stolenBases: 2,
      caughtStealing: 1,
      walks: 8,
      strikeouts: 18,
      avg: 0.3,
      obp: 0.38,
      slg: 0.52,
      ops: 0.9,
    },
  ],
  leaderboard: {
    avg: [
      { playerId: 'player-1', playerName: 'John Smith', value: 0.35 },
    ],
    homeRuns: [
      { playerId: 'player-2', playerName: 'Mike Johnson', value: 6 },
    ],
    rbi: [
      { playerId: 'player-2', playerName: 'Mike Johnson', value: 20 },
    ],
    hits: [
      { playerId: 'player-1', playerName: 'John Smith', value: 28 },
    ],
    stolenBases: [
      { playerId: 'player-1', playerName: 'John Smith', value: 5 },
    ],
  },
  totalCount: 2,
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/stats/batting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateStatsQueryParams).mockReturnValue({ valid: true, errors: {} });
  });

  it('returns batting stats successfully', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.stats).toHaveLength(2);
    expect(body.data.leaderboard).toBeDefined();
  });

  it('returns stats with pagination', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.pagination).toBeDefined();
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.totalItems).toBe(2);
  });

  it('filters by teamId', async () => {
    vi.mocked(getBattingStats).mockResolvedValue({
      stats: [mockBattingStats.stats[0]],
      leaderboard: mockBattingStats.leaderboard,
      totalCount: 1,
    });

    const request = createRequest('/api/stats/batting?teamId=team-1');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-1',
      })
    );
  });

  it('filters by seasonId', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting?seasonId=season-2026');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        seasonId: 'season-2026',
      })
    );
  });

  it('filters by minimum at-bats', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting?minAtBats=50');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        minAtBats: 50,
      })
    );
  });

  it('sorts by average by default', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'avg',
        sortDir: 'desc',
      })
    );
  });

  it('supports sorting by home runs', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting?sortBy=homeRuns');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'homeRuns',
      })
    );
  });

  it('supports sorting by RBI', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting?sortBy=rbi&sortDir=desc');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'rbi',
        sortDir: 'desc',
      })
    );
  });

  it('supports sorting by OPS', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting?sortBy=ops');
    const response = await GET(request);

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'ops',
      })
    );
  });

  it('returns leaderboard data', async () => {
    vi.mocked(getBattingStats).mockResolvedValue(mockBattingStats);

    const request = createRequest('/api/stats/batting');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.leaderboard).toHaveProperty('avg');
    expect(body.data.leaderboard).toHaveProperty('homeRuns');
    expect(body.data.leaderboard).toHaveProperty('rbi');
    expect(body.data.leaderboard).toHaveProperty('hits');
    expect(body.data.leaderboard).toHaveProperty('stolenBases');
  });

  it('returns validation error for invalid minAtBats', async () => {
    vi.mocked(validateStatsQueryParams).mockReturnValue({
      valid: false,
      errors: { minAtBats: ['minAtBats must be a positive number'] },
    });

    const request = createRequest('/api/stats/batting?minAtBats=-10');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(getBattingStats).mockRejectedValue(new Error('Database error'));

    const request = createRequest('/api/stats/batting');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Failed to fetch batting stats');
  });

  it('returns empty stats when no players qualify', async () => {
    vi.mocked(getBattingStats).mockResolvedValue({
      stats: [],
      leaderboard: {
        avg: [],
        homeRuns: [],
        rbi: [],
        hits: [],
        stolenBases: [],
      },
      totalCount: 0,
    });

    const request = createRequest('/api/stats/batting?minAtBats=100');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stats).toHaveLength(0);
    expect(body.data.pagination.totalItems).toBe(0);
  });

  it('respects pagination parameters', async () => {
    vi.mocked(getBattingStats).mockResolvedValue({
      ...mockBattingStats,
      totalCount: 100,
    });

    const request = createRequest('/api/stats/batting?page=3&pageSize=25');
    const response = await GET(request);
    const body = await response.json();

    expect(getBattingStats).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 3,
        pageSize: 25,
      })
    );
    expect(body.data.pagination.page).toBe(3);
    expect(body.data.pagination.pageSize).toBe(25);
    expect(body.data.pagination.totalPages).toBe(4);
  });
});
