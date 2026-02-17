-- ============================================================================
-- CNEBL (Coastal New England Baseball League) Database Schema
-- Version: 1.0.0
-- Created: February 2025
-- Database: PostgreSQL (Railway hosted)
-- ============================================================================
-- This schema supports a small adult men's baseball league (4-6 teams, ~60-90 players)
-- with 9-inning games and live scoring by team managers.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text for email comparisons
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- CUSTOM ENUM TYPES
-- ============================================================================

-- User roles in the application
-- player: Regular player, can view stats and RSVP
-- manager: Team manager, can enter live scores and manage roster
-- admin: League admin, full control over all data
-- commissioner: League commissioner, highest authority
CREATE TYPE user_role AS ENUM ('player', 'manager', 'admin', 'commissioner');

-- Game status lifecycle
-- scheduled: Game is planned but not started
-- warmup: Teams are warming up, game starting soon
-- in_progress: Game is currently being played
-- final: Game has ended with a result
-- postponed: Game delayed to another date
-- cancelled: Game will not be played
-- suspended: Game stopped mid-play (weather, etc.) and may resume
CREATE TYPE game_status AS ENUM (
    'scheduled',
    'warmup',
    'in_progress',
    'final',
    'postponed',
    'cancelled',
    'suspended'
);

-- Baseball field positions (standard numbering)
-- 1=P, 2=C, 3=1B, 4=2B, 5=3B, 6=SS, 7=LF, 8=CF, 9=RF, DH=Designated Hitter, UTIL=Utility
CREATE TYPE field_position AS ENUM (
    'P',    -- Pitcher
    'C',    -- Catcher
    '1B',   -- First Base
    '2B',   -- Second Base
    '3B',   -- Third Base
    'SS',   -- Shortstop
    'LF',   -- Left Field
    'CF',   -- Center Field
    'RF',   -- Right Field
    'DH',   -- Designated Hitter
    'UTIL'  -- Utility (plays multiple positions)
);

-- Batting side preference
CREATE TYPE batting_side AS ENUM ('L', 'R', 'S'); -- Left, Right, Switch

-- Throwing arm
CREATE TYPE throwing_arm AS ENUM ('L', 'R'); -- Left, Right

-- Player availability status for game RSVPs
CREATE TYPE availability_status AS ENUM (
    'available',    -- Player can attend
    'unavailable',  -- Player cannot attend
    'tentative',    -- Player is unsure
    'no_response'   -- Player has not responded
);

-- Pitching decision (win/loss/save/hold/no decision)
CREATE TYPE pitching_decision AS ENUM (
    'W',    -- Win
    'L',    -- Loss
    'S',    -- Save
    'H',    -- Hold
    'BS',   -- Blown Save
    'ND'    -- No Decision
);

-- Inning half indicator
CREATE TYPE inning_half AS ENUM ('top', 'bottom');

-- ============================================================================
-- TABLE: seasons
-- ============================================================================
-- Tracks different seasons/years for the league
-- Allows historical data to be preserved and queried by season
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Season identification
    name VARCHAR(100) NOT NULL,                          -- e.g., "Spring 2025", "Summer 2025"
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),

    -- Season dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Season state
    is_active BOOLEAN NOT NULL DEFAULT false,            -- Only one season should be active at a time
    registration_open BOOLEAN NOT NULL DEFAULT false,    -- Is player registration open?

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_season_dates CHECK (end_date > start_date),
    CONSTRAINT unique_season_name_year UNIQUE (name, year)
);

COMMENT ON TABLE seasons IS 'Tracks different seasons/years for the league. Each season has its own standings, stats, and rosters.';
COMMENT ON COLUMN seasons.is_active IS 'Indicates the current active season. Only one season should be active at a time.';

-- Index for quickly finding active season
CREATE INDEX idx_seasons_active ON seasons (is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Central user table for authentication and profile information
-- Stores all users: players, managers, admins, and commissioners
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication fields
    email CITEXT NOT NULL UNIQUE,                        -- Case-insensitive email for login
    password_hash VARCHAR(255) NOT NULL,                 -- Bcrypt hashed password

    -- Profile information
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),                                   -- Format: +1-XXX-XXX-XXXX or similar
    avatar_url TEXT,                                     -- URL to profile picture

    -- Authorization
    role user_role NOT NULL DEFAULT 'player',

    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,             -- Soft delete / deactivation flag
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMPTZ,

    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMPTZ,

    -- Session management
    last_login_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{7,20}$')
);

