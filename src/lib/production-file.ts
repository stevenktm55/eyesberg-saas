// =====================================================
// PRODUCTION FILE SERVICE
// =====================================================
// Service pour générer les fichiers SVG d'impression (Sublimation)
// en injectant un design utilisateur dans un template de patron
// =====================================================

import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface ColorConfig {
  primary: string;
  secondary: string;
  [key: string]: string; // Permet d'autres couleurs
}

export interface ProductionFileParams {
  size: string;
  userDesignSvg: string;
  colorConfig: ColorConfig;
}

export interface ProductionFileResult {
  success: boolean;
  svg?: string;
  error?: string;
}

/**
 * Convertit une couleur HEX en CMYK pour l'impression
 * @param hex - Couleur hexadécimale (ex: #FF0000)
 * @returns Couleur CMYK (ex: cmyk(0%, 100%, 100%, 0%))
 */
function hexToCmyk(hex: string): string {
  // Retirer le # si présent
  hex = hex.replace('#', '');
  
  // Convertir en RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Convertir RGB en CMYK
  const k = 1 - Math.max(r, g, b);
  const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
  const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
  const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
  
  // Convertir en pourcentages
  const cPercent = Math.round(c * 100);
  const mPercent = Math.round(m * 100);
  const yPercent = Math.round(y * 100);
  const kPercent = Math.round(k * 100);
  
  return `cmyk(${cPercent}%, ${mPercent}%, ${yPercent}%, ${kPercent}%)`;
}

/**
 * Extrait le viewBox d'un SVG
 * @param svgContent - Contenu XML du SVG
 * @returns viewBox string ou null
 */
function extractViewBox(svgContent: string): string | null {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    return viewBoxMatch[1];
  }
  
  // Si pas de viewBox, essayer d'extraire width et height
  const widthMatch = svgContent.match(/width=["']([^"']+)["']/i);
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/i);
  
  if (widthMatch && heightMatch) {
    const width = widthMatch[1].replace(/[^0-9.]/g, '');
    const height = heightMatch[1].replace(/[^0-9.]/g, '');
    return `0 0 ${width} ${height}`;
  }
  
  return null;
}

/**
 * Charge un template SVG depuis le disque ou Supabase Storage
 * @param size - Taille du template (S, M, L, XL, etc.)
 * @returns Contenu du template SVG
 */
