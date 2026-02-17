/**
 * Season Queries
 * Query functions for season-related data
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import type { Season } from '@/types';
import type {
  SeasonStats,
  SeasonResponse,
  SeasonDetailResponse,
  ScheduleOverview,
  CreateSeasonInput,
  UpdateSeasonInput,
} from '@/lib/api/schemas/seasons';

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Mock seasons data
 */
const mockSeasons: (Season & { stats: SeasonStats })[] = [
  {
    id: 'season-2026',
    name: 'CNEBL 2026 Summer Season',
    year: 2026,
    startDate: '2026-04-15',
    endDate: '2026-09-30',
    isActive: true,
    registrationOpen: true,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-02-16T00:00:00Z',
    stats: {
      gamesPlayed: 35,
      gamesScheduled: 60,
      teamsCount: 6,
      playersCount: 83,
    },
  },
  {
    id: 'season-2025',
    name: 'CNEBL 2025 Summer Season',
    year: 2025,
    startDate: '2025-04-20',
    endDate: '2025-09-28',
    isActive: false,
    registrationOpen: false,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-10-01T00:00:00Z',
    stats: {
      gamesPlayed: 72,
      gamesScheduled: 72,
      teamsCount: 6,
      playersCount: 78,
    },
  },
  {
    id: 'season-2024',
    name: 'CNEBL 2024 Summer Season',
    year: 2024,
    startDate: '2024-04-18',
    endDate: '2024-09-29',
    isActive: false,
    registrationOpen: false,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-10-01T00:00:00Z',
    stats: {
      gamesPlayed: 66,
      gamesScheduled: 66,
      teamsCount: 5,
      playersCount: 65,
    },
  },
  {
    id: 'season-2023',
    name: 'CNEBL 2023 Summer Season',
    year: 2023,
    startDate: '2023-04-22',
    endDate: '2023-09-24',
    isActive: false,
    registrationOpen: false,
    createdAt: '2022-12-01T00:00:00Z',
    updatedAt: '2023-10-01T00:00:00Z',
    stats: {
      gamesPlayed: 54,
      gamesScheduled: 54,
      teamsCount: 4,
      playersCount: 52,
    },
  },
];

/**
 * Mock teams for season detail
 */
const mockTeams = [
  { id: 'rays', name: 'Rays', abbreviation: 'RAY', primaryColor: '#092C5C', wins: 14, losses: 4, ties: 0 },
  { id: 'pirates', name: 'Pirates', abbreviation: 'PIT', primaryColor: '#FDB827', wins: 12, losses: 4, ties: 1 },
  { id: 'athletics', name: 'Athletics', abbreviation: 'OAK', primaryColor: '#003831', wins: 12, losses: 6, ties: 1 },
  { id: 'mariners', name: 'Mariners', abbreviation: 'SEA', primaryColor: '#0C2C56', wins: 8, losses: 10, ties: 0 },
  { id: 'rockies', name: 'Rockies', abbreviation: 'COL', primaryColor: '#33006F', wins: 4, losses: 12, ties: 0 },
  { id: 'diamondbacks', name: 'Diamondbacks', abbreviation: 'ARI', primaryColor: '#A71930', wins: 1, losses: 15, ties: 0 },
];

/**
 * Mock schedule overview
 */
const mockScheduleOverview: ScheduleOverview[] = [
  { month: 'April 2026', gamesCount: 8, completedCount: 8 },
  { month: 'May 2026', gamesCount: 12, completedCount: 12 },
  { month: 'June 2026', gamesCount: 12, completedCount: 10 },
  { month: 'July 2026', gamesCount: 10, completedCount: 5 },
  { month: 'August 2026', gamesCount: 12, completedCount: 0 },
  { month: 'September 2026', gamesCount: 6, completedCount: 0 },
];

// =============================================================================
// AUTHORIZATION
// =============================================================================

/**
 * Check if a user role can manage seasons
 */
