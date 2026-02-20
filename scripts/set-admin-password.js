const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ixdYQXwrxloiTcUwCZKYJNEgJYLXGOvY@switchback.proxy.rlwy.net:50559/railway',
  ssl: { rejectUnauthorized: false }
});

async function setAdminPassword() {
  const email = 'admin@cnebl.com';
  const password = '#Spring2026';
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

setAdminPassword();
