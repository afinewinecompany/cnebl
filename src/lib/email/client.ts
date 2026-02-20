/**
 * Resend Client Configuration
 * Initializes and exports the Resend client for sending emails
 */

import { Resend } from 'resend';

/**
 * Check if the Resend API key is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Get the Resend client instance
 * Returns null if RESEND_API_KEY is not configured
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

/**
 * Get the default "from" email address
 */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'CNEBL <noreply@cnebl.com>';
}

/**
 * Get the base URL for the application
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
