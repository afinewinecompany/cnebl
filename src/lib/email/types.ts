/**
 * Email Service Types
 * TypeScript types for the email notification system
 */

/**
 * Available email template types
 */
export type EmailTemplate =
  | 'verify-email'
  | 'password-reset'
  | 'welcome'
  | 'league-announcement'
  | 'game-scheduled'
  | 'game-reminder'
  | 'game-cancelled'
  | 'game-final'
  | 'availability-request'
  | 'team-announcement';

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** React component to render as HTML */
  react: React.ReactElement;
  /** Optional plain text version */
  text?: string;
  /** Optional reply-to address */
  replyTo?: string;
  /** Optional tags for tracking */
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Message ID from the email provider (if successful) */
  messageId?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Options for verification email
 */
export interface VerificationEmailOptions {
  /** Recipient email address */
  email: string;
  /** User's display name */
  userName: string;
  /** URL to verify the email */
  verifyUrl: string;
}

/**
 * Options for password reset email
 */
export interface PasswordResetEmailOptions {
  /** Recipient email address */
  email: string;
  /** User's display name */
  userName: string;
  /** URL to reset the password */
  resetUrl: string;
}

/**
 * Options for welcome email
 */
export interface WelcomeEmailOptions {
  /** Recipient email address */
  email: string;
  /** User's display name */
  userName: string;
  /** URL to the dashboard */
  dashboardUrl?: string;
}

/**
 * Priority levels for league announcements
 */
export type AnnouncementPriority = 'urgent' | 'important' | 'normal';

/**
 * Options for league announcement email
 */
export interface LeagueAnnouncementEmailOptions {
  /** Recipient email address */
  email: string;
  /** Priority level affects visual styling */
  priority: AnnouncementPriority;
  /** Announcement title/headline */
  title: string;
  /** Announcement body content (HTML safe) */
  content: string;
  /** Name of the person who posted the announcement */
  authorName: string;
  /** Date the announcement was posted */
  postedAt: string;
  /** URL to view the announcement in the app */
  viewUrl: string;
}

// =============================================================================
// GAME EMAIL OPTIONS
// =============================================================================

/**
 * Player's RSVP status for a game
 */
export type PlayerRsvpStatus = 'available' | 'unavailable' | 'tentative' | 'no_response';

/**
 * Options for game scheduled email
 */
export interface GameScheduledEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Time of the game (formatted string) */
  gameTime: string;
  /** Name of the location/field */
  location: string;
  /** Full address of the location */
  locationAddress: string;
  /** Whether this is a rescheduled game */
  isReschedule: boolean;
  /** Original date if rescheduled (formatted string) */
  previousDate?: string;
  /** URL to update RSVP/availability */
  rsvpUrl: string;
}

/**
 * Options for game reminder email
 */
export interface GameReminderEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Time of the game (formatted string) */
  gameTime: string;
  /** Name of the location/field */
  location: string;
  /** Full address of the location */
  locationAddress: string;
  /** URL to update RSVP/availability */
  rsvpUrl: string;
  /** Player's current RSVP status */
  playerRsvpStatus: PlayerRsvpStatus;
}

/**
 * Options for game cancelled email
 */
export interface GameCancelledEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Original date of the game (formatted string) */
  originalDate: string;
  /** Original time of the game (formatted string) */
  originalTime: string;
  /** Reason for cancellation (optional) */
  reason?: string;
  /** URL to view the schedule */
  scheduleUrl: string;
}

/**
 * Options for game final email
 */
export interface GameFinalEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Home team's final score */
  homeScore: number;
  /** Away team's final score */
  awayScore: number;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Name of the winning team (or null for tie) */
  winningTeam: string | null;
  /** URL to view the full box score */
  boxScoreUrl: string;
}

// =============================================================================
// TEAM EMAIL OPTIONS
// =============================================================================

/**
 * Game information for availability requests
 */
export interface GameForAvailability {
  /** Name of the home team */
  homeTeam: string;
  /** Name of the away team */
  awayTeam: string;
  /** Date of the game (formatted string) */
  gameDate: string;
  /** Time of the game (formatted string) */
  gameTime: string;
  /** Name of the location/field */
  location: string;
}

/**
 * Options for availability request email
 */
export interface AvailabilityRequestEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Manager's display name */
  managerName: string;
  /** Name of the team */
  teamName: string;
  /** Array of upcoming games to request availability for */
  games: GameForAvailability[];
  /** URL to update availability */
  availabilityUrl: string;
}

/**
 * Options for team announcement email
 */
export interface TeamAnnouncementEmailOptions {
  /** Recipient email address */
  email: string;
  /** Player's display name */
  playerName: string;
  /** Name of the team */
  teamName: string;
  /** Manager's display name */
  managerName: string;
  /** Announcement title/headline */
  title: string;
  /** Announcement body content (HTML safe) */
  content: string;
  /** Date the announcement was posted */
  postedAt: string;
  /** URL to view the announcement in the app */
  viewUrl: string;
}
