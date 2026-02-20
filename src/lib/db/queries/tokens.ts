/**
 * Token Queries
 * Database-backed token storage for password reset and email verification
 */

import { createHash, randomBytes } from 'crypto';
import { query } from '../client';

// =============================================================================
// TYPES
// =============================================================================

interface TokenRecord {
  id: string;
  token_hash: string;
  user_id: string;
  email?: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a cryptographically secure random token
 * Uses crypto.randomBytes for secure entropy (256-bit)
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256
 * Tokens are stored as hashes for security
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// =============================================================================
// PASSWORD RESET TOKENS
// =============================================================================

/**
 * Create a password reset token for a user
 * Invalidates any existing tokens for the user
 * @param userId - The user's ID
 * @param email - The user's email (for reference)
 * @returns The raw token (not hashed) to send to user
 */
export async function createPasswordResetToken(
  userId: string,
  email: string
): Promise<string> {
  // Invalidate existing tokens for this user
  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  // Generate new token
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Token valid for 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt]
  );

  return token;
}

/**
 * Validate a password reset token
 * @param token - The raw token to validate
 * @returns User info if valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  const tokenHash = hashToken(token);

  const result = await query<TokenRecord & { email: string; full_name: string }>(
    `SELECT prt.user_id, u.email, u.full_name
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token_hash = $1
       AND prt.used_at IS NULL
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    userId: result.rows[0].user_id,
    email: result.rows[0].email,
  };
}

/**
 * Mark a password reset token as used
 * @param token - The raw token to invalidate
 */
export async function invalidatePasswordResetToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

// =============================================================================
// EMAIL VERIFICATION TOKENS
// =============================================================================

/**
 * Create an email verification token for a user
 * Invalidates any existing tokens for the user
 * @param userId - The user's ID
 * @param email - The email to verify
 * @returns The raw token (not hashed) to send to user
 */
export async function createEmailVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  // Invalidate existing tokens for this user
  await query(
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  // Generate new token
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Token valid for 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO email_verification_tokens (token_hash, user_id, email, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, userId, email, expiresAt]
  );

  return token;
}

/**
 * Validate an email verification token
 * @param token - The raw token to validate
 * @returns User info if valid, null otherwise
 */
export async function validateEmailVerificationToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  const tokenHash = hashToken(token);

  const result = await query<TokenRecord>(
    `SELECT user_id, email
     FROM email_verification_tokens
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    userId: result.rows[0].user_id,
    email: result.rows[0].email!,
  };
}

/**
 * Mark an email verification token as used
 * @param token - The raw token to invalidate
 */
export async function invalidateEmailVerificationToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  await query(
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Clean up expired tokens
 * Should be called periodically via a cron job
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await query('SELECT cleanup_expired_tokens()');
}
