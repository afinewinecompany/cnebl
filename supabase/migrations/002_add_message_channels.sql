-- ============================================================================
-- Migration: Add Channel Support to Team Messages
-- Version: 002
-- Created: February 2026
-- Description: Adds channel_type to messages table for organized team communication
--
-- Channel Types:
--   - important: Manager-only posting, all can read (announcements, schedules)
--   - general: All team members can read and post (regular team chat)
--   - substitutes: All team members can read and post (finding subs for games)
--
-- Backward Compatibility:
--   - All existing messages will be assigned to 'general' channel
--   - No breaking changes to existing queries (channel filter is optional)
-- ============================================================================

-- ============================================================================
-- Step 1: Create the channel_type enum
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
        CREATE TYPE channel_type AS ENUM ('important', 'general', 'substitutes');
    END IF;
END$$;

COMMENT ON TYPE channel_type IS 'Channel types for team messaging: important (manager-only posts), general (team chat), substitutes (finding subs)';

-- ============================================================================
-- Step 2: Add channel_type column to messages table
-- ============================================================================

-- Add column with default value for existing messages
-- This will assign all existing messages to the 'general' channel
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS channel_type channel_type NOT NULL DEFAULT 'general';

-- Add comment for documentation
COMMENT ON COLUMN messages.channel_type IS 'Message channel: important (manager-only posting), general (team chat), substitutes (finding subs). Existing messages default to general.';

-- ============================================================================
-- Step 3: Create indexes for channel-based queries
-- ============================================================================

-- Index for fetching messages by team and channel (most common query)
-- Covers: GET /api/teams/[teamId]/messages?channel=general
CREATE INDEX IF NOT EXISTS idx_messages_team_channel_created
ON messages (team_id, channel_type, created_at DESC);

-- Index for fetching pinned messages by channel
-- Covers: Pinned message banner per channel
CREATE INDEX IF NOT EXISTS idx_messages_team_channel_pinned
ON messages (team_id, channel_type)
WHERE is_pinned = true AND is_deleted = false;