COMMENT ON TABLE users IS 'Central user table for authentication and profiles. All league participants have a user record.';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password. Never store plain text passwords.';
COMMENT ON COLUMN users.role IS 'User role determining permissions: player < manager < admin < commissioner';

-- Indexes for common queries
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_active ON users (is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: teams
-- ============================================================================
-- Team information including branding and current season record
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Team identity
    name VARCHAR(100) NOT NULL,                          -- Full team name, e.g., "Portland Seadogs"
    abbreviation VARCHAR(5) NOT NULL,                    -- Short code, e.g., "PSD"

    -- Branding
    logo_url TEXT,                                       -- URL to team logo image
    primary_color VARCHAR(7),                            -- Hex color code, e.g., "#1B3A5F"
    secondary_color VARCHAR(7),                          -- Hex color code for accent

    -- Management
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Season tracking (denormalized for quick standings display)
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    ties INTEGER NOT NULL DEFAULT 0 CHECK (ties >= 0),
    runs_scored INTEGER NOT NULL DEFAULT 0 CHECK (runs_scored >= 0),
    runs_allowed INTEGER NOT NULL DEFAULT 0 CHECK (runs_allowed >= 0),

    -- Team status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_primary_color CHECK (primary_color IS NULL OR primary_color ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT valid_secondary_color CHECK (secondary_color IS NULL OR secondary_color ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT unique_team_name_per_season UNIQUE (name, season_id),
    CONSTRAINT unique_abbreviation_per_season UNIQUE (abbreviation, season_id)
);

COMMENT ON TABLE teams IS 'Team information including branding, management, and current season record.';
COMMENT ON COLUMN teams.manager_id IS 'Reference to the user who manages this team. Managers can enter scores and manage roster.';
COMMENT ON COLUMN teams.wins IS 'Denormalized win count for quick standings display. Updated via triggers or application logic.';

-- Indexes
CREATE INDEX idx_teams_season ON teams (season_id);
CREATE INDEX idx_teams_manager ON teams (manager_id);
CREATE INDEX idx_teams_active ON teams (is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: players
-- ============================================================================
-- Links users to teams for a specific season
-- A user can play for different teams in different seasons
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,

    -- Player info for this team/season
    jersey_number VARCHAR(3),                            -- Jersey number (can be "00", "7", "42", etc.)
    primary_position field_position NOT NULL DEFAULT 'UTIL',
    secondary_position field_position,

    -- Physical attributes affecting play style
    bats batting_side NOT NULL DEFAULT 'R',
    throws throwing_arm NOT NULL DEFAULT 'R',

    -- Roster status
    is_active BOOLEAN NOT NULL DEFAULT true,             -- Currently on active roster
    is_captain BOOLEAN NOT NULL DEFAULT false,           -- Team captain designation

    -- Metadata
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints - one roster spot per user per team per season
    CONSTRAINT unique_player_team_season UNIQUE (user_id, team_id, season_id),
    CONSTRAINT unique_jersey_per_team UNIQUE (team_id, jersey_number),
    CONSTRAINT different_positions CHECK (primary_position != secondary_position OR secondary_position IS NULL)
);

COMMENT ON TABLE players IS 'Links users to teams for a specific season. Tracks jersey number, position, and batting/throwing preferences.';
COMMENT ON COLUMN players.jersey_number IS 'Jersey number as string to support "00" and leading zeros.';
COMMENT ON COLUMN players.is_captain IS 'Team captain has additional privileges like setting lineups.';

-- Indexes
CREATE INDEX idx_players_user ON players (user_id);
CREATE INDEX idx_players_team ON players (team_id);
CREATE INDEX idx_players_season ON players (season_id);
CREATE INDEX idx_players_team_season ON players (team_id, season_id);
CREATE INDEX idx_players_active ON players (is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: games
-- ============================================================================
-- Game schedule and results
-- Supports live scoring with inning-by-inning tracking
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Season and schedule
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    game_number INTEGER,                                 -- Game number in season (optional)

    -- Teams playing
    home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Date and time
    game_date DATE NOT NULL,
    game_time TIME,                                      -- Local time, nullable for TBD
    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Location
    location_name VARCHAR(150),                          -- Field/park name
    location_address TEXT,                               -- Full address for directions

    -- Game state
    status game_status NOT NULL DEFAULT 'scheduled',

    -- Score tracking (denormalized for quick display)
    home_score INTEGER NOT NULL DEFAULT 0 CHECK (home_score >= 0),
    away_score INTEGER NOT NULL DEFAULT 0 CHECK (away_score >= 0),

    -- Inning tracking for live games
    current_inning INTEGER DEFAULT 1 CHECK (current_inning >= 1 AND current_inning <= 99),
    current_inning_half inning_half DEFAULT 'top',
    outs INTEGER DEFAULT 0 CHECK (outs >= 0 AND outs <= 3),

    -- Inning-by-inning scores (stored as JSON arrays for flexibility)
    -- Format: [1, 0, 2, 1, 0, 0, 3, 0, 1] for 9 innings
    home_inning_scores JSONB DEFAULT '[]'::jsonb,
    away_inning_scores JSONB DEFAULT '[]'::jsonb,

    -- Game notes
    notes TEXT,                                          -- Umpire notes, weather delays, etc.

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,                              -- When game actually started
    ended_at TIMESTAMPTZ,                                -- When game ended

    -- Constraints
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id),
    CONSTRAINT valid_game_state CHECK (
        (status = 'scheduled' AND started_at IS NULL) OR
        (status IN ('warmup', 'in_progress', 'suspended') AND started_at IS NOT NULL) OR
        (status = 'final' AND ended_at IS NOT NULL) OR
        (status IN ('postponed', 'cancelled'))
    )
);

COMMENT ON TABLE games IS 'Game schedule and results with support for live scoring and inning-by-inning tracking.';
COMMENT ON COLUMN games.home_inning_scores IS 'JSON array of runs scored per inning by home team. Example: [1, 0, 2, 1, 0, 0, 3, 0, 1]';
COMMENT ON COLUMN games.current_inning IS 'Current inning number (1-99). Standard games are 9 innings but can go to extras.';

-- Indexes
CREATE INDEX idx_games_season ON games (season_id);
CREATE INDEX idx_games_home_team ON games (home_team_id);
CREATE INDEX idx_games_away_team ON games (away_team_id);
CREATE INDEX idx_games_date ON games (game_date);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_live ON games (status) WHERE status = 'in_progress';
CREATE INDEX idx_games_schedule ON games (season_id, game_date, game_time);

-- ============================================================================
-- TABLE: batting_stats
-- ============================================================================
-- Per-game batting statistics for each player
-- One record per player per game they batted in
CREATE TABLE batting_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Lineup position
    batting_order INTEGER CHECK (batting_order >= 1 AND batting_order <= 15),
    position_played field_position,

    -- Core batting stats
    plate_appearances INTEGER NOT NULL DEFAULT 0 CHECK (plate_appearances >= 0),
    at_bats INTEGER NOT NULL DEFAULT 0 CHECK (at_bats >= 0),          -- AB
    runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),                -- R
    hits INTEGER NOT NULL DEFAULT 0 CHECK (hits >= 0),                -- H
    doubles INTEGER NOT NULL DEFAULT 0 CHECK (doubles >= 0),          -- 2B
    triples INTEGER NOT NULL DEFAULT 0 CHECK (triples >= 0),          -- 3B
    home_runs INTEGER NOT NULL DEFAULT 0 CHECK (home_runs >= 0),      -- HR
    runs_batted_in INTEGER NOT NULL DEFAULT 0 CHECK (runs_batted_in >= 0),  -- RBI

    -- Plate discipline
    walks INTEGER NOT NULL DEFAULT 0 CHECK (walks >= 0),              -- BB
    strikeouts INTEGER NOT NULL DEFAULT 0 CHECK (strikeouts >= 0),    -- K
    hit_by_pitch INTEGER NOT NULL DEFAULT 0 CHECK (hit_by_pitch >= 0),-- HBP
    sacrifice_flies INTEGER NOT NULL DEFAULT 0 CHECK (sacrifice_flies >= 0),  -- SF
    sacrifice_bunts INTEGER NOT NULL DEFAULT 0 CHECK (sacrifice_bunts >= 0),  -- SAC

    -- Baserunning
    stolen_bases INTEGER NOT NULL DEFAULT 0 CHECK (stolen_bases >= 0),        -- SB
    caught_stealing INTEGER NOT NULL DEFAULT 0 CHECK (caught_stealing >= 0),  -- CS

    -- Other
    ground_into_double_play INTEGER NOT NULL DEFAULT 0 CHECK (ground_into_double_play >= 0),  -- GIDP
    left_on_base INTEGER NOT NULL DEFAULT 0 CHECK (left_on_base >= 0),        -- LOB

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_batting_game_player UNIQUE (game_id, player_id),
    CONSTRAINT valid_hits_at_bats CHECK (hits <= at_bats),
    CONSTRAINT valid_extra_base_hits CHECK (doubles + triples + home_runs <= hits),
    CONSTRAINT valid_plate_appearances CHECK (
        plate_appearances >= at_bats + walks + hit_by_pitch + sacrifice_flies + sacrifice_bunts
    )
);

