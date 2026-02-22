/**
 * Games API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getGames: vi.fn(),
}));

// Mock validation
vi.mock('@/lib/api/validation', () => ({
  validateGamesQueryParams: vi.fn(() => ({ valid: true, errors: {} })),
}));

import { getGames } from '@/lib/db/queries';
import { validateGamesQueryParams } from '@/lib/api/validation';

const mockGames = [
  {
    id: 'game-1',
    homeTeamId: 'team-1',
    homeTeamName: 'Sea Dogs',
    awayTeamId: 'team-2',
    awayTeamName: 'River Cats',
    date: '2026-03-15',
    time: '14:00',
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
    location: 'Portland Stadium',
  },
  {
    id: 'game-2',
    homeTeamId: 'team-2',
    homeTeamName: 'River Cats',
    awayTeamId: 'team-1',
    awayTeamName: 'Sea Dogs',
    date: '2026-03-10',
    time: '18:00',
    status: 'final',
    homeScore: 5,
    awayScore: 3,
    location: 'Sacramento Field',
  },
];

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/games', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateGamesQueryParams).mockReturnValue({ valid: true, errors: {} });
  });

  it('returns games with default pagination', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(20);
  });

  it('respects custom pagination parameters', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 50,
    });

    const request = createRequest('/api/games?page=2&pageSize=10');
    const response = await GET(request);
    const body = await response.json();

    expect(body.pagination.page).toBe(2);
    expect(body.pagination.pageSize).toBe(10);
    expect(body.pagination.totalItems).toBe(50);
    expect(body.pagination.totalPages).toBe(5);
  });

  it('limits pageSize to maximum of 100', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 200,
    });

    const request = createRequest('/api/games?pageSize=200');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 100,
      })
    );
  });

  it('filters by status', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: [mockGames[0]],
      totalCount: 1,
    });

    const request = createRequest('/api/games?status=scheduled');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'scheduled',
      })
    );
  });

  it('filters by multiple statuses', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games?status=scheduled,in_progress');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['scheduled', 'in_progress'],
      })
    );
  });

  it('filters by teamId', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games?teamId=team-1');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-1',
      })
    );
  });

  it('filters by date range', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games?startDate=2026-03-01&endDate=2026-03-31');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      })
    );
  });

  it('sorts by date ascending by default', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'date',
        sortDir: 'desc',
      })
    );
  });

  it('supports custom sorting', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 2,
    });

    const request = createRequest('/api/games?sortBy=status&sortDir=asc');
    const response = await GET(request);

    expect(getGames).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'status',
        sortDir: 'asc',
      })
    );
  });

  it('returns validation error for invalid query params', async () => {
    vi.mocked(validateGamesQueryParams).mockReturnValue({
      valid: false,
      errors: { status: ['Invalid status value'] },
    });

    const request = createRequest('/api/games?status=invalid');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(getGames).mockRejectedValue(new Error('Database error'));

    const request = createRequest('/api/games');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Failed to fetch games');
  });

  it('returns hasNextPage and hasPreviousPage correctly', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: mockGames,
      totalCount: 50,
    });

    const request = createRequest('/api/games?page=2&pageSize=20');
    const response = await GET(request);
    const body = await response.json();

    expect(body.pagination.hasNextPage).toBe(true);
    expect(body.pagination.hasPreviousPage).toBe(true);
  });

  it('returns empty array when no games found', async () => {
    vi.mocked(getGames).mockResolvedValue({
      games: [],
      totalCount: 0,
    });

    const request = createRequest('/api/games');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(0);
    expect(body.pagination.totalItems).toBe(0);
  });
});
