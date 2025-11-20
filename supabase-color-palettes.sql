-- =====================================================
-- TABLE POUR LES PALETTES DE COULEURS
-- =====================================================

-- Table pour les palettes de couleurs
CREATE TABLE IF NOT EXISTS color_palettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  colors JSONB NOT NULL, -- Array of hex color strings, e.g., ["#FF0000", "#00FF00", "#0000FF"]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_color_palettes_subdomain ON color_palettes(subdomain);
CREATE INDEX IF NOT EXISTS idx_color_palettes_name ON color_palettes(name);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_color_palettes_updated_at ON color_palettes;
CREATE TRIGGER update_color_palettes_updated_at BEFORE UPDATE ON color_palettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public read access for color_palettes" ON color_palettes
  FOR SELECT TO public
  USING (true);

-- Policy for public insert access
CREATE POLICY "Public insert access for color_palettes" ON color_palettes
  FOR INSERT TO public
  WITH CHECK (true);

-- Policy for public update access
CREATE POLICY "Public update access for color_palettes" ON color_palettes
  FOR UPDATE TO public
  USING (true);

-- Policy for public delete access
CREATE POLICY "Public delete access for color_palettes" ON color_palettes
  FOR DELETE TO public
  USING (true);

