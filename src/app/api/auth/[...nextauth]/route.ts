/**
 * NextAuth.js API Route Handler
 *
 * Handles all authentication API requests
 * GET: Session checks, OAuth callbacks
 * POST: Sign in, sign out, CSRF
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
