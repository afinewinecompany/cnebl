/**
 * Email Queue Module
 * Mock implementation for email queue management
 * Will be replaced with real database implementation later
 */

import type { EmailTemplate, PlayerRsvpStatus } from './types';

// =============================================================================
// TYPES
// =============================================================================

/** Status of a queued email */
export type QueuedEmailStatus = 'pending' | 'sent' | 'failed';

/** Base queued email record */
export interface QueuedEmail {
  /** Unique identifier for the queued email */
  id: string;
  /** Template to use for the email */
  template: EmailTemplate;
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Template data (varies by template type) */
  data: Record<string, unknown>;
  /** Current status of the email */
  status: QueuedEmailStatus;
  /** When the email was queued */
  createdAt: Date;
  /** When the email was sent (if sent) */
  sentAt?: Date;
  /** Resend message ID (if sent) */
  resendId?: string;
  /** Error message (if failed) */
  error?: string;
  /** Number of send attempts */
  attempts: number;
  /** When to retry (if failed) */
  retryAfter?: Date;
}

/** Options for queueing an email */
export interface QueueEmailOptions {
  /** Template to use */
  template: EmailTemplate;
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Template data */
  data: Record<string, unknown>;
}

/** Result of queueing an email */
export interface QueueEmailResult {
  /** Whether the email was queued successfully */
  success: boolean;
  /** ID of the queued email (if successful) */
  id?: string;
  /** Error message (if failed) */
  error?: string;
}

/** Result of queue processing */
export interface ProcessQueueResult {
  /** Total emails processed */
  processed: number;
  /** Emails sent successfully */
  sent: number;
  /** Emails that failed */
  failed: number;
}

/** Game reminder data for queueing */
export interface GameReminderData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  gameTime: string;
  location: string;
  locationAddress: string;
  players: Array<{
    email: string;
    playerName: string;
    rsvpStatus: PlayerRsvpStatus;
    rsvpUrl: string;
  }>;
}

// =============================================================================
// MOCK QUEUE STORAGE
// =============================================================================

/**
 * In-memory queue storage
 * TODO: Replace with real database implementation (Supabase)
 */
let emailQueue: QueuedEmail[] = [];

/**
 * Generate a unique ID for queued emails
 */
