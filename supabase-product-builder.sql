-- =====================================================
-- TABLE POUR LE PRODUCT BUILDER
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- =====================================================

-- Table pour stocker les produits du builder
CREATE TABLE IF NOT EXISTS product_builder (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  shop_domain TEXT, -- Domaine Shopify associé
  name TEXT NOT NULL DEFAULT 'Untitled Product',
  builder_data JSONB NOT NULL DEFAULT '{}', -- Données du builder (questions, settings, etc.)
  status TEXT DEFAULT 'draft', -- 'draft', 'published'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_builder_subdomain ON product_builder(subdomain);
CREATE INDEX IF NOT EXISTS idx_product_builder_shop_domain ON product_builder(shop_domain);
CREATE INDEX IF NOT EXISTS idx_product_builder_status ON product_builder(status);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_product_builder_updated_at ON product_builder;
CREATE TRIGGER update_product_builder_updated_at BEFORE UPDATE ON product_builder
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

