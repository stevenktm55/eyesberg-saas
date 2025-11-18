/**
 * Utilitaire pour générer les UV maps (UV0 et UV2) basées sur la taille sélectionnée
 * 
 * Ce module extrait les pièces depuis un SVG par taille
 * Chaque pièce dans le SVG est nommée avec son masque et contour de découpe
 */

export interface SizePatternPiece {
  id: string; // ID de l'élément dans le SVG (ex: "face-mask-cut")
  name: string; // Nom de la pièce extrait de l'ID (ex: "face")
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cutPath?: string; // Path SVG du tracé de découpe (extrait de l'ID ou de l'élément)
  maskPath?: string; // Path SVG du masque d'écrêtage (extrait de l'ID ou de l'élément)
  element?: string; // Élément SVG complet
  uvZone?: string; // Zone UV correspondante
}

export interface SizePatternFile {
  id: string;
  patternId: string;
  size: string; // Ex: "XS", "S", "M", "L", "XL", "XXL"
  svgUrl: string;
  metadata?: {
    pieces: SizePatternPiece[];
  };
}

export interface SizePatternTemplate {
  id: string;
  model3dId: string;
  name: string;
  uvType: 'UV0' | 'UV2';
  files: SizePatternFile[]; // Un fichier par taille
}

/**
 * Charge un template de patron depuis la base de données
 */
