/**
 * Teams API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getAllTeams: vi.fn(),
}));

import { getAllTeams } from '@/lib/db/queries';

const mockTeams = [
  {
    id: 'team-1',
    name: 'Sea Dogs',
    abbreviation: 'SD',
    city: 'Portland',
    primaryColor: '#002F6C',
    secondaryColor: '#C8102E',
    active: true,
  },
  {
    id: 'team-2',
    name: 'River Cats',
    abbreviation: 'RC',
    city: 'Sacramento',
    primaryColor: '#00843D',
    secondaryColor: '#FFFFFF',
    active: true,
  },
];

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all teams successfully', async () => {
    vi.mocked(getAllTeams).mockResolvedValue(mockTeams);

    const request = createRequest('/api/teams');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe('Sea Dogs');
  });

  it('filters teams by active status', async () => {
    vi.mocked(getAllTeams).mockResolvedValue([mockTeams[0]]);

    const request = createRequest('/api/teams?active=true');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAllTeams).toHaveBeenCalledWith({
      seasonId: undefined,
      active: true,
    });
  });

  it('filters teams by inactive status', async () => {
    vi.mocked(getAllTeams).mockResolvedValue([]);

    const request = createRequest('/api/teams?active=false');
    const response = await GET(request);

    expect(getAllTeams).toHaveBeenCalledWith({
      seasonId: undefined,
      active: false,
    });
  });

  it('filters teams by seasonId', async () => {
    vi.mocked(getAllTeams).mockResolvedValue(mockTeams);

    const request = createRequest('/api/teams?seasonId=season-2026');
    const response = await GET(request);

    expect(getAllTeams).toHaveBeenCalledWith({
      seasonId: 'season-2026',
      active: undefined,
    });
  });

  it('combines seasonId and active filters', async () => {
    vi.mocked(getAllTeams).mockResolvedValue(mockTeams);

    const request = createRequest('/api/teams?seasonId=season-2026&active=true');
    const response = await GET(request);

    expect(getAllTeams).toHaveBeenCalledWith({
      seasonId: 'season-2026',
      active: true,
    });
  });

  it('returns empty array when no teams found', async () => {
    vi.mocked(getAllTeams).mockResolvedValue([]);

    const request = createRequest('/api/teams');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(getAllTeams).mockRejectedValue(new Error('Database error'));

    const request = createRequest('/api/teams');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Failed to fetch teams');
  });

  it('ignores invalid active parameter', async () => {
    vi.mocked(getAllTeams).mockResolvedValue(mockTeams);

    const request = createRequest('/api/teams?active=invalid');
    const response = await GET(request);

    expect(getAllTeams).toHaveBeenCalledWith({
      seasonId: undefined,
      active: undefined,
    });
  });
});
