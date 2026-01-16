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
    console.log('🔍 [EXTRACT COLORS] Début extraction depuis SVG, longueur:', svgContent.length);
    const styleMatches = Array.from(svgContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
    console.log('🔍 [EXTRACT COLORS] Nombre de blocs <style> trouvés:', styleMatches.length);
    
    for (let styleIndex = 0; styleIndex < styleMatches.length; styleIndex++) {
      const [, cssContent] = styleMatches[styleIndex];
      console.log(`🔍 [EXTRACT COLORS] Traitement style bloc ${styleIndex + 1}, longueur CSS:`, cssContent.length);
      console.log(`🔍 [EXTRACT COLORS] Aperçu CSS (premiers 500 chars):`, cssContent.substring(0, 500));
      
      for (const className of colorClassNames) {
        // Chercher les règles CSS comme .primary { fill: #HEX !important; }
        // Patterns plus robustes pour gérer différents formats
        const patterns = [
          // Pattern 1: .primary { fill: #HEX !important; }
          new RegExp(`\\.${className}\\s*\\{[^}]*?fill:\\s*([^;}\\s!]+)`, 'i'),
          // Pattern 2: .primary { fill:#HEX; }
          new RegExp(`\\.${className}\\s*\\{[^}]*?fill:\\s*([^;}\\s!]+)`, 'i'),
          // Pattern 3: .primary{fill:#HEX}
          new RegExp(`\\.${className}\\s*\\{[^}]*?fill:([^;}\\s!]+)`, 'i'),
          // Pattern 4: stroke au lieu de fill
          new RegExp(`\\.${className}\\s*\\{[^}]*?stroke:\\s*([^;}\\s!]+)`, 'i'),
        ];
        
        let colorFound = false;
        for (const pattern of patterns) {
          const match = cssContent.match(pattern);
          if (match && match[1]) {
            const colorValue = match[1].trim();
            console.log(`🔍 [EXTRACT COLORS] Match trouvé pour ${className}:`, colorValue);
            const normalizedHex = normalizeToHex(colorValue);
            if (normalizedHex) {
              // Vérifier si cette couleur n'a pas déjà été ajoutée (éviter les doublons)
              const existing = extractedColors.find(c => c.name === className);
              if (!existing) {
                extractedColors.push({ name: className, value: normalizedHex });
                console.log(`✅ [EXTRACT COLORS] Couleur ${className} extraite: ${normalizedHex}`);
                colorFound = true;
                break; // Sortir de la boucle des patterns une fois qu'on a trouvé
              } else {
                console.log(`⚠️ [EXTRACT COLORS] Couleur ${className} déjà extraite, ignorée`);
              }
            } else {
              console.log(`⚠️ [EXTRACT COLORS] Couleur ${className} non normalisable:`, colorValue);
            }
          }
        }
        
        if (!colorFound) {
          // Vérifier si la classe existe dans le CSS même sans couleur trouvée
          const classExists = new RegExp(`\\.${className}\\s*\\{`, 'i').test(cssContent);
          if (classExists) {
            console.log(`⚠️ [EXTRACT COLORS] Classe .${className} trouvée dans CSS mais pas de couleur extractible`);
          }
        }
      }
    }

    console.log('🎨 [EXTRACT COLORS] Couleurs extraites depuis le SVG:', extractedColors);
    console.log('🎨 [EXTRACT COLORS] Nombre de couleurs extraites:', extractedColors.length);

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
