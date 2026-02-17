/**
 * Stats Queries
 * Query functions for batting and pitching statistics
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { battingStats, pitchingStats, BATTING_MIN_AB, PITCHING_MIN_IP } from '@/lib/mock-data';
import type { PlayerBattingTotals, PlayerPitchingTotals, LeaderboardEntry } from '@/types';

// =============================================================================
// MOCK DATA TRANSFORMERS
// =============================================================================

/**
 * Transform mock batting stats to API format
 */
function transformBattingStats(stat: typeof battingStats[0]): PlayerBattingTotals {
  return {
    playerId: stat.playerId,
    playerName: stat.playerName,
    teamName: getTeamName(stat.teamId),
    teamId: stat.teamId,
    seasonId: 'season-2025',
    seasonName: '2025 Season',
    gamesPlayed: stat.gamesPlayed,
    plateAppearances: stat.plateAppearances,
    atBats: stat.atBats,
    runs: stat.runs,
    hits: stat.hits,
    doubles: stat.doubles,
    triples: stat.triples,
    homeRuns: stat.homeRuns,
    rbi: stat.rbi,
    walks: stat.walks,
    strikeouts: stat.strikeouts,
    stolenBases: stat.stolenBases,
    hitByPitch: stat.hitByPitch,
    battingAvg: stat.avg,
    onBasePct: stat.obp,
    sluggingPct: stat.slg,
  };
}

/**
 * Transform mock pitching stats to API format
 */
function transformPitchingStats(stat: typeof pitchingStats[0]): PlayerPitchingTotals {
  // Calculate K/9 from available data
  const kPer9 = stat.inningsPitched > 0 ? (stat.strikeouts / stat.inningsPitched) * 9 : 0;

  return {
    playerId: stat.playerId,
    playerName: stat.playerName,
    teamName: getTeamName(stat.teamId),
    teamId: stat.teamId,
    seasonId: 'season-2025',
    seasonName: '2025 Season',
    gamesPitched: stat.gamesPlayed,
    gamesStarted: stat.gamesStarted,
    inningsPitched: stat.inningsPitched,
    hitsAllowed: stat.hits,
    runsAllowed: stat.runs,
    earnedRuns: stat.earnedRuns,
    walks: stat.walks,
    strikeouts: stat.strikeouts,
    homeRunsAllowed: 0, // Not tracked in 2025 data
    wins: stat.wins,
    losses: stat.losses,
    saves: stat.saves,
    era: stat.era,
    whip: stat.whip,
    kPer9: parseFloat(kPer9.toFixed(2)),
  };
}

/**
 * Get team name from ID
 */
function getTeamName(teamId: string): string {
  const names: Record<string, string> = {
    rays: 'Rays',
    pirates: 'Pirates',
    athletics: 'Athletics',
    mariners: 'Mariners',
    rockies: 'Rockies',
    diamondbacks: 'Diamondbacks',
  };
  return names[teamId] || teamId;
}

/**
 * Create leaderboard entries for a stat
 */
function createLeaderboard<T extends { playerId: string; playerName: string; teamId: string }>(
  stats: T[],
  getValue: (stat: T) => number,
  teamAbbrs: Record<string, string>,
  limit = 5,
  ascending = false
): LeaderboardEntry[] {
  const sorted = [...stats].sort((a, b) => {
    const diff = getValue(a) - getValue(b);
    return ascending ? diff : -diff;
  });

  return sorted.slice(0, limit).map((stat, index) => ({
    playerId: stat.playerId,
    playerName: stat.playerName,
    teamId: stat.teamId,
    teamAbbr: teamAbbrs[stat.teamId] || stat.teamId.toUpperCase().slice(0, 3),
    value: getValue(stat),
    rank: index + 1,
  }));
}

