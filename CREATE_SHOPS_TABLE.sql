-- =====================================================
-- Table shops - Boutiques Shopify liées aux comptes
-- =====================================================
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Créer la table shops si elle n'existe pas
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT UNIQUE NOT NULL, -- ex: eyesbergtest.myshopify.com
  shop_gid TEXT UNIQUE, -- Shopify GraphQL ID (gid://shopify/Shop/...)
  access_token TEXT, -- Shopify Admin API access token (OAuth)
  scopes TEXT, -- Scopes accordés lors de l'installation (comma-separated)
  installed_at TIMESTAMPTZ, -- Date d'installation de l'app
  shop_name TEXT, -- Nom de la boutique (depuis API Shopify)
  shop_email TEXT, -- Email du propriétaire (depuis API Shopify)
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- ID du compte propriétaire
  subdomain TEXT, -- Sous-domaine associé (ex: stretchmx)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shops_domain ON shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shops_account_id ON shops(account_id);
CREATE INDEX IF NOT EXISTS idx_shops_subdomain ON shops(subdomain);
CREATE INDEX IF NOT EXISTS idx_shops_gid ON shops(shop_gid) WHERE shop_gid IS NOT NULL;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_shops_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_shops_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Politique temporaire : tout le monde peut lire/écrire (à restreindre plus tard)
DROP POLICY IF EXISTS "Allow all operations on shops" ON shops;
CREATE POLICY "Allow all operations on shops" ON shops
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE shops IS 'Boutiques Shopify connectées aux comptes eyesberg';
COMMENT ON COLUMN shops.shop_domain IS 'Domaine Shopify (ex: eyesbergtest.myshopify.com)';
COMMENT ON COLUMN shops.shop_gid IS 'Shopify GraphQL ID (gid://shopify/Shop/...)';
COMMENT ON COLUMN shops.access_token IS 'Token OAuth pour accéder à l''API Admin Shopify';
COMMENT ON COLUMN shops.scopes IS 'Permissions accordées (read_products, write_products, etc.)';
COMMENT ON COLUMN shops.account_id IS 'Référence vers le compte propriétaire';
COMMENT ON COLUMN shops.subdomain IS 'Sous-domaine associé (ex: stretchmx pour stretchmx.eyesberg.app)';

-- Ajouter account_id si la table existe déjà mais pas la colonne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE shops ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_shops_account_id ON shops(account_id);
  END IF;
END $$;

-- Ajouter subdomain si la table existe déjà mais pas la colonne
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

