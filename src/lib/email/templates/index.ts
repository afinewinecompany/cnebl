/**
 * Email Templates Index
 * Central export for all email templates
 */

// Base layout and components
export {
  BaseLayout,
  EmailButton,
  EmailHeading,
  EmailParagraph,
  EmailAlert,
} from './base-layout';

// Auth templates
export { VerifyEmailTemplate } from './auth/verify-email';
export { PasswordResetTemplate } from './auth/password-reset';
export { WelcomeTemplate } from './auth/welcome';

// Announcement templates
export { LeagueAnnouncementTemplate } from './announcements/league-announcement';
export type { AnnouncementPriority } from './announcements/league-announcement';

// Game templates
export {
  GameScheduledTemplate,
  GameReminderTemplate,
  GameCancelledTemplate,
  GameFinalTemplate,
} from './games';
export type { PlayerRsvpStatus } from './games';

// Team templates
export {
  AvailabilityRequestTemplate,
  TeamAnnouncementTemplate,
} from './team';
export type { GameForAvailability } from './team';
