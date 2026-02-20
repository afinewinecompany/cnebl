/**
 * Migration Runner Script
 * Runs SQL migrations against Railway PostgreSQL
 *
 * Usage: node scripts/run-migration.js [migration-file]
 * Example: node scripts/run-migration.js db/migrations/003_security_tokens.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration(migrationFile) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in .env.local');
    console.log('\nPlease add your Railway PostgreSQL connection string:');
    console.log('DATABASE_URL=postgresql://user:password@host:port/database');
    process.exit(1);
  }

  // Read migration file
  const migrationPath = path.resolve(process.cwd(), migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`📄 Reading migration: ${migrationFile}`);

  // Connect to database
  // Railway PostgreSQL uses SSL but with their own CA
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false }, // Allow Railway's self-signed cert in dev
  });

  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    const client = await pool.connect();

    console.log('✅ Connected successfully');
    console.log('🚀 Running migration...\n');

    // Run migration
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('password_reset_tokens', 'email_verification_tokens')
      ORDER BY table_name
    `);

    console.log('\n📋 Token tables created:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check if cleanup function exists
    const functions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'cleanup_expired_tokens'
    `);

    if (functions.rows.length > 0) {
      console.log('   ✓ cleanup_expired_tokens() function');
    }

    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables may already exist. This is OK if you ran the migration before.');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || 'db/migrations/003_security_tokens.sql';
runMigration(migrationFile);