COMMENT ON TABLE batting_stats IS 'Per-game batting statistics. One record per player per game they appeared in as a batter.';
COMMENT ON COLUMN batting_stats.plate_appearances IS 'Total plate appearances including walks, HBP, and sacrifices.';
COMMENT ON COLUMN batting_stats.at_bats IS 'Official at-bats (excludes BB, HBP, SF, SAC).';

-- Indexes
CREATE INDEX idx_batting_stats_game ON batting_stats (game_id);
CREATE INDEX idx_batting_stats_player ON batting_stats (player_id);
CREATE INDEX idx_batting_stats_team ON batting_stats (team_id);
CREATE INDEX idx_batting_stats_game_team ON batting_stats (game_id, team_id);

-- ============================================================================
-- TABLE: pitching_stats
-- ============================================================================
-- Per-game pitching statistics for each pitcher
CREATE TABLE pitching_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Pitching role
    is_starter BOOLEAN NOT NULL DEFAULT false,

    -- Core pitching stats
    innings_pitched DECIMAL(4,1) NOT NULL DEFAULT 0 CHECK (innings_pitched >= 0),  -- IP (e.g., 6.2 = 6 2/3 innings)
    hits_allowed INTEGER NOT NULL DEFAULT 0 CHECK (hits_allowed >= 0),              -- H
    runs_allowed INTEGER NOT NULL DEFAULT 0 CHECK (runs_allowed >= 0),              -- R
    earned_runs INTEGER NOT NULL DEFAULT 0 CHECK (earned_runs >= 0),                -- ER
    walks INTEGER NOT NULL DEFAULT 0 CHECK (walks >= 0),                            -- BB
    strikeouts INTEGER NOT NULL DEFAULT 0 CHECK (strikeouts >= 0),                  -- K
    home_runs_allowed INTEGER NOT NULL DEFAULT 0 CHECK (home_runs_allowed >= 0),    -- HR

    -- Additional stats
    batters_faced INTEGER NOT NULL DEFAULT 0 CHECK (batters_faced >= 0),            -- BF
    pitches_thrown INTEGER CHECK (pitches_thrown >= 0),                             -- Optional pitch count
    strikes INTEGER CHECK (strikes >= 0),                                           -- Optional strike count
    hit_batters INTEGER NOT NULL DEFAULT 0 CHECK (hit_batters >= 0),                -- HBP
    wild_pitches INTEGER NOT NULL DEFAULT 0 CHECK (wild_pitches >= 0),              -- WP
    balks INTEGER NOT NULL DEFAULT 0 CHECK (balks >= 0),                            -- BK

    -- Decision
    decision pitching_decision,                                                      -- W/L/S/H/BS/ND

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_pitching_game_player UNIQUE (game_id, player_id),
    CONSTRAINT valid_earned_runs CHECK (earned_runs <= runs_allowed),
    CONSTRAINT valid_strikes CHECK (strikes IS NULL OR pitches_thrown IS NULL OR strikes <= pitches_thrown)
);

