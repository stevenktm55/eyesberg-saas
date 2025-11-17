-- =====================================================
-- Ajouter les colonnes de vérification d'email à la table accounts
-- À exécuter dans le SQL Editor de Supabase sur le projet eyesberg.app
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE accounts
      ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN email_verification_token TEXT,
      ADD COLUMN email_verified_at TIMESTAMPTZ;
  END IF;
END $$;


