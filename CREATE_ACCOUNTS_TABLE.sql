-- =====================================================
-- Table accounts - Comptes avec sous-domaines personnalisés
-- =====================================================
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Créer la table accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT, -- Nom du propriétaire
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_accounts_subdomain ON accounts(subdomain);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_accounts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Politique temporaire : tout le monde peut lire/écrire (à restreindre plus tard)
DROP POLICY IF EXISTS "Allow all operations on accounts" ON accounts;
CREATE POLICY "Allow all operations on accounts" ON accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE accounts IS 'Comptes utilisateurs avec sous-domaines personnalisés (comme Kickflip)';
COMMENT ON COLUMN accounts.subdomain IS 'Sous-domaine unique (ex: stretchmx pour stretchmx.eyesberg.app)';
COMMENT ON COLUMN accounts.password_hash IS 'Hash du mot de passe (bcrypt)';

-- =====================================================
-- Modifier la table shops pour ajouter account_id et subdomain
-- =====================================================

-- Ajouter account_id si n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter subdomain si n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'subdomain'
  ) THEN
    ALTER TABLE shops ADD COLUMN subdomain TEXT;
    CREATE INDEX IF NOT EXISTS idx_shops_subdomain ON shops(subdomain);
  END IF;
END $$;

-- Commentaires
COMMENT ON COLUMN shops.account_id IS 'Référence vers le compte propriétaire';
COMMENT ON COLUMN shops.subdomain IS 'Sous-domaine associé (peut être hérité du compte)';


-- =====================================================
-- Table sessions - Sessions utilisateur avec expiration glissante
-- =====================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);

COMMENT ON TABLE sessions IS 'Sessions de connexion pour les comptes eyesberg (cookie HTTP-only).';
COMMENT ON COLUMN sessions.session_token IS 'Token aléatoire stocké en cookie (eyesberg_session).';
COMMENT ON COLUMN sessions.expires_at IS 'Date d''expiration de la session (sliding window).';


