-- ============================================================================
-- Migration: Fix Channel Permissions to Include Team Captains
-- Version: 005
-- Created: February 2026
-- Description: Updates can_post_to_channel function to allow team captains
--              to post to the important channel, matching app logic
-- ============================================================================

-- Update the can_post_to_channel function to also check for team captains
CREATE OR REPLACE FUNCTION can_post_to_channel(
    p_user_id UUID,
    p_team_id UUID,
    p_channel_type channel_type
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role user_role;
    v_is_team_manager BOOLEAN;
    v_is_team_captain BOOLEAN;
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

    -- Check if user is the team's manager (from teams.manager_id)
    SELECT EXISTS (
        SELECT 1 FROM teams
        WHERE id = p_team_id AND manager_id = p_user_id
    ) INTO v_is_team_manager;

    -- Check if user is a team captain (from players.is_captain)
    SELECT EXISTS (
        SELECT 1 FROM players
        WHERE user_id = p_user_id
          AND team_id = p_team_id
          AND is_active = true
          AND is_captain = true
    ) INTO v_is_team_captain;

    -- Check if user is an active team member
    SELECT EXISTS (
        SELECT 1 FROM players
        WHERE user_id = p_user_id
          AND team_id = p_team_id
          AND is_active = true
    ) INTO v_is_team_member;

    -- Important channel: team managers, captains, admins, commissioners can post
    IF p_channel_type = 'important' THEN
        RETURN v_is_team_manager OR v_is_team_captain OR v_user_role IN ('admin', 'commissioner');
    END IF;

    -- General and Substitutes channels: any active team member can post
    -- Also allow managers/captains even if not in players table
    RETURN v_is_team_member OR v_is_team_manager OR v_is_team_captain OR v_user_role IN ('admin', 'commissioner');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION can_post_to_channel(UUID, UUID, channel_type) IS
'Checks if a user can post to a specific team channel. Important channel requires manager/captain/admin/commissioner. General/Substitutes allow all team members.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 005 complete:';
    RAISE NOTICE '  - Updated can_post_to_channel function to include team captains';
    RAISE NOTICE '  - Team captains (players.is_captain = true) can now post to important channel';
END$$;
