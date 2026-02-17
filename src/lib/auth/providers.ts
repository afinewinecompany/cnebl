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
}

/**
 * Find user by email from database
 */
async function findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  try {
    const result = await query<DbUser>(
      `SELECT id, email, password_hash, full_name, role, avatar_url, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1) AND is_active = true`,
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
        console.log('[Auth] User not found:', email);
        return null;
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log('[Auth] Invalid password for:', email);
        return null;
      }

      console.log('[Auth] Login successful:', email);

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
      console.error('[Auth] Authorization error:', error);
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
