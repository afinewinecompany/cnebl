/**
 * User Queries
 * Query functions for user-related data
 * Currently uses mock data, will be replaced with PostgreSQL queries
 */

import type { UserRole } from '@/types/database.types';

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
    // Password: Admin123!@#
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
    // Password: Commish123!@#
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
    // Password: Manager123!@#
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
 * Generate a secure random token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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
// EMAIL VERIFICATION (MOCK)
// =============================================================================

/**
 * Send a verification email (mock implementation)
 * In production, this would integrate with an email service
 *
 * @param email - The recipient email address
 * @param userId - The user ID for generating verification link
 */
export async function sendVerificationEmail(email: string, userId: string): Promise<void> {
  // Generate a mock verification token
  const verificationToken = generateToken();
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  // In production, this would send an actual email
  // For now, log to console for testing
  console.log('\n========================================');
  console.log('VERIFICATION EMAIL (Mock)');
  console.log('========================================');
  console.log(`To: ${email}`);
  console.log(`User ID: ${userId}`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log('========================================\n');
}

/**
 * Send a password reset email (mock implementation)
 * In production, this would integrate with an email service
 *
 * @param email - The recipient email address
 * @param resetToken - The password reset token
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // In production, this would send an actual email
  // For now, log to console for testing
  console.log('\n========================================');
  console.log('PASSWORD RESET EMAIL (Mock)');
  console.log('========================================');
  console.log(`To: ${email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`Token expires: ${new Date(Date.now() + 60 * 60 * 1000).toISOString()}`);
  console.log('========================================\n');
}
