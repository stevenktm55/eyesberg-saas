-- =====================================================
-- AJOUT DES COLONNES MANQUANTES POUR LE SNAPSHOT
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- =====================================================

-- Ajouter les colonnes pour le lien Shopify et le snapshot
ALTER TABLE product_builder
  ADD COLUMN IF NOT EXISTS shopify_product_id TEXT,
  ADD COLUMN IF NOT EXISTS shopify_variant_id TEXT,
  ADD COLUMN IF NOT EXISTS published_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_version INTEGER DEFAULT 1;

-- Index pour la recherche par shopify_product_id
CREATE INDEX IF NOT EXISTS idx_product_builder_shopify_product_id 
  ON product_builder(shopify_product_id);

-- Index pour la recherche par shop_domain et shopify_product_id
CREATE INDEX IF NOT EXISTS idx_product_builder_shop_shopify 
  ON product_builder(shop_domain, shopify_product_id);

-- Commentaires pour documentation
COMMENT ON COLUMN product_builder.shopify_product_id IS 'ID du produit Shopify lié';
COMMENT ON COLUMN product_builder.shopify_variant_id IS 'ID de la variante Shopify liée';
COMMENT ON COLUMN product_builder.published_snapshot IS 'Snapshot autonome du configurateur (JSON résolu)';
COMMENT ON COLUMN product_builder.last_published_at IS 'Date de dernière publication du snapshot';
COMMENT ON COLUMN product_builder.snapshot_version IS 'Version du snapshot (pour migrations futures)';

































