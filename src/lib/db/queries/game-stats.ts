/**
 * Game Stats Queries
 * Query functions for per-game batting and pitching statistics
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { teams } from '@/lib/mock-data';
import type { BattingStats, PitchingStats, FieldPosition, PitchingDecision } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface RosterPlayer {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  primaryPosition?: FieldPosition;
  isPitcher?: boolean;
}

export interface GameStatsResponse {
  gameId: string;
  batting: {
    home: BattingStats[];
    away: BattingStats[];
  };
  pitching: {
    home: PitchingStats[];
    away: PitchingStats[];
  };
  summary: {
    homeBattingCount: number;
    awayBattingCount: number;
    homePitchingCount: number;
    awayPitchingCount: number;
    isComplete: boolean;
  };
}

export interface SaveBattingStatsInput {
  gameId: string;
  teamId: string;
  playerId: string;
  battingOrder: number | null;
  positionPlayed: FieldPosition | null;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runsBattedIn: number;
  walks: number;
  strikeouts: number;
  hitByPitch: number;
  sacrificeFlies: number;
  sacrificeBunts: number;
  stolenBases: number;
  caughtStealing: number;
  groundIntoDoublePlays: number;
  leftOnBase: number;
}

export interface SavePitchingStatsInput {
  gameId: string;
  teamId: string;
  playerId: string;
  isStarter: boolean;
  decision: PitchingDecision | null;
  inningsPitched: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  battersFaced: number;
  pitchesThrown: number | null;
  strikes: number | null;
  hitBatters: number;
  wildPitches: number;
  balks: number;
}

// =============================================================================
// MOCK DATA STORAGE
// =============================================================================

// In-memory storage for mock data (in real app, this would be database)
const battingStatsStorage: Record<string, BattingStats[]> = {};
const pitchingStatsStorage: Record<string, PitchingStats[]> = {};

// Mock roster data
const mockRosters: Record<string, RosterPlayer[]> = {
  rays: [
    { playerId: 'ray-1', playerName: 'Jake Morrison', jerseyNumber: '7', primaryPosition: 'CF' },
    { playerId: 'ray-2', playerName: 'Tyler Chen', jerseyNumber: '12', primaryPosition: 'SS' },
    { playerId: 'ray-3', playerName: 'Brandon Walsh', jerseyNumber: '21', primaryPosition: '1B' },
    { playerId: 'ray-4', playerName: 'Marcus Reed', jerseyNumber: '35', primaryPosition: '3B' },
    { playerId: 'ray-5', playerName: 'Derek Foster', jerseyNumber: '8', primaryPosition: 'LF' },
    { playerId: 'ray-6', playerName: 'Kyle Patterson', jerseyNumber: '24', primaryPosition: 'RF' },
    { playerId: 'ray-7', playerName: 'Evan Brooks', jerseyNumber: '5', primaryPosition: '2B' },
    { playerId: 'ray-8', playerName: 'Noah Simmons', jerseyNumber: '18', primaryPosition: 'C' },
    { playerId: 'ray-9', playerName: 'Ryan Howard', jerseyNumber: '42', primaryPosition: 'DH' },
    { playerId: 'ray-10', playerName: 'Justin Torres', jerseyNumber: '31', primaryPosition: 'P', isPitcher: true },
    { playerId: 'ray-11', playerName: 'Alex Rivera', jerseyNumber: '45', primaryPosition: 'P', isPitcher: true },
    { playerId: 'ray-12', playerName: 'Chris Baker', jerseyNumber: '52', primaryPosition: 'UTIL' },
  ],
  pirates: [
    { playerId: 'pir-1', playerName: 'Mason Clark', jerseyNumber: '3', primaryPosition: 'CF' },
    { playerId: 'pir-2', playerName: 'Dylan Wright', jerseyNumber: '11', primaryPosition: 'SS' },
    { playerId: 'pir-3', playerName: 'Cameron Jones', jerseyNumber: '28', primaryPosition: '1B' },
    { playerId: 'pir-4', playerName: 'Ethan Hall', jerseyNumber: '16', primaryPosition: '3B' },
    { playerId: 'pir-5', playerName: 'Jordan King', jerseyNumber: '9', primaryPosition: 'LF' },
    { playerId: 'pir-6', playerName: 'Lucas Green', jerseyNumber: '23', primaryPosition: 'RF' },
    { playerId: 'pir-7', playerName: 'Nathan Lopez', jerseyNumber: '4', primaryPosition: '2B' },
    { playerId: 'pir-8', playerName: 'Sean Murphy', jerseyNumber: '17', primaryPosition: 'C' },
    { playerId: 'pir-9', playerName: 'Blake Hill', jerseyNumber: '44', primaryPosition: 'DH' },
    { playerId: 'pir-10', playerName: 'Hunter Scott', jerseyNumber: '33', primaryPosition: 'P', isPitcher: true },
    { playerId: 'pir-11', playerName: 'Colby Adams', jerseyNumber: '48', primaryPosition: 'P', isPitcher: true },
    { playerId: 'pir-12', playerName: 'Jared Baker', jerseyNumber: '55', primaryPosition: 'UTIL' },
  ],
  athletics: [
    { playerId: 'ath-1', playerName: 'Austin Price', jerseyNumber: '6', primaryPosition: 'CF' },
    { playerId: 'ath-2', playerName: 'Trevor Young', jerseyNumber: '14', primaryPosition: 'SS' },
    { playerId: 'ath-3', playerName: 'Gavin Roberts', jerseyNumber: '25', primaryPosition: '1B' },
    { playerId: 'ath-4', playerName: 'Logan Carter', jerseyNumber: '19', primaryPosition: '3B' },
    { playerId: 'ath-5', playerName: 'Owen Mitchell', jerseyNumber: '10', primaryPosition: 'LF' },
    { playerId: 'ath-6', playerName: 'Carter White', jerseyNumber: '27', primaryPosition: 'RF' },
    { playerId: 'ath-7', playerName: 'Wyatt Thomas', jerseyNumber: '2', primaryPosition: '2B' },
    { playerId: 'ath-8', playerName: 'Landon Martin', jerseyNumber: '20', primaryPosition: 'C' },
    { playerId: 'ath-9', playerName: 'Cooper Lee', jerseyNumber: '38', primaryPosition: 'DH' },
    { playerId: 'ath-10', playerName: 'Max Turner', jerseyNumber: '36', primaryPosition: 'P', isPitcher: true },
    { playerId: 'ath-11', playerName: 'Eli Harris', jerseyNumber: '49', primaryPosition: 'P', isPitcher: true },
    { playerId: 'ath-12', playerName: 'Tyler Cook', jerseyNumber: '56', primaryPosition: 'UTIL' },
  ],
  mariners: [
    { playerId: 'mar-1', playerName: 'Caleb Allen', jerseyNumber: '1', primaryPosition: 'CF' },
    { playerId: 'mar-2', playerName: 'Liam Edwards', jerseyNumber: '13', primaryPosition: 'SS' },
    { playerId: 'mar-3', playerName: 'Jacob Collins', jerseyNumber: '29', primaryPosition: '1B' },
    { playerId: 'mar-4', playerName: 'Henry Stewart', jerseyNumber: '15', primaryPosition: '3B' },
    { playerId: 'mar-5', playerName: 'Sebastian Flores', jerseyNumber: '11', primaryPosition: 'LF' },
    { playerId: 'mar-6', playerName: 'Daniel Morgan', jerseyNumber: '26', primaryPosition: 'RF' },
    { playerId: 'mar-7', playerName: 'Isaac Bell', jerseyNumber: '3', primaryPosition: '2B' },
    { playerId: 'mar-8', playerName: 'Matthew Peterson', jerseyNumber: '22', primaryPosition: 'C' },
    { playerId: 'mar-9', playerName: 'Andrew Gray', jerseyNumber: '40', primaryPosition: 'DH' },
    { playerId: 'mar-10', playerName: 'Samuel Parker', jerseyNumber: '34', primaryPosition: 'P', isPitcher: true },
    { playerId: 'mar-11', playerName: 'David Ramirez', jerseyNumber: '47', primaryPosition: 'P', isPitcher: true },
    { playerId: 'mar-12', playerName: 'Jack Hughes', jerseyNumber: '54', primaryPosition: 'UTIL' },
  ],
  rockies: [
    { playerId: 'roc-1', playerName: 'Mike Johnson', jerseyNumber: '7', primaryPosition: 'CF' },
    { playerId: 'roc-2', playerName: 'David Smith', jerseyNumber: '12', primaryPosition: 'SS' },
    { playerId: 'roc-3', playerName: 'Chris Williams', jerseyNumber: '21', primaryPosition: '1B' },
    { playerId: 'roc-4', playerName: 'Alex Brown', jerseyNumber: '35', primaryPosition: '3B' },
    { playerId: 'roc-5', playerName: 'Ryan Davis', jerseyNumber: '8', primaryPosition: 'LF' },
    { playerId: 'roc-6', playerName: 'Tyler Miller', jerseyNumber: '24', primaryPosition: 'RF' },
    { playerId: 'roc-7', playerName: 'Kevin Wilson', jerseyNumber: '5', primaryPosition: '2B' },
    { playerId: 'roc-8', playerName: 'Matt Taylor', jerseyNumber: '18', primaryPosition: 'C' },
    { playerId: 'roc-9', playerName: 'Jake Anderson', jerseyNumber: '42', primaryPosition: 'DH' },
    { playerId: 'roc-10', playerName: 'Tom Roberts', jerseyNumber: '31', primaryPosition: 'P', isPitcher: true },
    { playerId: 'roc-11', playerName: 'Sam Thompson', jerseyNumber: '45', primaryPosition: 'P', isPitcher: true },
    { playerId: 'roc-12', playerName: 'Josh Martinez', jerseyNumber: '52', primaryPosition: 'UTIL' },
  ],
  diamondbacks: [
    { playerId: 'dbk-1', playerName: 'Brian Lee', jerseyNumber: '3', primaryPosition: 'CF' },
    { playerId: 'dbk-2', playerName: 'Jason Clark', jerseyNumber: '11', primaryPosition: 'SS' },
    { playerId: 'dbk-3', playerName: 'Steve Young', jerseyNumber: '28', primaryPosition: '1B' },
    { playerId: 'dbk-4', playerName: 'Eric Hall', jerseyNumber: '16', primaryPosition: '3B' },
    { playerId: 'dbk-5', playerName: 'Dan Wright', jerseyNumber: '9', primaryPosition: 'LF' },
    { playerId: 'dbk-6', playerName: 'Jeff King', jerseyNumber: '23', primaryPosition: 'RF' },
    { playerId: 'dbk-7', playerName: 'Mark Lopez', jerseyNumber: '4', primaryPosition: '2B' },
    { playerId: 'dbk-8', playerName: 'Paul Green', jerseyNumber: '17', primaryPosition: 'C' },
    { playerId: 'dbk-9', playerName: 'Nick Hill', jerseyNumber: '44', primaryPosition: 'DH' },
    { playerId: 'dbk-10', playerName: 'Rick Scott', jerseyNumber: '33', primaryPosition: 'P', isPitcher: true },
    { playerId: 'dbk-11', playerName: 'Ben Adams', jerseyNumber: '48', primaryPosition: 'P', isPitcher: true },
    { playerId: 'dbk-12', playerName: 'Joe Baker', jerseyNumber: '55', primaryPosition: 'UTIL' },
  ],
};

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get team roster for stats entry
 */
