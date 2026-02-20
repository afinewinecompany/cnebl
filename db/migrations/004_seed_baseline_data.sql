-- ============================================================================
-- CNEBL Baseline Seed Data Migration
-- Version: 004
-- Created: February 2026
-- Purpose: Seed baseline data for the league (season, teams, admin user)
-- ============================================================================
-- This migration is idempotent and can be run multiple times safely.
-- It uses ON CONFLICT DO UPDATE to handle re-runs.
-- ============================================================================

-- ============================================================================
-- Fixed UUIDs for consistent seeding
-- ============================================================================
-- Using fixed UUIDs ensures idempotent runs and predictable references

-- Season 2026
-- 11111111-1111-1111-1111-111111111111

-- Teams:
-- ATH: 22222222-2222-2222-2222-222222222201
-- ARI: 22222222-2222-2222-2222-222222222202
-- SEA: 22222222-2222-2222-2222-222222222203
-- PIT: 22222222-2222-2222-2222-222222222204
-- TB:  22222222-2222-2222-2222-222222222205
-- COL: 22222222-2222-2222-2222-222222222206

-- Users:
-- Dylan Merlo: 33333333-3333-3333-3333-333333333301

-- Players:
-- Dylan Merlo (Athletics): 44444444-4444-4444-4444-444444444401

-- ============================================================================
-- 1. CREATE ACTIVE SEASON
-- ============================================================================

-- First, deactivate any existing active seasons
UPDATE seasons SET is_active = false WHERE is_active = true;

-- Insert/update the 2026 season
INSERT INTO seasons (id, name, year, start_date, end_date, is_active, registration_open)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Spring 2026',
    2026,
    '2026-04-01',
    '2026-08-31',
    true,
    true
)
ON CONFLICT (name, year) DO UPDATE SET
    is_active = true,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    registration_open = EXCLUDED.registration_open,
    updated_at = NOW();

-- ============================================================================
-- 2. SEED THE 6 TEAMS
-- ============================================================================

-- Athletics (ATH)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222201',
    'Athletics',
    'ATH',
    '#003831',
    '#EFB21E',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Diamondbacks (ARI)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222202',
    'Diamondbacks',
    'ARI',
    '#A71930',
    '#E3D4AD',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Mariners (SEA)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222203',
    'Mariners',
    'SEA',
    '#0C2C56',
    '#005C5C',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Pirates (PIT)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222204',
    'Pirates',
    'PIT',
    '#27251F',
    '#FDB827',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Rays (TB)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222205',
    'Rays',
    'TB',
    '#092C5C',
    '#8FBCE6',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Rockies (COL)
INSERT INTO teams (id, name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222206',
    'Rockies',
    'COL',
    '#33006F',
    '#C4CED4',
    '11111111-1111-1111-1111-111111111111',
    0, 0, 0, 0, 0,
    true
)
ON CONFLICT (abbreviation, season_id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- 3. CREATE ADMIN USER: DYLAN MERLO
-- ============================================================================

-- Password hash is a placeholder for 'changeme' - should be updated via set-admin-password.js
-- $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.1c1hQh1xq2X1C.

INSERT INTO users (id, email, full_name, role, is_active, password_hash, email_verified)
VALUES (
    '33333333-3333-3333-3333-333333333301',
    'dylanmerlo@gmail.com',
    'Dylan Merlo',
    'admin',
    true,
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.1c1hQh1xq2X1C.',
    true
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- 4. ASSIGN DYLAN MERLO TO ATHLETICS
-- ============================================================================

INSERT INTO players (id, user_id, team_id, season_id, primary_position, bats, throws, is_active, is_captain)
VALUES (
    '44444444-4444-4444-4444-444444444401',
    '33333333-3333-3333-3333-333333333301',  -- Dylan Merlo user ID
    '22222222-2222-2222-2222-222222222201',  -- Athletics team ID
    '11111111-1111-1111-1111-111111111111',  -- 2026 season ID
    'UTIL',
    'R',
    'R',
    true,
    true  -- Team captain
)
ON CONFLICT (user_id, team_id, season_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    is_captain = EXCLUDED.is_captain,
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for manual verification)
-- ============================================================================
-- Run these to verify the seed was successful:
--
-- SELECT * FROM seasons WHERE is_active = true;
-- SELECT id, name, abbreviation, primary_color, secondary_color FROM teams WHERE season_id = '11111111-1111-1111-1111-111111111111';
-- SELECT id, email, full_name, role FROM users WHERE email = 'dylanmerlo@gmail.com';
-- SELECT p.id, u.full_name, t.name as team_name FROM players p JOIN users u ON p.user_id = u.id JOIN teams t ON p.team_id = t.id;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
