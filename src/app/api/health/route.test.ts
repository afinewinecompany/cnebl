/**
 * Health API Route Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock database client
vi.mock('@/lib/db/client', () => ({
  getDatabaseStatus: vi.fn(),
  testConnection: vi.fn(),
}));

import { testConnection } from '@/lib/db/client';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when database is connected', async () => {
    vi.mocked(testConnection).mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database).toBe('connected');
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it('returns healthy status when database is disconnected in development', async () => {
    vi.mocked(testConnection).mockResolvedValue(false);
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database).toBe('disconnected');

    process.env.NODE_ENV = originalEnv;
  });

  it('returns degraded status when database is disconnected in production', async () => {
    vi.mocked(testConnection).mockResolvedValue(false);
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.services.database).toBe('disconnected');

    process.env.NODE_ENV = originalEnv;
  });

  it('handles database connection errors gracefully', async () => {
    vi.mocked(testConnection).mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.services.database).toBe('disconnected');
  });

  it('includes response time header', async () => {
    vi.mocked(testConnection).mockResolvedValue(true);

    const response = await GET();
    const responseTime = response.headers.get('X-Response-Time');

    expect(responseTime).toBeDefined();
    expect(responseTime).toMatch(/\d+ms/);
  });

  it('includes cache control headers', async () => {
    vi.mocked(testConnection).mockResolvedValue(true);

    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control');

    expect(cacheControl).toBe('no-cache, no-store, must-revalidate');
  });

  it('includes valid timestamp in ISO format', async () => {
    vi.mocked(testConnection).mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    const timestamp = new Date(body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });
});
