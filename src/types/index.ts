/**
 * Type exports for CNEBL
 */

// Auth types (SessionUser, LoginFormData, etc.)
export * from './auth';

// Database types - exclude User to avoid conflict with auth.User
// Import database User as DbUser if needed
export {
  // Enums
  type UserRole,
  type GameStatus,
  type FieldPosition,
  type BattingSide,
  type ThrowingArm,
  type AvailabilityStatus,
  type PitchingDecision,
  type InningHalf,
  // Core tables (excluding User)
  type Season,
  type Team,
  type Player,
  type Game,
  type BattingStats,
  type PitchingStats,
  type Message,
  type Announcement,
  type Availability,
  // Views
  type Standing,
  type PlayerBattingTotals,
  type PlayerPitchingTotals,
  // Join types
  type TeamWithManager,
  type PlayerWithDetails,
  type GameWithTeams,
  type BattingStatsWithPlayer,
  type PitchingStatsWithPlayer,
} from './database.types';

// Re-export database User with a different name to avoid conflict
export type { User as DbUser } from './database.types';

// API types
export * from './api.types';

// Plate appearance types
export * from './plate-appearance.types';
