// =====================================================
// API LOGOS - VERSION SUPABASE
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

interface LogoVariant {
  id: string;
  name: string;
  file: string;
}

interface Logo {
  id: string;
  name: string;
  tags?: string[];
  variants: LogoVariant[];
}

// =====================================================
// GET - Récupérer tous les logos
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    if (designId) {
      // 1) Récupérer les bibliothèques assignées au design
      const { data: links, error: linksErr } = await supabase
        .from('design_logo_libraries')
        .select('library_id')
        .eq('design_id', designId);
      if (linksErr) {
        console.error('Erreur GET logos?designId - design_logo_libraries:', linksErr);
        return NextResponse.json([]);
      }
      const libraryIds = (links || []).map((r: any) => r.library_id).filter(Boolean);
      if (libraryIds.length === 0) return NextResponse.json([]);

      // 2) Récupérer les logo_ids depuis les bibliothèques
      const { data: items, error: itemsErr } = await supabase
        .from('logo_library_items')
        .select('logo_id')
        .in('library_id', libraryIds);
      if (itemsErr) {
        console.error('Erreur GET logos?designId - logo_library_items:', itemsErr);
        return NextResponse.json([]);
      }
      const logoIds = Array.from(new Set((items || []).map((r: any) => r.logo_id).filter(Boolean)));
      if (logoIds.length === 0) return NextResponse.json([]);

      // 3) Retourner logos actifs correspondant
      const { data: filtered, error: logosErr } = await supabase
        .from('logos')
        .select('*')
        .eq('active', true)
        .in('id', logoIds)
        .order('name', { ascending: true });
      if (logosErr) {
        console.error('Erreur GET logos?designId - logos:', logosErr);
        return NextResponse.json([]);
      }
      return NextResponse.json(filtered || []);
    }

    const { data, error } = await supabase
      .from('logos')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur Supabase GET logos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Les logos sont déjà au bon format dans Supabase
    return NextResponse.json(data);
  } catch (err) {
    console.error('Erreur GET logos:', err);
    return NextResponse.json({ error: 'Failed to read logos' }, { status: 500 });
  }
}

// =====================================================
// POST - Créer un nouveau logo ou ajouter une variante
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const variantName = formData.get('variantName') as string;
    const file = formData.get('file') as File;
    const tags = formData.get('tags') as string;
    const logoId = formData.get('logoId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload du fichier vers Supabase Storage
    const filename = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload logo:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(uploadData.path);

    if (logoId) {
      // Ajouter une variante à un logo existant
      const { data: logo, error: fetchError } = await supabase
        .from('logos')
        .select('*')
        .eq('id', logoId)
        .single();

      if (fetchError || !logo) {
        return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
      }

      const variantId = `${Date.now()}`;
      const updatedVariants = [
        ...logo.variants,
        {
          id: variantId,
          name: variantName || 'Original',
          file: publicUrl
        }
      ];

      const { data: updatedLogo, error: updateError } = await supabase
        .from('logos')
        .update({ variants: updatedVariants })
        .eq('id', logoId)
        .select()
        .single();

      if (updateError) {
        console.error('Erreur update logo:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Récupérer tous les logos pour retourner la liste complète
      const { data: allLogos } = await supabase
        .from('logos')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      return NextResponse.json({ success: true, logos: allLogos });
    } else {
      // Créer un nouveau logo
      const variantId = `${Date.now()}-0`;
      
      const newLogo = {
        name: name || 'Logo sans nom',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        variants: [{
          id: variantId,
          name: variantName || 'Original',
          file: publicUrl
        }],
        active: true
      };

      const { error: insertError } = await supabase
        .from('logos')
        .insert(newLogo);

      if (insertError) {
        console.error('Erreur insert logo:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Récupérer tous les logos pour retourner la liste complète
      const { data: allLogos } = await supabase
        .from('logos')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      return NextResponse.json({ success: true, logos: allLogos });
    }
  } catch (err) {
    console.error('Erreur POST logo:', err);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

// =====================================================
// DELETE - Supprimer un logo ou une variante
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoId = searchParams.get('logoId');
    const variantId = searchParams.get('variantId');

    if (!logoId) {
      return NextResponse.json({ error: 'Logo ID required' }, { status: 400 });
    }

    if (variantId) {
      // Supprimer une variante spécifique
      const { data: logo, error: fetchError } = await supabase
        .from('logos')
        .select('*')
        .eq('id', logoId)
        .single();

      if (fetchError || !logo) {
        return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
      }

      const variant = logo.variants.find((v: LogoVariant) => v.id === variantId);
      if (variant) {
        // Supprimer le fichier du storage
        const fileName = variant.file.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('logos')
            .remove([fileName]);
        }

        const updatedVariants = logo.variants.filter((v: LogoVariant) => v.id !== variantId);

        if (updatedVariants.length === 0) {
          // Si plus de variantes, soft delete du logo
          await supabase
            .from('logos')
            .update({ active: false })
            .eq('id', logoId);
        } else {
          // Mettre à jour les variantes
          await supabase
            .from('logos')
            .update({ variants: updatedVariants })
            .eq('id', logoId);
        }
      }
    } else {
      // Supprimer tout le logo: retirer des bibliothèques, supprimer fichiers storage, puis supprimer la ligne
      // 1) Récupérer le logo complet
      const { data: logo, error: fetchError } = await supabase
        .from('logos')
        .select('*')
        .eq('id', logoId)
        .single();
      if (fetchError || !logo) {
        return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
      }

      // 2) Supprimer les fichiers de toutes les variantes (si dans le même bucket public 'logos')
      try {
        for (const v of (logo.variants || [])) {
          const fileName = (v.file && typeof v.file === 'string') ? v.file.split('/').pop() : null;
          if (fileName) {
            await supabase.storage.from('logos').remove([fileName]);
          }
        }
      } catch (e) {
        console.warn('Suppression fichiers storage (non bloquant):', e);
      }

      // 3) Nettoyer les liaisons avec les bibliothèques
      await supabase.from('logo_library_items').delete().eq('logo_id', logoId);

      // 4) Essayer soft delete (active=false), sinon hard delete si la colonne n'existe pas
      const { error: softErr } = await supabase
        .from('logos')
        .update({ active: false })
        .eq('id', logoId);
      if (softErr) {
        // Fallback suppression définitive
        const { error: hardErr } = await supabase.from('logos').delete().eq('id', logoId);
        if (hardErr) {
          console.error('Erreur DELETE logo (soft+hard):', softErr, hardErr);
          return NextResponse.json({ error: hardErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE logo:', err);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
