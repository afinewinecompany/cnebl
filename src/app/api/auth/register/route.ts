/**
 * User Registration API Route
 * POST /api/auth/register - Create a new user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from '@/lib/api/rate-limit';
import { sanitizeName, sanitizeEmail } from '@/lib/api/sanitize';

/**
 * Password requirements schema
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
 * Registration request schema
 */
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * POST /api/auth/register
 *
 * Create a new user account.
 *
 * Request body:
 * {
 *   "name": "Full Name",
 *   "email": "user@example.com",
 *   "password": "SecureP@ssw0rd!",
 *   "confirmPassword": "SecureP@ssw0rd!"
 * }
 *
 * Response:
 * - 201: User created successfully
 * - 400: Validation error
 * - 409: Email already exists
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(
      `register:${clientIP}`,
      RATE_LIMITS.register
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many registration attempts. Please try again later.',
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
    const validation = registerSchema.safeParse(body);
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
            message: 'Invalid registration data',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeName(validation.data.name);
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

    // TODO: Check if email already exists in database
    // const existingUser = await findUserByEmail(sanitizedEmail);
    // if (existingUser) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: {
    //         code: 'EMAIL_EXISTS',
    //         message: 'An account with this email already exists',
    //       },
    //     },
    //     { status: 409 }
    //   );
    // }

    // Hash password
    const passwordHash = await hashPassword(validation.data.password);

    // TODO: Create user in database
    // const user = await createUser({
    //   name: sanitizedName,
    //   email: sanitizedEmail,
    //   passwordHash,
    //   role: 'player', // Default role for new registrations
    // });

    // For now, simulate user creation
    const mockUser = {
      id: `user-${Date.now()}`,
      name: sanitizedName,
      email: sanitizedEmail,
      role: 'player',
      createdAt: new Date().toISOString(),
    };

    // TODO: Send verification email
    // await sendVerificationEmail(mockUser.email, mockUser.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Registration successful. Please check your email to verify your account.',
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
          },
        },
      },
      {
        status: 201,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[API] POST /api/auth/register error:', error);
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
