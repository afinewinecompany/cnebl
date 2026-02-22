/**
 * Standings API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getStandings: vi.fn(),
}));

import { getStandings } from '@/lib/db/queries';

const mockStandings = {
  seasonId: 'season-2026',
  seasonName: '2026 Season',
  asOf: '2026-02-20T12:00:00Z',
  standings: [
    {
      teamId: 'team-1',
      teamName: 'Sea Dogs',
      abbreviation: 'SD',
      wins: 15,
      losses: 5,
      ties: 0,
      winPct: 0.75,
      gamesBack: 0,
      runsScored: 120,
      runsAllowed: 80,
      runDifferential: 40,
      streak: 'W3',
      lastTen: '8-2',
    },
    {
      teamId: 'team-2',
      teamName: 'River Cats',
      abbreviation: 'RC',
      wins: 12,
      losses: 8,
      ties: 0,
      winPct: 0.6,
      gamesBack: 3,
      runsScored: 100,
      runsAllowed: 90,
      runDifferential: 10,
      streak: 'L1',
      lastTen: '6-4',
    },
  ],
};

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/standings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns standings successfully', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.standings).toHaveLength(2);
    expect(body.data.seasonId).toBe('season-2026');
  });

  it('filters by seasonId when provided', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings?seasonId=season-2025');
    const response = await GET(request);

    expect(getStandings).toHaveBeenCalledWith({
      seasonId: 'season-2025',
    });
  });

  it('uses default season when no seasonId provided', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings');
    const response = await GET(request);

    expect(getStandings).toHaveBeenCalledWith({
      seasonId: undefined,
    });
  });

  it('returns standings sorted by win percentage', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    // First team should have higher win percentage
    expect(body.data.standings[0].winPct).toBeGreaterThan(body.data.standings[1].winPct);
  });

  it('includes all required fields in standings', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    const firstTeam = body.data.standings[0];
    expect(firstTeam).toHaveProperty('teamId');
    expect(firstTeam).toHaveProperty('teamName');
    expect(firstTeam).toHaveProperty('wins');
    expect(firstTeam).toHaveProperty('losses');
    expect(firstTeam).toHaveProperty('winPct');
    expect(firstTeam).toHaveProperty('gamesBack');
    expect(firstTeam).toHaveProperty('runDifferential');
  });

  it('returns empty standings array when no data', async () => {
    vi.mocked(getStandings).mockResolvedValue({
      seasonId: 'season-2026',
      seasonName: '2026 Season',
      asOf: '2026-02-20T12:00:00Z',
      standings: [],
    });

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.standings).toHaveLength(0);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(getStandings).mockRejectedValue(new Error('Database error'));

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Failed to fetch standings');
  });

  it('includes season metadata in response', async () => {
    vi.mocked(getStandings).mockResolvedValue(mockStandings);

    const request = createRequest('/api/standings');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data).toHaveProperty('seasonId');
    expect(body.data).toHaveProperty('seasonName');
    expect(body.data).toHaveProperty('asOf');
  });
});