-- Index for author lookups by channel (user's message history)
CREATE INDEX IF NOT EXISTS idx_messages_author_channel
ON messages (author_id, channel_type, created_at DESC)
WHERE is_deleted = false;

-- ============================================================================
-- Step 4: Create helper function for channel permission checks
-- ============================================================================

-- Function to check if a user can post to a specific channel
-- Returns true if the user has permission, false otherwise
--
-- Logic:
--   - Important channel: Only managers (of that team), admins, and commissioners can post
--   - General/Substitutes: Any active team member can post
--   - Admins/commissioners can always view but posting to Important requires team manager role

CREATE OR REPLACE FUNCTION can_post_to_channel(
    p_user_id UUID,
    p_team_id UUID,
    p_channel_type channel_type
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_is_team_manager BOOLEAN;
    v_is_team_member BOOLEAN;
BEGIN
    -- Get user's global role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id AND is_active = true;

    -- If user not found or inactive, deny
    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;

    -- Check if user is the team's manager
    SELECT EXISTS (
        SELECT 1 FROM teams
        WHERE id = p_team_id AND manager_id = p_user_id
    ) INTO v_is_team_manager;

    -- Check if user is an active team member
    SELECT EXISTS (
        SELECT 1 FROM players
        WHERE user_id = p_user_id
          AND team_id = p_team_id
          AND is_active = true
    ) INTO v_is_team_member;

    -- Important channel: only team managers, admins, commissioners can post
    IF p_channel_type = 'important' THEN
        RETURN v_is_team_manager OR v_user_role IN ('admin', 'commissioner');
    END IF;

    -- General and Substitutes channels: any active team member can post
    -- Also allow managers even if not in players table
    RETURN v_is_team_member OR v_is_team_manager OR v_user_role IN ('admin', 'commissioner');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION can_post_to_channel(UUID, UUID, channel_type) IS
'Checks if a user can post to a specific team channel. Important channel requires manager/admin/commissioner. General/Substitutes allow all team members.';

-- ============================================================================
-- Step 5: Create function to check if user can view team messages
-- ============================================================================

-- Function to check if a user can view messages for a team
-- Returns true if:
--   - User is an active team member, OR
--   - User is the team manager, OR
--   - User is an admin or commissioner (oversight access)

CREATE OR REPLACE FUNCTION can_view_team_messages(
    p_user_id UUID,
    p_team_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
BEGIN
    -- Get user's global role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id AND is_active = true;

    -- If user not found or inactive, deny
    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;

    -- Admins and commissioners can view all team messages
    IF v_user_role IN ('admin', 'commissioner') THEN
        RETURN true;
    END IF;

    -- Check if user is team manager
    IF EXISTS (SELECT 1 FROM teams WHERE id = p_team_id AND manager_id = p_user_id) THEN
        RETURN true;
    END IF;

    -- Check if user is active team member
    RETURN EXISTS (
        SELECT 1 FROM players
        WHERE user_id = p_user_id
          AND team_id = p_team_id
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION can_view_team_messages(UUID, UUID) IS
'Checks if a user can view messages for a team. Returns true for team members, managers, admins, and commissioners.';

-- ============================================================================
-- Step 6: Create trigger to validate posting permissions
-- ============================================================================

-- Trigger function to validate channel posting permission before insert
CREATE OR REPLACE FUNCTION validate_message_channel_permission()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user can post to this channel
    IF NOT can_post_to_channel(NEW.author_id, NEW.team_id, NEW.channel_type) THEN
        RAISE EXCEPTION 'Permission denied: User cannot post to % channel', NEW.channel_type
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_message_channel_permission() IS
'Trigger function that validates user has permission to post to the specified channel.';

-- Create the trigger (drop first if exists to allow re-running migration)
DROP TRIGGER IF EXISTS trg_validate_message_channel_permission ON messages;

CREATE TRIGGER trg_validate_message_channel_permission
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION validate_message_channel_permission();

-- ============================================================================
-- Step 7: Create view for channel message counts and statistics
-- ============================================================================

-- View to get aggregated statistics for each team's channels
-- Useful for displaying unread counts and last activity
CREATE OR REPLACE VIEW team_channel_stats AS
SELECT
    m.team_id,
    m.channel_type,
    COUNT(*) FILTER (WHERE NOT m.is_deleted) AS message_count,
    COUNT(*) FILTER (WHERE m.is_pinned AND NOT m.is_deleted) AS pinned_count,
    MAX(m.created_at) FILTER (WHERE NOT m.is_deleted) AS last_message_at,
    COUNT(DISTINCT m.author_id) FILTER (WHERE NOT m.is_deleted) AS unique_authors
FROM messages m
GROUP BY m.team_id, m.channel_type;

COMMENT ON VIEW team_channel_stats IS
'Aggregated statistics for each team channel including message counts, pinned counts, and last activity timestamp.';

-- ============================================================================
-- Step 8: Create constant table for channel metadata (optional)
-- ============================================================================

-- This table stores metadata about each channel type
-- Useful for displaying channel info in the UI
CREATE TABLE IF NOT EXISTS channel_metadata (
    channel_type channel_type PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    can_all_post BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE channel_metadata IS
'Metadata about channel types including display names, descriptions, and permissions.';

-- Insert default channel metadata
INSERT INTO channel_metadata (channel_type, display_name, description, icon_name, sort_order, can_all_post)
VALUES
    ('important', 'Important', 'Team announcements and critical updates. Only managers can post.', 'megaphone', 1, false),
    ('general', 'General', 'General team discussion and coordination.', 'chat-bubble', 2, true),
    ('substitutes', 'Substitutes', 'Find or offer substitute players for games.', 'user-plus', 3, true)
ON CONFLICT (channel_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    sort_order = EXCLUDED.sort_order,
    can_all_post = EXCLUDED.can_all_post;

-- ============================================================================
-- Step 9: Update existing index comments
-- ============================================================================

-- Document the purpose of each index for future maintainers
COMMENT ON INDEX idx_messages_team_channel_created IS
'Primary index for fetching messages by team and channel, ordered by created_at. Covers most common query pattern.';

COMMENT ON INDEX idx_messages_team_channel_pinned IS
'Partial index for quickly fetching pinned messages per channel. Only includes active pinned messages.';

COMMENT ON INDEX idx_messages_author_channel IS
'Index for fetching a user''s message history by channel. Useful for profile pages and audit trails.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification query to confirm migration success
DO $$
DECLARE
    v_message_count INTEGER;
    v_general_count INTEGER;
BEGIN
    -- Count total messages
    SELECT COUNT(*) INTO v_message_count FROM messages;

    -- Count messages in general channel (should equal total after migration)
    SELECT COUNT(*) INTO v_general_count FROM messages WHERE channel_type = 'general';

    RAISE NOTICE 'Migration 002 complete:';
    RAISE NOTICE '  - Total messages: %', v_message_count;
    RAISE NOTICE '  - Messages in general channel: %', v_general_count;
    RAISE NOTICE '  - channel_type column added to messages table';
    RAISE NOTICE '  - Permission functions created: can_post_to_channel, can_view_team_messages';
    RAISE NOTICE '  - Trigger created: trg_validate_message_channel_permission';
    RAISE NOTICE '  - View created: team_channel_stats';
    RAISE NOTICE '  - Table created: channel_metadata';
END$$;