COMMENT ON TABLE pitching_stats IS 'Per-game pitching statistics. One record per pitcher per game they pitched in.';
COMMENT ON COLUMN pitching_stats.innings_pitched IS 'Innings pitched in decimal format. 6.1 = 6 1/3 innings, 6.2 = 6 2/3 innings.';
COMMENT ON COLUMN pitching_stats.decision IS 'Pitching decision: W=Win, L=Loss, S=Save, H=Hold, BS=Blown Save, ND=No Decision';

-- Indexes
CREATE INDEX idx_pitching_stats_game ON pitching_stats (game_id);
CREATE INDEX idx_pitching_stats_player ON pitching_stats (player_id);
CREATE INDEX idx_pitching_stats_team ON pitching_stats (team_id);
CREATE INDEX idx_pitching_stats_starter ON pitching_stats (game_id, is_starter) WHERE is_starter = true;

-- ============================================================================
-- TABLE: messages
-- ============================================================================
-- Team chat messages for internal team communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Message content
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),

    -- Optional: reply to another message
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,

    -- Message state
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    edited_at TIMESTAMPTZ,

    -- Soft delete
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_edit_state CHECK (
        (is_edited = false AND edited_at IS NULL) OR
        (is_edited = true AND edited_at IS NOT NULL)
    ),
    CONSTRAINT valid_delete_state CHECK (
        (is_deleted = false AND deleted_at IS NULL) OR
        (is_deleted = true AND deleted_at IS NOT NULL)
    )
);