export async function getStatsEntryRoster(teamId: string): Promise<RosterPlayer[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return mockRosters[teamId] || [];
}

/**
 * Get all stats for a game
 */
export async function getGameStats(gameId: string): Promise<GameStatsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const homeBatting = battingStatsStorage[`${gameId}-home`] || [];
  const awayBatting = battingStatsStorage[`${gameId}-away`] || [];
  const homePitching = pitchingStatsStorage[`${gameId}-home`] || [];
  const awayPitching = pitchingStatsStorage[`${gameId}-away`] || [];

  return {
    gameId,
    batting: {
      home: homeBatting,
      away: awayBatting,
    },
    pitching: {
      home: homePitching,
      away: awayPitching,
    },
    summary: {
      homeBattingCount: homeBatting.length,
      awayBattingCount: awayBatting.length,
      homePitchingCount: homePitching.length,
      awayPitchingCount: awayPitching.length,
      isComplete:
        homeBatting.length > 0 &&
        awayBatting.length > 0 &&
        homePitching.length > 0 &&
        awayPitching.length > 0,
    },
  };
}

/**
 * Get batting stats for a team in a game
 */
export async function getGameBattingStats(
  gameId: string,
  teamType: 'home' | 'away'
): Promise<BattingStats[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return battingStatsStorage[`${gameId}-${teamType}`] || [];
}

