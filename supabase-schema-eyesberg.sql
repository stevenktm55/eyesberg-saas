-- =====================================================
-- EYESBERG SAAS - SUPABASE SCHEMA
-- =====================================================
-- Nouveau projet Supabase dédié pour eyesberg-saas
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MATERIAL_MAPS - Material Maps (créé en premier car référencé)
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
-- 2. MODELS_3D - Modèles 3D
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
-- 3. MODEL_PARTS - Parties des modèles 3D
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
-- 4. MATERIAL_MAP_FILES - Fichiers des Material Maps
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
-- 5. SIZE_PATTERNS - Patrons multi-tailles
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
-- 6. SIZE_PATTERN_FILES - Fichiers SVG par taille
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
-- 7. DESIGNS_2D - Designs 2D
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
-- TRIGGERS - Updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_models_3d_updated_at BEFORE UPDATE ON models_3d
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_parts_updated_at BEFORE UPDATE ON model_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_maps_updated_at BEFORE UPDATE ON material_maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_map_files_updated_at BEFORE UPDATE ON material_map_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_size_patterns_updated_at BEFORE UPDATE ON size_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_size_pattern_files_updated_at BEFORE UPDATE ON size_pattern_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_2d_updated_at BEFORE UPDATE ON designs_2d
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

