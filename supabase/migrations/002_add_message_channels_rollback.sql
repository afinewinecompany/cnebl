-- ============================================================================
-- Rollback: Remove Channel Support from Team Messages
-- Version: 002 (Rollback)
-- Created: February 2026
-- Description: Reverts migration 002_add_message_channels.sql
--
-- WARNING: This will remove all channel-specific data!
--          All messages will lose their channel_type assignment.
--          This operation cannot be undone without a database restore.
-- ============================================================================

-- ============================================================================
-- Step 1: Drop the view
-- ============================================================================
DROP VIEW IF EXISTS team_channel_stats;

-- ============================================================================
-- Step 2: Drop the channel metadata table
-- ============================================================================
DROP TABLE IF EXISTS channel_metadata;

-- ============================================================================
-- Step 3: Drop the trigger
-- ============================================================================
DROP TRIGGER IF EXISTS trg_validate_message_channel_permission ON messages;

-- ============================================================================
-- Step 4: Drop the trigger function
-- ============================================================================
DROP FUNCTION IF EXISTS validate_message_channel_permission();

-- ============================================================================
-- Step 5: Drop the permission check functions
-- ============================================================================
DROP FUNCTION IF EXISTS can_view_team_messages(UUID, UUID);
DROP FUNCTION IF EXISTS can_post_to_channel(UUID, UUID, channel_type);

-- ============================================================================
-- Step 6: Drop the indexes
-- ============================================================================
DROP INDEX IF EXISTS idx_messages_author_channel;
DROP INDEX IF EXISTS idx_messages_team_channel_pinned;
DROP INDEX IF EXISTS idx_messages_team_channel_created;

-- ============================================================================
-- Step 7: Remove the channel_type column from messages
-- ============================================================================
ALTER TABLE messages DROP COLUMN IF EXISTS channel_type;

-- ============================================================================
-- Step 8: Drop the channel_type enum
-- ============================================================================
DROP TYPE IF EXISTS channel_type;

-- ============================================================================
-- Rollback Complete
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback 002 complete:';
    RAISE NOTICE '  - channel_type column removed from messages table';
    RAISE NOTICE '  - Permission functions dropped';
    RAISE NOTICE '  - Trigger dropped';
    RAISE NOTICE '  - View dropped';
    RAISE NOTICE '  - channel_metadata table dropped';
    RAISE NOTICE '  - channel_type enum dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: All channel assignments have been lost.';
    RAISE NOTICE 'Messages are preserved but no longer have channel context.';
END$$;
