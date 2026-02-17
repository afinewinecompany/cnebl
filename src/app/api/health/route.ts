/**
 * Health Check API Route
 * GET /api/health - Returns application health status
 */

import { NextResponse } from 'next/server';
import { getDatabaseStatus, testConnection } from '@/lib/db/client';
import type { HealthCheckResponse } from '@/types';

// App version from package.json or environment
const APP_VERSION = process.env.npm_package_version || '0.2.0';

/**
 * Determine the HTTP status code based on health status
 */
function getHttpStatus(healthStatus: HealthCheckResponse['status']): number {
  switch (healthStatus) {
    case 'unhealthy':
      return 503;
    case 'degraded':
      return 200; // Still operational, just degraded
    case 'healthy':
    default:
      return 200;
  }
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();

  // Test database connection
  let dbStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  try {
    const connected = await testConnection();
    dbStatus = connected ? 'connected' : 'disconnected';
  } catch {
    dbStatus = 'disconnected';
  }

  // Determine overall health status
  // In mock mode (development), we're always healthy since we use mock data
  // In production with real DB, disconnected would be degraded
  const status: HealthCheckResponse['status'] =
    dbStatus === 'disconnected' && process.env.NODE_ENV === 'production'
      ? 'degraded'
      : 'healthy';

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    services: {
      database: dbStatus,
    },
  };

  // Add response time header
  const responseTime = Date.now() - startTime;

  return NextResponse.json(response, {
    status: getHttpStatus(status),
    headers: {
      'X-Response-Time': `${responseTime}ms`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
