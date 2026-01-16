-- =====================================================
-- Migration: Ajouter colonne production_templates
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query
-- =====================================================
-- Cette migration ajoute la colonne production_templates à la table shopify_products
-- pour stocker les URLs des templates SVG de production par taille
-- =====================================================

-- Ajouter la colonne production_templates si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shopify_products' 
    AND column_name = 'production_templates'
  ) THEN
    ALTER TABLE shopify_products 
    ADD COLUMN production_templates JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN shopify_products.production_templates IS 
    'Stockage des templates SVG de production par taille: {"S": "url", "M": "url", ...}';
  END IF;
END $$;
