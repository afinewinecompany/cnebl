/**
 * Game Email Templates Index
 * Central export for all game-related email templates
 */

export { GameScheduledTemplate } from './game-scheduled';
export { GameReminderTemplate } from './game-reminder';
export { GameCancelledTemplate } from './game-cancelled';
export { GameFinalTemplate } from './game-final';

// Re-export types
export type { PlayerRsvpStatus } from './game-reminder';
