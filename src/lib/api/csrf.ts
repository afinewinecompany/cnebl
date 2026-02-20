/**
 * CSRF Protection Utilities
 *
 * Provides CSRF token validation for state-changing API requests.
 * Works with NextAuth.js CSRF protection.
 */

import { headers } from 'next/headers';

/**
 * Validate that the request includes proper CSRF protection.
 *
 * For API routes, we validate:
 * 1. Origin/Referer header matches our domain
 * 2. Content-Type is application/json (prevents simple form submissions)
 *
 * @returns true if the request passes CSRF validation
 */
export async function validateCSRF(): Promise<boolean> {
  const headersList = await headers();

  // Get the origin or referer header
  const origin = headersList.get('origin');
  const referer = headersList.get('referer');
  const host = headersList.get('host');

  // Content-Type check - JSON requests can't be sent via simple forms
  const contentType = headersList.get('content-type');
  const isJsonRequest = contentType?.includes('application/json');

  // For JSON requests, validate origin matches host
  if (isJsonRequest) {
    // Require origin or referer header for all state-changing requests
    // This prevents CSRF attacks from environments that strip these headers
    if (!origin && !referer) {
      return false;
    }

    // Validate origin matches host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host) {
          return true;
        }
      } catch {
        return false;
      }
    }

    // Validate referer matches host
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host === host) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }

  // Non-JSON requests require origin validation
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  // If no origin header, check referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // No origin or referer - reject for non-GET/HEAD/OPTIONS
  return false;
}

/**
 * CSRF validation response
 */
export function csrfErrorResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Request failed CSRF validation',
      },
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
