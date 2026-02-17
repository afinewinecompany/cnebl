/**
 * Next.js Middleware for Authentication
 *
 * Protects routes and handles auth redirects
 * Uses NextAuth.js v5 edge-compatible auth
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

// Export the middleware using NextAuth
export default NextAuth(authConfig).auth;

/**
 * Matcher configuration
 * Define which routes the middleware should run on
 *
 * API routes are now included in the matcher so they go through
 * the auth middleware. Individual API routes can still be public
 * by checking auth in the route handler.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     *
     * Note: API routes ARE included in middleware now.
     * Public API routes handle auth checks internally.
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
