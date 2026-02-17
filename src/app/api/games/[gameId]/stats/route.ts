/**
 * Game Stats API Route
 * GET /api/games/[gameId]/stats - Get stats for a game
 * POST /api/games/[gameId]/stats - Save stats for a game
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '@/lib/api';
import { auth } from '@/lib/auth';
import type { BattingStats, PitchingStats } from '@/types';

// Mock stats storage (in real app, this would be database queries)
const mockBattingStats: Record<string, BattingStats[]> = {};
const mockPitchingStats: Record<string, PitchingStats[]> = {};

interface StatsResponse {
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

/**
 * GET /api/games/[gameId]/stats
 *
 * Get all batting and pitching stats for a game
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Get stats from mock storage
    const homeBatting = mockBattingStats[`${gameId}-home`] || [];
    const awayBatting = mockBattingStats[`${gameId}-away`] || [];
    const homePitching = mockPitchingStats[`${gameId}-home`] || [];
    const awayPitching = mockPitchingStats[`${gameId}-away`] || [];

    const response: StatsResponse = {
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

    return successResponse(response);
  } catch (error) {
    console.error('[API] GET /api/games/[gameId]/stats error:', error);
    return internalErrorResponse('Failed to fetch game stats');
  }
}

interface SaveStatsRequest {
  type: 'batting' | 'pitching';
  team: 'home' | 'away';
  stats: (BattingStats | PitchingStats)[];
}

/**
 * POST /api/games/[gameId]/stats
 *
 * Save batting or pitching stats for a team in a game
 *
 * Request body:
 * {
 *   type: 'batting' | 'pitching',
 *   team: 'home' | 'away',
 *   stats: BattingStats[] | PitchingStats[]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Check admin role
    if (!['admin', 'commissioner'].includes(session.user.role)) {
      return unauthorizedResponse('Admin access required');
    }

    const { gameId } = await params;
    const body: SaveStatsRequest = await request.json();

    // Validate request body
    if (!body.type || !['batting', 'pitching'].includes(body.type)) {
      return badRequestResponse('Invalid stats type. Must be "batting" or "pitching".');
    }

    if (!body.team || !['home', 'away'].includes(body.team)) {
      return badRequestResponse('Invalid team. Must be "home" or "away".');
    }

    if (!Array.isArray(body.stats)) {
      return badRequestResponse('Stats must be an array.');
    }

    // Store stats
    const storageKey = `${gameId}-${body.team}`;
    if (body.type === 'batting') {
      mockBattingStats[storageKey] = body.stats as BattingStats[];
    } else {
      mockPitchingStats[storageKey] = body.stats as PitchingStats[];
    }

    // Return success with updated counts
    const homeBatting = mockBattingStats[`${gameId}-home`] || [];
    const awayBatting = mockBattingStats[`${gameId}-away`] || [];
    const homePitching = mockPitchingStats[`${gameId}-home`] || [];
    const awayPitching = mockPitchingStats[`${gameId}-away`] || [];

    return successResponse({
      message: `${body.type} stats saved successfully for ${body.team} team`,
      savedCount: body.stats.length,
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
    });
  } catch (error) {
    console.error('[API] POST /api/games/[gameId]/stats error:', error);
    return internalErrorResponse('Failed to save game stats');
  }
}
