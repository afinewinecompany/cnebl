/**
 * NextAuth.js Providers Configuration
 *
 * Sets up authentication providers for CNEBL
 * Uses PostgreSQL database for user authentication
 */

import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Provider } from 'next-auth/providers';
import type { User, UserRole } from '@/types/auth';
import { query } from '@/lib/db/client';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Database user type
interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  team_id: string | null;
  team_name: string | null;
}

/**
 * Find user by email from database
 * Joins with players and teams tables to get team assignment
 */
async function findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  try {
    const result = await query<DbUser>(
      `SELECT
         u.id, u.email, u.password_hash, u.full_name, u.role, u.avatar_url, u.is_active,
         p.team_id,
         t.name as team_name
       FROM users u
       LEFT JOIN players p ON p.user_id = u.id AND p.is_active = true
       LEFT JOIN teams t ON t.id = p.team_id
       WHERE LOWER(u.email) = LOWER($1) AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const dbUser = result.rows[0];

    return {
      id: dbUser.id,
      email: dbUser.email,
      password: dbUser.password_hash,
      name: dbUser.full_name,
      role: dbUser.role,
      teamId: dbUser.team_id || undefined,
      teamName: dbUser.team_name || undefined,
      profileImage: dbUser.avatar_url || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('[Auth] Database query error:', error);
    return null;
  }
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Credentials Provider
 * Handles email/password authentication
 */
export const credentialsProvider = Credentials({
  id: 'credentials',
  name: 'Email & Password',
  credentials: {
    email: {
      label: 'Email',
      type: 'email',
      placeholder: 'your@email.com',
    },
    password: {
      label: 'Password',
      type: 'password',
    },
  },
  async authorize(credentials) {
    try {
      // Validate input
      const { email, password } = loginSchema.parse(credentials);

      // Find user in database
      const user = await findUserByEmail(email);
      if (!user) {
        // Security: Don't log email addresses to prevent PII exposure in logs
        console.log('[Auth] Login failed: user not found');
        return null;
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        // Security: Don't log email addresses to prevent PII exposure in logs
        console.log('[Auth] Login failed: invalid credentials');
        return null;
      }

      // Security: Log user ID instead of email for successful logins
      console.log('[Auth] Login successful for user:', user.id);

      // Return user without password
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
        teamName: user.teamName,
        image: user.profileImage,
      };
    } catch (error) {
      // Security: Don't include error details that might contain PII
      console.error('[Auth] Authorization error occurred');
      return null;
    }
  },
});

/**
 * All authentication providers
 */
export const providers: Provider[] = [
  credentialsProvider,
];

/**
 * Hash a password for storage
 * Used during user registration
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
