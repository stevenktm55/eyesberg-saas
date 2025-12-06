// =====================================================
// API TEXT ZONES - VERSION SUPABASE
// =====================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getSubdomain } from '@/lib/get-subdomain';

interface TextZone {
  id: string;
  model_id?: string; // Optionnel pour l'instant
  name: string;
  position: [number, number, number];
  color: string;
  categories?: string[];
  defaultLogoWidth?: number;
  defaultLogoHeight?: number;
  defaultTextWidth?: number;
  defaultTextHeight?: number;
  zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | string;
  thumbnail_url?: string;
  view?: 'front' | 'back' | 'left' | 'right';
  design_id?: string | null;
}

// =====================================================
// GET - Récupérer toutes les zones
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');
    const shopDomain = searchParams.get('shop');

    // Récupérer le subdomain depuis product_builder si shopDomain est fourni
    let subdomain: string | null = null;
    
    if (shopDomain) {
      try {
        const { data: product } = await supabaseAdmin
          .from('product_builder')
          .select('subdomain')
          .eq('shop_domain', shopDomain)
          .limit(1)
          .maybeSingle();
        
        if (product?.subdomain) {
          subdomain = product.subdomain;
        }
      } catch (error) {
        console.warn('Could not fetch subdomain from shop_domain for text-zones API:', error);
      }
    }
    
    // Fallback: essayer de récupérer le subdomain depuis les headers/session
    if (!subdomain) {
      subdomain = await getSubdomain(request);
    }

    // Note: text_zones n'a pas directement de champ subdomain dans la structure actuelle
    // On retourne toutes les zones si designId est fourni, sinon toutes
    let query = supabaseAdmin
      .from('text_zones')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par subdomain si disponible (via design_id qui a un subdomain)
    // Note: text_zones n'a pas directement de champ subdomain, mais design_id peut être utilisé
    if (designId) {
      query = query.eq('design_id', designId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase GET text_zones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformer pour garder la compatibilité avec l'ancien format
    const zones = data.map(zone => ({
      id: zone.id,
      name: zone.name,
      position: zone.position,
      color: zone.zone_category || zone.color || 'torse', // Fallback pour compatibilité
      categories: zone.categories || ['text'],
      defaultLogoWidth: zone.default_logo_width,
      defaultLogoHeight: zone.default_logo_height,
      defaultTextWidth: zone.default_text_width,
      defaultTextHeight: zone.default_text_height,
      defaultRotation: zone.default_rotation,
      zoneCategory: zone.zone_category,
      image: zone.thumbnail_url,
      designId: zone.design_id ?? null,
      view: zone.view ?? undefined,
    }));

    return NextResponse.json(zones);
  } catch (err) {
    console.error('Erreur GET text_zones:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// =====================================================
// POST - Ajouter une nouvelle zone
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, position, color, image, categories,
      defaultLogoWidth, defaultLogoHeight,
      defaultTextWidth, defaultTextHeight,
      defaultRotation,
      zoneCategory,
      view,
      designId
    } = body;

    if (!name || !position || !color) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('text_zones')
      .insert({
        name,
        position,
        categories: categories || ['text'],
        zone_category: zoneCategory || 'torse',
        view: view || 'front',
        design_id: designId || null,
        default_logo_width: defaultLogoWidth,
        default_logo_height: defaultLogoHeight,
        default_text_width: defaultTextWidth,
        default_text_height: defaultTextHeight,
        default_rotation: defaultRotation,
        thumbnail_url: image
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase POST text_zone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retourner au format attendu par le front
    return NextResponse.json({
      id: data.id,
      name: data.name,
      position: data.position,
      color: data.zone_category,
      categories: data.categories,
      defaultLogoWidth: data.default_logo_width,
      defaultLogoHeight: data.default_logo_height,
      defaultTextWidth: data.default_text_width,
      defaultTextHeight: data.default_text_height,
      defaultRotation: data.default_rotation,
      zoneCategory: data.zone_category,
      image: data.thumbnail_url,
      view: data.view,
      designId: data.design_id
    });
  } catch (err) {
    console.error('Erreur POST text_zone:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// =====================================================
// PUT - Mettre à jour une zone existante
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const body = await request.json();

    // Récupérer la zone actuelle
    const { data: current, error: fetchError } = await supabase
      .from('text_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Zone introuvable' }, { status: 404 });
    }

    // Mettre à jour seulement les champs fournis
    const { data, error } = await supabase
      .from('text_zones')
      .update({
        name: body.name ?? current.name,
        position: body.position ?? current.position,
        zone_category: body.zoneCategory ?? current.zone_category,
        categories: body.categories ?? current.categories,
        view: body.view ?? current.view,
        design_id: body.designId !== undefined ? body.designId : current.design_id,
        default_logo_width: body.defaultLogoWidth ?? current.default_logo_width,
        default_logo_height: body.defaultLogoHeight ?? current.default_logo_height,
        default_text_width: body.defaultTextWidth ?? current.default_text_width,
        default_text_height: body.defaultTextHeight ?? current.default_text_height,
        default_rotation: body.defaultRotation !== undefined ? body.defaultRotation : current.default_rotation,
        thumbnail_url: body.image !== undefined ? body.image : current.thumbnail_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase PUT text_zone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retourner au format attendu
    return NextResponse.json({
      id: data.id,
      name: data.name,
      position: data.position,
      color: data.zone_category,
      categories: data.categories,
      defaultLogoWidth: data.default_logo_width,
      defaultLogoHeight: data.default_logo_height,
      defaultTextWidth: data.default_text_width,
      defaultTextHeight: data.default_text_height,
      defaultRotation: data.default_rotation,
      zoneCategory: data.zone_category,
      image: data.thumbnail_url,
      view: data.view,
      designId: data.design_id
    });
  } catch (err) {
    console.error('Erreur PUT text_zone:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// =====================================================
// PATCH - Opérations diverses (assigner design_id aux nulls)
// =====================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, designId } = body || {};
    if (action === 'assign_nulls') {
      if (!designId) return NextResponse.json({ error: 'designId required' }, { status: 400 });
      const { data, error } = await supabase
        .from('text_zones')
        .update({ design_id: designId })
        .is('design_id', null)
        .select('id');
      if (error) {
        console.error('Erreur PATCH assign_nulls:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, updated: data?.length || 0 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Erreur PATCH text_zones:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// =====================================================
// DELETE - Supprimer une zone
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const { error } = await supabase
      .from('text_zones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase DELETE text_zone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur DELETE text_zone:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
