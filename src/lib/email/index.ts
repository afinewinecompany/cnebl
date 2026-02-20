/**
 * Email Service
 * Main email service with send functions for the CNEBL application
 * Uses Resend as the email provider with React Email templates
 */

import { render } from '@react-email/render';
import { getResendClient, getFromEmail, getAppUrl, isEmailConfigured } from './client';
import { VerifyEmailTemplate } from './templates/auth/verify-email';
import { PasswordResetTemplate } from './templates/auth/password-reset';
import { WelcomeTemplate } from './templates/auth/welcome';
import { LeagueAnnouncementTemplate } from './templates/announcements/league-announcement';
import {
  GameScheduledTemplate,
  GameReminderTemplate,
  GameCancelledTemplate,
  GameFinalTemplate,
} from './templates/games';
import {
  AvailabilityRequestTemplate,
  TeamAnnouncementTemplate,
} from './templates/team';
import type {
  SendEmailOptions,
  SendEmailResult,
  VerificationEmailOptions,
  PasswordResetEmailOptions,
  WelcomeEmailOptions,
  LeagueAnnouncementEmailOptions,
  GameScheduledEmailOptions,
  GameReminderEmailOptions,
  GameCancelledEmailOptions,
  GameFinalEmailOptions,
  AvailabilityRequestEmailOptions,
  TeamAnnouncementEmailOptions,
} from './types';

// =============================================================================
// GENERIC SEND EMAIL FUNCTION
// =============================================================================

/**
 * Send an email using Resend
 * Falls back to console.log if RESEND_API_KEY is not configured (dev mode)
 *
 * @param options - Email options including recipient, subject, and React template
 * @returns Result object with success status and message ID or error
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, react, text, replyTo, tags } = options;

  // Check if email is configured
  if (!isEmailConfigured()) {
    // Development mode: log to console
    const html = await render(react);
    console.log('\n========================================');
    console.log('EMAIL (Development Mode)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${getFromEmail()}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    if (tags) console.log(`Tags: ${JSON.stringify(tags)}`);
    console.log('----------------------------------------');
    console.log('HTML Preview (truncated):');
    console.log(html.substring(0, 500) + '...');
    console.log('========================================\n');

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // Production mode: send via Resend
  const resend = getResendClient();

  if (!resend) {
    console.error('[Email] Resend client not available');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      react,
      text,
      replyTo,
      tags,
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    console.log(`[Email] Sent successfully to ${to}, ID: ${result.data?.id}`);
    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Send error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR AUTH EMAILS
// =============================================================================

/**
 * Send a verification email to a newly registered user
 *
 * @param options - Verification email options
 * @returns Result object with success status
 */
export async function sendVerificationEmail(
  options: VerificationEmailOptions
): Promise<SendEmailResult> {
  const { email, userName, verifyUrl } = options;

  return sendEmail({
    to: email,
    subject: 'Verify your CNEBL email address',
    react: VerifyEmailTemplate({ userName, verifyUrl }),
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'type', value: 'verify-email' },
    ],
  });
}

/**
 * Send a password reset email
 *
 * @param options - Password reset email options
 * @returns Result object with success status
 */
export async function sendPasswordResetEmail(
  options: PasswordResetEmailOptions
): Promise<SendEmailResult> {
  const { email, userName, resetUrl } = options;

  return sendEmail({
    to: email,
    subject: 'Reset your CNEBL password',
    react: PasswordResetTemplate({ userName, resetUrl }),
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'type', value: 'password-reset' },
    ],
  });
}

/**
 * Send a welcome email after email verification
 *
 * @param options - Welcome email options
 * @returns Result object with success status
 */
