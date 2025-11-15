import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = "nodejs";

// API pour uploader directement vers Supabase Storage
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API POST designs/upload - Début');
    
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const name = String(form.get("name") ?? "").trim();
    const colors = JSON.parse(String(form.get("colors") ?? "[]"));
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    console.log('📁 Upload file:', { name: file.name, size: file.size, type: file.type });
    
    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    
    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('designs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/svg+xml'
      });
    
    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    console.log('✅ Upload réussi:', uploadData);
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('designs')
      .getPublicUrl(uploadData.path);
    
    console.log('🔗 URL publique:', publicUrl);
    
    // Créer l'entrée dans la base de données
    const { data: design, error: dbError } = await supabaseAdmin
      .from('designs')
      .insert({
        name: name,
        svg_url: publicUrl,
        colors: colors,
        active: true,
        shop_id: 'default' // À adapter selon votre logique
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ Erreur DB:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    console.log('✅ Design créé:', design);
    
    return NextResponse.json({
      id: design.id,
      name: design.name,
      svgUrl: design.svg_url,
      colors: colors
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