function generateId(): string {
  return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// QUEUE FUNCTIONS
// =============================================================================

/**
 * Add an email to the queue
 *
 * @param options - Email options to queue
 * @returns Result with queue ID
 */
export function queueEmail(options: QueueEmailOptions): QueueEmailResult {
  try {
    const { template, to, subject, data } = options;

    const queuedEmail: QueuedEmail = {
      id: generateId(),
      template,
      to,
      subject,
      data,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
    };

    emailQueue.push(queuedEmail);

    console.log(`[EmailQueue] Queued email: ${queuedEmail.id} (${template} to ${to})`);

    return {
      success: true,
      id: queuedEmail.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EmailQueue] Failed to queue email:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get pending emails from the queue
 *
 * @param limit - Maximum number of emails to retrieve
 * @returns Array of pending queued emails
 */
export function getPendingEmails(limit: number = 50): QueuedEmail[] {
  const now = new Date();

  return emailQueue
    .filter((email) => {
      if (email.status !== 'pending') return false;
      // Check if we should wait before retrying
      if (email.retryAfter && email.retryAfter > now) return false;
      return true;
    })
    .slice(0, limit);
}

/**
 * Mark an email as sent
 *
 * @param id - Queue ID of the email
 * @param resendId - Message ID from Resend
 */
export function markEmailSent(id: string, resendId: string): void {
  const email = emailQueue.find((e) => e.id === id);
  if (email) {
    email.status = 'sent';
    email.sentAt = new Date();
    email.resendId = resendId;
    email.attempts += 1;
    console.log(`[EmailQueue] Marked as sent: ${id} (resendId: ${resendId})`);
  }
}

/**
 * Mark an email as failed
 *
 * @param id - Queue ID of the email
 * @param error - Error message
 */
export function markEmailFailed(id: string, error: string): void {
  const email = emailQueue.find((e) => e.id === id);
  if (email) {
    email.attempts += 1;
    email.error = error;

    // Retry up to 3 times with exponential backoff
    if (email.attempts < 3) {
      const delayMs = Math.pow(2, email.attempts) * 60 * 1000; // 2, 4, 8 minutes
      email.retryAfter = new Date(Date.now() + delayMs);
      console.log(
        `[EmailQueue] Failed (attempt ${email.attempts}/3), will retry: ${id}`
      );
    } else {
      email.status = 'failed';
      console.log(`[EmailQueue] Marked as failed after 3 attempts: ${id}`);
    }
  }
}

/**
 * Get queue statistics
 *
 * @returns Object with queue statistics
 */
export function getQueueStats(): {
  pending: number;
  sent: number;
  failed: number;
  total: number;
} {
  const pending = emailQueue.filter((e) => e.status === 'pending').length;
  const sent = emailQueue.filter((e) => e.status === 'sent').length;
  const failed = emailQueue.filter((e) => e.status === 'failed').length;

  return {
    pending,
    sent,
    failed,
    total: emailQueue.length,
  };
}

/**
 * Clear sent emails from the queue (older than specified hours)
 *
 * @param olderThanHours - Remove sent emails older than this many hours
 * @returns Number of emails removed
 */
export function clearSentEmails(olderThanHours: number = 24): number {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const beforeLength = emailQueue.length;

  emailQueue = emailQueue.filter((email) => {
    if (email.status !== 'sent') return true;
    if (!email.sentAt) return true;
    return email.sentAt > cutoff;
  });

  const removed = beforeLength - emailQueue.length;
  if (removed > 0) {
    console.log(`[EmailQueue] Cleared ${removed} sent emails older than ${olderThanHours}h`);
  }

  return removed;
}

// =============================================================================
// GAME REMINDER FUNCTIONS
// =============================================================================

/**
 * Queue game reminder emails for tomorrow's games
 * Mock implementation that logs what it would do
 *
 * In production, this would:
 * 1. Query the database for games scheduled for tomorrow
 * 2. Get all players for each team
 * 3. Check their RSVP status
 * 4. Queue reminder emails for each player
 *
 * @returns Number of reminders that would be queued
 */
export function queueGameReminders(): number {
  console.log('[EmailQueue] queueGameReminders() called');
  console.log('[EmailQueue] In production, this would:');
  console.log('  1. Query database for games scheduled for tomorrow');
  console.log('  2. Get all players for each participating team');
  console.log('  3. Check each player\'s RSVP status');
  console.log('  4. Queue reminder emails for all players');

  // Mock: Return 0 since we don't have real data
  // In production, this would return the actual count of queued reminders
  const mockRemindersQueued = 0;

  console.log(`[EmailQueue] Would queue ${mockRemindersQueued} reminder emails`);
  return mockRemindersQueued;
}

/**
 * Queue reminder emails for a specific game
 * Helper function for queueGameReminders
 *
 * @param gameData - Game reminder data including players
 * @returns Number of emails queued
 */
export function queueGameReminderBatch(gameData: GameReminderData): number {
  const { gameId, homeTeam, awayTeam, gameDate, gameTime, location, locationAddress, players } =
    gameData;

  let queued = 0;

  for (const player of players) {
    const result = queueEmail({
      template: 'game-reminder',
      to: player.email,
      subject: `Game Tomorrow: ${awayTeam} @ ${homeTeam} - ${gameTime}`,
      data: {
        playerName: player.playerName,
        homeTeam,
        awayTeam,
        gameDate,
        gameTime,
        location,
        locationAddress,
        rsvpUrl: player.rsvpUrl,
        playerRsvpStatus: player.rsvpStatus,
        gameId,
      },
    });

    if (result.success) {
      queued++;
    }
  }

  console.log(
    `[EmailQueue] Queued ${queued}/${players.length} reminders for game ${gameId}`
  );
  return queued;
}

// =============================================================================
// DEVELOPMENT/TESTING HELPERS
// =============================================================================

/**
 * Get the entire queue (for debugging)
 */
export function getQueue(): QueuedEmail[] {
  return [...emailQueue];
}

/**
 * Clear the entire queue (for testing)
 */
export function clearQueue(): void {
  emailQueue = [];
  console.log('[EmailQueue] Queue cleared');
}

/**
 * Get a specific queued email by ID
 */
export function getQueuedEmail(id: string): QueuedEmail | undefined {
  return emailQueue.find((e) => e.id === id);
}
