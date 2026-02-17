const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ixdYQXwrxloiTcUwCZKYJNEgJYLXGOvY@switchback.proxy.rlwy.net:50559/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Create enums (ignore if exists)
    const enums = [
      "CREATE TYPE game_status AS ENUM ('scheduled', 'warmup', 'in_progress', 'final', 'postponed', 'cancelled', 'suspended')",
      "CREATE TYPE field_position AS ENUM ('P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL')",
      "CREATE TYPE batting_side AS ENUM ('L', 'R', 'S')",
      "CREATE TYPE throwing_arm AS ENUM ('L', 'R')",
      "CREATE TYPE availability_status AS ENUM ('available', 'unavailable', 'tentative', 'no_response')",
      "CREATE TYPE pitching_decision AS ENUM ('W', 'L', 'S', 'H', 'BS', 'ND')",
      "CREATE TYPE inning_half AS ENUM ('top', 'bottom')"
    ];

    for (const sql of enums) {
      await pool.query(sql).catch(() => {});
    }
    console.log('Enums created');

    // Create seasons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        registration_open BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_season_dates CHECK (end_date > start_date),
        CONSTRAINT unique_season_name_year UNIQUE (name, year)
      )
    `);
    console.log('seasons table created');

    // Create teams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        abbreviation VARCHAR(5) NOT NULL,
        logo_url TEXT,
        primary_color VARCHAR(7),
        secondary_color VARCHAR(7),
        manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
        season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        ties INTEGER NOT NULL DEFAULT 0,
        runs_scored INTEGER NOT NULL DEFAULT 0,
        runs_allowed INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('teams table created');

    // Create players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
        jersey_number VARCHAR(3),
        primary_position field_position NOT NULL DEFAULT 'UTIL',
        secondary_position field_position,
        bats batting_side NOT NULL DEFAULT 'R',
        throws throwing_arm NOT NULL DEFAULT 'R',
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_captain BOOLEAN NOT NULL DEFAULT false,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('players table created');

    // Create games table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
        game_number INTEGER,
        home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        game_date DATE NOT NULL,
        game_time TIME,
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        location_name VARCHAR(150),
        location_address TEXT,
        status game_status NOT NULL DEFAULT 'scheduled',
        home_score INTEGER NOT NULL DEFAULT 0,
        away_score INTEGER NOT NULL DEFAULT 0,
        current_inning INTEGER DEFAULT 1,
        current_inning_half inning_half DEFAULT 'top',
        outs INTEGER DEFAULT 0,
        home_inning_scores JSONB DEFAULT '[]'::jsonb,
        away_inning_scores JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ
      )
    `);
    console.log('games table created');

    // Create announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMPTZ,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        priority INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('announcements table created');

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_edited BOOLEAN NOT NULL DEFAULT false,
        edited_at TIMESTAMPTZ,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('messages table created');

    // Create batting_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batting_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        batting_order INTEGER,
        position_played field_position,
        plate_appearances INTEGER NOT NULL DEFAULT 0,
        at_bats INTEGER NOT NULL DEFAULT 0,
        runs INTEGER NOT NULL DEFAULT 0,
        hits INTEGER NOT NULL DEFAULT 0,
        doubles INTEGER NOT NULL DEFAULT 0,
        triples INTEGER NOT NULL DEFAULT 0,
        home_runs INTEGER NOT NULL DEFAULT 0,
        runs_batted_in INTEGER NOT NULL DEFAULT 0,
        walks INTEGER NOT NULL DEFAULT 0,
        strikeouts INTEGER NOT NULL DEFAULT 0,
        hit_by_pitch INTEGER NOT NULL DEFAULT 0,
        sacrifice_flies INTEGER NOT NULL DEFAULT 0,
        sacrifice_bunts INTEGER NOT NULL DEFAULT 0,
        stolen_bases INTEGER NOT NULL DEFAULT 0,
        caught_stealing INTEGER NOT NULL DEFAULT 0,
        ground_into_double_play INTEGER NOT NULL DEFAULT 0,
        left_on_base INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('batting_stats table created');

    // Create pitching_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pitching_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        is_starter BOOLEAN NOT NULL DEFAULT false,
        innings_pitched DECIMAL(4,1) NOT NULL DEFAULT 0,
        hits_allowed INTEGER NOT NULL DEFAULT 0,
        runs_allowed INTEGER NOT NULL DEFAULT 0,
        earned_runs INTEGER NOT NULL DEFAULT 0,
        walks INTEGER NOT NULL DEFAULT 0,
        strikeouts INTEGER NOT NULL DEFAULT 0,
        home_runs_allowed INTEGER NOT NULL DEFAULT 0,
        batters_faced INTEGER NOT NULL DEFAULT 0,
        pitches_thrown INTEGER,
        strikes INTEGER,
        hit_batters INTEGER NOT NULL DEFAULT 0,
        wild_pitches INTEGER NOT NULL DEFAULT 0,
        balks INTEGER NOT NULL DEFAULT 0,
        decision pitching_decision,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('pitching_stats table created');

    // Create availability table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        status availability_status NOT NULL DEFAULT 'no_response',
        note VARCHAR(500),
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('availability table created');

    // Insert default season
    const seasonResult = await pool.query(`
      INSERT INTO seasons (name, year, start_date, end_date, is_active, registration_open)
      VALUES ('Spring 2025', 2025, '2025-04-01', '2025-08-31', true, true)
      ON CONFLICT (name, year) DO NOTHING
      RETURNING id
    `);
    console.log('Default season created');

    console.log('\nAll tables created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

run();