// Team abbreviations lookup
const TEAM_ABBRS: Record<string, string> = {
  rays: 'RAY',
  pirates: 'PIR',
  athletics: 'ATH',
  mariners: 'MAR',
  rockies: 'ROC',
  diamondbacks: 'DBK',
};

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export interface GetBattingStatsOptions {
  seasonId?: string;
  teamId?: string;
  minAtBats?: number;
  sortBy?: 'avg' | 'homeRuns' | 'rbi' | 'hits' | 'runs' | 'stolenBases' | 'ops';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Get batting stats with filtering and leaderboards
 */
export async function getBattingStats(options: GetBattingStatsOptions = {}): Promise<{
  stats: PlayerBattingTotals[];
  leaderboard: {
    avg: LeaderboardEntry[];
    homeRuns: LeaderboardEntry[];
    rbi: LeaderboardEntry[];
    hits: LeaderboardEntry[];
    stolenBases: LeaderboardEntry[];
  };
  totalCount: number;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  const minAB = options.minAtBats ?? BATTING_MIN_AB;
  let filtered = battingStats.filter((s) => s.atBats >= minAB);

  // Filter by team
  if (options.teamId) {
    filtered = filtered.filter((s) => s.teamId === options.teamId);
  }

  // Sort
  const sortDir = options.sortDir === 'asc' ? 1 : -1;
  const sortFunctions: Record<string, (a: typeof battingStats[0], b: typeof battingStats[0]) => number> = {
    avg: (a, b) => (a.avg - b.avg) * sortDir,
    homeRuns: (a, b) => (a.homeRuns - b.homeRuns) * sortDir,
    rbi: (a, b) => (a.rbi - b.rbi) * sortDir,
    hits: (a, b) => (a.hits - b.hits) * sortDir,
    runs: (a, b) => (a.runs - b.runs) * sortDir,
    stolenBases: (a, b) => (a.stolenBases - b.stolenBases) * sortDir,
    ops: (a, b) => (a.ops - b.ops) * sortDir,
  };

  const sortFn = sortFunctions[options.sortBy || 'avg'] || sortFunctions.avg;
  filtered.sort(sortFn);

  const totalCount = filtered.length;

  // Pagination
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  // Build leaderboards from qualified players (all teams, not filtered)
  const qualified = battingStats.filter((s) => s.atBats >= BATTING_MIN_AB);

  return {
    stats: paginated.map(transformBattingStats),
    leaderboard: {
      avg: createLeaderboard(qualified, (s) => s.avg, TEAM_ABBRS),
      homeRuns: createLeaderboard(qualified, (s) => s.homeRuns, TEAM_ABBRS),
      rbi: createLeaderboard(qualified, (s) => s.rbi, TEAM_ABBRS),
      hits: createLeaderboard(qualified, (s) => s.hits, TEAM_ABBRS),
      stolenBases: createLeaderboard(qualified, (s) => s.stolenBases, TEAM_ABBRS),
    },
    totalCount,
  };
}

export interface GetPitchingStatsOptions {
  seasonId?: string;
  teamId?: string;
  minInningsPitched?: number;
  sortBy?: 'era' | 'wins' | 'strikeouts' | 'saves' | 'whip';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Get pitching stats with filtering and leaderboards
 */
export async function getPitchingStats(options: GetPitchingStatsOptions = {}): Promise<{
  stats: PlayerPitchingTotals[];
  leaderboard: {
    era: LeaderboardEntry[];
    wins: LeaderboardEntry[];
    strikeouts: LeaderboardEntry[];
    saves: LeaderboardEntry[];
    whip: LeaderboardEntry[];
  };
  totalCount: number;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  const minIP = options.minInningsPitched ?? PITCHING_MIN_IP;
  let filtered = pitchingStats.filter((s) => s.inningsPitched >= minIP);

  // Filter by team
  if (options.teamId) {
    filtered = filtered.filter((s) => s.teamId === options.teamId);
  }

  // Sort (note: for ERA and WHIP, lower is better, so default to ascending)
  const sortDir = options.sortDir === 'asc' ? 1 : -1;
  const sortFunctions: Record<string, (a: typeof pitchingStats[0], b: typeof pitchingStats[0]) => number> = {
    era: (a, b) => (a.era - b.era) * sortDir,
    wins: (a, b) => (a.wins - b.wins) * sortDir,
    strikeouts: (a, b) => (a.strikeouts - b.strikeouts) * sortDir,
    saves: (a, b) => (a.saves - b.saves) * sortDir,
    whip: (a, b) => (a.whip - b.whip) * sortDir,
  };

  const sortFn = sortFunctions[options.sortBy || 'era'] || sortFunctions.era;
  filtered.sort(sortFn);

  const totalCount = filtered.length;

  // Pagination
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  // Build leaderboards from qualified players
  const qualified = pitchingStats.filter((s) => s.inningsPitched >= PITCHING_MIN_IP);

  return {
    stats: paginated.map(transformPitchingStats),
    leaderboard: {
      era: createLeaderboard(qualified, (s) => s.era, TEAM_ABBRS, 5, true), // Lower is better
      wins: createLeaderboard(qualified, (s) => s.wins, TEAM_ABBRS),
      strikeouts: createLeaderboard(qualified, (s) => s.strikeouts, TEAM_ABBRS),
      saves: createLeaderboard(qualified, (s) => s.saves, TEAM_ABBRS),
      whip: createLeaderboard(qualified, (s) => s.whip, TEAM_ABBRS, 5, true), // Lower is better
    },
    totalCount,
  };
}