COMMENT ON TABLE messages IS 'Team chat messages for internal team communication. Supports replies and pinned messages.';
COMMENT ON COLUMN messages.content IS 'Message content, max 2000 characters.';

-- Indexes
CREATE INDEX idx_messages_team ON messages (team_id);
CREATE INDEX idx_messages_author ON messages (author_id);
CREATE INDEX idx_messages_team_created ON messages (team_id, created_at DESC);
CREATE INDEX idx_messages_pinned ON messages (team_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_messages_reply ON messages (reply_to_id) WHERE reply_to_id IS NOT NULL;

-- ============================================================================
-- TABLE: announcements
-- ============================================================================
-- League-wide announcements from admins/commissioners
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,          -- NULL = all seasons

    -- Content
    title VARCHAR(200) NOT NULL CHECK (char_length(title) > 0),
    content TEXT NOT NULL CHECK (char_length(content) > 0),

    -- Visibility
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,

    -- Priority/display
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 0,                              -- Higher = more important

    -- Optional expiration
    expires_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_publish_state CHECK (
        (is_published = false AND published_at IS NULL) OR
        (is_published = true AND published_at IS NOT NULL)
    )
);

COMMENT ON TABLE announcements IS 'League-wide announcements from admins and commissioners. Supports pinning and expiration.';
COMMENT ON COLUMN announcements.season_id IS 'If NULL, announcement applies to all seasons. Otherwise, only shows for specific season.';
COMMENT ON COLUMN announcements.priority IS 'Higher priority announcements appear first. 0 = normal, 1+ = elevated.';

-- Indexes
CREATE INDEX idx_announcements_author ON announcements (author_id);
CREATE INDEX idx_announcements_season ON announcements (season_id);
CREATE INDEX idx_announcements_published ON announcements (is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_announcements_pinned ON announcements (is_pinned, priority DESC) WHERE is_pinned = true;
CREATE INDEX idx_announcements_active ON announcements (is_published, expires_at)
    WHERE is_published = true AND (expires_at IS NULL OR expires_at > NOW());

-- ============================================================================
-- TABLE: availability
-- ============================================================================
-- Player RSVP/availability for games
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

    -- RSVP status
    status availability_status NOT NULL DEFAULT 'no_response',

    -- Optional note explaining availability
    note VARCHAR(500),

    -- Response tracking
    responded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints - one availability record per player per game
    CONSTRAINT unique_availability UNIQUE (game_id, player_id)
);

COMMENT ON TABLE availability IS 'Player RSVP/availability status for games. Helps managers plan lineups.';
COMMENT ON COLUMN availability.status IS 'RSVP status: available, unavailable, tentative, or no_response';
COMMENT ON COLUMN availability.note IS 'Optional note explaining availability, e.g., "Will be 15 min late"';

