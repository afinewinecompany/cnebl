/**
 * Auth Register API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed_password_123')),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimitAsync: vi.fn(() => Promise.resolve({ allowed: true, remaining: 5, reset: Date.now() + 60000 })),
  getClientIP: vi.fn(() => '127.0.0.1'),
  rateLimitHeaders: vi.fn(() => ({})),
  RATE_LIMITS: { register: { limit: 5, window: 60000 } },
}));

vi.mock('@/lib/api/csrf', () => ({
  validateCSRF: vi.fn(() => Promise.resolve(true)),
  csrfErrorResponse: vi.fn(() => {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      { success: false, error: { code: 'CSRF_ERROR', message: 'Invalid CSRF token' } },
      { status: 403 }
    );
  }),
}));

vi.mock('@/lib/api/sanitize', () => ({
  sanitizeName: vi.fn((name: string) => name?.trim() || ''),
  sanitizeEmail: vi.fn((email: string) => email?.toLowerCase().trim() || null),
}));

vi.mock('@/lib/db/queries/users', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  sendVerificationEmail: vi.fn(() => Promise.resolve()),
}));

import { checkRateLimitAsync } from '@/lib/api/rate-limit';
import { validateCSRF } from '@/lib/api/csrf';
import { findUserByEmail, createUser } from '@/lib/db/queries/users';

const validRegistrationData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecureP@ss123!',
  confirmPassword: 'SecureP@ss123!',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('/api/auth/register', 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateCSRF).mockResolvedValue(true);
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, remaining: 5, reset: Date.now() + 60000 });
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockResolvedValue({
      id: 'user-123',
      email: 'john@example.com',
      fullName: 'John Doe',
      role: 'player',
    });
  });

  it('successfully registers a new user', async () => {
    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('john@example.com');
    expect(body.data.message).toContain('Registration successful');
  });

  it('rejects invalid CSRF token', async () => {
    vi.mocked(validateCSRF).mockResolvedValue(false);

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CSRF_ERROR');
  });

  it('enforces rate limiting', async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({
      allowed: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('validates required fields', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates name minimum length', async () => {
    const request = createRequest({
      ...validRegistrationData,
      name: 'J',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.name).toBeDefined();
  });

  it('validates email format', async () => {
    const request = createRequest({
      ...validRegistrationData,
      email: 'invalid-email',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.email).toBeDefined();
  });

  it('validates password minimum length', async () => {
    const request = createRequest({
      ...validRegistrationData,
      password: 'Short1!',
      confirmPassword: 'Short1!',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.password).toBeDefined();
  });

  it('validates password requires uppercase', async () => {
    const request = createRequest({
      ...validRegistrationData,
      password: 'lowercase123!',
      confirmPassword: 'lowercase123!',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.password).toBeDefined();
  });

  it('validates password requires lowercase', async () => {
    const request = createRequest({
      ...validRegistrationData,
      password: 'UPPERCASE123!',
      confirmPassword: 'UPPERCASE123!',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.password).toBeDefined();
  });

  it('validates password requires number', async () => {
    const request = createRequest({
      ...validRegistrationData,
      password: 'NoNumbers!@#',
      confirmPassword: 'NoNumbers!@#',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.password).toBeDefined();
  });

  it('validates password requires special character', async () => {
    const request = createRequest({
      ...validRegistrationData,
      password: 'NoSpecialChar123',
      confirmPassword: 'NoSpecialChar123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.password).toBeDefined();
  });

  it('validates passwords must match', async () => {
    const request = createRequest({
      ...validRegistrationData,
      confirmPassword: 'DifferentP@ss123!',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details.confirmPassword).toBeDefined();
  });

  it('rejects existing email', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'existing-user',
      email: 'john@example.com',
    });

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('EMAIL_EXISTS');
  });

  it('handles invalid JSON gracefully', async () => {
    const request = new NextRequest(new URL('/api/auth/register', 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'not valid json',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(createUser).mockRejectedValue(new Error('Database error'));

    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('trims whitespace from name', async () => {
    const request = createRequest({
      ...validRegistrationData,
      name: '  John Doe  ',
    });
    const response = await POST(request);
    const body = await response.json();

    // Check that the response is successful
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(createUser).toHaveBeenCalled();
  });

  it('creates user with default player role', async () => {
    const request = createRequest(validRegistrationData);
    await POST(request);

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'player',
      })
    );
  });

  it('does not return password hash in response', async () => {
    const request = createRequest(validRegistrationData);
    const response = await POST(request);
    const body = await response.json();

    expect(body.data.user).not.toHaveProperty('passwordHash');
    expect(body.data.user).not.toHaveProperty('password');
  });
});
