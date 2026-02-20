/**
 * User Queries
 * Query functions for user-related data
 * Uses PostgreSQL database for persistence
 */

import type { UserRole } from '@/types/database.types';
import { query } from '../client';
import {
  sendVerificationEmail as sendVerificationEmailService,
  sendPasswordResetEmail as sendPasswordResetEmailService,
} from '@/lib/email';
import {
  generateToken,
  createPasswordResetToken as createPasswordResetTokenDB,
  validatePasswordResetToken as validatePasswordResetTokenDB,
  invalidatePasswordResetToken as invalidatePasswordResetTokenDB,
  createEmailVerificationToken as createEmailVerificationTokenDB,
  validateEmailVerificationToken as validateEmailVerificationTokenDB,
  invalidateEmailVerificationToken as invalidateEmailVerificationTokenDB,
} from './tokens';
import { getDatabaseStatus } from '../client';

// =============================================================================
// USER TYPE
// =============================================================================

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely convert a date value to ISO string
 * PostgreSQL returns dates as strings or Date objects depending on driver config
 */
function toISOString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Safely convert a nullable date value to ISO string or null
 */
function toISOStringOrNull(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// =============================================================================
// IN-MEMORY FALLBACK TOKENS (for when database is unavailable)
// =============================================================================

interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * In-memory store for password reset tokens
 * Used as fallback when database is unavailable
 */
const passwordResetTokens: PasswordResetToken[] = [];

/**
 * In-memory store for email verification tokens
 * Used as fallback when database is unavailable
 */
const emailVerificationTokens: EmailVerificationToken[] = [];

// Clean up expired tokens periodically (every 5 minutes)
setInterval(() => {
  const now = new Date();
  const validPasswordTokens = passwordResetTokens.filter(
    (token) => token.expiresAt > now && !token.used
  );
  passwordResetTokens.length = 0;
  passwordResetTokens.push(...validPasswordTokens);

  const validEmailTokens = emailVerificationTokens.filter(
    (token) => token.expiresAt > now && !token.used
  );
  emailVerificationTokens.length = 0;
  emailVerificationTokens.push(...validEmailTokens);
}, 5 * 60 * 1000);

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Find a user by email address
 * @param email - The email to search for
 * @returns The user if found, null otherwise
 */
export async function findUserByEmail(email: string): Promise<MockUser | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
      email_verified: boolean;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        email_verified_at,
        created_at,
        updated_at
      FROM users
      WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      emailVerifiedAt: toISOStringOrNull(row.email_verified_at),
      createdAt: toISOString(row.created_at),
      updatedAt: toISOString(row.updated_at),
    };
  } catch (error) {
    console.error('[Users] Error finding user by email:', error);
    throw new Error('Failed to find user. Please try again later.');
  }
}

/**
 * Find a user by ID
 * @param id - The user ID to search for
 * @returns The user if found, null otherwise
 */
export async function findUserById(id: string): Promise<MockUser | null> {
  try {
    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
      email_verified: boolean;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        email_verified_at,
        created_at,
        updated_at
      FROM users
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      emailVerifiedAt: toISOStringOrNull(row.email_verified_at),
      createdAt: toISOString(row.created_at),
      updatedAt: toISOString(row.updated_at),
    };
  } catch (error) {
    console.error('[Users] Error finding user by ID:', error);
    throw new Error('Failed to find user. Please try again later.');
  }
}

/**
 * Create a new user
 * @param userData - The user data to create
 * @returns The created user
 */
