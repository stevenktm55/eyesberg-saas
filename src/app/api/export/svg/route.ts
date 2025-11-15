// =====================================================
// API EXPORT SVG COMPLET - UV MAP 4096x4096
// =====================================================
// Exporte le design, couleurs, textes et logos
// NOTE IMPORTANT: 
// - Les textes sont convertis en chemins vectoriels avec la bonne police
// - Plus besoin de créer les outlines dans Illustrator
// =====================================================
import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import opentype from 'opentype.js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('📥 SVG Export - Requête reçue');
  try {
    const { configId } = await request.json();
    console.log('📥 SVG Export - ConfigId:', configId);

    if (!configId) {
      return NextResponse.json({ error: 'configId required' }, { status: 400 });
    }

    // 1. Charger la configuration
    const { data: config, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (error || !config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    const configData = config.config_data;
    console.log('📦 Export SVG - Config ID:', configId);
    console.log('📦 Export SVG - Colors:', JSON.stringify(configData.colors, null, 2));
    console.log('📦 Export SVG - Config data keys:', Object.keys(configData || {}));

    // 2. Charger le design - essayer plusieurs méthodes
    let designUrl = configData.designUrl || configData.design?.svgUrl;
    const designId = configData.designId || configData.design?.id;
    
    console.log('📦 Export SVG - designUrl from config:', designUrl);
    console.log('📦 Export SVG - designId from config:', designId);

    // Si pas de designUrl mais un designId, récupérer depuis la base de données
    if (!designUrl && designId) {
      console.log('📦 Tentative récupération design depuis designId:', designId);
      try {
        // Utiliser supabaseAdmin pour contourner RLS si nécessaire
        const { data: design, error: designError } = await supabaseAdmin
          .from('designs')
          .select('svg_url, name')
          .eq('id', designId)
          .single();
        
        if (!designError && design && design.svg_url) {
          designUrl = design.svg_url;
          console.log('✅ Design récupéré depuis DB:', {
            name: design.name,
            svg_url: designUrl
          });
        } else {
          console.error('❌ Erreur récupération design depuis DB:', {
            error: designError,
            designId: designId,
            hasDesign: !!design,
            hasSvgUrl: !!(design?.svg_url)
          });
        }
      } catch (error) {
        console.error('❌ Exception lors de la récupération du design:', error);
      }
    }

    if (!designUrl) {
      console.error('❌ Aucun designUrl trouvé dans configData:', {
        hasDesignUrl: !!configData.designUrl,
        hasDesignSvgUrl: !!(configData.design?.svgUrl),
        hasDesignId: !!designId,
        configDataKeys: Object.keys(configData || {})
      });
      return NextResponse.json({ error: 'No design found in configuration' }, { status: 404 });
    }

    // Vérifier si designUrl est du base64 (SVG encodé directement)
    let svgText: string;
    
    if (designUrl.includes('base64,') || designUrl.startsWith('data:')) {
      // C'est du base64, décoder directement
      console.log('📦 DesignUrl contient du base64, décodage direct...');
      try {
        if (designUrl.startsWith('data:')) {
          // Format: data:image/svg+xml;base64,...
          const base64Match = designUrl.match(/base64,(.+)$/);
          if (base64Match) {
            svgText = Buffer.from(base64Match[1], 'base64').toString('utf-8');
          } else {
            // Essayer sans le préfixe data:
            svgText = Buffer.from(designUrl.split(',')[1] || designUrl, 'base64').toString('utf-8');
          }
        } else {
          // Format: svg+xml;base64,... (sans préfixe data:)
          const base64Match = designUrl.match(/base64,(.+)$/);
          if (base64Match) {
            svgText = Buffer.from(base64Match[1], 'base64').toString('utf-8');
          } else {
            // Essayer de décoder directement
            const base64Part = designUrl.split('base64,')[1] || designUrl;
            svgText = Buffer.from(base64Part, 'base64').toString('utf-8');
          }
        }
        console.log('✅ SVG décodé depuis base64, taille:', svgText.length, 'caractères');
      } catch (error) {
        console.error('❌ Erreur décodage base64:', error);
        return NextResponse.json({ 
          error: 'Failed to decode base64 SVG',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }, { status: 400 });
      }
    } else {
      // C'est une URL, faire un fetch
      // Construire l'URL complète si nécessaire
      if (!designUrl.startsWith('http')) {
        const filename = designUrl.split('/').pop();
        designUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/designs/${filename}`;
        console.log('📦 DesignUrl reconstruit:', designUrl);
      }

      console.log('📦 Tentative fetch du design:', designUrl.substring(0, 100) + '...');
      const designResponse = await fetch(designUrl);
      
      if (!designResponse.ok) {
        console.error('❌ Erreur fetch design:', {
          status: designResponse.status,
          statusText: designResponse.statusText,
          url: designUrl.substring(0, 200),
          configId: configId,
          designId: designId
        });
        return NextResponse.json({ 
          error: 'Design not found',
          details: {
            status: designResponse.status,
            url: designUrl.substring(0, 200),
            designId: designId
          }
        }, { status: 404 });
      }
      
      svgText = await designResponse.text();
      console.log('✅ Design chargé depuis URL avec succès, taille:', svgText.length, 'caractères');
    }
    
    // Ajouter xmlns:xlink dans le SVG pour la compatibilité avec Illustrator
    if (!svgText.includes('xmlns:xlink')) {
      svgText = svgText.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    // Extraire TOUTES les définitions CSS et les convertir en inline
    const allStyleMatch = svgText.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (allStyleMatch) {
      const allStyleContent = allStyleMatch[1];
      console.log('📄 Extracting ALL CSS styles for inline conversion');
      
      // Extraire TOUTES les règles CSS (y compris .st0, .st1, etc.)
      const allCssRules = [...allStyleContent.matchAll(/\.(st\d+)\s*\{([^}]*)\}/g)];
      const allColorMap: Record<string, { fill?: string, stroke?: string, strokeWidth?: string }> = {};
      
      console.log('📦 Found CSS rules:', allCssRules.length);
      
      for (const match of allCssRules) {
        const className = match[1];
        const properties = match[2];
        
        // Extraire toutes les propriétés (fill, stroke, etc.) avec ou sans point-virgule
        const fillMatch = properties.match(/fill:\s*([^;]+)/);
        const strokeMatch = properties.match(/stroke:\s*([^;]+)/);
        const strokeWidthMatch = properties.match(/stroke-width:\s*([^;]+)/);
        
        if (fillMatch || strokeMatch) {
          allColorMap[className] = {
            fill: fillMatch ? fillMatch[1].trim() : undefined,
            stroke: strokeMatch ? strokeMatch[1].trim() : undefined,
            strokeWidth: strokeWidthMatch ? strokeWidthMatch[1].trim() : undefined
          };
        }
      }
      
      console.log('📦 All CSS rules extracted:', Object.keys(allColorMap).length);
      
      // Convertir toutes les classes CSS en attributs inline
      for (const [className, styles] of Object.entries(allColorMap)) {
        const classNameEscaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let replacement = '';
        
        if (styles.fill && !replacement.includes('fill=')) {
          replacement += `fill="${styles.fill}"`;
        }
        if (styles.stroke && !replacement.includes('stroke=')) {
          replacement += (replacement ? ' ' : '') + `stroke="${styles.stroke}"`;
        }
        if (styles.strokeWidth && !replacement.includes('stroke-width=')) {
          replacement += (replacement ? ' ' : '') + `stroke-width="${styles.strokeWidth}"`;
        }
        
        if (replacement) {
          // Remplacer class="className" par les attributs inline
          svgText = svgText.replace(new RegExp(`class="${classNameEscaped}"`, 'g'), replacement);
          console.log(`✅ Converted class="${className}" → ${replacement}`);
        }
      }
      
      // Retirer toutes les classes restantes qui n'ont pas de style
      svgText = svgText.replace(/\s+class="[^"]*"/g, '');
      
      // Nettoyer les <style> et <defs> vides
      svgText = svgText.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
      svgText = svgText.replace(/<defs>\s*<\/defs>/g, '');
      
      console.log('✅ All CSS converted to inline attributes');
    }

    // 3. Appliquer les couleurs et créer les variables
    let primary, secondary, tertiary, quaternary, quinary;
    let primaryName = '', secondaryName = '', tertiaryName = '', quaternaryName = '', quinaryName = '';
    
    console.log('🔍 Type de configData.colors:', typeof configData.colors);
    console.log('🔍 configData.colors est array?', Array.isArray(configData.colors));
    console.log('🔍 Nombre de couleurs:', Array.isArray(configData.colors) ? configData.colors.length : 'N/A');
    
    if (configData.colors && Array.isArray(configData.colors)) {
      console.log('📦 Format tableau détecté');
      primary = configData.colors[0]?.hex;
      secondary = configData.colors[1]?.hex;
      tertiary = configData.colors[2]?.hex;
      quaternary = configData.colors[3]?.hex;
      quinary = configData.colors[4]?.hex;
      
      primaryName = configData.colors[0]?.name || 'Couleur Primaire';
      secondaryName = configData.colors[1]?.name || 'Couleur Secondaire';
      tertiaryName = configData.colors[2]?.name || 'Couleur Tertiaire';
      quaternaryName = configData.colors[3]?.name || 'Couleur Quaternaire';
      quinaryName = configData.colors[4]?.name || 'Couleur Quinaire';
      
      console.log('🎨 Couleurs extraites du tableau:', { primary, secondary, tertiary, quaternary, quinary });
      
      // Logs pour diagnostiquer
      const hasPrimaryClass = svgText.includes('class="primary"');
      const hasSecondaryClass = svgText.includes('class="secondary"');
      const hasTertiaryClass = svgText.includes('class="tertiary"');
      console.log('🔍 Classes trouvées dans le SVG:', { hasPrimaryClass, hasSecondaryClass, hasTertiaryClass });
      
      // Chercher toutes les définitions de classes CSS dans le style
      const classMatches = svgText.match(/\.st\d+\s*\{[^}]+\}/g);
      console.log('🎨 Définitions CSS trouvées:', classMatches?.length || 0);
      
      // Chercher .secondary et .tertiary spécifiquement
      const secondaryDef = svgText.match(/\.secondary\s*\{[^}]+\}/g);
      const tertiaryDef = svgText.match(/\.tertiary\s*\{[^}]+\}/g);
      console.log('🎨 Définitions CSS .secondary:', secondaryDef);
      console.log('🎨 Définitions CSS .tertiary:', tertiaryDef);
      
      console.log('📄 Aperçu du SVG (2000 premiers caractères):', svgText.substring(0, 2000));
      
      // Fonction pour remplacer les couleurs de manière robuste - INLINE uniquement pour Illustrator
      const replaceColor = (className: string, color: string) => {
        // 1. Remplacer class="className" par fill="color" INLINE
        let replaced = 0;
        const classRegex = new RegExp(`class="${className}"`, 'g');
        const matches = svgText.match(classRegex);
        if (matches) {
          replaced = matches.length;
          // Pour les couleurs blanches, ajouter un contour fin pour la visibilité
          const isWhite = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF' || color === 'white';
          if (isWhite) {
            // Ajouter un contour gris fin pour rendre le blanc visible
            svgText = svgText.replace(classRegex, `fill="${color}" stroke="#E0E0E0" stroke-width="0.5"`);
            console.log(`✅ ${replaced} usages de class="${className}" → fill="${color}" avec contour gris`);
          } else {
            svgText = svgText.replace(classRegex, `fill="${color}"`);
            console.log(`✅ ${replaced} usages de class="${className}" → fill="${color}"`);
          }
        }
        
        // 2. Remplacer aussi dans le CSS (même si on fait inline, au cas où)
        const cssBlockPattern = new RegExp(`\\.${className}\\s*\\{[^}]+fill:\\s*[^}]+\\}`, 'g');
        const cssMatches = svgText.match(cssBlockPattern);
        if (cssMatches) {
          const isWhite = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF' || color === 'white';
          if (isWhite) {
            svgText = svgText.replace(cssBlockPattern, `.${className} {\n        fill: ${color} !important;\n        stroke: #E0E0E0 !important;\n        stroke-width: 0.5 !important;\n      }`);
            console.log(`✅ CSS ${className} remplacé par ${color} avec contour gris`);
          } else {
            svgText = svgText.replace(cssBlockPattern, `.${className} {\n        fill: ${color} !important;\n      }`);
            console.log(`✅ CSS ${className} remplacé par ${color}`);
          }
        }
        
        console.log(`✅ Couleur ${className} appliquée en inline: ${color} (${replaced} éléments)`);
      };
      
      if (primary) {
        replaceColor('primary', primary);
        console.log('✅ Couleur primary appliquée');
      }
      if (secondary) {
        replaceColor('secondary', secondary);
      }
      if (tertiary) {
        replaceColor('tertiary', tertiary);
      }
      if (quaternary) {
        replaceColor('quaternary', quaternary);
      }
      if (quinary) {
        replaceColor('quinary', quinary);
      }
      console.log('✅ Couleurs appliquées (tableau):', { primary, secondary, tertiary, quaternary, quinary });
    
    // Vérifier une dernière fois après les couleurs
    console.log('🔍 Vérification final après application couleurs:');
    const tertiaryCheckFinal = svgText.match(/\.tertiary\s*\{[^}]+\}/g);
    console.log('🎨 .tertiary après:', tertiaryCheckFinal);
    } else if (configData.colors && typeof configData.colors === 'object' && !Array.isArray(configData.colors)) {
      console.log('📦 Format objet détecté');
      // Format ancien (objet avec primary, secondary, tertiary)
      primary = configData.colors.primary;
      secondary = configData.colors.secondary;
      tertiary = configData.colors.tertiary;
      quaternary = configData.colors.quaternary;
      quinary = configData.colors.quinary;
      
      primaryName = configData.colors.primaryName || 'Couleur Primaire';
      secondaryName = configData.colors.secondaryName || 'Couleur Secondaire';
      tertiaryName = configData.colors.tertiaryName || 'Couleur Tertiaire';
      quaternaryName = configData.colors.quaternaryName || 'Couleur Quaternaire';
      quinaryName = configData.colors.quinaryName || 'Couleur Quinaire';
      
      // Fonction pour remplacer les couleurs de manière robuste
      const replaceColorObj = (className: string, color: string) => {
        // 1. Remplacer class="className" par fill="color"
        const isWhite = color.toUpperCase() === '#FFFFFF' || color.toUpperCase() === '#FFF' || color === 'white';
        if (isWhite) {
          // Ajouter un contour gris fin pour rendre le blanc visible
          svgText = svgText.replace(new RegExp(`class="${className}"`, 'g'), `fill="${color}" stroke="#E0E0E0" stroke-width="0.5"`);
          console.log(`✅ ${className} remplacé par ${color} avec contour gris (format objet)`);
        } else {
          svgText = svgText.replace(new RegExp(`class="${className}"`, 'g'), `fill="${color}"`);
        }
        
        // 2. Remplacer la valeur dans le bloc CSS .className { fill: valeur }
        // Pattern qui capture: (.className { ... fill: ) [couleur avec ou sans point-virgule] ( ... })
        const cssBlockPattern = new RegExp(`(\\.${className}\\s*\\{[^}]*fill:\\s*)([^;\\}]+)([^}]*\\})`, 'g');
        if (isWhite) {
          svgText = svgText.replace(cssBlockPattern, `$1${color} !important; stroke: #E0E0E0 !important; stroke-width: 0.5 !important$3`);
          console.log(`✅ CSS ${className} remplacé par ${color} avec contour gris (format objet)`);
        } else {
          svgText = svgText.replace(cssBlockPattern, `$1${color} !important$3`);
        }
      };
      
      if (primary) {
        replaceColorObj('primary', primary);
      }
      if (secondary) {
        replaceColorObj('secondary', secondary);
      }
      if (tertiary) {
        replaceColorObj('tertiary', tertiary);
      }
      if (quaternary) {
        replaceColorObj('quaternary', quaternary);
      }
      if (quinary) {
        replaceColorObj('quinary', quinary);
      }
      console.log('✅ Couleurs appliquées (format objet):', { primary, secondary, tertiary, quaternary, quinary });
    }
    
    // Ajouter les commentaires avec les noms des couleurs au début du SVG
    if (primary || secondary || tertiary || quaternary || quinary) {
      const colorComments = [
        '<!-- ===== COULEURS UTILISÉES ===== -->',
        ...(primary ? [`<!-- Primaire (${primaryName}): ${primary} -->`] : []),
        ...(secondary ? [`<!-- Secondaire (${secondaryName}): ${secondary} -->`] : []),
        ...(tertiary ? [`<!-- Tertiaire (${tertiaryName}): ${tertiary} -->`] : []),
        ...(quaternary ? [`<!-- Quaternaire (${quaternaryName}): ${quaternary} -->`] : []),
        ...(quinary ? [`<!-- Quinaire (${quinaryName}): ${quinary} -->`] : []),
        '<!-- =============================== -->',
        ''
      ].join('\n');
      
      // Insérer les commentaires après l'en-tête XML si présent, sinon au début
      if (svgText.includes('<?xml')) {
        svgText = svgText.replace('<?xml version="1.0" encoding="UTF-8"?>\n<svg', `<?xml version="1.0" encoding="UTF-8"?>\n${colorComments}<svg`);
      } else {
        svgText = svgText.replace('<svg', `${colorComments}<svg`);
      }
    }

    // 3.5. Récupérer les polices utilisées et les définir dans le SVG
    const texts: any[] = configData.texts || [];
    const usedFontFamilies = [...new Set(texts.map(t => t.fontFamily))].filter(Boolean);
    
    if (usedFontFamilies.length > 0) {
      console.log('📝 Polices utilisées:', usedFontFamilies);
      
      // Récupérer les polices depuis Supabase
      try {
        const { data: fontsData, error: fontsError } = await supabase
          .from('fonts')
          .select('display_name, font_url, format')
          .in('display_name', usedFontFamilies)
          .eq('active', true);
        
        if (!fontsError && fontsData) {
          console.log('✅ Polices récupérées:', fontsData.length);
          
          // Créer les définitions @font-face avec les polices embarquées en base64
          const fontFaces = await Promise.all(fontsData.map(async (font) => {
            try {
              console.log('📥 Téléchargement police:', font.display_name);
              const fontResponse = await fetch(font.font_url);
              const fontBuffer = await fontResponse.arrayBuffer();
              const base64 = Buffer.from(fontBuffer).toString('base64');
              
              const mimeType = font.format === 'ttf' ? 'font/truetype' :
                              font.format === 'otf' ? 'font/opentype' :
                              font.format === 'woff' ? 'font/woff' :
                              font.format === 'woff2' ? 'font/woff2' :
                              'font/truetype';
              
              const dataUrl = `data:${mimeType};base64,${base64}`;
              
              console.log('✅ Police intégrée en base64:', font.display_name);
              
              return `    @font-face {
      font-family: '${font.display_name}';
      src: url('${dataUrl}') format('${font.format}');
    }`;
            } catch (err) {
              console.error('❌ Erreur intégration police:', font.display_name, err);
              return `    @font-face {
      font-family: '${font.display_name}';
      src: url('${font.font_url}') format('${font.format}');
    }`;
            }
          }));
          
          const fontFacesText = fontFaces.join('\n');
          
          // Insérer les @font-face dans le <defs> ou avant le premier <style>
          // Vérifier d'abord si <defs> existe déjà
          if (svgText.includes('<defs>')) {
            // Si <defs> existe, vérifier s'il contient déjà un <style>
            if (svgText.match(/<defs>[\s\S]*?<style/)) {
              // Insérer avant le premier <style> dans <defs>
              svgText = svgText.replace(/(<defs>[\s\S]*?)(<style)/, `$1  <style type="text/css">\n${fontFacesText}\n  </style>\n$2`);
            } else {
              // Ajouter le style dans <defs>
              svgText = svgText.replace('<defs>', `<defs>\n  <style type="text/css">\n${fontFacesText}\n  </style>`);
            }
          } else if (svgText.includes('<style')) {
            // Si <style> existe mais pas <defs>, créer <defs> avant
            svgText = svgText.replace('<style', `<defs>\n  <style type="text/css">\n${fontFacesText}\n  </style>\n</defs>\n<style`);
          } else {
            // Ajouter après l'ouverture du svg
            svgText = svgText.replace(/<svg([^>]*)>/, `<svg$1>\n  <defs>\n    <style type="text/css">\n${fontFacesText}\n    </style>\n  </defs>`);
          }
          
          console.log('✅ @font-face insérés dans le SVG');
          
          console.log('✅ Polices intégrées dans le SVG (base64)');
        }
      } catch (err) {
        console.error('❌ Erreur récupération polices:', err);
      }
    }

    // 4. Ajouter les textes convertis en chemins vectoriels
    if (texts.length > 0) {
      console.log(`📝 ${texts.length} texte(s) à convertir en chemins vectoriels`);
      const textElements = await Promise.all(texts.map(async (text, index) => {
        const x = text.position[0] * 4096;
        const y = text.position[1] * 4096;
        const fontSize = text.fontSize * 4096;
        const fontFamily = text.fontFamily || 'Arial';
        const color = text.color || '#000000';
        const strokeColor = text.strokeColor || '';
        const strokeWidth = text.strokeWidth || 0;
        const rotation = text.rotation || 0;
        
        console.log(`📝 Texte ${index + 1}/${texts.length}: "${text.content}", police: ${fontFamily}, couleur: ${color}, position: (${x}, ${y}), taille: ${fontSize}`);
        
        try {
          // Récupérer la police depuis Supabase si elle existe
          const { data: fontData } = await supabase
            .from('fonts')
            .select('font_url, format')
            .eq('display_name', fontFamily)
            .eq('active', true)
            .single();
          
          console.log('🔍 Police recherchée:', fontFamily, 'trouvée:', !!fontData);
          
          if (fontData && fontData.font_url) {
            console.log('📝 Téléchargement police:', fontData.font_url);
            
            // Télécharger la police
            const fontResponse = await fetch(fontData.font_url);
            const fontBuffer = await fontResponse.arrayBuffer();
            
            console.log('✅ Police téléchargée, parsing avec opentype...');
            
            // Charger la police avec opentype (passer directement l'ArrayBuffer)
            const font = opentype.parse(fontBuffer);
            
            console.log('✅ Police parsée, génération du chemin pour:', text.content);
            
            // Générer le chemin SVG pour le texte
            // Centrer le texte: x à -textWidth/2 pour centrer horizontalement
            const bbox = font.getPath(text.content, 0, 0, fontSize).getBoundingBox();
            const textWidth = bbox.x2 - bbox.x1;
            
            // Générer le chemin centré horizontalement, avec baseline à y=0
            const path = font.getPath(text.content, -textWidth/2, 0, fontSize);
            console.log('🔍 SVG généré par opentype:', path.toSVG());
            let pathData = path.toSVG();
            // Extraire le 'd' depuis le chemin SVG
            const dMatch = pathData.match(/ d="([^"]+)"/);
            if (dMatch) {
              pathData = dMatch[1];
            } else {
              console.error('❌ Impossible d\'extraire le chemin d du SVG:', pathData);
              throw new Error('Chemin SVG vide');
            }
            
            console.log('✅ Chemin généré:', pathData.substring(0, 50), '...');
            
            // Transformation simple: juste translation à la position x,y
            let transform = `translate(${x}, ${y})`;
            if (rotation) {
              transform += ` rotate(${rotation})`;
            }
            
            const hasStroke = strokeWidth > 0 && strokeColor;
            
            if (hasStroke) {
              // Dessiner le contour d'abord, puis le remplissage par-dessus
              return `    <!-- Contour -->\n    <g transform="${transform}"><path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth * 2000}" fill="none" stroke-linejoin="round" stroke-linecap="round" /></g>\n    <!-- Remplissage -->\n    <g transform="${transform}"><path d="${pathData}" fill="${color}" /></g>`;
            } else {
              // Juste le remplissage
              return `    <g transform="${transform}"><path d="${pathData}" fill="${color}" /></g>`;
            }
          } else {
            // Fallback sur du texte normal si la police n'est pas trouvée
            console.warn('⚠️ Police non trouvée:', fontFamily, 'utilisation du texte normal');
            const rotationTransform = rotation ? ` transform="rotate(${rotation} ${x} ${y})"` : '';
            const hasStroke = strokeWidth > 0 && strokeColor;
            const commonAttrs = `x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle"${rotationTransform}`;
            
            if (hasStroke) {
              return `    <!-- Contour -->\n    <text ${commonAttrs} stroke="${strokeColor}" stroke-width="${strokeWidth * 2000}" fill="none" stroke-linejoin="round" stroke-linecap="round">${text.content}</text>\n    <!-- Remplissage -->\n    <text ${commonAttrs} fill="${color}" stroke="none">${text.content}</text>`;
            } else {
              return `    <text ${commonAttrs} fill="${color}">${text.content}</text>`;
            }
          }
        } catch (err) {
          console.error('❌ Erreur conversion texte en chemin:', err);
          console.error('Stack:', err instanceof Error ? err.stack : 'no stack');
          // Fallback sur du texte normal
          const rotationTransform = rotation ? ` transform="rotate(${rotation} ${x} ${y})"` : '';
          const commonAttrs = `x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle"${rotationTransform}`;
          return `    <text ${commonAttrs} fill="${color}">${text.content}</text>`;
        }
      }));
      
      // Insérer à la fin SANS clip-path
      svgText = svgText.replace('</svg>', `
  <!-- Textes vectorisés (Polices: ${[...new Set(texts.map(t => t.fontFamily))].join(', ')}) -->
  <g id="texts" clip-path="none" style="clip-path: none;">
${textElements.join('\n')}
  </g>
</svg>`);
      console.log('✅ Textes convertis en chemins vectoriels:', texts.length);
    }

    // 5. Ajouter les logos
    const logos: any[] = configData.logos || [];
    console.log('🖼️ Logos dans config:', logos.length, logos);
    if (logos.length > 0) {
      const logoElements = [];
      
      for (const logo of logos) {
        try {
          console.log('🖼️ Traitement logo:', logo);
          let logoUrl = logo.variantFile;
          let logoSVG = '';
          
          console.log('📦 Type de logo:', logoUrl?.substring(0, 50));
          
          // Si c'est une URL (Supabase ou autre), récupérer le contenu
          if (logoUrl && !logoUrl.startsWith('data:')) {
            console.log('🌐 Logo URL:', logoUrl);
            
            // Si l'URL contient '.png', '.jpg', '.jpeg' -> c'est une image
            if (/\.(png|jpg|jpeg)$/i.test(logoUrl)) {
              console.log('🖼️ Type: IMAGE PNG/JPG');
              console.log('🖼️ Logo image détecté depuis URL');
              
              // Récupérer l'image et la convertir en data URL base64 pour l'intégrer
              try {
                const imageResponse = await fetch(logoUrl);
                const imageBlob = await imageResponse.blob();
                const arrayBuffer = await imageBlob.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const mimeType = imageBlob.type || 'image/png';
                const dataUrl = `data:${mimeType};base64,${base64}`;
                
                const x = logo.position[0] * 4096;
                const y = logo.position[1] * 4096;
                const logoWidth = logo.width || 100;
                const logoHeight = logo.height || 100;
                const scale = logo.scale || 1;
                const rotation = logo.rotation || 0;
                const rotationTransform = rotation ? ` rotate(${rotation} ${x} ${y})` : '';
                
                // Utiliser la data URL dans le SVG (intégrée) avec xlink:href pour Illustrator
                logoElements.push(`    <g transform="translate(${x}, ${y})${rotationTransform}">
      <image x="${-logoWidth * scale/2}" y="${-logoHeight * scale/2}" width="${logoWidth * scale}" height="${logoHeight * scale}" xlink:href="${dataUrl}" preserveAspectRatio="xMidYMid meet" />
    </g>`);
                console.log('✅ Image intégrée au SVG avec data URL');
                continue; // Skip le reste du traitement
              } catch (err) {
                console.error('❌ Erreur récupération image:', err);
                continue;
              }
            }
            
            // Sinon récupérer le SVG
            console.log('📦 Type: SVG depuis URL');
            const logoResponse = await fetch(logoUrl);
            if (!logoResponse.ok) {
              console.error('❌ Erreur fetch logo SVG:', logoResponse.status, logoResponse.statusText);
              continue;
            }
            logoSVG = await logoResponse.text();
            console.log('✅ Logo SVG téléchargé, longueur:', logoSVG.length);
          } else if (logoUrl && logoUrl.startsWith('data:')) {
            // Legacy : gérer les anciennes data URLs
            console.log('📦 Logo data URL (legacy)');
            const mimeType = logoUrl.match(/^data:([^;]+)/)?.[1];
            const base64Data = logoUrl.split(',')[1];
            
            // Si c'est une image PNG/JPG (pas SVG), utiliser une balise <image>
            if (mimeType && mimeType.startsWith('image/') && !mimeType.includes('svg')) {
              console.log('🖼️ Logo image (PNG/JPG) depuis data URL');
              const x = logo.position[0] * 4096;
              const y = logo.position[1] * 4096;
              const logoWidth = logo.width || 100;
              const logoHeight = logo.height || 100;
              const scale = logo.scale || 1;
              const rotation = logo.rotation || 0;
              const rotationTransform = rotation ? ` rotate(${rotation} ${x} ${y})` : '';
              
              logoElements.push(`    <g transform="translate(${x}, ${y})${rotationTransform}">
      <image x="${-logoWidth * scale/2}" y="${-logoHeight * scale/2}" width="${logoWidth * scale}" height="${logoHeight * scale}" xlink:href="${logoUrl}" preserveAspectRatio="xMidYMid meet" />
    </g>`);
              console.log('✅ Image ajoutée au SVG depuis data URL');
              continue;
            }
            
            // Sinon c'est un SVG
            try {
              logoSVG = Buffer.from(base64Data, 'base64').toString('utf-8');
              console.log('📦 SVG extrait, longueur:', logoSVG.length);
            } catch (err) {
              console.error('❌ Erreur décodage base64:', err);
              continue;
            }
          }
          
          console.log('📦 Logo SVG brut, longueur:', logoSVG.length);
          console.log('📦 Logo SVG preview:', logoSVG.substring(0, 200));
          
          // Extraire le contenu du SVG
          const beforeCleanup = logoSVG.length;
          logoSVG = logoSVG
            .replace(/<\?xml[^>]*>/g, '')
            .replace(/<!DOCTYPE[^>]*>/g, '')
            .replace(/<svg[^>]*>/, '')
            .replace(/<\/svg>/, '')
            .trim();
          
          console.log('✅ SVG nettoyé, longueur:', logoSVG.length, 'était:', beforeCleanup);
          
          // Supprimer les clipPath
          logoSVG = logoSVG.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
          logoSVG = logoSVG.replace(/clip-path="url\([^)]*\)"/g, '');
          logoSVG = logoSVG.replace(/clipPath="[^"]*"/g, '');
          
          console.log('✅ SVG après suppression clipPath, longueur:', logoSVG.length);
          
          // Extraire le <style> et convertir les classes en attributs inline
          const styleMatch = logoSVG.match(/<style[^>]*>([\s\S]*?)<\/style>/);
          if (styleMatch) {
            const styleContent = styleMatch[1];
            console.log('📄 Style CSS trouvé:', styleContent.substring(0, 200));
            
            // Extraire toutes les règles CSS (ex: .st0 { fill: #fff; })
            const cssRules = styleContent.matchAll(/\.(st\d+|cls-\d+)\s*\{([^}]*)\}/g);
            const colorMap: Record<string, string> = {};
            
            for (const match of cssRules) {
              const className = match[1];
              const properties = match[2];
              
              // Extraire la couleur fill
              const fillMatch = properties.match(/fill:\s*([^;]+);/);
              if (fillMatch) {
                colorMap[className] = fillMatch[1].trim();
              }
            }
            
            console.log('📦 Color map extraite:', colorMap);
            
            // Remplacer class="stX" ou class="cls-X" par fill="color" directement
            for (const [className, color] of Object.entries(colorMap)) {
              const classNameEscaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              logoSVG = logoSVG.replace(
                new RegExp(`class="${classNameEscaped}"`, 'g'),
                `fill="${color}"`
              );
            }
            
          // Retirer le <style> et les <defs> vides
          logoSVG = logoSVG.replace(/<style[^>]*>[\s\S]*?<\/style>/, '');
          logoSVG = logoSVG.replace(/<defs>\s*<\/defs>/g, '');
          
          console.log('✅ Classes CSS converties en attributs inline');
          } else {
            console.log('⚠️ Aucun style CSS trouvé dans le logo');
          }
          
          // Supprimer toutes les classes restantes qui n'ont pas été converties
          logoSVG = logoSVG.replace(/class="[^"]*"/g, '');

          const x = logo.position[0] * 4096;
          const y = logo.position[1] * 4096;
          const scale = logo.scale || 1;
          const rotation = logo.rotation || 0;
          const logoWidth = logo.width || 100;
          const logoHeight = logo.height || 100;

          console.log('🎨 Position logo:', { x, y, scale, rotation, width: logoWidth, height: logoHeight });
          console.log('📦 LogoSVG final (100 premiers chars):', logoSVG.substring(0, 100));
          
          const rotationTransform = rotation ? ` rotate(${rotation})` : '';
          
          // Transformation combinée : translate puis rotate, puis scale
          logoElements.push(`    <g transform="translate(${x - logoWidth/2}, ${y - logoHeight/2})${rotationTransform} scale(${scale})">
      ${logoSVG}
    </g>`);
        } catch (err) {
          console.error('❌ Erreur logo:', err);
        }
      }
      
      // Insérer à la fin SANS clip-path
      svgText = svgText.replace('</svg>', `
  <!-- Logos -->
  <g id="logos" clip-path="none" style="clip-path: none;">
${logoElements.join('\n')}
  </g>
</svg>`);
      console.log('✅ Logos ajoutés:', logos.length);
    }

    console.log('✅ Export SVG terminé');
    
    // Vérification finale avant le retour
    const tertiaryFinalCheck = svgText.match(/\.tertiary\s*\{[^}]+\}/g);
    console.log('🔍 .tertiary CSS FINAL avant retour:', tertiaryFinalCheck);
    
    // Chercher tous les fill= dans le SVG pour tertiary
    const fillMatches = svgText.match(/fill="(#ce0000|#e52421|#5a8c5a|#8aafce|#474747|#bea6ff)"/g);
    console.log('🔍 Tous les fill correspondant aux anciennes couleurs trouvés:', fillMatches?.length || 0);
    if (fillMatches && fillMatches.length > 0) {
      console.log('🔍 Premier 10 fill trouvés:', fillMatches.slice(0, 10));
    }
    
    // Vérifier les couleurs attendues
    console.log('🔍 Couleurs attendues dans le SVG final:');
    console.log('  - primary:', primary);
    console.log('  - secondary:', secondary);
    console.log('  - tertiary:', tertiary);
    
    // Chercher les couleurs attendues
    const primaryMatches = svgText.match(new RegExp(`fill="${primary}"`, 'g'));
    const secondaryMatches = svgText.match(new RegExp(`fill="${secondary}"`, 'g'));
    const tertiaryMatches = svgText.match(new RegExp(`fill="${tertiary}"`, 'g'));
    console.log('🔍 Couleurs attendues présentes:');
    console.log('  - primary (#000000):', primaryMatches?.length || 0, 'occurrences');
    console.log('  - secondary (#87CEFA):', secondaryMatches?.length || 0, 'occurrences');
    console.log('  - tertiary (#e999ff):', tertiaryMatches?.length || 0, 'occurrences');

    return new NextResponse(svgText, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="stretchmx-${configId}.svg"`
      }
    });
  } catch (err) {
    console.error('❌ Erreur:', err);
    return NextResponse.json({ 
      error: 'Export failed',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