-- Indexes
CREATE INDEX idx_availability_game ON availability (game_id);
CREATE INDEX idx_availability_player ON availability (player_id);
CREATE INDEX idx_availability_game_status ON availability (game_id, status);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Current season standings
CREATE OR REPLACE VIEW standings AS
SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.abbreviation,
    t.logo_url,
    t.primary_color,
    t.wins,
    t.losses,
    t.ties,
    t.wins + t.losses + t.ties AS games_played,
    CASE
        WHEN (t.wins + t.losses + t.ties) > 0
        THEN ROUND(t.wins::DECIMAL / (t.wins + t.losses + t.ties), 3)
        ELSE 0.000
    END AS win_pct,
    t.runs_scored,
    t.runs_allowed,
    t.runs_scored - t.runs_allowed AS run_differential,
    s.id AS season_id,
    s.name AS season_name,
    s.year AS season_year
FROM teams t
JOIN seasons s ON t.season_id = s.id
WHERE t.is_active = true
ORDER BY
    s.year DESC,
    win_pct DESC,
    t.wins DESC,
    run_differential DESC;

COMMENT ON VIEW standings IS 'Pre-calculated standings with win percentage and run differential.';

-- View: Player season batting totals
CREATE OR REPLACE VIEW player_batting_totals AS
SELECT
    p.id AS player_id,
    u.full_name AS player_name,
    t.name AS team_name,
    t.id AS team_id,
    s.id AS season_id,
    s.name AS season_name,
    COUNT(bs.id) AS games_played,
    SUM(bs.plate_appearances) AS plate_appearances,
    SUM(bs.at_bats) AS at_bats,
    SUM(bs.runs) AS runs,
    SUM(bs.hits) AS hits,
    SUM(bs.doubles) AS doubles,
    SUM(bs.triples) AS triples,
    SUM(bs.home_runs) AS home_runs,
    SUM(bs.runs_batted_in) AS rbi,
    SUM(bs.walks) AS walks,
    SUM(bs.strikeouts) AS strikeouts,
    SUM(bs.stolen_bases) AS stolen_bases,
    SUM(bs.hit_by_pitch) AS hit_by_pitch,
    -- Calculated stats
    CASE
        WHEN SUM(bs.at_bats) > 0
        THEN ROUND(SUM(bs.hits)::DECIMAL / SUM(bs.at_bats), 3)
        ELSE 0.000
    END AS batting_avg,
    CASE
        WHEN SUM(bs.at_bats + bs.walks + bs.hit_by_pitch + bs.sacrifice_flies) > 0
        THEN ROUND(
            (SUM(bs.hits) + SUM(bs.walks) + SUM(bs.hit_by_pitch))::DECIMAL /
            SUM(bs.at_bats + bs.walks + bs.hit_by_pitch + bs.sacrifice_flies), 3
        )
        ELSE 0.000
    END AS on_base_pct,
    CASE
        WHEN SUM(bs.at_bats) > 0
        THEN ROUND(
            (SUM(bs.hits) + SUM(bs.doubles) + (2 * SUM(bs.triples)) + (3 * SUM(bs.home_runs)))::DECIMAL /
            SUM(bs.at_bats), 3
        )
        ELSE 0.000
    END AS slugging_pct
FROM players p
JOIN users u ON p.user_id = u.id
JOIN teams t ON p.team_id = t.id
JOIN seasons s ON p.season_id = s.id
LEFT JOIN batting_stats bs ON bs.player_id = p.id
WHERE p.is_active = true
GROUP BY p.id, u.full_name, t.name, t.id, s.id, s.name
ORDER BY batting_avg DESC;

COMMENT ON VIEW player_batting_totals IS 'Aggregated season batting statistics per player with calculated AVG, OBP, and SLG.';

