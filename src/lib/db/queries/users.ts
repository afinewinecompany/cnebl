/**
 * User Queries
 * Query functions for user-related data
 * Currently uses mock data, will be replaced with PostgreSQL queries
 */

import { randomBytes } from 'crypto';
import type { UserRole } from '@/types/database.types';
import {
  sendVerificationEmail as sendVerificationEmailService,
  sendPasswordResetEmail as sendPasswordResetEmailService,
} from '@/lib/email';

// =============================================================================
// MOCK USER TYPE
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
// MOCK DATA STORE
// =============================================================================

/**
 * Mock users database
 * In production, this would be replaced with PostgreSQL queries
 */
const mockUsers: MockUser[] = [
  {
    id: 'user-admin-001',
    email: 'admin@cnebl.com',
    passwordHash: '$2a$12$LQv3c1yqBwQXRbPrQIx7qOZHHlBfPJHgXmjwJB8KFvYL7z0vQXHJa',
    fullName: 'League Admin',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    emailVerifiedAt: '2025-01-01T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-commissioner-001',
    email: 'commissioner@cnebl.com',
    passwordHash: '$2a$12$LQv3c1yqBwQXRbPrQIx7qOZHHlBfPJHgXmjwJB8KFvYL7z0vQXHJa',
    fullName: 'League Commissioner',
    role: 'commissioner',
    isActive: true,
    emailVerified: true,
    emailVerifiedAt: '2025-01-01T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-manager-001',
    email: 'manager@cnebl.com',
    passwordHash: '$2a$12$LQv3c1yqBwQXRbPrQIx7qOZHHlBfPJHgXmjwJB8KFvYL7z0vQXHJa',
    fullName: 'Team Manager',
    role: 'manager',
    isActive: true,
    emailVerified: true,
    emailVerifiedAt: '2025-01-01T00:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// =============================================================================
// MOCK PASSWORD RESET TOKENS
// =============================================================================

interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * In-memory store for password reset tokens
 * In production, this would be stored in the database
 */
const passwordResetTokens: PasswordResetToken[] = [];

// Clean up expired tokens periodically (every 5 minutes)
setInterval(() => {
  const now = new Date();
  const validTokens = passwordResetTokens.filter(
    (token) => token.expiresAt > now && !token.used
  );
  passwordResetTokens.length = 0;
  passwordResetTokens.push(...validTokens);
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
  // Simulate async database query
  await new Promise((resolve) => setTimeout(resolve, 10));

  const normalizedEmail = email.toLowerCase().trim();
  return mockUsers.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}

/**
 * Find a user by ID
 * @param id - The user ID to search for
 * @returns The user if found, null otherwise
 */
export async function findUserById(id: string): Promise<MockUser | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return mockUsers.find((user) => user.id === id) || null;
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
  await new Promise((resolve) => setTimeout(resolve, 50));

  const now = new Date().toISOString();
  const newUser: MockUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email: userData.email.toLowerCase().trim(),
    passwordHash: userData.passwordHash,
    fullName: userData.fullName,
    role: userData.role || 'player',
    isActive: true,
    emailVerified: false,
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  mockUsers.push(newUser);
  return newUser;
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
  await new Promise((resolve) => setTimeout(resolve, 50));

  const userIndex = mockUsers.findIndex((user) => user.id === userId);
  if (userIndex === -1) return false;

  mockUsers[userIndex].passwordHash = newPasswordHash;
  mockUsers[userIndex].updatedAt = new Date().toISOString();
  return true;
}

// =============================================================================
// PASSWORD RESET TOKEN FUNCTIONS
// =============================================================================

/**
 * Generate a cryptographically secure random token
 * Uses crypto.randomBytes for secure entropy (256-bit)
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a password reset token for a user
 * @param email - The user's email address
 * @returns The reset token if user exists, null otherwise
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const user = await findUserByEmail(email);
  if (!user) return null;

  // Invalidate any existing tokens for this user
  passwordResetTokens.forEach((t) => {
    if (t.userId === user.id) {
      t.used = true;
    }
  });

  // Create new token (valid for 1 hour)
  const token = generateToken();
  const resetToken: PasswordResetToken = {
    token,
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    used: false,
  };

  passwordResetTokens.push(resetToken);
  return token;
}

/**
 * Validate a password reset token
 * @param token - The token to validate
 * @returns The user ID if valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const resetToken = passwordResetTokens.find((t) => t.token === token);

  if (!resetToken) {
    return null;
  }

  if (resetToken.used) {
    return null;
  }

  if (resetToken.expiresAt < new Date()) {
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
  await new Promise((resolve) => setTimeout(resolve, 10));

  const resetToken = passwordResetTokens.find((t) => t.token === token);
  if (resetToken) {
    resetToken.used = true;
  }
}

// =============================================================================
// EMAIL VERIFICATION TOKENS
// =============================================================================

interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * In-memory store for email verification tokens
 * In production, this would be stored in the database
 */
const emailVerificationTokens: EmailVerificationToken[] = [];

// Clean up expired verification tokens periodically (every 5 minutes)
setInterval(() => {
  const now = new Date();
  const validTokens = emailVerificationTokens.filter(
    (token) => token.expiresAt > now && !token.used
  );
  emailVerificationTokens.length = 0;
  emailVerificationTokens.push(...validTokens);
}, 5 * 60 * 1000);

/**
 * Create an email verification token for a user
 * @param email - The user's email address
 * @param userId - The user's ID
 * @returns The verification token
 */
export async function createEmailVerificationToken(
  email: string,
  userId: string
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Invalidate any existing tokens for this user
  emailVerificationTokens.forEach((t) => {
    if (t.userId === userId) {
      t.used = true;
    }
  });

  // Create new token (valid for 24 hours)
  const token = generateToken();
  const verificationToken: EmailVerificationToken = {
    token,
    userId,
    email,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    used: false,
  };

  emailVerificationTokens.push(verificationToken);
  return token;
}

/**
 * Validate an email verification token
 * @param token - The token to validate
 * @returns The user info if valid, null otherwise
 */
export async function validateEmailVerificationToken(token: string): Promise<{
  userId: string;
  email: string;
} | null> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const verificationToken = emailVerificationTokens.find((t) => t.token === token);

  if (!verificationToken) {
    return null;
  }

  if (verificationToken.used) {
    return null;
  }

  if (verificationToken.expiresAt < new Date()) {
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
export async function invalidateEmailVerificationToken(token: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));

  const verificationToken = emailVerificationTokens.find((t) => t.token === token);
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
  await new Promise((resolve) => setTimeout(resolve, 50));

  const userIndex = mockUsers.findIndex((user) => user.id === userId);
  if (userIndex === -1) return false;

  mockUsers[userIndex].emailVerified = true;
  mockUsers[userIndex].emailVerifiedAt = new Date().toISOString();
  mockUsers[userIndex].updatedAt = new Date().toISOString();
  return true;
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
export async function sendVerificationEmail(email: string, userId: string): Promise<void> {
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
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
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
