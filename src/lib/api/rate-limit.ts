/**
 * Rate Limiting Utility
 *
 * Redis-backed rate limiter for API routes.
 * Falls back to in-memory if Redis is unavailable.
 *
 * Security considerations:
 * - In-memory fallback does not persist across server restarts
 * - In-memory fallback does not work across multiple server instances
 * - For production, ensure Redis is properly configured
 */

import { getRedisClient, isRedisAvailable } from '@/lib/redis/client';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store as fallback when Redis is unavailable
const rateLimitStore = new Map<string, RateLimitEntry>();

// Track if we've warned about in-memory fallback (to avoid log spam)
let hasWarnedAboutFallback = false;

// Clean up expired in-memory entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Log a warning when falling back to in-memory rate limiting in production
 */
function warnAboutInMemoryFallback(): void {
  if (process.env.NODE_ENV === 'production' && !hasWarnedAboutFallback) {
    hasWarnedAboutFallback = true;
    console.warn(
      '[Rate Limit] WARNING: Using in-memory rate limiting fallback in production. ' +
      'This does not persist across restarts or scale across instances. ' +
      'Configure Redis (REDIS_URL) for proper rate limiting.'
    );
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Time in ms until the rate limit resets */
  resetIn: number;
  /** Total requests allowed per window */
  limit: number;
}

/**
 * Check rate limit using in-memory store (fallback)
 * Note: This is a fallback for when Redis is unavailable.
 * In production, this has limitations - see module-level docs.
 */
function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Warn once in production about in-memory limitations
  warnAboutInMemoryFallback();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or entry has expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      limit: config.maxRequests,
    };
  }

  // Increment count
  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      limit: config.maxRequests,
    };
  }

  return {
    allowed: true,
    remaining,
    resetIn,
    limit: config.maxRequests,
  };
}

/**
 * Check rate limit using Redis (sliding window counter)
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return checkRateLimitInMemory(identifier, config);
  }

  const key = `ratelimit:${identifier}`;
  const windowSec = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis MULTI for atomic increment + expire
    const pipeline = redis.multi();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const count = results[0][1] as number;
    let ttl = results[1][1] as number;

    // If key is new (ttl = -1), set expiration
    if (ttl === -1) {
      await redis.expire(key, windowSec);
      ttl = windowSec;
    }

    const resetIn = ttl * 1000;
    const remaining = Math.max(0, config.maxRequests - count);

    return {
      allowed: count <= config.maxRequests,
      remaining,
      resetIn,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('[Rate Limit] Redis error, falling back to in-memory:', error);
    return checkRateLimitInMemory(identifier, config);
  }
}

/**
 * Check rate limit for a given identifier
 * Uses in-memory for synchronous API compatibility
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // For synchronous API compatibility, use in-memory
  // Use checkRateLimitAsync for Redis-backed rate limiting
  return checkRateLimitInMemory(identifier, config);
}

/**
 * Check rate limit asynchronously using Redis
 * Preferred method for production - persists across restarts and scales horizontally
 *
 * @param identifier - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @param options - Additional options
 * @returns Rate limit result
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig,
  options?: { isSensitive?: boolean }
): Promise<RateLimitResult> {
  // Use Redis if available, otherwise fall back to in-memory
  if (isRedisAvailable()) {
    return checkRateLimitRedis(identifier, config);
  }

  // For sensitive operations (login, password reset) in production without Redis,
  // apply stricter rate limits since we can't rely on persistence
  if (options?.isSensitive && process.env.NODE_ENV === 'production') {
    const stricterConfig: RateLimitConfig = {
      maxRequests: Math.max(1, Math.floor(config.maxRequests / 2)),
      windowMs: config.windowMs,
    };
    return checkRateLimitInMemory(identifier, stricterConfig);
  }

  return checkRateLimitInMemory(identifier, config);
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  /** Login attempts: 5 per 15 minutes per IP */
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  /** Registration attempts: 3 per hour per IP */
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  /** Password reset requests: 3 per hour per email */
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  /** API requests: 100 per minute per user */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  /** Message sending: 30 per minute per user */
  messages: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Trusted proxy configuration
 * In production, set TRUSTED_PROXIES env var to comma-separated list of trusted proxy IPs
 * e.g., "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16" for private networks
 * Railway uses internal networking, so you may need to configure this based on your setup
 */
const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES?.split(',').map(p => p.trim()) || [];

/**
 * Check if an IP is in a trusted proxy range
 * Supports exact matches and CIDR notation
 */
function isTrustedProxy(ip: string): boolean {
  if (TRUSTED_PROXIES.length === 0) {
    // In development or if not configured, trust common proxy headers
    // In production, configure TRUSTED_PROXIES for security
    return process.env.NODE_ENV !== 'production';
  }

  return TRUSTED_PROXIES.some(proxy => {
    if (proxy.includes('/')) {
      // CIDR notation - simplified check for common cases
      const [network, bits] = proxy.split('/');
      const networkParts = network.split('.').map(Number);
      const ipParts = ip.split('.').map(Number);
      const mask = parseInt(bits, 10);

      if (networkParts.length !== 4 || ipParts.length !== 4) return false;

      const networkNum = networkParts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
      const ipNum = ipParts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
      const maskNum = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;

      return (networkNum & maskNum) === (ipNum & maskNum);
    }
    return proxy === ip;
  });
}

/**
 * Get client IP address from request headers
 * Only trusts X-Forwarded-For from configured trusted proxies
 */
export function getClientIP(headers: Headers): string {
  const connectionIP = headers.get('x-real-ip') || 'unknown';

  // Only trust X-Forwarded-For if the connecting IP is a trusted proxy
  if (isTrustedProxy(connectionIP)) {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Get the leftmost (client) IP from the chain
      return forwardedFor.split(',')[0].trim();
    }
  }

  // If not behind a trusted proxy, use the direct connection IP
  return connectionIP;
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  };
}
