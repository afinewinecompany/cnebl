/**
 * Redis Client
 * Connection to Railway Redis instance
 */

import Redis from 'ioredis';

// =============================================================================
// REDIS CONNECTION
// =============================================================================

let redis: Redis | null = null;
let connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

/**
 * Get or create Redis client
 * Uses REDIS_URL environment variable from Railway
 */
export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not configured, rate limiting will use in-memory fallback');
    return null;
  }

  if (!redis) {
    connectionStatus = 'connecting';

    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error('[Redis] Max retries reached, giving up');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Exponential backoff
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      connectionStatus = 'connected';
      console.log('[Redis] Connected to Railway Redis');
    });

    redis.on('error', (err) => {
      connectionStatus = 'disconnected';
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('close', () => {
      connectionStatus = 'disconnected';
    });

    // Attempt connection
    redis.connect().catch((err) => {
      console.error('[Redis] Initial connection failed:', err.message);
      connectionStatus = 'disconnected';
    });
  }

  return redis;
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): 'connected' | 'disconnected' | 'connecting' {
  return connectionStatus;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return connectionStatus === 'connected' && redis !== null;
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    connectionStatus = 'disconnected';
  }
}
