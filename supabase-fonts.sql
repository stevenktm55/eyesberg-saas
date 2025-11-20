-- =====================================================
-- TABLES POUR LES GROUPES DE FONTS ET LES FONTS
-- =====================================================

-- Table pour les groupes de fonts
CREATE TABLE IF NOT EXISTS font_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les fonts
CREATE TABLE IF NOT EXISTS fonts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  font_group_id UUID NOT NULL REFERENCES font_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- URL du fichier de font dans Supabase Storage
  file_name TEXT NOT NULL, -- Nom original du fichier
  file_type TEXT NOT NULL, -- ttf, otf, woff, woff2
  letter_spacing TEXT DEFAULT '0px', -- Letter spacing en px, em, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_font_groups_subdomain ON font_groups(subdomain);
CREATE INDEX IF NOT EXISTS idx_fonts_font_group_id ON fonts(font_group_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_font_groups_updated_at ON font_groups;
CREATE TRIGGER update_font_groups_updated_at BEFORE UPDATE ON font_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fonts_updated_at ON fonts;
CREATE TRIGGER update_fonts_updated_at BEFORE UPDATE ON fonts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE font_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonts ENABLE ROW LEVEL SECURITY;

-- Policies for font_groups
CREATE POLICY "Public read access for font_groups" ON font_groups
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Public insert access for font_groups" ON font_groups
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public update access for font_groups" ON font_groups
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Public delete access for font_groups" ON font_groups
  FOR DELETE TO public
  USING (true);

-- Policies for fonts
CREATE POLICY "Public read access for fonts" ON fonts
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Public insert access for fonts" ON fonts
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public update access for fonts" ON fonts
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Public delete access for fonts" ON fonts
  FOR DELETE TO public
  USING (true);

