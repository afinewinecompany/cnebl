/**
 * API Types for CNEBL
 * Request/Response types for all API endpoints
 */

import type {
  GameStatus,
  Standing,
  GameWithTeams,
  TeamWithManager,
  PlayerWithDetails,
  PlayerBattingTotals,
  PlayerPitchingTotals,
} from './database.types';

// =============================================================================
// COMMON API TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: never;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  data?: never;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Common query parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

// =============================================================================
// HEALTH CHECK TYPES
// =============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'unknown';
    cache?: 'connected' | 'disconnected' | 'unknown';
  };
}

// =============================================================================
// TEAMS API TYPES
// =============================================================================

/**
 * Team list response
 */
export interface TeamsListResponse extends ApiResponse<TeamWithManager[]> {}

/**
 * Single team response
 */
export interface TeamResponse extends ApiResponse<TeamWithManager> {}

/**
 * Team roster response
 */
export interface TeamRosterResponse extends ApiResponse<{
  team: Pick<TeamWithManager, 'id' | 'name' | 'abbreviation' | 'primaryColor' | 'secondaryColor'>;
  players: PlayerWithDetails[];
}> {}

/**
 * Query params for teams list
 */
export interface TeamsQueryParams {
  seasonId?: string;
  active?: boolean;
}

// =============================================================================
// GAMES API TYPES
// =============================================================================

/**
 * Games list response
 */
export interface GamesListResponse extends PaginatedResponse<GameWithTeams> {}

/**
 * Single game response
 */
export interface GameResponse extends ApiResponse<GameWithTeams> {}

/**
 * Query params for games list
 */
export interface GamesQueryParams extends PaginationParams {
  seasonId?: string;
  teamId?: string;
  status?: GameStatus | GameStatus[];
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  sortBy?: 'date' | 'status';
  sortDir?: SortDirection;
}

// =============================================================================
// STATS API TYPES
// =============================================================================

/**
 * Batting stats list response with leaderboard data
 */
export interface BattingStatsResponse extends ApiResponse<{
  stats: PlayerBattingTotals[];
  leaderboard: {
    avg: LeaderboardEntry[];
    homeRuns: LeaderboardEntry[];
    rbi: LeaderboardEntry[];
    hits: LeaderboardEntry[];
    stolenBases: LeaderboardEntry[];
  };
}> {}

/**
 * Pitching stats list response with leaderboard data
 */
export interface PitchingStatsResponse extends ApiResponse<{
  stats: PlayerPitchingTotals[];
  leaderboard: {
    era: LeaderboardEntry[];
    wins: LeaderboardEntry[];
    strikeouts: LeaderboardEntry[];
    saves: LeaderboardEntry[];
    whip: LeaderboardEntry[];
  };
}> {}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  teamId: string;
  teamAbbr: string;
  value: number;
  rank: number;
}

/**
 * Query params for batting stats
 */
export interface BattingStatsQueryParams extends PaginationParams {
  seasonId?: string;
  teamId?: string;
  minAtBats?: number;
  sortBy?: 'avg' | 'homeRuns' | 'rbi' | 'hits' | 'runs' | 'stolenBases' | 'ops';
  sortDir?: SortDirection;
}

/**
 * Query params for pitching stats
 */
export interface PitchingStatsQueryParams extends PaginationParams {
  seasonId?: string;
  teamId?: string;
  minInningsPitched?: number;
  sortBy?: 'era' | 'wins' | 'strikeouts' | 'saves' | 'whip' | 'kPer9';
  sortDir?: SortDirection;
}

// =============================================================================
// STANDINGS API TYPES
// =============================================================================

/**
 * Standings response
 */
export interface StandingsResponse extends ApiResponse<{
  standings: Standing[];
  seasonId: string;
  seasonName: string;
  asOf: string; // ISO timestamp when standings were calculated
}> {}

/**
 * Query params for standings
 */
export interface StandingsQueryParams {
  seasonId?: string;
}

// =============================================================================
// MESSAGES API TYPES
// =============================================================================

/**
 * Author information embedded in message responses
 */
export interface MessageAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Reply preview for messages that are replies
 */
export interface MessageReplyPreview {
  id: string;
  content: string;
  author: MessageAuthor;
}

/**
 * Full message response with author and reply info
 */
export interface MessageWithDetails {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  replyToId: string | null;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  author: MessageAuthor;
  replyTo?: MessageReplyPreview | null;
}

/**
 * Cursor-based pagination response for messages
 */
export interface MessagesListResponseData {
  messages: MessageWithDetails[];
  cursor: {
    next: string | null;
    previous: string | null;
  };
  hasMore: boolean;
  totalPinned: number;
}

/**
 * Messages list response
 */
export interface MessagesListResponse extends ApiResponse<MessagesListResponseData> {}

/**
 * Single message response
 */
export interface MessageResponse extends ApiResponse<MessageWithDetails> {}

/**
 * Query params for messages list (cursor-based pagination)
 */
export interface MessagesQueryParams {
  cursor?: string;
  limit?: number;
  direction?: 'older' | 'newer';
  pinnedOnly?: boolean;
}

/**
 * Request body for creating a message
 */
export interface CreateMessageRequest {
  content: string;
  replyToId?: string | null;
}

/**
 * Request body for editing a message
 */
export interface EditMessageRequest {
  content: string;
}

/**
 * Request body for toggling pin status
 */
export interface TogglePinRequest {
  isPinned: boolean;
}

// =============================================================================
// SCORING API TYPES
// =============================================================================

import type { InningHalf } from './database.types';

/**
 * Game scoring state (current game state for live scoring)
 */
export interface GameScoringState {
  id: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  currentInning: number | null;
  currentInningHalf: InningHalf | null;
  outs: number | null;
  homeInningScores: number[];
  awayInningScores: number[];
  isExtraInnings: boolean;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
}

/**
 * Result of a scoring action
 */
export interface ScoringActionResult {
  action: 'start' | 'score' | 'out' | 'advance' | 'end' | 'update';
  previousState: Partial<GameScoringState>;
  newState: GameScoringState;
  autoAdvanced?: boolean;
}

/**
 * Response for scoring action endpoints
 */
export interface ScoringActionResponse extends ApiResponse<ScoringActionResult> {}

/**
 * Live games response
 */
export interface LiveGamesResponse extends ApiResponse<{
  games: GameWithTeams[];
  count: number;
  timestamp: string;
}> {}

/**
 * Request body for starting a game
 */
export interface StartGameRequest {
  status?: 'warmup' | 'in_progress';
}

/**
 * Request body for recording score
 */
export interface RecordScoreRequest {
  runs: number;
}

/**
 * Request body for recording an out
 */
export interface RecordOutRequest {
  count?: number; // 1-3, for double/triple plays
}

/**
 * Request body for advancing inning
 */
export interface AdvanceInningRequest {
  forceInning?: number;
  forceHalf?: InningHalf;
}

/**
 * Request body for ending a game
 */
export interface EndGameRequest {
  status?: 'final' | 'suspended' | 'postponed' | 'cancelled';
  notes?: string;
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const API_ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resource-specific errors
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  SEASON_NOT_FOUND: 'SEASON_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
