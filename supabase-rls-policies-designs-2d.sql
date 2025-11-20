-- =====================================================
-- POLICIES RLS POUR DESIGNS_2D
-- =====================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Ces policies permettent l'écriture pour designs_2d
-- =====================================================

-- Activer RLS sur designs_2d si ce n'est pas déjà fait
ALTER TABLE designs_2d ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Public can insert designs_2d" ON designs_2d;
DROP POLICY IF EXISTS "Public can update designs_2d" ON designs_2d;
DROP POLICY IF EXISTS "Public can delete designs_2d" ON designs_2d;
DROP POLICY IF EXISTS "Public can read designs_2d" ON designs_2d;

-- DESIGNS_2D - Allow insert/update/delete
CREATE POLICY "Public can insert designs_2d" ON designs_2d
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can update designs_2d" ON designs_2d
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Public can delete designs_2d" ON designs_2d
  FOR DELETE TO public
  USING (true);

-- DESIGNS_2D - Allow read (isolation par subdomain)
CREATE POLICY "Public can read designs_2d" ON designs_2d
  FOR SELECT TO public
  USING (true);