export async function sendWelcomeEmail(
  options: WelcomeEmailOptions
): Promise<SendEmailResult> {
  const { email, userName, dashboardUrl } = options;
  const baseUrl = getAppUrl();
  const dashboard = dashboardUrl || `${baseUrl}/dashboard`;

  return sendEmail({
    to: email,
    subject: 'Welcome to CNEBL!',
    react: WelcomeTemplate({ userName, dashboardUrl: dashboard }),
    tags: [
      { name: 'category', value: 'auth' },
      { name: 'type', value: 'welcome' },
    ],
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR ANNOUNCEMENT EMAILS
// =============================================================================

/**
 * Send a league announcement email
 *
 * @param options - League announcement email options
 * @returns Result object with success status
 */
export async function sendLeagueAnnouncementEmail(
  options: LeagueAnnouncementEmailOptions
): Promise<SendEmailResult> {
  const { email, priority, title, content, authorName, postedAt, viewUrl } = options;

  // Build subject line based on priority
  let subject: string;
  switch (priority) {
    case 'urgent':
      subject = `[URGENT] ${title}`;
      break;
    case 'important':
      subject = `[Important] ${title}`;
      break;
    default:
      subject = `CNEBL Announcement: ${title}`;
  }

  return sendEmail({
    to: email,
    subject,
    react: LeagueAnnouncementTemplate({
      priority,
      title,
      content,
      authorName,
      postedAt,
      viewUrl,
    }),
    tags: [
      { name: 'category', value: 'announcement' },
      { name: 'type', value: 'league-announcement' },
      { name: 'priority', value: priority },
    ],
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR GAME EMAILS
// =============================================================================

/**
 * Send a game scheduled email
 *
 * @param options - Game scheduled email options
 * @returns Result object with success status
 */
export async function sendGameScheduledEmail(
  options: GameScheduledEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    homeTeam,
    awayTeam,
    gameDate,
    gameTime,
    location,
    locationAddress,
    isReschedule,
    previousDate,
    rsvpUrl,
  } = options;

  const subject = isReschedule
    ? `[Rescheduled] ${awayTeam} @ ${homeTeam} - ${gameDate}`
    : `Game Scheduled: ${awayTeam} @ ${homeTeam} - ${gameDate}`;

  return sendEmail({
    to: email,
    subject,
    react: GameScheduledTemplate({
      playerName,
      homeTeam,
      awayTeam,
      gameDate,
      gameTime,
      location,
      locationAddress,
      isReschedule,
      previousDate,
      rsvpUrl,
    }),
    tags: [
      { name: 'category', value: 'game' },
      { name: 'type', value: 'game-scheduled' },
      { name: 'reschedule', value: isReschedule ? 'true' : 'false' },
    ],
  });
}

/**
 * Send a game reminder email
 *
 * @param options - Game reminder email options
 * @returns Result object with success status
 */
export async function sendGameReminderEmail(
  options: GameReminderEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    homeTeam,
    awayTeam,
    gameDate,
    gameTime,
    location,
    locationAddress,
    rsvpUrl,
    playerRsvpStatus,
  } = options;

  const needsResponse = playerRsvpStatus === 'no_response' || playerRsvpStatus === 'tentative';
  const subject = needsResponse
    ? `[Action Required] Game Tomorrow: ${awayTeam} @ ${homeTeam}`
    : `Game Tomorrow: ${awayTeam} @ ${homeTeam} - ${gameTime}`;

  return sendEmail({
    to: email,
    subject,
    react: GameReminderTemplate({
      playerName,
      homeTeam,
      awayTeam,
      gameDate,
      gameTime,
      location,
      locationAddress,
      rsvpUrl,
      playerRsvpStatus,
    }),
    tags: [
      { name: 'category', value: 'game' },
      { name: 'type', value: 'game-reminder' },
      { name: 'rsvp-status', value: playerRsvpStatus },
    ],
  });
}

/**
 * Send a game cancelled email
 *
 * @param options - Game cancelled email options
 * @returns Result object with success status
 */
export async function sendGameCancelledEmail(
  options: GameCancelledEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    homeTeam,
    awayTeam,
    originalDate,
    originalTime,
    reason,
    scheduleUrl,
  } = options;

  const subject = `[Cancelled] ${awayTeam} @ ${homeTeam} - ${originalDate}`;

  return sendEmail({
    to: email,
    subject,
    react: GameCancelledTemplate({
      playerName,
      homeTeam,
      awayTeam,
      originalDate,
      originalTime,
      reason,
      scheduleUrl,
    }),
    tags: [
      { name: 'category', value: 'game' },
      { name: 'type', value: 'game-cancelled' },
    ],
  });
}

/**
 * Send a game final email
 *
 * @param options - Game final email options
 * @returns Result object with success status
 */
export async function sendGameFinalEmail(
  options: GameFinalEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    gameDate,
    winningTeam,
    boxScoreUrl,
  } = options;

  const isTie = homeScore === awayScore;
  const subject = isTie
    ? `Final: ${awayTeam} ${awayScore}, ${homeTeam} ${homeScore} (Tie)`
    : `Final: ${winningTeam} wins! ${awayTeam} ${awayScore} - ${homeTeam} ${homeScore}`;

  return sendEmail({
    to: email,
    subject,
    react: GameFinalTemplate({
      playerName,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      gameDate,
      winningTeam,
      boxScoreUrl,
    }),
    tags: [
      { name: 'category', value: 'game' },
      { name: 'type', value: 'game-final' },
    ],
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR TEAM EMAILS
// =============================================================================

/**
 * Send an availability request email
 *
 * @param options - Availability request email options
 * @returns Result object with success status
 */
export async function sendAvailabilityRequestEmail(
  options: AvailabilityRequestEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    managerName,
    teamName,
    games,
    availabilityUrl,
  } = options;

  const gameCount = games.length;
  const subject = `[${teamName}] Availability needed for ${gameCount} upcoming game${gameCount !== 1 ? 's' : ''}`;

  return sendEmail({
    to: email,
    subject,
    react: AvailabilityRequestTemplate({
      playerName,
      managerName,
      teamName,
      games,
      availabilityUrl,
    }),
    tags: [
      { name: 'category', value: 'team' },
      { name: 'type', value: 'availability-request' },
      { name: 'team', value: teamName },
    ],
  });
}

/**
 * Send a team announcement email
 *
 * @param options - Team announcement email options
 * @returns Result object with success status
 */
export async function sendTeamAnnouncementEmail(
  options: TeamAnnouncementEmailOptions
): Promise<SendEmailResult> {
  const {
    email,
    playerName,
    teamName,
    managerName,
    title,
    content,
    postedAt,
    viewUrl,
  } = options;

  const subject = `[${teamName}] ${title}`;

  return sendEmail({
    to: email,
    subject,
    react: TeamAnnouncementTemplate({
      playerName,
      teamName,
      managerName,
      title,
      content,
      postedAt,
      viewUrl,
    }),
    tags: [
      { name: 'category', value: 'team' },
      { name: 'type', value: 'team-announcement' },
      { name: 'team', value: teamName },
    ],
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export { isEmailConfigured } from './client';
export type {
  EmailTemplate,
  SendEmailOptions,
  SendEmailResult,
  VerificationEmailOptions,
  PasswordResetEmailOptions,
  WelcomeEmailOptions,
  LeagueAnnouncementEmailOptions,
  AnnouncementPriority,
  PlayerRsvpStatus,
  GameScheduledEmailOptions,
  GameReminderEmailOptions,
  GameCancelledEmailOptions,
  GameFinalEmailOptions,
  GameForAvailability,
  AvailabilityRequestEmailOptions,
  TeamAnnouncementEmailOptions,
} from './types';
