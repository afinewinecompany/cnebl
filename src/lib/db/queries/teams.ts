/**
 * Team Queries
 * Query functions for team-related data
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { teams as mockTeamsData, battingStats, pitchingStats } from '@/lib/mock-data';
import type { TeamWithManager, PlayerWithDetails } from '@/types';

// =============================================================================
// MUTABLE MOCK DATA STORE
// =============================================================================

// Create a mutable copy of teams for CRUD operations
// This will be replaced with real database operations later
let teamsStore = [...mockTeamsData];

/**
 * Extended team type for admin view with roster count
 */
export interface TeamWithAdminDetails extends TeamWithManager {
  rosterCount: number;
}

// =============================================================================
// MOCK DATA TRANSFORMERS
// =============================================================================

/**
 * Transform mock team data to API format
 */
function transformTeam(team: typeof teamsStore[0]): TeamWithManager {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    logoUrl: null, // Mock data doesn't have logos
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    managerId: null,
    seasonId: 'season-2026',
    wins: getTeamWins(team.id),
    losses: getTeamLosses(team.id),
    ties: 0,
    runsScored: getTeamRunsScored(team.id),
    runsAllowed: getTeamRunsAllowed(team.id),
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-16T00:00:00Z',
    manager: null, // Mock data doesn't have managers
  };
}

/**
 * Transform mock team data to admin API format with roster count
 */
function transformTeamAdmin(team: typeof teamsStore[0]): TeamWithAdminDetails {
  const rosterCount = getRosterCountForTeam(team.id);
  return {
    ...transformTeam(team),
    rosterCount,
  };
}

/**
 * Get roster count for a team from mock data
 */
function getRosterCountForTeam(teamId: string): number {
  const teamBatters = battingStats.filter((p: { teamId: string }) => p.teamId === teamId);
  const teamPitchers = pitchingStats.filter((p: { teamId: string }) => p.teamId === teamId);

  // Count unique players (some players may appear in both batting and pitching)
  const uniquePlayerNames = new Set([
    ...teamBatters.map((p) => p.playerName),
    ...teamPitchers.map((p) => p.playerName),
  ]);

  return uniquePlayerNames.size;
}

/**
 * Get mock win count for a team
 */
function getTeamWins(teamId: string): number {
  const winsMap: Record<string, number> = {
    seadogs: 8,
    mariners: 7,
    noreasters: 6,
    clippers: 5,
    anchors: 5,
    tides: 4,
  };
  return winsMap[teamId] || 0;
}

/**
 * Get mock loss count for a team
 */
function getTeamLosses(teamId: string): number {
  const lossesMap: Record<string, number> = {
    seadogs: 4,
    mariners: 5,
    noreasters: 6,
    clippers: 7,
    anchors: 7,
    tides: 8,
  };
  return lossesMap[teamId] || 0;
}

/**
 * Get mock runs scored for a team
 */
function getTeamRunsScored(teamId: string): number {
  const runsMap: Record<string, number> = {
    seadogs: 68,
    mariners: 62,
    noreasters: 58,
    clippers: 54,
    anchors: 52,
    tides: 48,
  };
  return runsMap[teamId] || 0;
}

/**
 * Get mock runs allowed for a team
 */
function getTeamRunsAllowed(teamId: string): number {
  const runsMap: Record<string, number> = {
    seadogs: 42,
    mariners: 48,
    noreasters: 52,
    clippers: 56,
    anchors: 58,
    tides: 62,
  };
  return runsMap[teamId] || 0;
}

/**
 * Build roster from mock stats data
 */
function buildRoster(teamId: string): PlayerWithDetails[] {
  // Combine batters and pitchers for the team
  const teamBatters = battingStats.filter((p: { teamId: string }) => p.teamId === teamId);
  const teamPitchers = pitchingStats.filter((p: { teamId: string }) => p.teamId === teamId);

  // Create player entries from batters
  const players: PlayerWithDetails[] = teamBatters.map((batter, index) => ({
    id: batter.playerId,
    userId: `user-${batter.playerId}`,
    teamId: batter.teamId,
    seasonId: 'season-2026',
    jerseyNumber: String((index + 1) * 2),
    primaryPosition: batter.position as PlayerWithDetails['primaryPosition'],
    secondaryPosition: null,
    bats: 'R' as const,
    throws: 'R' as const,
    isActive: true,
    isCaptain: index === 0,
    joinedAt: '2026-01-15T00:00:00Z',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-16T00:00:00Z',
    user: {
      id: `user-${batter.playerId}`,
      fullName: batter.playerName,
      email: `${batter.playerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      avatarUrl: null,
    },
    team: {
      id: batter.teamId,
      name: teamsStore.find((t) => t.id === batter.teamId)?.name || '',
      abbreviation: batter.teamAbbr,
      primaryColor: teamsStore.find((t) => t.id === batter.teamId)?.primaryColor || null,
    },
  }));

  // Add pitchers that aren't already in the batters list
  for (const pitcher of teamPitchers) {
    if (!players.find((p) => p.user.fullName === pitcher.playerName)) {
      players.push({
        id: pitcher.playerId,
        userId: `user-${pitcher.playerId}`,
        teamId: pitcher.teamId,
        seasonId: 'season-2026',
        jerseyNumber: String(players.length + 10),
        primaryPosition: 'P',
        secondaryPosition: null,
        bats: 'R' as const,
        throws: pitcher.position === 'SP' ? 'R' as const : 'L' as const,
        isActive: true,
        isCaptain: false,
        joinedAt: '2026-01-15T00:00:00Z',
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-02-16T00:00:00Z',
        user: {
          id: `user-${pitcher.playerId}`,
          fullName: pitcher.playerName,
          email: `${pitcher.playerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          avatarUrl: null,
        },
        team: {
          id: pitcher.teamId,
          name: teamsStore.find((t) => t.id === pitcher.teamId)?.name || '',
          abbreviation: pitcher.teamAbbr,
          primaryColor: teamsStore.find((t) => t.id === pitcher.teamId)?.primaryColor || null,
        },
      });
    }
  }

  return players;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all teams
 */
export async function getAllTeams(options?: {
  seasonId?: string;
  active?: boolean;
}): Promise<TeamWithManager[]> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  let result = teamsStore.map(transformTeam);

  // Filter by active status if specified
  if (options?.active !== undefined) {
    result = result.filter((team) => team.isActive === options.active);
  }

  return result;
}

