-- =====================================================
-- CREATE ZONE GROUPS AND ZONES TABLES
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- Table: zone_groups (Groupes de zones)
-- =====================================================
CREATE TABLE IF NOT EXISTS zone_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  model3d_id UUID REFERENCES models_3d(id) ON DELETE SET NULL,
  design2d_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: zones (Zones individuelles dans un groupe)
-- =====================================================
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_group_id UUID REFERENCES zone_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model3d_id UUID REFERENCES models_3d(id) ON DELETE SET NULL,
  position JSONB NOT NULL, -- [u, v, 0] coordonnées UV
  rotation DECIMAL(10,2) DEFAULT 0, -- Rotation en degrés
  width DECIMAL(10,4) NOT NULL, -- Largeur en espace UV (0-1)
  height DECIMAL(10,4) NOT NULL, -- Hauteur en espace UV (0-1)
  thumbnail_url TEXT,
  is_logo BOOLEAN DEFAULT false, -- true pour logo, false pour texte
  view TEXT CHECK (view IN ('Face', 'Dos', 'Gauche', 'Droite')) DEFAULT 'Face',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_zone_groups_subdomain ON zone_groups(subdomain);
CREATE INDEX IF NOT EXISTS idx_zones_zone_group_id ON zones(zone_group_id);
CREATE INDEX IF NOT EXISTS idx_zones_model3d_id ON zones(model3d_id);

-- RLS Policies (Row Level Security)
-- =====================================================
ALTER TABLE zone_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres groupes de zones (basé sur subdomain)
CREATE POLICY "Users can view their own zone groups"
  ON zone_groups FOR SELECT
  USING (true); -- Pour l'instant, permettre la lecture à tous (sera filtré par subdomain dans l'API)

-- Policy: Les utilisateurs peuvent créer leurs propres groupes de zones
CREATE POLICY "Users can create their own zone groups"
  ON zone_groups FOR INSERT
  WITH CHECK (true); -- Pour l'instant, permettre la création à tous (sera filtré par subdomain dans l'API)

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres groupes de zones
CREATE POLICY "Users can update their own zone groups"
  ON zone_groups FOR UPDATE
  USING (true); -- Pour l'instant, permettre la mise à jour à tous (sera filtré par subdomain dans l'API)

-- Policy: Les utilisateurs peuvent supprimer leurs propres groupes de zones
CREATE POLICY "Users can delete their own zone groups"
  ON zone_groups FOR DELETE
  USING (true); -- Pour l'instant, permettre la suppression à tous (sera filtré par subdomain dans l'API)

-- Policies pour zones
CREATE POLICY "Users can view zones"
  ON zones FOR SELECT
  USING (true);

CREATE POLICY "Users can create zones"
  ON zones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update zones"
  ON zones FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete zones"
  ON zones FOR DELETE
  USING (true);



