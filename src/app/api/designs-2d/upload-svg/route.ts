import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// POST - Uploader un SVG modifié pour un design 2D
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const designId = formData.get('designId') as string;
    const svgContent = formData.get('svgContent') as string;

    if (!designId || !svgContent) {
      return NextResponse.json(
        { error: 'designId and svgContent are required' },
        { status: 400 }
      );
    }

    // Vérifier que le design appartient au sous-domaine
    const { data: existingDesign, error: fetchError } = await supabaseAdmin
      .from('designs_2d')
      .select('id, name')
      .eq('id', designId)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingDesign) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    // Créer un blob à partir du contenu SVG
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const fileName = `${Date.now()}-${existingDesign.name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;

    // Upload du nouveau SVG vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('designs-2d')
      .upload(fileName, svgBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/svg+xml'
      });

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload SVG: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('designs-2d')
      .getPublicUrl(uploadData.path);

    // Extraire les couleurs depuis le SVG sauvegardé
    const extractedColors: Array<{ name: string; value: string }> = [];
    const colorClassNames = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary'];
    
    // Fonction pour normaliser une couleur en hex
    const normalizeToHex = (colorValue: string): string | null => {
      let normalized = colorValue.trim();
      // Retirer !important si présent
      normalized = normalized.replace(/\s*!important\s*/gi, '').trim();
      
      if (normalized.startsWith('#')) {
        // Déjà en hex, normaliser la casse et la longueur
        const hex = normalized.toUpperCase();
        if (hex.length === 4) {
          // #RGB -> #RRGGBB
          return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
        }
        return hex.length === 7 ? hex : null;
      } else if (normalized.startsWith('rgb')) {
        // Convertir rgb/rgba en hex
        const rgbMatch = normalized.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0]);
          const g = parseInt(rgbMatch[1]);
          const b = parseInt(rgbMatch[2]);
          const hex = `#${[r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('')}`.toUpperCase();
          return hex;
        }
      }
      return null;
    };
    
    // Parser les styles CSS pour extraire les couleurs
    const styleMatches = svgContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    for (const [, cssContent] of styleMatches) {
      for (const className of colorClassNames) {
        // Chercher les règles CSS comme .primary { fill: #HEX !important; }
        // Chercher aussi stroke: au cas où
        const fillPattern = new RegExp(`\\.${className}\\s*\\{[^}]*fill:\\s*([^;}\\s]+)`, 'i');
        const strokePattern = new RegExp(`\\.${className}\\s*\\{[^}]*stroke:\\s*([^;}\\s]+)`, 'i');
        
        const fillMatch = cssContent.match(fillPattern);
        const strokeMatch = cssContent.match(strokePattern);
        
        // Priorité à fill, sinon stroke
        const colorMatch = fillMatch || strokeMatch;
        if (colorMatch && colorMatch[1]) {
          const normalizedHex = normalizeToHex(colorMatch[1]);
          if (normalizedHex) {
            // Vérifier si cette couleur n'a pas déjà été ajoutée (éviter les doublons)
            const existing = extractedColors.find(c => c.name === className);
            if (!existing) {
              extractedColors.push({ name: className, value: normalizedHex });
              console.log(`🎨 Couleur ${className} extraite: ${normalizedHex}`);
            }
          }
        }
      }
    }

    console.log('🎨 Couleurs extraites depuis le SVG:', extractedColors);

    // Mettre à jour le design avec la nouvelle URL SVG et les couleurs extraites
    const updateData: any = { svg_url: publicUrl };
    if (extractedColors.length > 0) {
      updateData.colors = extractedColors;
    }

    const { data: updatedDesign, error: updateError } = await supabaseAdmin
      .from('designs_2d')
      .update(updateData)
      .eq('id', designId)
      .eq('subdomain', subdomain)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update design: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      design: updatedDesign,
      svgUrl: publicUrl 
    });
  } catch (error: any) {
    console.error('Error uploading SVG:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload SVG' },
      { status: 500 }
    );
  }
}
