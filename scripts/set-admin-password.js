const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env.local');
  console.log('\nPlease add your Railway PostgreSQL connection string:');
  console.log('DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false }
});

async function setAdminPassword() {
  // Get email and password from command line args or use defaults
  const email = process.argv[2] || 'dylanmerlo@gmail.com';
  const password = process.argv[3] || '#DM$pring23';
  const saltRounds = 12;

  try {
    console.log(`Setting password for ${email}...`);

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      // Update existing user
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)',
        [passwordHash, email]
      );
      console.log(`Password updated for existing user: ${email}`);
    } else {
      // Insert new admin user
      await pool.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [email, passwordHash, 'Admin User', 'admin', true, true]);
      console.log(`Created new admin user: ${email}`);
    }

    console.log('\nDone! You can now login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    pool.end();
  }
}

// Show usage if --help is passed
if (process.argv.includes('--help')) {
  console.log('Usage: node scripts/set-admin-password.js [email] [password]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/set-admin-password.js');
  console.log('  node scripts/set-admin-password.js dylanmerlo@gmail.com "#DM$pring23"');
  console.log('');
  console.log('Defaults: dylanmerlo@gmail.com / #DM$pring23');
  process.exit(0);
}

setAdminPassword();
