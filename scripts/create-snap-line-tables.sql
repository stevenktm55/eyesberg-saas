-- Créer les tables pour les snap lines
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Table: snap_line_groups
CREATE TABLE IF NOT EXISTS snap_line_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT NOT NULL,
  name TEXT NOT NULL,
  model3d_id UUID REFERENCES models_3d(id) ON DELETE SET NULL,
  design2d_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: snap_lines
CREATE TABLE IF NOT EXISTS snap_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snap_line_group_id UUID REFERENCES snap_line_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model3d_id UUID REFERENCES models_3d(id) ON DELETE SET NULL,
  start JSONB NOT NULL, -- [u, v] coordinates
  end JSONB NOT NULL, -- [u, v] coordinates
  type TEXT NOT NULL CHECK (type IN ('horizontal', 'vertical', 'diagonal')) DEFAULT 'vertical',
  view TEXT CHECK (view IN ('Face', 'Dos', 'Gauche', 'Droite')) DEFAULT 'Face',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snap_line_groups_subdomain ON snap_line_groups(subdomain);
CREATE INDEX IF NOT EXISTS idx_snap_line_groups_model3d ON snap_line_groups(model3d_id);
CREATE INDEX IF NOT EXISTS idx_snap_lines_group ON snap_lines(snap_line_group_id);
CREATE INDEX IF NOT EXISTS idx_snap_lines_model3d ON snap_lines(model3d_id);

-- RLS Policies
ALTER TABLE snap_line_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE snap_lines ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique pour les snap line groups
CREATE POLICY "Public read access for snap line groups" ON snap_line_groups
  FOR SELECT USING (true);

-- Policy: Lecture publique pour les snap lines
CREATE POLICY "Public read access for snap lines" ON snap_lines
  FOR SELECT USING (true);

-- Note: Les écritures nécessitent le service role key (gérées par l'API)

