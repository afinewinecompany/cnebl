/**
 * Database Types for CNEBL
 * These types match the PostgreSQL schema defined in supabase/migrations/001_initial_schema.sql
 */

// =============================================================================
// ENUM TYPES
// =============================================================================

export type UserRole = 'player' | 'manager' | 'admin' | 'commissioner';

export type GameStatus =
  | 'scheduled'
  | 'warmup'
  | 'in_progress'
  | 'final'
  | 'postponed'
  | 'cancelled'
  | 'suspended';

export type FieldPosition =
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH'
  | 'UTIL';

export type BattingSide = 'L' | 'R' | 'S';

export type ThrowingArm = 'L' | 'R';

export type AvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'tentative'
  | 'no_response';

export type PitchingDecision = 'W' | 'L' | 'S' | 'H' | 'BS' | 'ND';

export type InningHalf = 'top' | 'bottom';

/**
 * Channel types for team messaging
 * - important: Manager-only posting, all can read (announcements, schedules)
 * - general: All team members can read and post (regular team chat)
 * - substitutes: All team members can read and post (finding subs for games)
 */
export type ChannelType = 'important' | 'general' | 'substitutes';

// =============================================================================
// TABLE TYPES
// =============================================================================

/**
 * Season record - tracks different seasons/years for the league
 */
export interface Season {
  id: string;
  name: string;
  year: number;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isActive: boolean;
  registrationOpen: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

/**
 * User record - central user table for authentication and profiles
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team record - team information including branding and current season record
 */
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  managerId: string | null;
  seasonId: string;
  wins: number;
  losses: number;
  ties: number;
  runsScored: number;
  runsAllowed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Player record - links users to teams for a specific season
 */
export interface Player {
  id: string;
  userId: string;
  teamId: string;
  seasonId: string;
  jerseyNumber: string | null;
  primaryPosition: FieldPosition;
  secondaryPosition: FieldPosition | null;
  bats: BattingSide;
  throws: ThrowingArm;
  isActive: boolean;
  isCaptain: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Game record - game schedule and results
 */
export interface Game {
  id: string;
  seasonId: string;
  gameNumber: number | null;
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string; // ISO date string
  gameTime: string | null; // HH:MM:SS format
  timezone: string;
  locationName: string | null;
  locationAddress: string | null;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  currentInning: number | null;
  currentInningHalf: InningHalf | null;
  outs: number | null;
  homeInningScores: number[];
  awayInningScores: number[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

/**
 * BattingStats record - per-game batting statistics for each player
 */
export interface BattingStats {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;
  battingOrder: number | null;
  positionPlayed: FieldPosition | null;
  plateAppearances: number;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * PitchingStats record - per-game pitching statistics for each pitcher
 */
export interface PitchingStats {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;
  isStarter: boolean;
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
  decision: PitchingDecision | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Message record - team chat messages
 */
export interface Message {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  channelType: ChannelType;
  replyToId: string | null;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

/**
 * Channel metadata record - stores display info for channel types
 */
export interface ChannelMetadata {
  channelType: ChannelType;
  displayName: string;
  description: string;
  iconName: string;
  sortOrder: number;
  canAllPost: boolean;
  createdAt: string;
}

/**
 * Channel configuration for UI rendering
 */
export interface ChannelConfig {
  type: ChannelType;
  name: string;
  description: string;
  icon: string;
  canAllPost: boolean;
}

/**
 * Team channel statistics from the team_channel_stats view
 */
export interface TeamChannelStats {
  teamId: string;
  channelType: ChannelType;
  messageCount: number;
  pinnedCount: number;
  lastMessageAt: string | null;
  uniqueAuthors: number;
}

/**
 * Announcement record - league-wide announcements
 */
export interface Announcement {
  id: string;
  authorId: string;
  seasonId: string | null;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  isPinned: boolean;
  priority: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Availability record - player RSVP for games
 */
export interface Availability {
  id: string;
  gameId: string;
  playerId: string;
  status: AvailabilityStatus;
  note: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VIEW TYPES (pre-calculated/aggregated data)
// =============================================================================

/**
 * Standings view - pre-calculated standings with win percentage
 */
export interface Standing {
  teamId: string;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  primaryColor: string | null;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  winPct: number;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  seasonId: string;
  seasonName: string;
  seasonYear: number;
}

/**
 * Player batting totals view - aggregated season batting statistics
 */
export interface PlayerBattingTotals {
  playerId: string;
  playerName: string;
  teamName: string;
  teamId: string;
  seasonId: string;
  seasonName: string;
  gamesPlayed: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  hitByPitch: number;
  battingAvg: number;
  onBasePct: number;
  sluggingPct: number;
}

/**
 * Player pitching totals view - aggregated season pitching statistics
 */
export interface PlayerPitchingTotals {
  playerId: string;
  playerName: string;
  teamName: string;
  teamId: string;
  seasonId: string;
  seasonName: string;
  gamesPitched: number;
  gamesStarted: number;
  inningsPitched: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  wins: number;
  losses: number;
  saves: number;
  era: number;
  whip: number;
  kPer9: number;
}

// =============================================================================
// JOIN TYPES (for queries that include related data)
// =============================================================================

/**
 * Team with manager information
 */
export interface TeamWithManager extends Team {
  manager: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'> | null;
}

/**
 * Player with user and team information
 */
export interface PlayerWithDetails extends Player {
  user: Pick<User, 'id' | 'fullName' | 'email' | 'avatarUrl'>;
  team: Pick<Team, 'id' | 'name' | 'abbreviation' | 'primaryColor'>;
}

/**
 * Game with team information
 */
export interface GameWithTeams extends Game {
  homeTeam: Pick<Team, 'id' | 'name' | 'abbreviation' | 'primaryColor' | 'secondaryColor' | 'logoUrl'>;
  awayTeam: Pick<Team, 'id' | 'name' | 'abbreviation' | 'primaryColor' | 'secondaryColor' | 'logoUrl'>;
}

/**
 * Batting stats with player and team info
 */
export interface BattingStatsWithPlayer extends BattingStats {
  player: Pick<Player, 'id' | 'jerseyNumber' | 'primaryPosition'> & {
    user: Pick<User, 'id' | 'fullName'>;
  };
  team: Pick<Team, 'id' | 'name' | 'abbreviation'>;
}

/**
 * Pitching stats with player and team info
 */
export interface PitchingStatsWithPlayer extends PitchingStats {
  player: Pick<Player, 'id' | 'jerseyNumber' | 'primaryPosition'> & {
    user: Pick<User, 'id' | 'fullName'>;
  };
  team: Pick<Team, 'id' | 'name' | 'abbreviation'>;
}
