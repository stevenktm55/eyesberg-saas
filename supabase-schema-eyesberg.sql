-- =====================================================
-- EYESBERG SAAS - SUPABASE SCHEMA COMPLET
-- =====================================================
-- Nouveau projet Supabase dédié pour eyesberg-saas
-- Inclut toutes les tables nécessaires : auth, shops, products, models, etc.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ACCOUNTS - Comptes avec sous-domaines personnalisés
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verified_at TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_subdomain ON accounts(subdomain);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- =====================================================
-- 2. SESSIONS - Sessions utilisateur
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);

-- =====================================================
-- 3. SHOPS - Boutiques Shopify connectées
-- =====================================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  subdomain TEXT,
  shop_domain TEXT UNIQUE NOT NULL,
  shop_gid TEXT UNIQUE,
  access_token TEXT,
  scopes TEXT,
  installed_at TIMESTAMPTZ,
  shop_name TEXT,
  shop_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_domain ON shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shops_account_id ON shops(account_id);
CREATE INDEX IF NOT EXISTS idx_shops_subdomain ON shops(subdomain);

-- =====================================================
-- 4. SHOPIFY_PRODUCTS - Produits Shopify synchronisés
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  shopify_product_title TEXT NOT NULL,
  shopify_product_handle TEXT,
  shopify_product_image_url TEXT,
  shopify_product_status TEXT DEFAULT 'active',
  shopify_variants JSONB,
  model_id TEXT,
  design_ids TEXT[],
  enabled_for_configurator BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT shopify_products_shop_product_unique UNIQUE(shop_id, shopify_product_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_products_shop_id ON shopify_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_product_id ON shopify_products(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_status ON shopify_products(shopify_product_status);

-- =====================================================
-- 5. SHOPIFY_PRODUCT_CONFIGS - Configurations des produits
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_product_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopify_product_id UUID NOT NULL REFERENCES shopify_products(id) ON DELETE CASCADE,
  product_name TEXT,
  model_url TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  layers JSONB DEFAULT '[]'::jsonb,
  base_price DECIMAL(10,2),
  pricing_config JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT shopify_product_configs_product_unique UNIQUE(shopify_product_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_product_configs_product_id ON shopify_product_configs(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_product_configs_published ON shopify_product_configs(is_published);

-- =====================================================
-- 6. MATERIAL_MAPS - Material Maps (créé avant models_3d car référencé)
-- =====================================================
CREATE TABLE IF NOT EXISTS material_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. MODELS_3D - Modèles 3D
-- =====================================================
CREATE TABLE IF NOT EXISTS models_3d (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  name TEXT NOT NULL,
  glb_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. MODEL_PARTS - Parties des modèles 3D
-- =====================================================
CREATE TABLE IF NOT EXISTS model_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_3d_id UUID REFERENCES models_3d(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Front", "Back", "Sleeves", "Collar"
  material_map_id UUID REFERENCES material_maps(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_3d_id, name)
);

-- =====================================================
-- 9. MATERIAL_MAP_FILES - Fichiers des Material Maps
-- =====================================================
CREATE TABLE IF NOT EXISTS material_map_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_map_id UUID REFERENCES material_maps(id) ON DELETE CASCADE,
  map_type TEXT NOT NULL, -- 'diffuse', 'normal', 'roughness', 'metallic'
  file_url TEXT NOT NULL,
  intensity INTEGER DEFAULT 100, -- 0-100
  scale DECIMAL(3,1) DEFAULT 1.0, -- 0.1-2.0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_map_id, map_type)
);

-- =====================================================
-- 10. SIZE_PATTERNS - Patrons multi-tailles
-- =====================================================
CREATE TABLE IF NOT EXISTS size_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  model_3d_id UUID REFERENCES models_3d(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  uv_type TEXT NOT NULL DEFAULT 'UV0', -- 'UV0' ou 'UV2'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. SIZE_PATTERN_FILES - Fichiers SVG par taille
-- =====================================================
CREATE TABLE IF NOT EXISTS size_pattern_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID REFERENCES size_patterns(id) ON DELETE CASCADE,
  size_name TEXT NOT NULL, -- Ex: "XS", "S", "M", "L", "XL", "XXL"
  svg_url TEXT NOT NULL,
  metadata JSONB, -- Métadonnées extraites du SVG
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, size_name)
);

-- =====================================================
-- 12. DESIGNS_2D - Designs 2D
-- =====================================================
CREATE TABLE IF NOT EXISTS designs_2d (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  name TEXT NOT NULL,
  svg_url TEXT NOT NULL,
  thumbnail_url TEXT,
  format TEXT, -- Ex: "PNG - 2048x2048"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_model_parts_model_3d_id ON model_parts(model_3d_id);
CREATE INDEX IF NOT EXISTS idx_model_parts_material_map_id ON model_parts(material_map_id);
CREATE INDEX IF NOT EXISTS idx_material_map_files_material_map_id ON material_map_files(material_map_id);
CREATE INDEX IF NOT EXISTS idx_size_patterns_model_3d_id ON size_patterns(model_3d_id);
CREATE INDEX IF NOT EXISTS idx_size_pattern_files_pattern_id ON size_pattern_files(pattern_id);

-- Indexes pour l'isolation par sous-domaine
CREATE INDEX IF NOT EXISTS idx_material_maps_subdomain ON material_maps(subdomain);
CREATE INDEX IF NOT EXISTS idx_models_3d_subdomain ON models_3d(subdomain);
CREATE INDEX IF NOT EXISTS idx_size_patterns_subdomain ON size_patterns(subdomain);
CREATE INDEX IF NOT EXISTS idx_designs_2d_subdomain ON designs_2d(subdomain);

-- =====================================================
-- 13. CONFIGURATIONS - Configurations clients sauvegardées
-- =====================================================
CREATE TABLE IF NOT EXISTS configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  subdomain TEXT,
  product_id UUID,
  model_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  config_data JSONB NOT NULL,
  preview_image_url TEXT,
  shopify_cart_token TEXT,
  shopify_order_id TEXT,
  status TEXT DEFAULT 'draft',
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_configurations_account_id ON configurations(account_id);
CREATE INDEX IF NOT EXISTS idx_configurations_subdomain ON configurations(subdomain);
CREATE INDEX IF NOT EXISTS idx_configurations_customer_email ON configurations(customer_email);
CREATE INDEX IF NOT EXISTS idx_configurations_status ON configurations(status);
CREATE INDEX IF NOT EXISTS idx_configurations_share_token ON configurations(share_token);

-- =====================================================
-- TRIGGERS - Updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_models_3d_updated_at ON models_3d;
CREATE TRIGGER update_models_3d_updated_at BEFORE UPDATE ON models_3d
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_model_parts_updated_at ON model_parts;
CREATE TRIGGER update_model_parts_updated_at BEFORE UPDATE ON model_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_maps_updated_at ON material_maps;
CREATE TRIGGER update_material_maps_updated_at BEFORE UPDATE ON material_maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_material_map_files_updated_at ON material_map_files;
CREATE TRIGGER update_material_map_files_updated_at BEFORE UPDATE ON material_map_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_size_patterns_updated_at ON size_patterns;
CREATE TRIGGER update_size_patterns_updated_at BEFORE UPDATE ON size_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_size_pattern_files_updated_at ON size_pattern_files;
CREATE TRIGGER update_size_pattern_files_updated_at BEFORE UPDATE ON size_pattern_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_designs_2d_updated_at ON designs_2d;
CREATE TRIGGER update_designs_2d_updated_at BEFORE UPDATE ON designs_2d
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopify_products_updated_at ON shopify_products;
CREATE TRIGGER update_shopify_products_updated_at BEFORE UPDATE ON shopify_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopify_product_configs_updated_at ON shopify_product_configs;
CREATE TRIGGER update_shopify_product_configs_updated_at BEFORE UPDATE ON shopify_product_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configurations_updated_at ON configurations;
CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- À créer manuellement dans Supabase Dashboard > Storage :
-- 1. models-3d (pour les fichiers .glb)
-- 2. material-maps (pour les textures)
-- 3. size-patterns (pour les SVG de patrons)
-- 4. designs-2d (pour les designs SVG)
-- 5. thumbnails (pour les miniatures)