export async function loadSizePatternTemplate(
  model3dId: string,
  uvType: 'UV0' | 'UV2' = 'UV0'
): Promise<SizePatternTemplate | null> {
  try {
    const response = await fetch(
      `/api/size-patterns?model3dId=${model3dId}&uvType=${uvType}`
    );
    
    if (!response.ok) {
      console.error('Failed to load size pattern template');
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading size pattern template:', error);
    return null;
  }
}

/**
 * Charge le fichier SVG pour une taille spécifique
 */
export async function loadSizePatternFile(
  template: SizePatternTemplate,
  size: string
): Promise<SizePatternFile | null> {
  const file = template.files.find(f => f.size === size);
  
  if (!file) {
    console.warn(`No pattern file found for size ${size}`);
    return null;
  }
  
  return file;
}

/**
 * Parse un SVG et extrait les pièces avec leurs masques et contours
 * Les pièces sont identifiées par leur ID dans le SVG (ex: "face-mask-cut")
 */
export async function parseSVGPieces(svgUrl: string): Promise<SizePatternPiece[]> {
  try {
    // Charger le SVG
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    // Parser le SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // Trouver tous les éléments avec des IDs contenant "mask" et "cut"
    const pieces: SizePatternPiece[] = [];
    const allElements = svgElement.querySelectorAll('[id*="mask"], [id*="cut"]');
    
    for (const element of Array.from(allElements)) {
      const id = element.getAttribute('id');
      if (!id) continue;
      
      // Extraire le nom de la pièce depuis l'ID (ex: "face-mask-cut" -> "face")
      const nameMatch = id.match(/^([^-]+)/);
      const name = nameMatch ? nameMatch[1] : id;
      
      // Calculer le bounding box
      const bbox = (element as SVGGraphicsElement).getBBox();
      
      // Extraire les paths (cut et mask)
      let cutPath: string | undefined;
      let maskPath: string | undefined;
      
      // Chercher les éléments enfants avec les paths
      const paths = element.querySelectorAll('path');
      for (const path of Array.from(paths)) {
        const pathId = path.getAttribute('id') || '';
        const d = path.getAttribute('d') || '';
        
        if (pathId.includes('cut') || pathId.includes('contour')) {
          cutPath = d;
        } else if (pathId.includes('mask') || pathId.includes('masque')) {
          maskPath = d;
        }
      }
      
      // Si pas de paths enfants, essayer de trouver dans les groupes
      if (!cutPath || !maskPath) {
        const groups = element.querySelectorAll('g');
        for (const group of Array.from(groups)) {
          const groupId = group.getAttribute('id') || '';
          const paths = group.querySelectorAll('path');
          
          for (const path of Array.from(paths)) {
            const pathId = path.getAttribute('id') || '';
            const d = path.getAttribute('d') || '';
            
            if (pathId.includes('cut') || groupId.includes('cut')) {
              cutPath = d;
            } else if (pathId.includes('mask') || groupId.includes('mask')) {
              maskPath = d;
            }
          }
        }
      }
      
      pieces.push({
        id,
        name,
        bbox: {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        },
        cutPath,
        maskPath,
        element: element.outerHTML,
        uvZone: name,
      });
    }
    
    return pieces;
  } catch (error) {
    console.error('Error parsing SVG pieces:', error);
    return [];
  }
}

/**
 * Extrait les pièces d'une taille spécifique depuis le fichier SVG
 */
export async function extractPiecesForSize(
  template: SizePatternTemplate,
  size: string
): Promise<SizePatternPiece[]> {
  const file = await loadSizePatternFile(template, size);
  
  if (!file) {
    return [];
  }
  
  // Si les métadonnées sont déjà disponibles, les utiliser
  if (file.metadata?.pieces) {
    return file.metadata.pieces;
  }
  
  // Sinon, parser le SVG
  return await parseSVGPieces(file.svgUrl);
}

/**
 * Génère un canvas UV map (4096x4096) pour une taille spécifique
 * avec les designs et logos appliqués dans les masques d'écrêtage
 */
export async function generateUVMapForSize(
  template: SizePatternTemplate,
  size: string,
  designData?: {
    svgUrl?: string;
    colors?: Record<string, string>;
  },
  logoData?: Array<{
    id: string;
    svgUrl: string;
    position: [number, number];
    scale: number;
    rotation: number;
    uvZone: string; // Zone où placer le logo
  }>
): Promise<HTMLCanvasElement> {
  // Créer le canvas de sortie (4096x4096)
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 4096;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }
  
  // Charger le fichier SVG pour cette taille
  const file = await loadSizePatternFile(template, size);
  if (!file) {
    throw new Error(`No pattern file found for size ${size}`);
  }
  
  // Charger le SVG
  const svgImg = await loadSVGImage(file.svgUrl);
  
  // Extraire les pièces depuis le SVG
  const pieces = await extractPiecesForSize(template, size);
  
  // Pour chaque pièce, extraire et appliquer les designs/logos
  for (const piece of pieces) {
    // 1. Créer un canvas pour la pièce
    const pieceCanvas = document.createElement('canvas');
    pieceCanvas.width = piece.bbox.width;
    pieceCanvas.height = piece.bbox.height;
    const pieceCtx = pieceCanvas.getContext('2d');
    
    if (!pieceCtx) continue;
    
    // 2. Dessiner la pièce depuis le SVG (en utilisant le viewBox)
    pieceCtx.drawImage(
      svgImg,
      piece.bbox.x, piece.bbox.y, piece.bbox.width, piece.bbox.height,
      0, 0, piece.bbox.width, piece.bbox.height
    );
    
    // 3. Appliquer le masque d'écrêtage si disponible
    if (piece.maskPath) {
      // Créer un path depuis le SVG mask
      const maskPath = new Path2D(piece.maskPath);
      
      // Utiliser le masque comme clipping path
      pieceCtx.save();
      pieceCtx.clip(maskPath);
      
      // 4. Appliquer le design (UV0) ou les logos (UV2)
      if (template.uvType === 'UV0' && designData) {
        await applyDesignToPiece(pieceCtx, piece, designData);
      } else if (template.uvType === 'UV2' && logoData) {
        await applyLogosToPiece(pieceCtx, piece, logoData);
      }
      
      pieceCtx.restore();
    }
    
    // 5. Dessiner la pièce traitée sur le canvas final
    // Positionner la pièce au centre du canvas
    const centerX = (canvas.width - piece.bbox.width) / 2;
    const centerY = (canvas.height - piece.bbox.height) / 2;
    
    ctx.drawImage(pieceCanvas, centerX, centerY);
  }
  
  return canvas;
}

/**
 * Applique le design (couleurs, motifs) à une pièce
 */
