/**
 * Standings API Route
 * GET /api/standings - Returns league standings
 */

import { NextRequest } from 'next/server';
import {
  successResponse,
  internalErrorResponse,
} from '@/lib/api';
import { getStandings } from '@/lib/db/queries';

/**
 * GET /api/standings
 *
 * Query parameters:
 * - seasonId: Filter by season (optional, defaults to active season)
 *
 * Example requests:
 * - GET /api/standings
 * - GET /api/standings?seasonId=season-2026
 *
 * Response includes:
 * - standings: Array of teams with their records, sorted by win percentage
 * - seasonId: The season ID for these standings
 * - seasonName: Human-readable season name
 * - asOf: Timestamp when standings were calculated
 *
 * Standings are sorted by:
 * 1. Win percentage (descending)
 * 2. Total wins (descending)
 * 3. Run differential (descending)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') || undefined;

    const data = await getStandings({ seasonId });

    return successResponse(data);
  } catch (error) {
    console.error('[API] GET /api/standings error:', error);
    return internalErrorResponse('Failed to fetch standings');
  }
}