/**
 * Get a single team by ID
 * Supports both database UUIDs and mock data slugs
 */
export async function getTeamById(teamId: string): Promise<TeamWithManager | null> {
  // First try mock data (for backwards compatibility with slug IDs like 'athletics')
  const mockTeam = teamsStore.find((t) => t.id === teamId);
  if (mockTeam) {
    return transformTeam(mockTeam);
  }

  // If not found in mock data, try database (for UUID IDs)
  try {
    const { query } = await import('../client');
    const result = await query<{
      id: string;
      name: string;
      abbreviation: string;
      primary_color: string | null;
      secondary_color: string | null;
      manager_id: string | null;
      season_id: string;
      wins: number;
      losses: number;
      ties: number;
      runs_scored: number;
      runs_allowed: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, abbreviation, primary_color, secondary_color,
              manager_id, season_id, wins, losses, ties,
              runs_scored, runs_allowed, is_active, created_at, updated_at
       FROM teams WHERE id = $1`,
      [teamId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      logoUrl: null,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      managerId: row.manager_id,
      seasonId: row.season_id,
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      runsScored: row.runs_scored,
      runsAllowed: row.runs_allowed,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      manager: null,
    };
  } catch (error) {
    console.error('[Teams] Error fetching team from database:', error);
    return null;
  }
}

/**
 * Get team roster
 */
export async function getTeamRoster(teamId: string): Promise<{
  team: Pick<TeamWithManager, 'id' | 'name' | 'abbreviation' | 'primaryColor' | 'secondaryColor'>;
  players: PlayerWithDetails[];
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) return null;

  const players = buildRoster(teamId);

  return {
    team: {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
    },
    players,
  };
}

// =============================================================================
// ADMIN QUERY FUNCTIONS
// =============================================================================

/**
 * Get all teams with admin-level details (including roster counts)
 */
export async function getAllTeamsAdmin(options?: {
  seasonId?: string;
  active?: boolean;
}): Promise<TeamWithAdminDetails[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  let result = teamsStore.map(transformTeamAdmin);

  // Filter by active status if specified
  if (options?.active !== undefined) {
    result = result.filter((team) => team.isActive === options.active);
  }

  return result;
}

/**
 * Get a single team by ID with admin-level details
 */
export async function getTeamByIdAdmin(teamId: string): Promise<TeamWithAdminDetails | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const team = teamsStore.find((t) => t.id === teamId);
  if (!team) return null;

  return transformTeamAdmin(team);
}

/**
 * Get roster count for a team
 */
export async function getTeamRosterCount(teamId: string): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  return getRosterCountForTeam(teamId);
}

// =============================================================================
// ADMIN MUTATION FUNCTIONS
// =============================================================================

/**
 * Input data for creating a new team
 */
export interface CreateTeamInput {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
  seasonId: string;
}

/**
 * Create a new team
 */
export async function createTeam(data: CreateTeamInput): Promise<TeamWithManager> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date().toISOString();

  // Create the new team in mock data format
  const newMockTeam = {
    id: data.id,
    name: data.name,
    abbreviation: data.abbreviation,
    primaryColor: data.primaryColor || '#374151',
    secondaryColor: data.secondaryColor || '#6B7280',
  };

  // Add to the mutable store
  teamsStore.push(newMockTeam);

  // Return the full team object
  const team: TeamWithManager = {
    id: data.id,
    name: data.name,
    abbreviation: data.abbreviation,
    logoUrl: null,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    managerId: null,
    seasonId: data.seasonId,
    wins: 0,
    losses: 0,
    ties: 0,
    runsScored: 0,
    runsAllowed: 0,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
    manager: null,
  };

  return team;
}

/**
 * Update an existing team
 */
export async function updateTeam(
  teamId: string,
  data: Partial<{
    name: string;
    abbreviation: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    isActive: boolean;
    managerId: string | null;
  }>
): Promise<TeamWithManager> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const teamIndex = teamsStore.findIndex((t) => t.id === teamId);
  if (teamIndex === -1) {
    throw new Error(`Team not found: ${teamId}`);
  }

  // Update the mock data store
  const existingTeam = teamsStore[teamIndex];
  teamsStore[teamIndex] = {
    ...existingTeam,
    ...(data.name && { name: data.name }),
    ...(data.abbreviation && { abbreviation: data.abbreviation }),
    ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor || existingTeam.primaryColor }),
    ...(data.secondaryColor !== undefined && { secondaryColor: data.secondaryColor || existingTeam.secondaryColor }),
  };

  // Return the updated team with full details
  const updatedTeam = transformTeam(teamsStore[teamIndex]);

  return {
    ...updatedTeam,
    ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.managerId !== undefined && { managerId: data.managerId }),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const teamIndex = teamsStore.findIndex((t) => t.id === teamId);
  if (teamIndex === -1) {
    throw new Error(`Team not found: ${teamId}`);
  }

  // Remove from the mutable store
  teamsStore.splice(teamIndex, 1);
}