export async function canManageSeasons(role: string): Promise<boolean> {
  return ['admin', 'commissioner'].includes(role);
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all seasons with optional filtering
 */
export async function getAllSeasons(options?: {
  year?: number;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{
  seasons: SeasonResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  let result = [...mockSeasons];

  // Filter by year
  if (options?.year) {
    result = result.filter((season) => season.year === options.year);
  }

  // Filter active only
  if (options?.activeOnly) {
    result = result.filter((season) => season.isActive);
  }

  // Sort by year descending (most recent first)
  result.sort((a, b) => b.year - a.year);

  // Pagination
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const totalItems = result.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (page - 1) * pageSize;

  const paginatedSeasons = result.slice(offset, offset + pageSize);

  return {
    seasons: paginatedSeasons,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Get a single season by ID
 */
export async function getSeasonById(seasonId: string): Promise<SeasonResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const season = mockSeasons.find((s) => s.id === seasonId);
  return season || null;
}

/**
 * Get season detail with teams and schedule overview
 */
export async function getSeasonDetail(seasonId: string): Promise<SeasonDetailResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const season = mockSeasons.find((s) => s.id === seasonId);
  if (!season) return null;

  return {
    ...season,
    teams: mockTeams,
    scheduleOverview: mockScheduleOverview,
  };
}

/**
 * Get the currently active season
 */
export async function getActiveSeason(): Promise<SeasonResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const activeSeason = mockSeasons.find((s) => s.isActive);
  return activeSeason || null;
}

/**
 * Create a new season
 */
export async function createSeason(data: CreateSeasonInput): Promise<SeasonResponse> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const now = new Date().toISOString();
  const newSeason: Season & { stats: SeasonStats } = {
    id: `season-${Date.now()}`,
    name: data.name,
    year: data.year,
    startDate: data.startDate,
    endDate: data.endDate,
    isActive: data.isActive ?? false,
    registrationOpen: data.registrationOpen ?? false,
    createdAt: now,
    updatedAt: now,
    stats: {
      gamesPlayed: 0,
      gamesScheduled: 0,
      teamsCount: 0,
      playersCount: 0,
    },
  };

  // In real implementation, copy settings from another season if requested
  if (data.copyFromSeasonId) {
    const sourceSeason = mockSeasons.find((s) => s.id === data.copyFromSeasonId);
    if (sourceSeason) {
      // Would copy team structures, etc.
      console.log(`Copying settings from season: ${sourceSeason.name}`);
    }
  }

  mockSeasons.unshift(newSeason);
  return newSeason;
}

/**
 * Update a season
 */
export async function updateSeason(
  seasonId: string,
  data: UpdateSeasonInput
): Promise<SeasonResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const seasonIndex = mockSeasons.findIndex((s) => s.id === seasonId);
  if (seasonIndex === -1) return null;

  const existingSeason = mockSeasons[seasonIndex];
  const updatedSeason = {
    ...existingSeason,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  mockSeasons[seasonIndex] = updatedSeason;
  return updatedSeason;
}

/**
 * Delete a season
 * Note: In production, this should soft-delete or prevent deletion of seasons with data
 */
export async function deleteSeason(seasonId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const seasonIndex = mockSeasons.findIndex((s) => s.id === seasonId);
  if (seasonIndex === -1) return false;

  // Prevent deletion of active season
  if (mockSeasons[seasonIndex].isActive) {
    throw new Error('Cannot delete an active season');
  }

  mockSeasons.splice(seasonIndex, 1);
  return true;
}

/**
 * Set a season as active (deactivates all other seasons)
 */
export async function activateSeason(seasonId: string): Promise<SeasonResponse | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  const seasonIndex = mockSeasons.findIndex((s) => s.id === seasonId);
  if (seasonIndex === -1) return null;

  // Deactivate all seasons
  mockSeasons.forEach((season) => {
    season.isActive = false;
  });

  // Activate the target season
  mockSeasons[seasonIndex].isActive = true;
  mockSeasons[seasonIndex].updatedAt = new Date().toISOString();

  return mockSeasons[seasonIndex];
}

/**
 * Get season statistics
 */
export async function getSeasonStats(seasonId: string): Promise<SeasonStats | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const season = mockSeasons.find((s) => s.id === seasonId);
  return season?.stats || null;
}

/**
 * Get available seasons for dropdown/select
 */
export async function getSeasonOptions(): Promise<Array<{ id: string; name: string; year: number; isActive: boolean }>> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  return mockSeasons.map((s) => ({
    id: s.id,
    name: s.name,
    year: s.year,
    isActive: s.isActive,
  }));
}
