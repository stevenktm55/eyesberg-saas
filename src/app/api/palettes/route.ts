// =====================================================
// API PALETTES - VERSION SUPABASE
// =====================================================
import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// =====================================================
// GET - Récupérer toutes les palettes
// =====================================================
export async function GET(request: Request) {
  try {
    // Utiliser supabaseAdmin pour éviter les problèmes de permissions RLS
    // Essayer d'abord avec le filtre active
    let query = supabaseAdmin
      .from('color_palettes')
      .select('*');
    
    // Essayer avec le filtre active d'abord
    try {
      query = query.or('active.is.null,active.eq.true');
    } catch (e) {
      // Si la colonne active n'existe pas, on continue sans filtre
      console.warn('[API/palettes] Colonne active non disponible, récupération de toutes les palettes');
    }
    
    query = query.order('created_at', { ascending: false });
    
    let { data, error } = await query;

    // Si erreur liée à la colonne active, réessayer sans filtre
    if (error && (error.code === '42703' || error.message?.includes('active'))) {
      console.warn('[API/palettes] Erreur avec colonne active, réessai sans filtre');
      const retryQuery = supabaseAdmin
        .from('color_palettes')
        .select('*')
        .order('created_at', { ascending: false });
      
      const retryResult = await retryQuery;
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('[API/palettes] Erreur Supabase GET palettes:', error.message);
      console.error('[API/palettes] Error details:', error.details);
      console.error('[API/palettes] Error hint:', error.hint);
      console.error('[API/palettes] Error code:', error.code);
      
      // Si c'est une erreur de colonne manquante ou de permissions, retourner un tableau vide
      if (error.code === '42P01' || error.code === '42703' || error.code === '42501') {
        console.warn('[API/palettes] Erreur de colonne/permissions, retour d\'un tableau vide');
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformer pour garder la même structure que l'ancienne API
    const items = data.map(palette => ({
      id: palette.id,
      name: palette.name,
      colors: palette.colors || []
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error('Erreur GET palettes:', err);
    return NextResponse.json({ error: "Failed to fetch palettes" }, { status: 500 });
  }
}

// =====================================================
// POST - Créer une nouvelle palette
// =====================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const name: string = String(body?.name ?? "Palette");
    const colorsInput = Array.isArray(body?.colors) ? body.colors : [];
    const colors = colorsInput.map((c: any) => (
      typeof c === "string" 
        ? { hex: c, name: "" } 
        : { hex: String(c.hex || "#000000"), name: String(c.name || "") }
    ));

    const { data, error } = await supabase
      .from('color_palettes')
      .insert({
        name,
        colors,
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase POST palette:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      colors: data.colors
    }, { status: 201 });
  } catch (err) {
    console.error('Erreur POST palette:', err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}

// =====================================================
// PUT - Mettre à jour une palette existante
// =====================================================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    
    const name: string = String(body?.name ?? "Palette");
    const colorsInput = Array.isArray(body?.colors) ? body.colors : [];
    const colors = colorsInput.map((c: any) => (
      typeof c === "string" 
        ? { hex: c, name: "" } 
        : { hex: String(c.hex || "#000000"), name: String(c.name || "") }
    ));

    const { data, error } = await supabase
      .from('color_palettes')
      .update({
        name,
        colors
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase PUT palette:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      colors: data.colors
    });
  } catch (err) {
    console.error('Erreur PUT palette:', err);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

// =====================================================
// DELETE - Supprimer une palette
// =====================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Suppression définitive
    const { error } = await supabase
      .from('color_palettes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase DELETE palette:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erreur DELETE palette:', err);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
