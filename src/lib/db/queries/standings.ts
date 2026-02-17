/**
 * Standings Queries
 * Query functions for league standings
 * Currently returns mock data, will be replaced with PostgreSQL queries
 */

import { teams } from '@/lib/mock-data';
import type { Standing } from '@/types';

// =============================================================================
// MOCK STANDINGS DATA
// =============================================================================

// Mock standings data with calculated stats
const mockStandings: Standing[] = [
  {
    teamId: 'seadogs',
    teamName: 'Seadogs',
    abbreviation: 'SEA',
    logoUrl: null,
    primaryColor: '#1B3A5F',
    wins: 8,
    losses: 4,
    ties: 0,
    gamesPlayed: 12,
    winPct: 0.667,
    runsScored: 68,
    runsAllowed: 42,
    runDifferential: 26,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
  {
    teamId: 'mariners',
    teamName: 'Mariners',
    abbreviation: 'MAR',
    logoUrl: null,
    primaryColor: '#2D5A27',
    wins: 7,
    losses: 5,
    ties: 0,
    gamesPlayed: 12,
    winPct: 0.583,
    runsScored: 62,
    runsAllowed: 48,
    runDifferential: 14,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
  {
    teamId: 'noreasters',
    teamName: "Nor'easters",
    abbreviation: 'NOR',
    logoUrl: null,
    primaryColor: '#4A6FA5',
    wins: 6,
    losses: 6,
    ties: 0,
    gamesPlayed: 12,
    winPct: 0.500,
    runsScored: 58,
    runsAllowed: 52,
    runDifferential: 6,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
  {
    teamId: 'anchors',
    teamName: 'Anchors',
    abbreviation: 'ANC',
    logoUrl: null,
    primaryColor: '#1B3A5F',
    wins: 5,
    losses: 6,
    ties: 1,
    gamesPlayed: 12,
    winPct: 0.458,
    runsScored: 52,
    runsAllowed: 54,
    runDifferential: -2,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
  {
    teamId: 'clippers',
    teamName: 'Clippers',
    abbreviation: 'CLI',
    logoUrl: null,
    primaryColor: '#8B4513',
    wins: 5,
    losses: 7,
    ties: 0,
    gamesPlayed: 12,
    winPct: 0.417,
    runsScored: 54,
    runsAllowed: 56,
    runDifferential: -2,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
  {
    teamId: 'tides',
    teamName: 'Tides',
    abbreviation: 'TID',
    logoUrl: null,
    primaryColor: '#006D77',
    wins: 4,
    losses: 7,
    ties: 1,
    gamesPlayed: 12,
    winPct: 0.375,
    runsScored: 48,
    runsAllowed: 62,
    runDifferential: -14,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    seasonYear: 2026,
  },
];

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export interface GetStandingsOptions {
  seasonId?: string;
}

/**
 * Get league standings
 */
export async function getStandings(options: GetStandingsOptions = {}): Promise<{
  standings: Standing[];
  seasonId: string;
  seasonName: string;
  asOf: string;
}> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Sort standings by win percentage, then by wins, then by run differential
  const sorted = [...mockStandings].sort((a, b) => {
    if (a.winPct !== b.winPct) return b.winPct - a.winPct;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return b.runDifferential - a.runDifferential;
  });

  return {
    standings: sorted,
    seasonId: 'season-2026',
    seasonName: 'Spring 2026',
    asOf: new Date().toISOString(),
  };
}

/**
 * Get available seasons
 */
export async function getSeasons(): Promise<{
  id: string;
  name: string;
  year: number;
  isActive: boolean;
}[]> {
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  return [
    { id: 'season-2026', name: 'Spring 2026', year: 2026, isActive: true },
    { id: 'season-2025', name: 'Fall 2025', year: 2025, isActive: false },
    { id: 'season-2025-spring', name: 'Spring 2025', year: 2025, isActive: false },
  ];
}
