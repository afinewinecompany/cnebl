/**
 * Admin Teams API Route Tests
 * Tests for GET /api/admin/teams and POST /api/admin/teams
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database queries
vi.mock('@/lib/db/queries/teams', () => ({
  getAllTeamsAdmin: vi.fn(),
  createTeam: vi.fn(),
  getTeamById: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { getAllTeamsAdmin, createTeam, getTeamById } from '@/lib/db/queries/teams';

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

const mockTeams = [
  {
    id: 'boston-bombers',
    name: 'Boston Bombers',
    abbreviation: 'BOS',
    primaryColor: '#1a365d',
    secondaryColor: '#c53030',
    isActive: true,
    seasonId: 'season-2026',
    rosterCount: 15,
    manager: { id: 'user-1', fullName: 'John Manager' },
  },
  {
    id: 'providence-panthers',
    name: 'Providence Panthers',
    abbreviation: 'PRO',
    primaryColor: '#2d3748',
    secondaryColor: '#d69e2e',
    isActive: true,
    seasonId: 'season-2026',
    rosterCount: 12,
    manager: null,
  },
];

const validTeamData = {
  name: 'New Hampshire Hawks',
  abbreviation: 'NHH',
  primaryColor: '#003366',
  secondaryColor: '#FFD700',
};

function createGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/teams');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: 'GET' });
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/admin/teams'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/admin/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getAllTeamsAdmin).mockResolvedValue(mockTeams);
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('allows admin users', async () => {
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
    it('returns all teams', async () => {
      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockTeams);
    });

    it('passes seasonId filter to query', async () => {
      await GET(createGetRequest({ seasonId: 'season-2026' }));

      expect(getAllTeamsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ seasonId: 'season-2026' })
      );
    });

    it('passes active=true filter to query', async () => {
      await GET(createGetRequest({ active: 'true' }));

      expect(getAllTeamsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ active: true })
      );
    });

    it('passes active=false filter to query', async () => {
      await GET(createGetRequest({ active: 'false' }));

      expect(getAllTeamsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ active: false })
      );
    });

    it('ignores invalid active value', async () => {
      await GET(createGetRequest({ active: 'invalid' }));

      expect(getAllTeamsAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ active: undefined })
      );
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(getAllTeamsAdmin).mockRejectedValue(new Error('Database error'));

      const response = await GET(createGetRequest());
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});

describe('POST /api/admin/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockAdminSession);
    vi.mocked(getTeamById).mockResolvedValue(null);
    vi.mocked(createTeam).mockResolvedValue({
      id: 'new-hampshire-hawks',
      ...validTeamData,
      abbreviation: 'NHH',
      isActive: true,
      seasonId: 'season-2026',
    });
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await POST(createPostRequest(validTeamData));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 403 for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue(mockPlayerSession);

      const response = await POST(createPostRequest(validTeamData));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe('Team Creation', () => {
    it('creates a team with valid data', async () => {
      const response = await POST(createPostRequest(validTeamData));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(validTeamData.name);
    });

    it('generates team ID from name', async () => {
      await POST(createPostRequest(validTeamData));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-hampshire-hawks',
        })
      );
    });

    it('converts abbreviation to uppercase', async () => {
      await POST(createPostRequest({ ...validTeamData, abbreviation: 'nhh' }));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          abbreviation: 'NHH',
        })
      );
    });

    it('trims whitespace from name', async () => {
      await POST(createPostRequest({ ...validTeamData, name: '  Team Name  ' }));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Team Name',
        })
      );
    });

    it('defaults isActive to true', async () => {
      await POST(createPostRequest(validTeamData));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });

    it('allows setting isActive to false', async () => {
      await POST(createPostRequest({ ...validTeamData, isActive: false }));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('uses default seasonId when not provided', async () => {
      await POST(createPostRequest(validTeamData));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonId: 'season-2026',
        })
      );
    });

    it('allows custom seasonId', async () => {
      await POST(createPostRequest({ ...validTeamData, seasonId: 'season-2027' }));

      expect(createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonId: 'season-2027',
        })
      );
    });
  });

  describe('Validation', () => {
    it('validates required name', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        name: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates name is not empty', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        name: '   ',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates name max length', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        name: 'A'.repeat(101),
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.name).toBeDefined();
    });

    it('validates required abbreviation', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        abbreviation: undefined,
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.abbreviation).toBeDefined();
    });

    it('validates abbreviation min length', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        abbreviation: 'A',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.abbreviation).toBeDefined();
    });

    it('validates abbreviation max length', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        abbreviation: 'ABCDE',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.abbreviation).toBeDefined();
    });

    it('validates primaryColor is valid hex', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        primaryColor: 'not-a-color',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.primaryColor).toBeDefined();
    });

    it('validates secondaryColor is valid hex', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        secondaryColor: 'invalid',
      }));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error.details.errors.secondaryColor).toBeDefined();
    });

    it('accepts 3-character hex colors', async () => {
      const response = await POST(createPostRequest({
        ...validTeamData,
        primaryColor: '#F00',
        secondaryColor: '#0F0',
      }));

      expect(response.status).toBe(201);
    });

    it('allows colors to be omitted', async () => {
      const { primaryColor, secondaryColor, ...dataWithoutColors } = validTeamData;
      const response = await POST(createPostRequest(dataWithoutColors));

      expect(response.status).toBe(201);
    });
  });

  describe('Duplicate Prevention', () => {
    it('returns 400 when team name already exists', async () => {
      vi.mocked(getTeamById).mockResolvedValue(mockTeams[0]);

      const response = await POST(createPostRequest(validTeamData));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('already exists');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(createTeam).mockRejectedValue(new Error('Database error'));

      const response = await POST(createPostRequest(validTeamData));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });
});
