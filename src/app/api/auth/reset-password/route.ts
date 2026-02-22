/**
 * Reset Password API Route
 * POST /api/auth/reset-password - Reset password with a valid token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import {
  checkRateLimitAsync,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/api/rate-limit';
import { validateCSRF, csrfErrorResponse } from '@/lib/api/csrf';
import {
  validatePasswordResetToken,
  invalidatePasswordResetToken,
  updateUserPassword,
} from '@/lib/db/queries/users';

/**
 * Password requirements schema (matches registration requirements)
 * - At least 10 characters
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 */
const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

/**
 * Reset password request schema
 */
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * POST /api/auth/reset-password
 *
 * Reset a user's password using a valid reset token.
 *
 * Request body:
 * {
 *   "token": "reset-token-from-email",
 *   "password": "NewSecureP@ssw0rd!",
 *   "confirmPassword": "NewSecureP@ssw0rd!"
 * }
 *
 * Response:
 * - 200: Password reset successful
 * - 400: Validation error or invalid/expired token
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF validation
    if (!await validateCSRF()) {
      return csrfErrorResponse();
    }

    // Rate limiting (database-backed when available)
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = await checkRateLimitAsync(
      `reset-password:${clientIP}`,
      RATE_LIMITS.passwordReset,
      { isSensitive: true }
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
    const validation = resetPasswordSchema.safeParse(body);
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
            message: 'Invalid password reset data',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Validate the reset token
    const tokenData = await validatePasswordResetToken(token);

    if (!tokenData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'This password reset link is invalid or has expired. Please request a new one.',
          },
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update the user's password
    const updated = await updateUserPassword(tokenData.userId, passwordHash);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update password. Please try again.',
          },
        },
        { status: 500 }
      );
    }

    // Invalidate the reset token so it can't be reused
    await invalidatePasswordResetToken(token);

    console.log('[API] Password reset successful');

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Your password has been successfully reset. You can now log in with your new password.',
        },
      },
      {
        status: 200,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[API] POST /api/auth/reset-password error:', error);
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
