/**
 * Database Client
 * PostgreSQL connection for Railway
 */

import { Pool, PoolClient } from 'pg';

// =============================================================================
// DATABASE CONNECTION STATUS
// =============================================================================

export type DatabaseStatus = 'connected' | 'disconnected' | 'unknown';

let connectionStatus: DatabaseStatus = 'unknown';

/**
 * Get current database connection status
 */
export function getDatabaseStatus(): DatabaseStatus {
  return connectionStatus;
}

// =============================================================================
// POSTGRESQL CLIENT
// =============================================================================

/**
 * Build SSL configuration for PostgreSQL connection
 *
 * Security considerations:
 * - In production, SSL certificate validation is ENABLED by default
 * - Use DATABASE_CA_CERT to provide a custom CA certificate (base64 encoded)
 * - Use DATABASE_SSL_REJECT_UNAUTHORIZED=false ONLY if your provider requires it
 *   (e.g., some PaaS platforms with internal proxies)
 * - In development without DATABASE_URL, SSL is disabled
 */
function buildSslConfig(): false | { rejectUnauthorized: boolean; ca?: string } {
  // No SSL if no database URL
  if (!process.env.DATABASE_URL) {
    return false;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Check for custom CA certificate (base64 encoded)
  const caCert = process.env.DATABASE_CA_CERT;
  if (caCert) {
    return {
      rejectUnauthorized: true,
      ca: Buffer.from(caCert, 'base64').toString('utf-8'),
    };
  }

  // Check for explicit opt-out of SSL validation
  // This should ONLY be used when the database provider requires it
  const rejectUnauthorizedEnv = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  if (rejectUnauthorizedEnv === 'false') {
    if (isProduction) {
      console.warn(
        '[DB] WARNING: SSL certificate validation is disabled in production. ' +
        'This makes the connection vulnerable to MITM attacks. ' +
        'Consider providing DATABASE_CA_CERT for secure connections.'
      );
    }
    return { rejectUnauthorized: false };
  }

  // Default: SSL enabled with certificate validation
  // In development, allow self-signed certs; in production, require valid certs
  return {
    rejectUnauthorized: isProduction,
  };
}

// Connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: buildSslConfig(),
  max: 10, // Reduced pool size for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms for cold starts
  statement_timeout: 30000, // 30 second query timeout
};

// Create a connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    pool.on('connect', () => {
      connectionStatus = 'connected';
      console.log('[DB] Client connected to PostgreSQL');
    });

    pool.on('error', (err) => {
      connectionStatus = 'disconnected';
      console.error('[DB] Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}

/**
 * Get a client for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    connectionStatus = 'connected';
    return true;
  } catch (error) {
    connectionStatus = 'disconnected';
    console.error('[DB] Connection test failed:', error);
    return false;
  }
}

/**
 * Close pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    connectionStatus = 'disconnected';
  }
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
}

/**
 * Get database configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig | null {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      user: parsed.username,
      ssl: process.env.NODE_ENV === 'production',
    };
  } catch {
    return null;
  }
}
