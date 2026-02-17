/**
 * Database Client
 * Placeholder for Railway PostgreSQL connection
 *
 * When ready to connect to the database:
 * 1. Install: npm install pg @types/pg
 * 2. Add DATABASE_URL to environment variables
 * 3. Uncomment the PostgreSQL client code below
 */

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
// POSTGRESQL CLIENT (PLACEHOLDER)
// =============================================================================

// TODO: Uncomment when ready to connect to Railway PostgreSQL
/*
import { Pool, PoolClient } from 'pg';

// Connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
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

// Execute a query
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}

// Get a client for transactions
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    connectionStatus = 'connected';
    return true;
  } catch (error) {
    connectionStatus = 'disconnected';
    console.error('[DB] Connection test failed:', error);
    return false;
  }
}

// Close pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    connectionStatus = 'disconnected';
  }
}
*/

// =============================================================================
// MOCK DATABASE CLIENT (ACTIVE)
// =============================================================================

/**
 * Mock query function for development
 * Returns mock data instead of actual database queries
 */
export async function query<T = unknown>(
  _text: string,
  _params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  // In development, we use direct mock data imports instead of database queries
  // This function exists for future PostgreSQL integration
  console.warn('[DB] Using mock database client - no actual queries executed');
  return { rows: [], rowCount: 0 };
}

/**
 * Test database connection (mock)
 */
export async function testConnection(): Promise<boolean> {
  // In development mode, we always report as connected (using mock data)
  connectionStatus = 'connected';
  return true;
}

/**
 * Close pool (mock - no-op)
 */
export async function closePool(): Promise<void> {
  connectionStatus = 'disconnected';
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

/**
 * Database configuration type
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
}

/**
 * Get database configuration from environment
 * Note: In production, use DATABASE_URL from Railway
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
