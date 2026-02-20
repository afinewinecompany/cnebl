-- ============================================================================
-- Migration: Security Tokens
-- Version: 003
-- Created: February 2026
-- Platform: Railway PostgreSQL
-- Description: Adds database-backed token storage for password reset and email verification
-- Note: Rate limiting is handled by Railway Redis (see src/lib/redis/client.ts)
-- ============================================================================

-- ============================================================================
-- TABLE: password_reset_tokens
-- ============================================================================
-- Stores hashed password reset tokens with expiration and usage tracking
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Token data (stored as SHA-256 hash, never plaintext)
    token_hash VARCHAR(64) NOT NULL,

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Expiration and usage
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_password_reset_token_hash UNIQUE (token_hash)
);

COMMENT ON TABLE password_reset_tokens IS 'Stores hashed password reset tokens. Tokens are SHA-256 hashed for security.';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of the token. Original token is never stored.';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'When the token was used to reset password. NULL if not yet used.';

-- Index for token lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens (expires_at) WHERE used_at IS NULL;

-- ============================================================================
-- TABLE: email_verification_tokens
-- ============================================================================
-- Stores hashed email verification tokens with expiration and usage tracking
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Token data (stored as SHA-256 hash, never plaintext)
    token_hash VARCHAR(64) NOT NULL,

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Email being verified (in case user changes email)
    email CITEXT NOT NULL,

    -- Expiration and usage
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_email_verification_token_hash UNIQUE (token_hash)
);

COMMENT ON TABLE email_verification_tokens IS 'Stores hashed email verification tokens. Tokens are SHA-256 hashed for security.';
COMMENT ON COLUMN email_verification_tokens.email IS 'The email address being verified. Stored separately in case user changes email.';

-- Index for token lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens (expires_at) WHERE used_at IS NULL;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up expired tokens
-- Call this periodically via Railway cron or pg_cron extension
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens (older than 24 hours past expiration)
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours';

    -- Delete used password reset tokens (older than 24 hours past use)
    DELETE FROM password_reset_tokens
    WHERE used_at IS NOT NULL AND used_at < NOW() - INTERVAL '24 hours';

    -- Delete expired email verification tokens (older than 24 hours past expiration)
    DELETE FROM email_verification_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours';

    -- Delete used email verification tokens (older than 24 hours past use)
    DELETE FROM email_verification_tokens
    WHERE used_at IS NOT NULL AND used_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tokens IS 'Removes expired tokens. Call periodically via cron.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
