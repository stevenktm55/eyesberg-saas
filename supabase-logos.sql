-- =====================================================
-- TABLES POUR LES BIBLIOTHÈQUES DE LOGOS ET LES LOGOS
-- =====================================================

-- Table pour les bibliothèques de logos
CREATE TABLE IF NOT EXISTS logo_libraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les logos
CREATE TABLE IF NOT EXISTS logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_library_id UUID NOT NULL REFERENCES logo_libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- URL du fichier SVG dans Supabase Storage
  file_name TEXT NOT NULL, -- Nom original du fichier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les variantes de logos
CREATE TABLE IF NOT EXISTS logo_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_id UUID NOT NULL REFERENCES logos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- URL du fichier SVG dans Supabase Storage
  file_name TEXT NOT NULL, -- Nom original du fichier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logo_libraries_subdomain ON logo_libraries(subdomain);
CREATE INDEX IF NOT EXISTS idx_logos_library_id ON logos(logo_library_id);
CREATE INDEX IF NOT EXISTS idx_logo_variants_logo_id ON logo_variants(logo_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_logo_libraries_updated_at ON logo_libraries;
CREATE TRIGGER update_logo_libraries_updated_at BEFORE UPDATE ON logo_libraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_logos_updated_at ON logos;
CREATE TRIGGER update_logos_updated_at BEFORE UPDATE ON logos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_logo_variants_updated_at ON logo_variants;
CREATE TRIGGER update_logo_variants_updated_at BEFORE UPDATE ON logo_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE logo_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_variants ENABLE ROW LEVEL SECURITY;

-- Policies for logo_libraries
DROP POLICY IF EXISTS "Public read access for logo_libraries" ON logo_libraries;
CREATE POLICY "Public read access for logo_libraries" ON logo_libraries
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Public insert access for logo_libraries" ON logo_libraries;
CREATE POLICY "Public insert access for logo_libraries" ON logo_libraries
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for logo_libraries" ON logo_libraries;
CREATE POLICY "Public update access for logo_libraries" ON logo_libraries
  FOR UPDATE TO public
  USING (true);

DROP POLICY IF EXISTS "Public delete access for logo_libraries" ON logo_libraries;
CREATE POLICY "Public delete access for logo_libraries" ON logo_libraries
  FOR DELETE TO public
  USING (true);

-- Policies for logos
DROP POLICY IF EXISTS "Public read access for logos" ON logos;
CREATE POLICY "Public read access for logos" ON logos
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Public insert access for logos" ON logos;
CREATE POLICY "Public insert access for logos" ON logos
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for logos" ON logos;
CREATE POLICY "Public update access for logos" ON logos
  FOR UPDATE TO public
  USING (true);

DROP POLICY IF EXISTS "Public delete access for logos" ON logos;
CREATE POLICY "Public delete access for logos" ON logos
  FOR DELETE TO public
  USING (true);

-- Policies for logo_variants
DROP POLICY IF EXISTS "Public read access for logo_variants" ON logo_variants;
CREATE POLICY "Public read access for logo_variants" ON logo_variants
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Public insert access for logo_variants" ON logo_variants;
CREATE POLICY "Public insert access for logo_variants" ON logo_variants
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for logo_variants" ON logo_variants;
CREATE POLICY "Public update access for logo_variants" ON logo_variants
  FOR UPDATE TO public
  USING (true);

DROP POLICY IF EXISTS "Public delete access for logo_variants" ON logo_variants;
CREATE POLICY "Public delete access for logo_variants" ON logo_variants
  FOR DELETE TO public
  USING (true);

