/**
 * Forgot Password API Route
 * POST /api/auth/forgot-password - Request a password reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimitAsync,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/api/rate-limit';
import { validateCSRF, csrfErrorResponse } from '@/lib/api/csrf';
import { sanitizeEmail } from '@/lib/api/sanitize';
import {
  findUserByEmail,
  createPasswordResetToken,
  sendPasswordResetEmail,
} from '@/lib/db/queries/users';

/**
 * Request schema for password reset
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/forgot-password
 *
 * Request a password reset email. For security, always returns success
 * even if the email doesn't exist (prevents email enumeration).
 *
 * Request body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * - 200: Request processed (always returns success for security)
 * - 400: Validation error
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    if (!await validateCSRF()) {
      return csrfErrorResponse();
    }

    // Rate limiting - stricter for password reset (database-backed when available)
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await checkRateLimitAsync(
      `forgot-password:${clientIP}`,
      RATE_LIMITS.passwordReset
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts. Please try again later.',
          },
        },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email address',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(validation.data.email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address format',
          },
        },
        { status: 400 }
      );
    }

    // Check if user exists and generate reset token
    // We do this silently - don't reveal if the email exists
    const user = await findUserByEmail(sanitizedEmail);

    if (user) {
      // Generate reset token and send email
      const resetToken = await createPasswordResetToken(sanitizedEmail);

      if (resetToken) {
        // Send the password reset email (mock implementation logs to console)
        await sendPasswordResetEmail(sanitizedEmail, resetToken);
        console.log('[API] Password reset email sent');
      }
    } else {
      // Log the attempt but don't reveal that the user doesn't exist
      console.log('[API] Password reset attempted for unknown email');
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'If an account exists with this email, you will receive a password reset link shortly.',
        },
      },
      {
        status: 200,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[API] POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
