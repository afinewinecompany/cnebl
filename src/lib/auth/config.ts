/**
 * NextAuth.js v5 Configuration
 *
 * Central configuration for authentication in CNEBL
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { providers } from './providers';
import type { SessionUser, UserRole } from '@/types/auth';
import { query } from '@/lib/db/client';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teamId?: string;
    teamName?: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teamId?: string;
    teamName?: string;
  }
}

/**
 * NextAuth configuration object
 */
export const authConfig: NextAuthConfig = {
  providers,

  // Use JWT strategy for sessions
  // IMPORTANT: These values MUST match edge-config.ts for middleware compatibility
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days - matches edge-config
    updateAge: 24 * 60 * 60, // Update session every 24 hours - matches edge-config
  },

  // Custom pages
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/register',
  },

  // Callbacks for customizing behavior
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * Add custom fields to the token
     */
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email ?? '';
        token.name = user.name ?? '';
        token.role = user.role;
        token.teamId = user.teamId;
        token.teamName = user.teamName;
      }

      // Handle session update (e.g., after profile change or team assignment)
      if (trigger === 'update') {
        // If explicit values provided, use them
        if (session?.name) token.name = session.name;
        if (session?.teamId) token.teamId = session.teamId;
        if (session?.teamName) token.teamName = session.teamName;

        // If refreshTeam flag is set, re-fetch team info from database
        if (session?.refreshTeam && token.id) {
          try {
            const result = await query<{ team_id: string | null; team_name: string | null }>(
              `SELECT p.team_id, t.name as team_name
               FROM players p
               LEFT JOIN teams t ON t.id = p.team_id
               WHERE p.user_id = $1 AND p.is_active = true`,
              [token.id]
            );
            if (result.rows.length > 0) {
              token.teamId = result.rows[0].team_id || undefined;
              token.teamName = result.rows[0].team_name || undefined;
            }
          } catch (error) {
            console.error('[Auth] Failed to refresh team info:', error);
          }
        }
      }

      return token;
    },

    /**
     * Session callback - called when session is checked
     * Add custom fields from JWT to session
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.teamId = token.teamId;
        session.user.teamName = token.teamName;
        session.user.image = token.picture ?? undefined;
      }
      return session;
    },

    /**
     * Authorized callback - protect routes in middleware
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtected = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/team') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/scoring') ||
        nextUrl.pathname.startsWith('/chat') ||
        nextUrl.pathname.startsWith('/availability');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register') ||
        nextUrl.pathname.startsWith('/forgot-password') ||
        nextUrl.pathname.startsWith('/reset-password');

      // Redirect logged-in users away from auth pages
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Protect admin routes
      if (isOnAdmin) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        const role = auth?.user?.role;
        if (role !== 'admin' && role !== 'commissioner') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      // Protect authenticated routes
      if (isOnProtected) {
        if (!isLoggedIn) {
          const loginUrl = new URL('/login', nextUrl);
          loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
          return Response.redirect(loginUrl);
        }
        return true;
      }

      // Allow public routes
      return true;
    },
  },

  // Events for logging (no PII logged for security)
  events: {
    async signIn({ user, isNewUser }) {
      console.log('[Auth Event] Sign in:', user.id, isNewUser ? '(new user)' : '');
    },
    async signOut(message) {
      // Check if it's a JWT session (has token) or database session
      if ('token' in message) {
        console.log('[Auth Event] Sign out:', message.token?.id);
      } else {
        console.log('[Auth Event] Sign out: session ended');
      }
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Trust host configuration for proxy environments
  // Security: Only trust host header when AUTH_URL is properly configured
  // - In development: Always trust (for localhost flexibility)
  // - In production: Only trust when AUTH_URL is set (validates against it)
  // This prevents host header injection attacks in misconfigured deployments
  trustHost: process.env.NODE_ENV !== 'production' || !!process.env.AUTH_URL,
};

/**
 * Export NextAuth handlers and utilities
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Export type-safe auth getter for server components
 */
export async function getSession() {
  return await auth();
}

/**
 * Check if user has required role (server-side)
 */
export async function requireRole(requiredRole: UserRole): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const roleHierarchy: Record<UserRole, number> = {
    player: 1,
    manager: 2,
    admin: 3,
    commissioner: 4,
  };

  if (roleHierarchy[session.user.role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions');
  }

  return session.user;
}
