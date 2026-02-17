/**
 * NextAuth.js Edge-compatible Configuration
 *
 * This config is used by the middleware (which runs in Edge Runtime).
 * It excludes the credentials provider which imports bcryptjs (Node.js only).
 *
 * For full auth functionality (login, etc.), use the main config.ts
 */

import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { SessionUser, UserRole } from '@/types/auth';

// Re-declare module augmentations for Edge context
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
 * Edge-compatible auth config (no providers that use Node.js crypto)
 * Used by middleware for session validation and route protection
 */
export const edgeAuthConfig: NextAuthConfig = {
  // NO PROVIDERS - this is intentional for Edge compatibility
  // The middleware only needs to validate existing sessions, not create new ones
  providers: [],

  // Use JWT strategy for sessions
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  // Custom pages
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/register',
  },

  // Callbacks for session/JWT handling
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     */
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? '';
        token.name = user.name ?? '';
        token.role = user.role;
        token.teamId = user.teamId;
        token.teamName = user.teamName;
      }

      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.teamId = session.teamId || token.teamId;
        token.teamName = session.teamName || token.teamName;
      }

      return token;
    },

    /**
     * Session callback - add custom fields from JWT to session
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

  // Trust the host header
  trustHost: true,
};