-- View: Player season pitching totals
CREATE OR REPLACE VIEW player_pitching_totals AS
SELECT
    p.id AS player_id,
    u.full_name AS player_name,
    t.name AS team_name,
    t.id AS team_id,
    s.id AS season_id,
    s.name AS season_name,
    COUNT(ps.id) AS games_pitched,
    COUNT(ps.id) FILTER (WHERE ps.is_starter = true) AS games_started,
    SUM(ps.innings_pitched) AS innings_pitched,
    SUM(ps.hits_allowed) AS hits_allowed,
    SUM(ps.runs_allowed) AS runs_allowed,
    SUM(ps.earned_runs) AS earned_runs,
    SUM(ps.walks) AS walks,
    SUM(ps.strikeouts) AS strikeouts,
    SUM(ps.home_runs_allowed) AS home_runs_allowed,
    COUNT(ps.id) FILTER (WHERE ps.decision = 'W') AS wins,
    COUNT(ps.id) FILTER (WHERE ps.decision = 'L') AS losses,
    COUNT(ps.id) FILTER (WHERE ps.decision = 'S') AS saves,
    -- Calculated stats
    CASE
        WHEN SUM(ps.innings_pitched) > 0
        THEN ROUND((SUM(ps.earned_runs) * 9.0) / SUM(ps.innings_pitched), 2)
        ELSE 0.00
    END AS era,
    CASE
        WHEN SUM(ps.innings_pitched) > 0
        THEN ROUND((SUM(ps.walks) + SUM(ps.hits_allowed)) / SUM(ps.innings_pitched), 2)
        ELSE 0.00
    END AS whip,
    CASE
        WHEN SUM(ps.innings_pitched) > 0
        THEN ROUND((SUM(ps.strikeouts) * 9.0) / SUM(ps.innings_pitched), 1)
        ELSE 0.0
    END AS k_per_9
FROM players p
JOIN users u ON p.user_id = u.id
JOIN teams t ON p.team_id = t.id
JOIN seasons s ON p.season_id = s.id
LEFT JOIN pitching_stats ps ON ps.player_id = p.id
WHERE p.is_active = true
GROUP BY p.id, u.full_name, t.name, t.id, s.id, s.name
HAVING COUNT(ps.id) > 0
ORDER BY era ASC;

COMMENT ON VIEW player_pitching_totals IS 'Aggregated season pitching statistics per player with calculated ERA, WHIP, and K/9.';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batting_stats_updated_at
    BEFORE UPDATE ON batting_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pitching_stats_updated_at
    BEFORE UPDATE ON pitching_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================
-- Note: In production, you would typically have a separate seed file
-- Here we just ensure there's a default active season

-- Insert a default season (commented out - uncomment to use)
-- INSERT INTO seasons (name, year, start_date, end_date, is_active, registration_open)
-- VALUES ('Spring 2025', 2025, '2025-04-01', '2025-08-31', true, true);

-- ============================================================================
-- COMMENTS ON SCHEMA DESIGN DECISIONS
-- ============================================================================
/*
DESIGN NOTES:

1. UUID PRIMARY KEYS
   - Using UUIDs instead of serial integers for better distribution in sharded
     environments and to avoid exposing sequential IDs in URLs.

2. CITEXT FOR EMAIL
   - Using case-insensitive text for email addresses to prevent duplicate
     registrations with different casing.

3. DENORMALIZED TEAM STATS
   - wins/losses/ties/runs stored directly on teams table for fast standings
     queries. Should be updated via application logic or triggers when games
     are completed.

4. INNINGS PITCHED AS DECIMAL
   - Standard baseball notation: 6.1 = 6 1/3 innings, 6.2 = 6 2/3 innings
   - Application should handle the display conversion.

5. INNING SCORES AS JSONB
   - Flexible structure for variable-length games (extras, called games)
   - Array format: [1, 0, 2, 1, 0, 0, 3, 0, 1]

6. SOFT DELETES
   - Using is_active/is_deleted flags instead of hard deletes to preserve
     historical data and allow recovery.

7. PLAYER-TEAM-SEASON RELATIONSHIP
   - Players table links users to teams per season, allowing players to
     change teams between seasons while preserving historical stats.

8. AVAILABILITY TRACKING
   - Simple RSVP system for game attendance planning.

9. REFERENTIAL INTEGRITY
   - Appropriate ON DELETE actions:
     - CASCADE: Child records deleted with parent (stats with game)
     - SET NULL: Preserve record but clear reference (manager_id on teams)

10. INDEXES
    - Created for all foreign keys and common query patterns.
    - Partial indexes for filtered queries (is_active, status, etc.)
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