/**
 * Get pitching stats for a team in a game
 */
export async function getGamePitchingStats(
  gameId: string,
  teamType: 'home' | 'away'
): Promise<PitchingStats[]> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return pitchingStatsStorage[`${gameId}-${teamType}`] || [];
}

/**
 * Save batting stats for a team in a game
 */
export async function saveBattingStats(
  gameId: string,
  teamType: 'home' | 'away',
  stats: BattingStats[]
): Promise<{ savedCount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  battingStatsStorage[`${gameId}-${teamType}`] = stats;

  return { savedCount: stats.length };
}

/**
 * Save pitching stats for a team in a game
 */
export async function savePitchingStats(
  gameId: string,
  teamType: 'home' | 'away',
  stats: PitchingStats[]
): Promise<{ savedCount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  pitchingStatsStorage[`${gameId}-${teamType}`] = stats;

  return { savedCount: stats.length };
}

/**
 * Delete all stats for a game
 */
export async function deleteGameStats(gameId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  delete battingStatsStorage[`${gameId}-home`];
  delete battingStatsStorage[`${gameId}-away`];
  delete pitchingStatsStorage[`${gameId}-home`];
  delete pitchingStatsStorage[`${gameId}-away`];
}

/**
 * Import stats from another game as template
 */
export async function importStatsFromGame(
  sourceGameId: string,
  targetGameId: string,
  teamType: 'home' | 'away'
): Promise<{
  battingCount: number;
  pitchingCount: number;
}> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const sourceBatting = battingStatsStorage[`${sourceGameId}-${teamType}`] || [];
  const sourcePitching = pitchingStatsStorage[`${sourceGameId}-${teamType}`] || [];

  // Copy stats with new game ID and reset values
  const newBatting: BattingStats[] = sourceBatting.map((stat) => ({
    ...stat,
    id: `${targetGameId}-${stat.playerId}-batting`,
    gameId: targetGameId,
    // Reset all counting stats to 0
    plateAppearances: 0,
    atBats: 0,
    runs: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    runsBattedIn: 0,
    walks: 0,
    strikeouts: 0,
    hitByPitch: 0,
    sacrificeFlies: 0,
    sacrificeBunts: 0,
    stolenBases: 0,
    caughtStealing: 0,
    groundIntoDoublePlays: 0,
    leftOnBase: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const newPitching: PitchingStats[] = sourcePitching.map((stat) => ({
    ...stat,
    id: `${targetGameId}-${stat.playerId}-pitching`,
    gameId: targetGameId,
    // Reset all stats
    inningsPitched: 0,
    hitsAllowed: 0,
    runsAllowed: 0,
    earnedRuns: 0,
    walks: 0,
    strikeouts: 0,
    homeRunsAllowed: 0,
    battersFaced: 0,
    pitchesThrown: null,
    strikes: null,
    hitBatters: 0,
    wildPitches: 0,
    balks: 0,
    decision: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Store the imported stats
  battingStatsStorage[`${targetGameId}-${teamType}`] = newBatting;
  pitchingStatsStorage[`${targetGameId}-${teamType}`] = newPitching;

  return {
    battingCount: newBatting.length,
    pitchingCount: newPitching.length,
  };
}

/**
 * Calculate plate appearances from stats components
 */
export function calculatePlateAppearances(stat: {
  atBats: number;
  walks: number;
  hitByPitch: number;
  sacrificeFlies: number;
  sacrificeBunts: number;
}): number {
  return stat.atBats + stat.walks + stat.hitByPitch + stat.sacrificeFlies + stat.sacrificeBunts;
}

/**
 * Validate batting stats
 */
export function validateBattingStats(stat: Partial<BattingStats>): Record<string, string> {
  const errors: Record<string, string> = {};

  // Hits cannot exceed at bats
  if ((stat.hits || 0) > (stat.atBats || 0)) {
    errors.hits = 'Hits cannot exceed at bats';
  }

  // Extra base hits cannot exceed hits
  const extraBaseHits = (stat.doubles || 0) + (stat.triples || 0) + (stat.homeRuns || 0);
  if (extraBaseHits > (stat.hits || 0)) {
    errors.doubles = '2B + 3B + HR cannot exceed hits';
  }

  // Strikeouts cannot exceed at bats
  if ((stat.strikeouts || 0) > (stat.atBats || 0)) {
    errors.strikeouts = 'Strikeouts cannot exceed at bats';
  }

  return errors;
}

/**
 * Validate pitching stats
 */
export function validatePitchingStats(stat: Partial<PitchingStats>): Record<string, string> {
  const errors: Record<string, string> = {};

  // Earned runs cannot exceed runs allowed
  if ((stat.earnedRuns || 0) > (stat.runsAllowed || 0)) {
    errors.earnedRuns = 'Earned runs cannot exceed runs allowed';
  }

  // Strikes cannot exceed pitches
  if (stat.pitchesThrown && stat.strikes && stat.strikes > stat.pitchesThrown) {
    errors.strikes = 'Strikes cannot exceed pitches thrown';
  }

  return errors;
}
