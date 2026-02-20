/**
 * Email Queue Processing API Route
 * POST /api/email/process - Process queued emails and optionally queue game reminders
 *
 * This endpoint is designed to be called by a cron job or scheduled task.
 * Requires Authorization header with CRON_SECRET for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingEmails,
  markEmailSent,
  markEmailFailed,
  queueGameReminders,
  getQueueStats,
} from '@/lib/email/queue';
import {
  sendEmail,
  sendGameReminderEmail,
  sendGameScheduledEmail,
  sendGameCancelledEmail,
  sendGameFinalEmail,
} from '@/lib/email';
import {
  GameReminderTemplate,
  GameScheduledTemplate,
  GameCancelledTemplate,
  GameFinalTemplate,
} from '@/lib/email/templates/games';
import type { QueuedEmail } from '@/lib/email/queue';
import type { PlayerRsvpStatus } from '@/lib/email/types';

/** Maximum emails to process per request */
const MAX_EMAILS_PER_REQUEST = 50;

/** Response type for the process endpoint */
interface ProcessResponse {
  success: boolean;
  stats: {
    processed: number;
    sent: number;
    failed: number;
    remindersQueued: number;
    queueStats: {
      pending: number;
      sent: number;
      failed: number;
      total: number;
    };
  };
  errors?: string[];
  timestamp: string;
}

/**
 * Verify the cron secret for authentication
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret if not configured
  if (!cronSecret && process.env.NODE_ENV !== 'production') {
    console.warn('[EmailProcess] CRON_SECRET not configured - allowing in development');
    return true;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === cronSecret;
}

/**
 * Process a single queued email by template type
 */
async function processQueuedEmail(
  email: QueuedEmail
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { template, to, data } = email;

  try {
    // Route to appropriate send function based on template
    switch (template) {
      case 'game-reminder': {
        const reminderData = data as {
          playerName: string;
          homeTeam: string;
          awayTeam: string;
          gameDate: string;
          gameTime: string;
          location: string;
          locationAddress: string;
          rsvpUrl: string;
          playerRsvpStatus: PlayerRsvpStatus;
        };
        return await sendEmail({
          to,
          subject: email.subject,
          react: GameReminderTemplate(reminderData),
          tags: [
            { name: 'category', value: 'game' },
            { name: 'type', value: 'game-reminder' },
          ],
        });
      }

      case 'game-scheduled': {
        const scheduledData = data as {
          playerName: string;
          homeTeam: string;
          awayTeam: string;
          gameDate: string;
          gameTime: string;
          location: string;
          locationAddress: string;
          isReschedule: boolean;
          previousDate?: string;
          rsvpUrl: string;
        };
        return await sendEmail({
          to,
          subject: email.subject,
          react: GameScheduledTemplate(scheduledData),
          tags: [
            { name: 'category', value: 'game' },
            { name: 'type', value: 'game-scheduled' },
          ],
        });
      }

      case 'game-cancelled': {
        const cancelledData = data as {
          playerName: string;
          homeTeam: string;
          awayTeam: string;
          originalDate: string;
          originalTime: string;
          reason?: string;
          scheduleUrl: string;
        };
        return await sendEmail({
          to,
          subject: email.subject,
          react: GameCancelledTemplate(cancelledData),
          tags: [
            { name: 'category', value: 'game' },
            { name: 'type', value: 'game-cancelled' },
          ],
        });
      }

      case 'game-final': {
        const finalData = data as {
          playerName: string;
          homeTeam: string;
          awayTeam: string;
          homeScore: number;
          awayScore: number;
          gameDate: string;
          winningTeam: string | null;
          boxScoreUrl: string;
        };
        return await sendEmail({
          to,
          subject: email.subject,
          react: GameFinalTemplate(finalData),
          tags: [
            { name: 'category', value: 'game' },
            { name: 'type', value: 'game-final' },
          ],
        });
      }

      default:
        return {
          success: false,
          error: `Unknown template type: ${template}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/email/process
 * Process queued emails and optionally queue game reminders
 *
 * Query params:
 * - queue-reminders=true: Also queue game reminders for tomorrow's games
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse>> {
  const startTime = Date.now();

  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      {
        success: false,
        stats: {
          processed: 0,
          sent: 0,
          failed: 0,
          remindersQueued: 0,
          queueStats: { pending: 0, sent: 0, failed: 0, total: 0 },
        },
        errors: ['Unauthorized - Invalid or missing CRON_SECRET'],
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  const errors: string[] = [];
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let remindersQueued = 0;

  // Check if we should queue game reminders
  const { searchParams } = new URL(request.url);
  const shouldQueueReminders = searchParams.get('queue-reminders') === 'true';

  if (shouldQueueReminders) {
    try {
      remindersQueued = queueGameReminders();
      console.log(`[EmailProcess] Queued ${remindersQueued} game reminders`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to queue game reminders: ${message}`);
      console.error('[EmailProcess] Error queueing reminders:', message);
    }
  }

  // Get pending emails
  const pendingEmails = getPendingEmails(MAX_EMAILS_PER_REQUEST);
  console.log(`[EmailProcess] Processing ${pendingEmails.length} pending emails`);

  // Process each email
  for (const email of pendingEmails) {
    processed++;

    try {
      const result = await processQueuedEmail(email);

      if (result.success && result.messageId) {
        markEmailSent(email.id, result.messageId);
        sent++;
      } else {
        markEmailFailed(email.id, result.error || 'Unknown error');
        failed++;
        if (result.error) {
          errors.push(`Email ${email.id}: ${result.error}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      markEmailFailed(email.id, message);
      failed++;
      errors.push(`Email ${email.id}: ${message}`);
    }
  }

  // Get final queue stats
  const queueStats = getQueueStats();

  const responseTime = Date.now() - startTime;
  console.log(
    `[EmailProcess] Completed in ${responseTime}ms: processed=${processed}, sent=${sent}, failed=${failed}`
  );

  const response: ProcessResponse = {
    success: failed === 0 && errors.length === 0,
    stats: {
      processed,
      sent,
      failed,
      remindersQueued,
      queueStats,
    },
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}

/**
 * GET /api/email/process
 * Get queue statistics (for monitoring)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const queueStats = getQueueStats();

  return NextResponse.json({
    success: true,
    stats: queueStats,
    timestamp: new Date().toISOString(),
  });
}
