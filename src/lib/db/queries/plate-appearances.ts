/**
 * Plate Appearances Queries
 * Query functions for plate appearance data (scorebook-style stats)
 * Currently uses mock in-memory storage, will be replaced with PostgreSQL queries
 */

import type {
  PlateAppearance,
  PlayerPlateAppearances,
  PlateAppearanceEntry,
  PlateAppearanceResultType,
  PlateAppearanceSubtype,
  HitType,
  WalkType,
  OutType,
  SacrificeType,
} from '@/types/plate-appearance.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input type for saving a player's plate appearances
 */
export interface SavePlateAppearancesInput {
  gameId: string;
  teamId: string;
  playerId: string;
  plateAppearances: PlateAppearance[];
  runs: number;
  rbis: number;
  stolenBases: number;
  caughtStealing: number;
}

/**
 * Validation result for plate appearances
 */
export interface PlateAppearanceValidationResult {
  valid: boolean;
  errors: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VALID_RESULT_TYPES: PlateAppearanceResultType[] = ['hit', 'walk', 'out', 'sacrifice'];

const VALID_HIT_SUBTYPES: HitType[] = ['1B', '2B', '3B', 'HR'];
const VALID_WALK_SUBTYPES: WalkType[] = ['BB', 'IBB', 'HBP'];
const VALID_OUT_SUBTYPES: OutType[] = ['K', 'Kc', 'GO', 'FO', 'LO', 'PO', 'DP', 'FC'];
const VALID_SACRIFICE_SUBTYPES: SacrificeType[] = ['SAC', 'SF'];

const VALID_SUBTYPES_BY_TYPE: Record<PlateAppearanceResultType, PlateAppearanceSubtype[]> = {
  hit: VALID_HIT_SUBTYPES,
  walk: VALID_WALK_SUBTYPES,
  out: VALID_OUT_SUBTYPES,
  sacrifice: VALID_SACRIFICE_SUBTYPES,
};

// =============================================================================
// MOCK DATA STORAGE
// =============================================================================

/**
 * In-memory storage for plate appearances (will be replaced with database)
 * Key format: `${gameId}-${teamType}` for team-level access
 */
const plateAppearancesStorage: Record<string, PlayerPlateAppearances[]> = {};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Simulate async database delay
 */
async function simulateDelay(ms: number = 10): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate storage key for a game and team
 */
function getStorageKey(gameId: string, teamType: 'home' | 'away'): string {
  return `${gameId}-${teamType}`;
}

/**
 * Check if a subtype is valid for a given result type
 */
function isValidSubtypeForType(
  resultType: PlateAppearanceResultType,
  subtype: PlateAppearanceSubtype
): boolean {
  const validSubtypes = VALID_SUBTYPES_BY_TYPE[resultType];
  return validSubtypes?.includes(subtype) ?? false;
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all plate appearances for a game
 * Optionally filter by team type (home/away)
 */
export async function getGamePlateAppearances(
  gameId: string,
  teamType?: 'home' | 'away'
): Promise<PlayerPlateAppearances[]> {
  await simulateDelay();

  if (teamType) {
    // Return plate appearances for specific team
    const key = getStorageKey(gameId, teamType);
    return plateAppearancesStorage[key] || [];
  }

  // Return all plate appearances for the game (both teams)
  const homeKey = getStorageKey(gameId, 'home');
  const awayKey = getStorageKey(gameId, 'away');

  const homePAs = plateAppearancesStorage[homeKey] || [];
  const awayPAs = plateAppearancesStorage[awayKey] || [];

  return [...homePAs, ...awayPAs];
}

/**
 * Get plate appearances for a specific player in a game
 */
export async function getPlayerPlateAppearances(
  gameId: string,
  playerId: string
): Promise<PlayerPlateAppearances | null> {
  await simulateDelay();

  // Search both home and away teams
  for (const teamType of ['home', 'away'] as const) {
    const key = getStorageKey(gameId, teamType);
    const teamPAs = plateAppearancesStorage[key] || [];
    const playerData = teamPAs.find((p) => p.playerId === playerId);
    if (playerData) {
      return playerData;
    }
  }

  return null;
}

/**
 * Save plate appearances for a single player
 */
export async function savePlateAppearances(
  input: SavePlateAppearancesInput
): Promise<{ success: boolean }> {
  await simulateDelay();

  // Determine team type from teamId (in real implementation, this would be looked up)
  // For mock, we'll use a simple approach - check if data already exists
  let teamType: 'home' | 'away' = 'home';

  // Check which team storage contains this player or default to home
  for (const type of ['home', 'away'] as const) {
    const key = getStorageKey(input.gameId, type);
    const existing = plateAppearancesStorage[key] || [];
    if (existing.some((p) => p.playerId === input.playerId)) {
      teamType = type;
      break;
    }
  }

  const key = getStorageKey(input.gameId, teamType);
  const existing = plateAppearancesStorage[key] || [];

  // Create player plate appearances object
  const playerPAs: PlayerPlateAppearances = {
    playerId: input.playerId,
    plateAppearances: input.plateAppearances,
    runs: input.runs,
    rbis: input.rbis,
    stolenBases: input.stolenBases,
    caughtStealing: input.caughtStealing,
  };

  // Update or add player data
  const existingIndex = existing.findIndex((p) => p.playerId === input.playerId);
  if (existingIndex >= 0) {
    existing[existingIndex] = playerPAs;
  } else {
    existing.push(playerPAs);
  }

  plateAppearancesStorage[key] = existing;

  return { success: true };
}

/**
 * Save all plate appearances for a team in a game
 */
export async function saveTeamPlateAppearances(
  gameId: string,
  teamType: 'home' | 'away',
  playersData: SavePlateAppearancesInput[]
): Promise<{ savedCount: number }> {
  await simulateDelay();

  const key = getStorageKey(gameId, teamType);

  // Convert input data to storage format
  const teamPAs: PlayerPlateAppearances[] = playersData.map((input) => ({
    playerId: input.playerId,
    plateAppearances: input.plateAppearances,
    runs: input.runs,
    rbis: input.rbis,
    stolenBases: input.stolenBases,
    caughtStealing: input.caughtStealing,
  }));

  plateAppearancesStorage[key] = teamPAs;

  return { savedCount: teamPAs.length };
}

/**
 * Delete plate appearances for a player in a game
 */
export async function deletePlateAppearances(
  gameId: string,
  playerId: string
): Promise<{ success: boolean }> {
  await simulateDelay();

  let deleted = false;

  // Search and remove from both team storages
  for (const teamType of ['home', 'away'] as const) {
    const key = getStorageKey(gameId, teamType);
    const existing = plateAppearancesStorage[key];

    if (existing) {
      const initialLength = existing.length;
      plateAppearancesStorage[key] = existing.filter((p) => p.playerId !== playerId);

      if (plateAppearancesStorage[key].length < initialLength) {
        deleted = true;
      }
    }
  }

  return { success: deleted };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate an array of plate appearances
 * Checks for valid result types, subtypes, notation, RBI values, and PA numbering
 */
export function validatePlateAppearances(
  pas: PlateAppearance[]
): PlateAppearanceValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(pas)) {
    return { valid: false, errors: ['Plate appearances must be an array'] };
  }

  if (pas.length === 0) {
    // Empty array is valid (player may not have batted)
    return { valid: true, errors: [] };
  }

  // Track PA numbers for sequential validation
  const paNumbers = new Set<number>();

  for (let i = 0; i < pas.length; i++) {
    const pa = pas[i];
    const paLabel = `PA #${pa.paNumber || i + 1}`;

    // Validate resultType
    if (!pa.resultType || !VALID_RESULT_TYPES.includes(pa.resultType)) {
      errors.push(`${paLabel}: Invalid result type "${pa.resultType}"`);
    }

    // Validate resultSubtype matches resultType
    if (pa.resultType && pa.resultSubtype) {
      if (!isValidSubtypeForType(pa.resultType, pa.resultSubtype)) {
        errors.push(
          `${paLabel}: Subtype "${pa.resultSubtype}" is not valid for result type "${pa.resultType}"`
        );
      }
    } else if (!pa.resultSubtype) {
      errors.push(`${paLabel}: Missing result subtype`);
    }

    // Validate notation for outs (must not be empty)
    if (pa.resultType === 'out') {
      if (!pa.notation || pa.notation.trim() === '') {
        errors.push(`${paLabel}: Notation is required for outs`);
      }
    }

    // Validate RBI values (0-4)
    if (pa.rbiOnPlay !== undefined && pa.rbiOnPlay !== null) {
      if (typeof pa.rbiOnPlay !== 'number' || pa.rbiOnPlay < 0 || pa.rbiOnPlay > 4) {
        errors.push(`${paLabel}: RBI must be between 0 and 4, got ${pa.rbiOnPlay}`);
      }
      // Grand slam is max 4 RBI
      if (pa.rbiOnPlay === 4 && pa.resultSubtype !== 'HR') {
        errors.push(`${paLabel}: 4 RBI is only valid on a home run`);
      }
    }

    // Track PA numbers
    if (pa.paNumber) {
      if (paNumbers.has(pa.paNumber)) {
        errors.push(`${paLabel}: Duplicate PA number ${pa.paNumber}`);
      }
      paNumbers.add(pa.paNumber);
    }
  }

  // Validate PA numbers are sequential starting from 1
  if (paNumbers.size > 0) {
    const sortedNumbers = Array.from(paNumbers).sort((a, b) => a - b);

    // Check that it starts at 1
    if (sortedNumbers[0] !== 1) {
      errors.push(`PA numbers must start at 1, got ${sortedNumbers[0]}`);
    }

    // Check for gaps in sequence
    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== sortedNumbers[i - 1] + 1) {
        errors.push(
          `PA numbers must be sequential: gap between ${sortedNumbers[i - 1]} and ${sortedNumbers[i]}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single plate appearance entry
 */
export function validateSinglePlateAppearance(
  pa: Partial<PlateAppearance>
): PlateAppearanceValidationResult {
  const errors: string[] = [];

  // Validate resultType
  if (!pa.resultType || !VALID_RESULT_TYPES.includes(pa.resultType)) {
    errors.push(`Invalid result type "${pa.resultType}"`);
  }

  // Validate resultSubtype
  if (pa.resultType && pa.resultSubtype) {
    if (!isValidSubtypeForType(pa.resultType, pa.resultSubtype)) {
      errors.push(
        `Subtype "${pa.resultSubtype}" is not valid for result type "${pa.resultType}"`
      );
    }
  } else if (!pa.resultSubtype) {
    errors.push('Missing result subtype');
  }

  // Validate notation for outs
  if (pa.resultType === 'out' && (!pa.notation || pa.notation.trim() === '')) {
    errors.push('Notation is required for outs');
  }

  // Validate RBI
  if (pa.rbiOnPlay !== undefined && pa.rbiOnPlay !== null) {
    if (typeof pa.rbiOnPlay !== 'number' || pa.rbiOnPlay < 0 || pa.rbiOnPlay > 4) {
      errors.push(`RBI must be between 0 and 4`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clear all plate appearances for a game
 */
export async function clearGamePlateAppearances(gameId: string): Promise<void> {
  await simulateDelay();

  const homeKey = getStorageKey(gameId, 'home');
  const awayKey = getStorageKey(gameId, 'away');

  delete plateAppearancesStorage[homeKey];
  delete plateAppearancesStorage[awayKey];
}

/**
 * Get plate appearance summary for a game
 */
export async function getGamePlateAppearancesSummary(
  gameId: string
): Promise<{
  homePlayerCount: number;
  awayPlayerCount: number;
  homeTotalPAs: number;
  awayTotalPAs: number;
  isComplete: boolean;
}> {
  await simulateDelay();

  const homeKey = getStorageKey(gameId, 'home');
  const awayKey = getStorageKey(gameId, 'away');

  const homePAs = plateAppearancesStorage[homeKey] || [];
  const awayPAs = plateAppearancesStorage[awayKey] || [];

  const homeTotalPAs = homePAs.reduce((sum, p) => sum + p.plateAppearances.length, 0);
  const awayTotalPAs = awayPAs.reduce((sum, p) => sum + p.plateAppearances.length, 0);

  return {
    homePlayerCount: homePAs.length,
    awayPlayerCount: awayPAs.length,
    homeTotalPAs,
    awayTotalPAs,
    isComplete: homePAs.length > 0 && awayPAs.length > 0,
  };
}

/**
 * Create an empty plate appearance record
 */
export function createEmptyPlateAppearance(paNumber: number): PlateAppearance {
  return {
    id: `pa-${Date.now()}-${paNumber}`,
    paNumber,
    resultType: 'out',
    resultSubtype: 'GO',
    notation: '',
    rbiOnPlay: 0,
    runScored: false,
  };
}

/**
 * Create a plate appearance entry with form state
 */
export function createPlateAppearanceEntry(
  paNumber: number,
  defaults?: Partial<PlateAppearance>
): PlateAppearanceEntry {
  return {
    ...createEmptyPlateAppearance(paNumber),
    ...defaults,
    hasChanges: false,
    errors: undefined,
  };
}