async function loadTemplate(size: string): Promise<string> {
  // Essayer d'abord depuis le disque local (public/templates/)
  const localPath = path.join(process.cwd(), 'public', 'templates', `template_${size}.svg`);
  
  if (fs.existsSync(localPath)) {
    console.log(`✅ Template trouvé localement: ${localPath}`);
    return fs.readFileSync(localPath, 'utf-8');
  }
  
  // Essayer depuis Supabase Storage
  try {
    const { data, error } = await supabase.storage
      .from('models-3D') // Ou un bucket dédié aux templates
      .download(`templates/template_${size}.svg`);
    
    if (!error && data) {
      console.log(`✅ Template téléchargé depuis Supabase Storage`);
      return await data.text();
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors du téléchargement depuis Supabase:`, error);
  }
  
  throw new Error(`Template template_${size}.svg introuvable (ni local, ni Supabase)`);
}

/**
 * Prépare le design utilisateur dans un pattern SVG
 * @param userDesignSvg - Contenu XML du SVG design
 * @returns Pattern SVG prêt à être injecté
 */
function prepareDesignPattern(userDesignSvg: string): string {
  // Extraire le viewBox du design
  const viewBox = extractViewBox(userDesignSvg);
  
  // Extraire le contenu interne du SVG (sans les balises <svg>)
  // On cherche tout ce qui est entre <svg...> et </svg>
  // Gérer les cas avec ou sans namespace
  let innerContent = userDesignSvg;
  
  // Essayer d'extraire le contenu entre les balises <svg> et </svg>
  const svgContentMatch = userDesignSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (svgContentMatch && svgContentMatch[1]) {
    innerContent = svgContentMatch[1].trim();
  } else {
    // Si pas de balises <svg>, utiliser le contenu tel quel
    innerContent = userDesignSvg.trim();
  }
  
  // Nettoyer les commentaires XML si présents (optionnel, mais peut aider)
  innerContent = innerContent.replace(/<!--[\s\S]*?-->/g, '');
  
  // Créer le pattern avec viewBox préservé
  let pattern = `<pattern id="userDesignPattern" patternUnits="userSpaceOnUse" width="100%" height="100%"`;
  
  if (viewBox) {
    pattern += ` viewBox="${viewBox}"`;
  }
  
  pattern += `>\n`;
  pattern += `  ${innerContent}\n`;
  pattern += `</pattern>`;
  
  return pattern;
}

/**
 * Crée le bloc CSS pour les couleurs
 * @param colorConfig - Configuration des couleurs
 * @returns Bloc <style> CSS
 */
function createColorStyle(colorConfig: ColorConfig): string {
  let css = `<style type="text/css">\n`;
  css += `  <![CDATA[\n`;
  
  // Convertir chaque couleur en CMYK
  Object.entries(colorConfig).forEach(([key, hexColor]) => {
    const cmykColor = hexToCmyk(hexColor);
    // Les classes dans le design utilisent .primary, .secondary, etc.
    css += `    .${key} { fill: ${cmykColor}; }\n`;
    css += `    .${key} * { fill: ${cmykColor}; }\n`; // Pour les éléments enfants
  });
  
  css += `  ]]>\n`;
  css += `</style>`;
  
  return css;
}

/**
 * Injecte le pattern et le style dans le template
 * @param templateSvg - Contenu XML du template
 * @param pattern - Pattern SVG du design
 * @param style - Bloc CSS des couleurs
 * @returns SVG final assemblé
 */
function injectIntoTemplate(templateSvg: string, pattern: string, style: string): string {
  let result = templateSvg;
  
  // Trouver ou créer la section <defs>
  const defsMatch = result.match(/<defs[^>]*>([\s\S]*?)<\/defs>/i);
  
  if (defsMatch) {
    // <defs> existe, ajouter le pattern et le style dedans
    const existingDefsContent = defsMatch[1];
    const newDefsContent = `${existingDefsContent}\n  ${pattern}\n  ${style}`;
    result = result.replace(/<defs[^>]*>[\s\S]*?<\/defs>/i, `<defs>\n  ${newDefsContent}\n</defs>`);
  } else {
    // Pas de <defs>, créer une section <defs> après l'ouverture du <svg>
    const svgOpenMatch = result.match(/<svg[^>]*>/);
    if (svgOpenMatch) {
      const svgOpen = svgOpenMatch[0];
      result = result.replace(svgOpen, `${svgOpen}\n<defs>\n  ${pattern}\n  ${style}\n</defs>`);
    } else {
      // Fallback: ajouter au début du contenu
      result = `<defs>\n  ${pattern}\n  ${style}\n</defs>\n${result}`;
    }
  }
  
  return result;
}

/**
 * Service principal: Génère un fichier SVG de production
 * @param params - Paramètres de génération
 * @returns Résultat avec le SVG final ou une erreur
 */
export async function generateProductionFile(
  params: ProductionFileParams
): Promise<ProductionFileResult> {
  try {
    const { size, userDesignSvg, colorConfig } = params;
    
    // Validation des paramètres
    if (!size || !userDesignSvg || !colorConfig) {
      return {
        success: false,
        error: 'Paramètres manquants: size, userDesignSvg et colorConfig sont requis'
      };
    }
    
    if (!colorConfig.primary || !colorConfig.secondary) {
      return {
        success: false,
        error: 'colorConfig doit contenir au moins primary et secondary'
      };
    }
    
    console.log(`🔄 Génération fichier production - Taille: ${size}`);
    
    // 1. Charger le template
    const templateSvg = await loadTemplate(size);
    console.log(`✅ Template chargé (${templateSvg.length} caractères)`);
    
    // 2. Préparer le design dans un pattern
    const pattern = prepareDesignPattern(userDesignSvg);
    console.log(`✅ Pattern créé`);
    
    // 3. Créer le style CSS pour les couleurs
    const style = createColorStyle(colorConfig);
    console.log(`✅ Style CSS créé`);
    
    // 4. Injecter dans le template
    const finalSvg = injectIntoTemplate(templateSvg, pattern, style);
    console.log(`✅ SVG final assemblé (${finalSvg.length} caractères)`);
    
    return {
      success: true,
      svg: finalSvg
    };
    
  } catch (error) {
    console.error('❌ Erreur génération fichier production:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