export async function createUser(userData: {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: UserRole;
}): Promise<MockUser> {
  try {
    const normalizedEmail = userData.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
      email_verified: boolean;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, true, false)
       RETURNING
         id,
         email,
         password_hash,
         full_name,
         role,
         is_active,
         email_verified,
         email_verified_at,
         created_at,
         updated_at`,
      [
        normalizedEmail,
        userData.passwordHash,
        userData.fullName,
        userData.role || 'player',
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      emailVerifiedAt: toISOStringOrNull(row.email_verified_at),
      createdAt: toISOString(row.created_at),
      updatedAt: toISOString(row.updated_at),
    };
  } catch (error) {
    console.error('[Users] Error creating user:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    // Check for unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes('duplicate key value')
    ) {
      throw new Error('A user with this email already exists');
    }
    throw new Error('Failed to create user. Please try again later.');
  }
}

/**
 * Update a user's password
 * @param userId - The user ID
 * @param newPasswordHash - The new hashed password
 * @returns True if successful, false otherwise
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('[Users] Error updating user password:', error);
    throw new Error('Failed to update password. Please try again later.');
  }
}

/**
 * Update user's last login timestamp
 * @param userId - The user ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  } catch (error) {
    console.error('[Users] Error updating last login:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Update user's role
 * @param userId - The user ID
 * @param role - The new role
 * @returns True if successful, false otherwise
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2`,
      [role, userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('[Users] Error updating user role:', error);
    throw new Error('Failed to update user role. Please try again later.');
  }
}

/**
 * Get all users with a specific role
 * @param role - The role to filter by
 * @returns Array of users with that role
 */
