-- =====================================================
-- Add password reset fields to accounts table
-- =====================================================
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Add password_reset_token column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'password_reset_token'
  ) THEN
    ALTER TABLE accounts ADD COLUMN password_reset_token TEXT;
  END IF;
END $$;

-- Add password_reset_expires_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'password_reset_expires_at'
  ) THEN
    ALTER TABLE accounts ADD COLUMN password_reset_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_password_reset_token ON accounts(password_reset_token);

-- Add comments
COMMENT ON COLUMN accounts.password_reset_token IS 'Token for password reset (valid for 1 hour)';
COMMENT ON COLUMN accounts.password_reset_expires_at IS 'Expiration date of the password reset token';


