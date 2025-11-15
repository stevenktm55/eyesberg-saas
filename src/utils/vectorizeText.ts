// =====================================================
// VECTORISATION DE TEXTE AVEC OPENTYPE.JS
// =====================================================
// Convertit les textes SVG en paths vectorisés
// =====================================================
import opentype from 'opentype.js';

interface VectorizedTextOptions {
  text: string;
  fontUrl: string;
  fontSize: number;
  x: number;
  y: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  rotation?: number;
}

/**
 * Charge une police et la met en cache
 */
const fontCache = new Map<string, any>();

async function loadFont(fontUrl: string): Promise<any> {
  if (fontCache.has(fontUrl)) {
    return fontCache.get(fontUrl);
  }

  const response = await fetch(fontUrl);
  const buffer = await response.arrayBuffer();
  const font = opentype.parse(buffer);
  
  fontCache.set(fontUrl, font);
  return font;
}

/**
 * Convertit un texte en path SVG vectorisé
 */
export async function vectorizeText(options: VectorizedTextOptions): Promise<string> {
  try {
    const { text, fontUrl, fontSize, x, y, color, strokeColor, strokeWidth, rotation } = options;

    // Charger la police
    const font = await loadFont(fontUrl);

    // Générer le path pour le texte
    const path = font.getPath(text, 0, 0, fontSize);
    const pathData = path.toPathData(2);

    // Calculer la bbox pour centrer
    const bbox = path.getBoundingBox();
    const textWidth = bbox.x2 - bbox.x1;
    const textHeight = bbox.y2 - bbox.y1;
    
    // Calculer la translation pour centrer le texte
    const translateX = x - textWidth / 2 - bbox.x1;
    const translateY = y - bbox.y1 - textHeight / 2;

    // Construire le SVG
    let svg = '';
    
    const rotationTransform = rotation ? ` transform="rotate(${rotation} ${x} ${y})"` : '';
    
    if (rotationTransform) {
      svg += `<g${rotationTransform}>`;
    }

    svg += `<g transform="translate(${translateX}, ${translateY})">`;

    // Ajouter le path avec stroke si nécessaire
    if (strokeColor && strokeWidth && strokeWidth > 0) {
      svg += `
      <path d="${pathData}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth * 2000}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/>`;
    } else {
      svg += `
      <path d="${pathData}" fill="${color}"/>`;
    }

    svg += `</g>`;

    if (rotationTransform) {
      svg += `</g>`;
    }

    return svg;
  } catch (err) {
    console.error('❌ Erreur vectorisation:', err);
    // Fallback: texte normal
    const rotationTransform = rotation ? ` transform="rotate(${rotation} ${x} ${y})"` : '';
    return `<text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" fill="${color}"${rotationTransform}>${text}</text>`;
  }
}

/**
 * Génère un SVG complet avec tous les textes vectorisés
 */
export async function generateVectorizedSVG(
  baseSvgText: string,
  texts: any[],
  fonts: any[],
  logos: any[]
): Promise<string> {
  let svg = baseSvgText;

  // Vectoriser tous les textes
  if (texts.length > 0) {
    const textElements = [];
    
    for (const text of texts) {
      const x = text.position[0] * 4096;
      const y = text.position[1] * 4096;
      const fontSize = text.fontSize * 4096;
      
      // Trouver la police
      const font = fonts.find(f => f.name === text.fontFamily);
      
      if (font && font.fontUrl) {
        const vectorized = await vectorizeText({
          text: text.content,
          fontUrl: font.fontUrl,
          fontSize,
          x,
          y,
          color: text.color,
          strokeColor: text.strokeColor,
          strokeWidth: text.strokeWidth,
          rotation: text.rotation
        });
        
        textElements.push(vectorized);
      } else {
        // Fallback
        const rotationTransform = text.rotation ? ` transform="rotate(${text.rotation} ${x} ${y})"` : '';
        textElements.push(`<text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" fill="${text.color}"${rotationTransform}>${text.content}</text>`);
      }
    }
    
    svg = svg.replace('</svg>', `
  <!-- Textes vectorisés -->
  <g id="texts">
${textElements.join('\n')}
  </g>
</svg>`);
  }

  // Ajouter les logos
  if (logos.length > 0) {
    const logoElements = [];
    
    for (const logo of logos) {
      try {
        const logoResponse = await fetch(logo.variantFile);
        let logoSVG = await logoResponse.text();
        
        logoSVG = logoSVG
          .replace(/<\?xml[^>]*>/g, '')
          .replace(/<!DOCTYPE[^>]*>/g, '')
          .replace(/<svg[^>]*>/, '')
          .replace(/<\/svg>/, '')
          .trim();

        const x = logo.position[0] * 4096;
        const y = logo.position[1] * 4096;
        const scale = logo.scale || 1;
        const rotation = logo.rotation || 0;
        const logoWidth = logo.width || 100;
        const logoHeight = logo.height || 100;

        const rotationTransform = rotation ? ` rotate(${rotation} ${x} ${y})` : '';
        
        logoElements.push(`
    <g transform="translate(${x - (logoWidth * scale)/2}, ${y - (logoHeight * scale)/2})${rotationTransform}">
      <g transform="scale(${scale})">
${logoSVG}
      </g>
    </g>`);
      } catch (err) {
        console.error('❌ Erreur logo:', err);
      }
    }
    
    svg = svg.replace('</svg>', `
  <!-- Logos -->
  <g id="logos">
${logoElements.join('\n')}
  </g>
</svg>`);
  }

  return svg;
}


