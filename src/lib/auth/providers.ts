/**
 * NextAuth.js Providers Configuration
 *
 * Sets up authentication providers for CNEBL
 * Currently: Credentials (email/password)
 * Future: Google OAuth
 */

import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Provider } from 'next-auth/providers';
import type { User, UserRole } from '@/types/auth';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Mock user database for development only.
 * In production, this should be replaced with actual database queries.
 *
 * IMPORTANT: Passwords must be set via environment variables.
 * Never commit actual passwords or password hashes to source control.
 */
interface MockUserConfig {
  id: string;
  email: string;
  passwordEnvVar: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
}

const MOCK_USER_CONFIGS: MockUserConfig[] = [
  {
    id: '1',
    email: process.env.MOCK_USER_COMMISSIONER_EMAIL || 'commissioner@cnebl.com',
    passwordEnvVar: 'MOCK_USER_COMMISSIONER_PASSWORD_HASH',
    name: 'John Commissioner',
    role: 'commissioner' as UserRole,
  },
  {
    id: '2',
    email: process.env.MOCK_USER_ADMIN_EMAIL || 'admin@cnebl.com',
    passwordEnvVar: 'MOCK_USER_ADMIN_PASSWORD_HASH',
    name: 'Admin User',
    role: 'admin' as UserRole,
  },
  {
    id: '3',
    email: process.env.MOCK_USER_MANAGER_EMAIL || 'manager@cnebl.com',
    passwordEnvVar: 'MOCK_USER_MANAGER_PASSWORD_HASH',
    name: 'Mike Manager',
    role: 'manager' as UserRole,
    teamId: 'team-1',
    teamName: 'Cape Cod Mariners',
  },
  {
    id: '4',
    email: process.env.MOCK_USER_PLAYER_EMAIL || 'player@cnebl.com',
    passwordEnvVar: 'MOCK_USER_PLAYER_PASSWORD_HASH',
    name: 'Tommy Player',
    role: 'player' as UserRole,
    teamId: 'team-1',
    teamName: 'Cape Cod Mariners',
  },
];

// Build mock users array from config - only include users with valid password hashes
const MOCK_USERS: (User & { password: string })[] = MOCK_USER_CONFIGS
  .filter(config => {
    const passwordHash = process.env[config.passwordEnvVar];
    return passwordHash && passwordHash.length > 0;
  })
  .map(config => ({
    id: config.id,
    email: config.email,
    password: process.env[config.passwordEnvVar]!,
    name: config.name,
    role: config.role,
    teamId: config.teamId,
    teamName: config.teamName,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }));

/**
 * Find user by email (mock implementation)
 * Replace with database query in production
 */
async function findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  // Simulate database delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
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

      // Find user
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
 * Add Google OAuth here when ready
 */
export const providers: Provider[] = [
  credentialsProvider,
  // Future: Google OAuth
  // Google({
  //   clientId: process.env.GOOGLE_CLIENT_ID!,
  //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // }),
];

/**
 * Hash a password for storage
 * Used during user registration
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// findUserByEmail is used internally - not exported to prevent credential leakage
