/**
 * Plate Appearance Types for CNEBL
 * Used for scorebook-style game stats entry
 */

// =============================================================================
// RESULT CATEGORY TYPES
// =============================================================================

/**
 * Top-level classification of a plate appearance result
 */
export type PlateAppearanceResultType = 'hit' | 'walk' | 'out' | 'sacrifice';

// =============================================================================
// DETAILED SUBTYPE ENUMS
// =============================================================================

/**
 * Hit subtypes - base hits categorized by number of bases
 * 1B = Single, 2B = Double, 3B = Triple, HR = Home Run
 */
export type HitType = '1B' | '2B' | '3B' | 'HR';

/**
 * Walk subtypes - plate appearances reaching base via walk or hit by pitch
 * BB = Walk, IBB = Intentional Walk, HBP = Hit By Pitch
 */
export type WalkType = 'BB' | 'IBB' | 'HBP';

/**
 * Out subtypes - various ways a batter can be put out
 * K = Strikeout (swinging), Kc = Strikeout (called/looking)
 * GO = Ground Out, FO = Fly Out, LO = Line Out, PO = Pop Out
 * DP = Double Play, FC = Fielder's Choice
 */
export type OutType = 'K' | 'Kc' | 'GO' | 'FO' | 'LO' | 'PO' | 'DP' | 'FC';

/**
 * Sacrifice subtypes - productive outs
 * SAC = Sacrifice Bunt, SF = Sacrifice Fly
 */
export type SacrificeType = 'SAC' | 'SF';

/**
 * Union of all plate appearance subtypes
 */
export type PlateAppearanceSubtype = HitType | WalkType | OutType | SacrificeType;

// =============================================================================
// PLATE APPEARANCE RECORDS
// =============================================================================

/**
 * Individual plate appearance record
 * Represents a single at-bat/plate appearance in a game
 */
export interface PlateAppearance {
  id: string;
  paNumber: number;               // 1, 2, 3, etc. (order within game)
  resultType: PlateAppearanceResultType;
  resultSubtype: PlateAppearanceSubtype;
  notation: string;               // Full notation e.g., "6-3", "F8", "1B"
  rbiOnPlay: number;              // RBIs credited on this PA (0-4)
  runScored: boolean;             // Did batter score on this play?
  notes?: string;                 // Optional notes for the play
}

/**
 * Player's complete PA data for a game
 * Aggregates all plate appearances and baserunning stats
 */
export interface PlayerPlateAppearances {
  playerId: string;
  plateAppearances: PlateAppearance[];
  stolenBases: number;
  caughtStealing: number;
  runs: number;
  rbis: number;
}

// =============================================================================
// FORM/UI TYPES
// =============================================================================

/**
 * Entry type for the plate appearance form
 * Extends PlateAppearance with UI state for form handling
 */
export interface PlateAppearanceEntry extends PlateAppearance {
  hasChanges: boolean;
  errors?: Record<string, string>;
}

// =============================================================================
// COMPUTED STATISTICS
// =============================================================================

/**
 * Computed batting stats from plate appearances
 * All statistics derived from analyzing PA records
 */
export interface ComputedBattingStats {
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  intentionalWalks: number;
  hitByPitch: number;
  strikeouts: number;
  sacrificeFlies: number;
  sacrificeBunts: number;
  groundIntoDoublePlays: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Compute aggregated batting stats from an array of plate appearances
 * @param pas - Array of PlateAppearance records
 * @returns ComputedBattingStats with all calculated totals
 */
export function computeStatsFromPAs(pas: PlateAppearance[]): ComputedBattingStats {
  const stats: ComputedBattingStats = {
    plateAppearances: 0,
    atBats: 0,
    hits: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    walks: 0,
    intentionalWalks: 0,
    hitByPitch: 0,
    strikeouts: 0,
    sacrificeFlies: 0,
    sacrificeBunts: 0,
    groundIntoDoublePlays: 0,
  };

  for (const pa of pas) {
    stats.plateAppearances++;

    switch (pa.resultType) {
      case 'hit':
        stats.hits++;
        // At-bats include hits
        stats.atBats++;
        // Count specific hit types
        switch (pa.resultSubtype as HitType) {
          case '1B':
            stats.singles++;
            break;
          case '2B':
            stats.doubles++;
            break;
          case '3B':
            stats.triples++;
            break;
          case 'HR':
            stats.homeRuns++;
            break;
        }
        break;

      case 'walk':
        // Walks do NOT count as at-bats
        switch (pa.resultSubtype as WalkType) {
          case 'BB':
            stats.walks++;
            break;
          case 'IBB':
            stats.intentionalWalks++;
            stats.walks++; // IBB also counts toward total walks
            break;
          case 'HBP':
            stats.hitByPitch++;
            break;
        }
        break;

      case 'out':
        // Outs count as at-bats
        stats.atBats++;
        switch (pa.resultSubtype as OutType) {
          case 'K':
          case 'Kc':
            stats.strikeouts++;
            break;
          case 'DP':
            stats.groundIntoDoublePlays++;
            break;
          // GO, FO, LO, PO, FC don't have separate counters
        }
        break;

      case 'sacrifice':
        // Sacrifices do NOT count as at-bats
        switch (pa.resultSubtype as SacrificeType) {
          case 'SAC':
            stats.sacrificeBunts++;
            break;
          case 'SF':
            stats.sacrificeFlies++;
            break;
        }
        break;
    }
  }

  return stats;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a subtype is a hit type
 */
export function isHitType(subtype: PlateAppearanceSubtype): subtype is HitType {
  return ['1B', '2B', '3B', 'HR'].includes(subtype);
}

/**
 * Type guard to check if a subtype is a walk type
 */
export function isWalkType(subtype: PlateAppearanceSubtype): subtype is WalkType {
  return ['BB', 'IBB', 'HBP'].includes(subtype);
}

/**
 * Type guard to check if a subtype is an out type
 */
export function isOutType(subtype: PlateAppearanceSubtype): subtype is OutType {
  return ['K', 'Kc', 'GO', 'FO', 'LO', 'PO', 'DP', 'FC'].includes(subtype);
}

/**
 * Type guard to check if a subtype is a sacrifice type
 */
export function isSacrificeType(subtype: PlateAppearanceSubtype): subtype is SacrificeType {
  return ['SAC', 'SF'].includes(subtype);
}

/**
 * Get the result type for a given subtype
 */
export function getResultTypeForSubtype(subtype: PlateAppearanceSubtype): PlateAppearanceResultType {
  if (isHitType(subtype)) return 'hit';
  if (isWalkType(subtype)) return 'walk';
  if (isOutType(subtype)) return 'out';
  if (isSacrificeType(subtype)) return 'sacrifice';
  throw new Error(`Unknown subtype: ${subtype}`);
}