export async function getUsersByRole(role: UserRole): Promise<MockUser[]> {
  try {
    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
      email_verified: boolean;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT
        id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        email_verified_at,
        created_at,
        updated_at
      FROM users
      WHERE role = $1 AND is_active = true
      ORDER BY full_name`,
      [role]
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      emailVerifiedAt: toISOStringOrNull(row.email_verified_at),
      createdAt: toISOString(row.created_at),
      updatedAt: toISOString(row.updated_at),
    }));
  } catch (error) {
    console.error('[Users] Error getting users by role:', error);
    throw new Error('Failed to fetch users. Please try again later.');
  }
}

/**
 * Deactivate a user (soft delete)
 * @param userId - The user ID to deactivate
 * @returns True if successful, false otherwise
 */
export async function deactivateUser(userId: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE users
       SET is_active = false, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('[Users] Error deactivating user:', error);
    throw new Error('Failed to deactivate user. Please try again later.');
  }
}

/**
 * Reactivate a user
 * @param userId - The user ID to reactivate
 * @returns True if successful, false otherwise
 */
export async function reactivateUser(userId: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE users
       SET is_active = true, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('[Users] Error reactivating user:', error);
    throw new Error('Failed to reactivate user. Please try again later.');
  }
}

// =============================================================================
// PASSWORD RESET TOKEN FUNCTIONS
// =============================================================================

/**
 * Create a password reset token for a user
 * Uses database storage when available, falls back to in-memory for testing
 * @param email - The user's email address
 * @returns The reset token if user exists, null otherwise
 */
export async function createPasswordResetToken(
  email: string
): Promise<string | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      return await createPasswordResetTokenDB(user.id, user.email);
    } catch (error) {
      console.error(
        '[Users] Database token creation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory for development/testing
  passwordResetTokens.forEach((t) => {
    if (t.userId === user.id) {
      t.used = true;
    }
  });

  const token = generateToken();
  const resetToken: PasswordResetToken = {
    token,
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    used: false,
  };

  passwordResetTokens.push(resetToken);
  return token;
}

/**
 * Validate a password reset token
 * Uses database storage when available, falls back to in-memory for testing
 * @param token - The token to validate
 * @returns The user ID if valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      return await validatePasswordResetTokenDB(token);
    } catch (error) {
      console.error(
        '[Users] Database token validation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory
  const resetToken = passwordResetTokens.find((t) => t.token === token);

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return null;
  }

  return {
    userId: resetToken.userId,
    email: resetToken.email,
  };
}

/**
 * Mark a password reset token as used
 * @param token - The token to invalidate
 */
export async function invalidatePasswordResetToken(token: string): Promise<void> {
  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      await invalidatePasswordResetTokenDB(token);
      return;
    } catch (error) {
      console.error(
        '[Users] Database token invalidation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory
  const resetToken = passwordResetTokens.find((t) => t.token === token);
  if (resetToken) {
    resetToken.used = true;
  }
}

// =============================================================================
// EMAIL VERIFICATION TOKENS
// =============================================================================

/**
 * Create an email verification token for a user
 * Uses database storage when available, falls back to in-memory for testing
 * @param email - The user's email address
 * @param userId - The user's ID
 * @returns The verification token
 */
export async function createEmailVerificationToken(
  email: string,
  userId: string
): Promise<string> {
  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      return await createEmailVerificationTokenDB(userId, email);
    } catch (error) {
      console.error(
        '[Users] Database token creation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory for development/testing
  emailVerificationTokens.forEach((t) => {
    if (t.userId === userId) {
      t.used = true;
    }
  });

  const token = generateToken();
  const verificationToken: EmailVerificationToken = {
    token,
    userId,
    email,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    used: false,
  };

  emailVerificationTokens.push(verificationToken);
  return token;
}

/**
 * Validate an email verification token
 * Uses database storage when available, falls back to in-memory for testing
 * @param token - The token to validate
 * @returns The user info if valid, null otherwise
 */
export async function validateEmailVerificationToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      return await validateEmailVerificationTokenDB(token);
    } catch (error) {
      console.error(
        '[Users] Database token validation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory
  const verificationToken = emailVerificationTokens.find(
    (t) => t.token === token
  );

  if (
    !verificationToken ||
    verificationToken.used ||
    verificationToken.expiresAt < new Date()
  ) {
    return null;
  }

  return {
    userId: verificationToken.userId,
    email: verificationToken.email,
  };
}

/**
 * Mark an email verification token as used
 * @param token - The token to invalidate
 */
export async function invalidateEmailVerificationToken(
  token: string
): Promise<void> {
  // Use database if connected
  if (getDatabaseStatus() === 'connected') {
    try {
      await invalidateEmailVerificationTokenDB(token);
      return;
    } catch (error) {
      console.error(
        '[Users] Database token invalidation failed, using in-memory:',
        error
      );
    }
  }

  // Fallback to in-memory
  const verificationToken = emailVerificationTokens.find(
    (t) => t.token === token
  );
  if (verificationToken) {
    verificationToken.used = true;
  }
}

/**
 * Mark a user's email as verified
 * @param userId - The user ID
 * @returns True if successful, false otherwise
 */
export async function verifyUserEmail(userId: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE users
       SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error('[Users] Error verifying user email:', error);
    throw new Error('Failed to verify email. Please try again later.');
  }
}

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

/**
 * Send a verification email to a user
 * Uses the Resend email service (falls back to console.log if not configured)
 *
 * @param email - The recipient email address
 * @param userId - The user ID for generating verification link
 */
export async function sendVerificationEmail(
  email: string,
  userId: string
): Promise<void> {
  // Get the user's name for personalization
  const user = await findUserById(userId);
  const userName = user?.fullName || 'there';

  // Generate a verification token
  const verificationToken = await createEmailVerificationToken(email, userId);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  // Send the email using the email service
  const result = await sendVerificationEmailService({
    email,
    userName,
    verifyUrl,
  });

  if (!result.success) {
    console.error(`[Users] Failed to send verification email: ${result.error}`);
  }
}

/**
 * Send a password reset email to a user
 * Uses the Resend email service (falls back to console.log if not configured)
 *
 * @param email - The recipient email address
 * @param resetToken - The password reset token
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  // Get the user's name for personalization
  const user = await findUserByEmail(email);
  const userName = user?.fullName || 'there';

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // Send the email using the email service
  const result = await sendPasswordResetEmailService({
    email,
    userName,
    resetUrl,
  });

  if (!result.success) {
    console.error(`[Users] Failed to send password reset email: ${result.error}`);
  }
}
