// =====================================================
// SERVICE DE GÉNÉRATION DE FICHIERS DE PRODUCTION
// =====================================================
// Fusionne le design utilisateur avec le template de production
// et injecte les couleurs en CMJN
// =====================================================

import { supabaseAdmin } from "@/lib/supabase";

/**
 * Convertit une couleur HEX en CMJN
 * @param hex - Couleur hexadécimale (ex: "#FF0000")
 * @returns Chaîne CMJN (ex: "cmyk(0%, 100%, 100%, 0%)")
 */
function hexToCmyk(hex: string): string {
  // Retirer le # si présent
  hex = hex.replace("#", "");
  
  // Convertir en RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convertir RGB en CMJN
  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

  // Formater en pourcentages
  return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
}

/**
 * Récupère la couleur CMJN depuis une palette de couleurs
 * Si la couleur n'est pas trouvée dans la palette, convertit directement depuis HEX
 */
async function getCmykColor(hex: string, colorName?: string): Promise<string> {
  // TODO: Si vous avez une table de correspondance HEX -> CMJN dans votre DB,
  // vous pouvez la consulter ici. Pour l'instant, on convertit directement.
  
  // Si on a un nom de couleur, on pourrait chercher dans les palettes
  // mais pour l'instant, on fait une conversion directe
  return hexToCmyk(hex);
}

/**
 * Génère un fichier SVG de production en fusionnant :
 * - Le template de production (contenant les formes du patron)
 * - Le design utilisateur (UV Map avec logos et classes de couleurs)
 * - Les couleurs en CMJN
 * 
 * @param productId - ID du produit
 * @param size - Taille (S, M, L, XL, etc.)
 * @param userDesignSvgString - SVG du design utilisateur (UV Map)
 * @param colorConfig - Configuration des couleurs { primary: "#FF0000", secondary: "#00FF00", ... }
 * @returns SVG complet prêt pour la production
 */
export async function generatePrintFile(
  productId: string,
  size: string,
  userDesignSvgString: string,
  colorConfig: Record<string, string>
): Promise<string> {
  try {
    // 1. Récupérer le produit et son template depuis Supabase
    const { data: product, error } = await supabaseAdmin
      .from("shopify_products")
      .select("id, production_templates")
      .eq("id", productId)
      .single();

    if (error || !product) {
      throw new Error(`Product ${productId} not found`);
    }

    const templates = (product.production_templates as Record<string, string>) || {};
    const templateUrl = templates[size];

    if (!templateUrl) {
      throw new Error(`Template for size ${size} not found for product ${productId}`);
    }

    // 2. Charger le template SVG depuis l'URL
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to load template from ${templateUrl}`);
    }
    const templateSvg = await templateResponse.text();

    // 3. Parser le template SVG
    // Extraire les attributs de la balise <svg>
    const svgOpenMatch = templateSvg.match(/<svg([^>]*)>/i);
    if (!svgOpenMatch) {
      throw new Error("Invalid template SVG format: missing <svg> tag");
    }
    const svgAttributes = svgOpenMatch[1];

    // Extraire le contenu entre <svg> et </svg>
    const svgContentMatch = templateSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    if (!svgContentMatch) {
      throw new Error("Invalid template SVG format: missing closing </svg> tag");
    }
    let svgContent = svgContentMatch[1];

    // 4. Extraire le contenu du design utilisateur (sans les balises <svg>)
    let userDesignContent = userDesignSvgString;
    // Retirer les balises <svg> et </svg> si présentes
    userDesignContent = userDesignContent.replace(/<svg[^>]*>/gi, "").replace(/<\/svg>/gi, "").trim();

    // 5. Créer le pattern avec le design utilisateur
    // Le pattern doit avoir les bonnes dimensions pour couvrir toute la zone
    const userDesignPattern = `
      <pattern id="dynamicUserDesign" x="0" y="0" width="1" height="1" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
        ${userDesignContent}
      </pattern>
    `;

    // 6. Générer les styles CSS avec les couleurs CMJN
    const cmykStyles: string[] = [];
    for (const [colorName, hexValue] of Object.entries(colorConfig)) {
      const cmyk = await getCmykColor(hexValue, colorName);
      // Les classes de couleurs dans le SVG utilisent .primary, .secondary, etc.
      cmykStyles.push(`.${colorName} { fill: ${cmyk}; }`);
    }

    const styleBlock = `
      <style type="text/css">
        ${cmykStyles.join("\n        ")}
      </style>
    `;

    // 7. Injecter le pattern et les styles dans les <defs>
    const defsContent = userDesignPattern + "\n      " + styleBlock;
    
    // Chercher si <defs> existe déjà dans le template
    const defsMatch = svgContent.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i);
    
    if (defsMatch) {
      // Si <defs> existe, on ajoute notre contenu dedans
      const existingDefsContent = defsMatch[1];
      const newDefsContent = existingDefsContent + "\n        " + defsContent;
      const newDefs = `<defs>${newDefsContent}\n      </defs>`;
      svgContent = svgContent.replace(/<defs[^>]*>[\s\S]*?<\/defs>/i, newDefs);
    } else {
      // Si pas de <defs>, on en crée un au début du contenu
      const defsBlock = `<defs>\n      ${defsContent}\n    </defs>`;
      svgContent = defsBlock + "\n    " + svgContent;
    }

    // 8. Retourner le SVG complet
    return `<svg${svgAttributes}>\n  ${svgContent}\n</svg>`;
  } catch (error: any) {
    console.error("❌ Erreur generatePrintFile:", error);
    throw new Error(`Failed to generate print file: ${error.message}`);
  }
}
