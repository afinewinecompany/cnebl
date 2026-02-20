const { Pool } = require('pg');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env.local');
  console.log('\nPlease add your Railway PostgreSQL connection string:');
  console.log('DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

// Use environment variable for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false }  // Allow Railway's self-signed cert in dev
});

// Fixed UUIDs for consistent seeding (allows idempotent runs)
const FIXED_IDS = {
  season2026: '11111111-1111-1111-1111-111111111111',
  teams: {
    ATH: '22222222-2222-2222-2222-222222222201',
    ARI: '22222222-2222-2222-2222-222222222202',
    SEA: '22222222-2222-2222-2222-222222222203',
    PIT: '22222222-2222-2222-2222-222222222204',
    TB: '22222222-2222-2222-2222-222222222205',
    COL: '22222222-2222-2222-2222-222222222206',
  },
  users: {
    dylanMerlo: '33333333-3333-3333-3333-333333333301',
  },
  players: {
    dylanMerloPlayer: '44444444-4444-4444-4444-444444444401',
  },
};

// Team definitions (never change)
const TEAMS = [
  { name: 'Athletics', abbr: 'ATH', primary: '#003831', secondary: '#EFB21E' },
  { name: 'Diamondbacks', abbr: 'ARI', primary: '#A71930', secondary: '#E3D4AD' },
  { name: 'Mariners', abbr: 'SEA', primary: '#0C2C56', secondary: '#005C5C' },
  { name: 'Pirates', abbr: 'PIT', primary: '#27251F', secondary: '#FDB827' },
  { name: 'Rays', abbr: 'TB', primary: '#092C5C', secondary: '#8FBCE6' },
  { name: 'Rockies', abbr: 'COL', primary: '#33006F', secondary: '#C4CED4' },
];

async function seedSeason(client) {
  console.log('Creating 2026 season...');

  // First, deactivate any existing active seasons
  await client.query(`UPDATE seasons SET is_active = false WHERE is_active = true`);

  const result = await client.query(`
    INSERT INTO seasons (id, name, year, start_date, end_date, is_active, registration_open)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (name, year) DO UPDATE SET
      is_active = EXCLUDED.is_active,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      registration_open = EXCLUDED.registration_open,
      updated_at = NOW()
    RETURNING id
  `, [
    FIXED_IDS.season2026,
    'Spring 2026',
    2026,
    '2026-04-01',
    '2026-08-31',
    true,
    true
  ]);

  const seasonId = result.rows[0].id;
  console.log(`  Season created/updated with ID: ${seasonId}`);
  return seasonId;
}

async function seedTeams(client, seasonId) {
  console.log('Creating teams...');

  const teamIds = {};

  for (const team of TEAMS) {
    // First, check if team already exists for this season
    const existing = await client.query(`
      SELECT id FROM teams WHERE abbreviation = $1 AND season_id = $2
    `, [team.abbr, seasonId]);

    let teamId;

    if (existing.rows.length > 0) {
      // Team exists, update it
      teamId = existing.rows[0].id;
      await client.query(`
        UPDATE teams SET
          name = $1,
          primary_color = $2,
          secondary_color = $3,
          is_active = $4,
          updated_at = NOW()
        WHERE id = $5
      `, [team.name, team.primary, team.secondary, true, teamId]);
      console.log(`  Team ${team.name} (${team.abbr}) updated with ID: ${teamId}`);
    } else {
      // Team doesn't exist, insert it
      const result = await client.query(`
        INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        FIXED_IDS.teams[team.abbr],
        team.name,
        team.abbr,
        team.primary,
        team.secondary,
        seasonId,
        0,  // wins
        0,  // losses
        0,  // ties
        0,  // runs_scored
        0,  // runs_allowed
        true
      ]);
      teamId = result.rows[0].id;
      console.log(`  Team ${team.name} (${team.abbr}) created with ID: ${teamId}`);
    }

    teamIds[team.abbr] = teamId;
  }

  return teamIds;
}

async function seedAdminUser(client) {
  console.log('Creating admin user Dylan Merlo...');

  // Use a placeholder password hash - should be updated via set-admin-password.js
  // This is a bcrypt hash of 'changeme' - admin should change password after first login
  const placeholderPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.1c1hQh1xq2X1C.';

  const result = await client.query(`
    INSERT INTO users (id, email, full_name, role, is_active, password_hash, email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING id
  `, [
    FIXED_IDS.users.dylanMerlo,
    'dylanmerlo@gmail.com',
    'Dylan Merlo',
    'admin',
    true,
    placeholderPasswordHash,
    true
  ]);

  console.log(`  Admin user created/updated with ID: ${result.rows[0].id}`);
  return result.rows[0].id;
}

async function seedPlayerAssignment(client, userId, teamId, seasonId) {
  console.log('Assigning Dylan Merlo to Athletics...');

  // First, check if player assignment already exists
  const existing = await client.query(`
    SELECT id FROM players WHERE user_id = $1 AND team_id = $2 AND season_id = $3
  `, [userId, teamId, seasonId]);

  let playerId;

  if (existing.rows.length > 0) {
    // Player assignment exists, update it
    playerId = existing.rows[0].id;
    await client.query(`
      UPDATE players SET
        is_active = $1,
        is_captain = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [true, true, playerId]);
    console.log(`  Player assignment updated with ID: ${playerId}`);
  } else {
    // Player assignment doesn't exist, insert it
    const result = await client.query(`
      INSERT INTO players (id, user_id, team_id, season_id, primary_position, bats, throws, is_active, is_captain)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      FIXED_IDS.players.dylanMerloPlayer,
      userId,
      teamId,
      seasonId,
      'UTIL',
      'R',
      'R',
      true,
      true  // Make Dylan the team captain
    ]);
    playerId = result.rows[0].id;
    console.log(`  Player assignment created with ID: ${playerId}`);
  }

  return playerId;
}

async function run() {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    console.log('');
    console.log('==========================================');
    console.log('CNEBL Database Seed Script');
    console.log('==========================================');
    console.log('');

    // 1. Seed the active season first (needed for team foreign key)
    const seasonId = await seedSeason(client);

    // 2. Seed the 6 teams
    const teamIds = await seedTeams(client, seasonId);

    // 3. Create admin user Dylan Merlo
    const userId = await seedAdminUser(client);

    // 4. Assign Dylan Merlo to Athletics
    const athleticsTeamId = teamIds['ATH'];
    await seedPlayerAssignment(client, userId, athleticsTeamId, seasonId);

    // Commit transaction
    await client.query('COMMIT');

    console.log('');
    console.log('==========================================');
    console.log('Seed data inserted successfully!');
    console.log('==========================================');
    console.log('');
    console.log('Summary:');
    console.log(`  - Season: Spring 2026 (ID: ${seasonId})`);
    console.log(`  - Teams: ${Object.keys(teamIds).length} teams created`);
    console.log(`  - Admin: Dylan Merlo (dylanmerlo@gmail.com)`);
    console.log(`  - Player Assignment: Dylan Merlo -> Athletics`);
    console.log('');
    console.log('Team IDs:');
    for (const [abbr, id] of Object.entries(teamIds)) {
      console.log(`  ${abbr}: ${id}`);
    }
    console.log('');
    console.log('Note: Admin password should be set using scripts/set-admin-password.js');
    console.log('');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('');
    console.error('ERROR: Seed failed!');
    console.error('Error message:', err.message);
    console.error('');
    console.error('Full error:');
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