async function applyDesignToPiece(
  ctx: CanvasRenderingContext2D,
  piece: SizePatternPiece,
  designData: {
    svgUrl?: string;
    colors?: Record<string, string>;
  }
): Promise<void> {
  if (!designData.svgUrl) return;
  
  // Charger le SVG du design
  const designImg = await loadSVGImage(designData.svgUrl);
  
  // Appliquer les couleurs si nécessaire
  // (cela dépend de comment les designs sont structurés)
  
  // Dessiner le design sur la pièce (à la taille de la pièce)
  ctx.drawImage(designImg, 0, 0, piece.bbox.width, piece.bbox.height);
}

/**
 * Applique les logos à une pièce
 */
async function applyLogosToPiece(
  ctx: CanvasRenderingContext2D,
  piece: SizePatternPiece,
  logos: Array<{
    id: string;
    svgUrl: string;
    position: [number, number];
    scale: number;
    rotation: number;
    uvZone: string;
  }>
): Promise<void> {
  // Filtrer les logos pour cette zone UV
  const logosForZone = logos.filter(logo => logo.uvZone === piece.name || logo.uvZone === piece.uvZone);
  
  for (const logo of logosForZone) {
    // Charger le logo
    const logoImg = await loadSVGImage(logo.svgUrl);
    
    // Calculer la position dans le contexte de la pièce
    const logoX = logo.position[0] * piece.bbox.width;
    const logoY = logo.position[1] * piece.bbox.height;
    const logoWidth = logoImg.width * logo.scale;
    const logoHeight = logoImg.height * logo.scale;
    
    // Appliquer la rotation et le scale
    ctx.save();
    ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2);
    ctx.rotate(logo.rotation);
    ctx.scale(logo.scale, logo.scale);
    
    // Dessiner le logo
    ctx.drawImage(
      logoImg,
      -logoWidth / 2,
      -logoHeight / 2,
      logoWidth,
      logoHeight
    );
    
    ctx.restore();
  }
}

/**
 * Helper pour charger une image
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Helper pour charger un SVG comme image
 */
function loadSVGImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convertit un canvas en blob (pour upload)
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Génère les URLs des UV maps générées
 */
export async function generateUVMapUrls(
  model3dId: string,
  size: string,
  configData: {
    design?: { svgUrl?: string; colors?: Record<string, string> };
    logos?: Array<{
      id: string;
      svgUrl: string;
      position: [number, number];
      scale: number;
      rotation: number;
      uvZone: string;
    }>;
  }
): Promise<{ uv0Url: string | null; uv2Url: string | null }> {
  // Charger les templates UV0 et UV2
  const templateUV0 = await loadSizePatternTemplate(model3dId, 'UV0');
  const templateUV2 = await loadSizePatternTemplate(model3dId, 'UV2');
  
  let uv0Url: string | null = null;
  let uv2Url: string | null = null;
  
  // Générer UV0 (design)
  if (templateUV0 && configData.design) {
    const uv0Canvas = await generateUVMapForSize(
      templateUV0,
      size,
      configData.design,
      undefined
    );
    
    const uv0Blob = await canvasToBlob(uv0Canvas);
    uv0Url = await uploadUVMap(uv0Blob, model3dId, size, 'UV0');
  }
  
  // Générer UV2 (logos)
  if (templateUV2 && configData.logos && configData.logos.length > 0) {
    const uv2Canvas = await generateUVMapForSize(
      templateUV2,
      size,
      undefined,
      configData.logos
    );
    
    const uv2Blob = await canvasToBlob(uv2Canvas);
    uv2Url = await uploadUVMap(uv2Blob, model3dId, size, 'UV2');
  }
  
  return { uv0Url, uv2Url };
}

/**
 * Upload un UV map généré vers le storage
 */
async function uploadUVMap(
  blob: Blob,
  model3dId: string,
  size: string,
  uvType: 'UV0' | 'UV2'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, `uv-${uvType}-${size}-${Date.now()}.png`);
  formData.append('model3dId', model3dId);
  formData.append('size', size);
  formData.append('uvType', uvType);
  
  const response = await fetch('/api/size-patterns/upload-uv', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload UV map');
  }
  
  const data = await response.json();
  return data.url;
}

