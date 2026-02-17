/**
 * Team Queries
 * Query functions for team-related data
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { teams, battingStats, pitchingStats } from '@/lib/mock-data';
import type { TeamWithManager, PlayerWithDetails } from '@/types';

// =============================================================================
// MOCK DATA TRANSFORMERS
// =============================================================================

/**
 * Transform mock team data to API format
 */
function transformTeam(team: typeof teams[0]): TeamWithManager {
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
  const teamBatters = battingStats.filter((p) => p.teamId === teamId);
  const teamPitchers = pitchingStats.filter((p) => p.teamId === teamId);

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
      name: teams.find((t) => t.id === batter.teamId)?.name || '',
      abbreviation: batter.teamAbbr,
      primaryColor: teams.find((t) => t.id === batter.teamId)?.primaryColor || null,
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
          name: teams.find((t) => t.id === pitcher.teamId)?.name || '',
          abbreviation: pitcher.teamAbbr,
          primaryColor: teams.find((t) => t.id === pitcher.teamId)?.primaryColor || null,
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

  let result = teams.map(transformTeam);

  // Filter by active status if specified
  if (options?.active !== undefined) {
    result = result.filter((team) => team.isActive === options.active);
  }

  return result;
}

/**
 * Get a single team by ID
 */
export async function getTeamById(teamId: string): Promise<TeamWithManager | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  return transformTeam(team);
}

/**
 * Get team roster
 */
export async function getTeamRoster(teamId: string): Promise<{
  team: Pick<TeamWithManager, 'id' | 'name' | 'abbreviation' | 'primaryColor' | 'secondaryColor'>;
  players: PlayerWithDetails[];
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const team = teams.find((t) => t.id === teamId);
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
