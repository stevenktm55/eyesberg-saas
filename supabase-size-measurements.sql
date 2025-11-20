-- =====================================================
-- TABLE POUR LE GUIDE DES TAILLES - MESURES
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- =====================================================

-- Table pour stocker les mesures du guide des tailles
CREATE TABLE IF NOT EXISTS size_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID REFERENCES size_patterns(id) ON DELETE CASCADE,
  size_name TEXT NOT NULL, -- Ex: "XS", "S", "M", "L", "XL", "XXL"
  measurement_name TEXT NOT NULL, -- Ex: "Hauteur (cm)", "Poitrine (cm)", "Taille (cm)"
  measurement_value TEXT NOT NULL, -- Ex: "170-180", "94-98"
  subdomain TEXT NOT NULL, -- Isolation par sous-domaine
  display_order INTEGER DEFAULT 0, -- Ordre d'affichage des mesures
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_id, size_name, measurement_name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_size_measurements_pattern_id ON size_measurements(pattern_id);
CREATE INDEX IF NOT EXISTS idx_size_measurements_size_name ON size_measurements(size_name);
CREATE INDEX IF NOT EXISTS idx_size_measurements_subdomain ON size_measurements(subdomain);
CREATE INDEX IF NOT EXISTS idx_size_measurements_pattern_size ON size_measurements(pattern_id, size_name);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_size_measurements_updated_at ON size_measurements;
CREATE TRIGGER update_size_measurements_updated_at BEFORE UPDATE ON size_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

