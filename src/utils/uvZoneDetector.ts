/**
 * Détecteur de zones UV basé sur une zone map (SVG avec couleurs)
 */

export interface UVZoneMap {
  face: string;      // #FF0000
  dos: string;       // #00FF00
  col: string;       // #0000FF
  mancheG: string;   // #FFFF00
  mancheD: string;   // #FF00FF
}

export const ZONE_COLORS: UVZoneMap = {
  face: '#FF0000',      // Rouge
  dos: '#00FF00',       // Vert
  col: '#0000FF',       // Bleu
  mancheG: '#FFFF00',   // Jaune
  mancheD: '#FF00FF',   // Magenta
};

export type ZoneName = 'face' | 'dos' | 'col' | 'mancheG' | 'mancheD' | 'unknown';

/**
 * Charger la zone map et créer un canvas pour la lecture de pixels
 */
export async function loadZoneMap(svgUrl: string): Promise<HTMLCanvasElement | null> {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    // Créer une image depuis le SVG
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Créer un canvas pour pouvoir lire les pixels
        const canvas = document.createElement('canvas');
        canvas.width = 512;  // Résolution suffisante pour la détection
        canvas.height = 512;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte 2D'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, 512, 512);
        URL.revokeObjectURL(url);
        
        console.log('✅ Zone map chargée:', svgUrl);
        resolve(canvas);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Erreur lors du chargement de la zone map'));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la zone map:', error);
    return null;
  }
}

/**
 * Déterminer la zone à partir des coordonnées UV
 */
export function detectZone(
  uv: [number, number], 
  zoneMapCanvas: HTMLCanvasElement
): ZoneName {
  const ctx = zoneMapCanvas.getContext('2d');
  if (!ctx) return 'unknown';
  
  // Convertir UV (0-1) en coordonnées canvas
  const x = Math.floor(uv[0] * zoneMapCanvas.width);
  const y = Math.floor(uv[1] * zoneMapCanvas.height);
  
  // Lire la couleur du pixel
  const pixelData = ctx.getImageData(x, y, 1, 1).data;
  const r = pixelData[0];
  const g = pixelData[1];
  const b = pixelData[2];
  
  // Convertir en hex
  const colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  
  console.log('🎨 Couleur détectée:', colorHex, 'aux UV:', uv);
  
  // Détecter la zone (avec tolérance)
  const tolerance = 30; // Tolérance pour les variations de couleur
  
  if (colorMatches(r, g, b, 255, 0, 0, tolerance)) return 'face';      // Rouge
  if (colorMatches(r, g, b, 0, 255, 0, tolerance)) return 'dos';       // Vert
  if (colorMatches(r, g, b, 0, 0, 255, tolerance)) return 'col';       // Bleu
  if (colorMatches(r, g, b, 255, 255, 0, tolerance)) return 'mancheG'; // Jaune
  if (colorMatches(r, g, b, 255, 0, 255, tolerance)) return 'mancheD'; // Magenta
  
  return 'unknown';
}

/**
 * Vérifier si deux couleurs correspondent (avec tolérance)
 */
function colorMatches(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  tolerance: number
): boolean {
  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance
  );
}

/**
 * Obtenir le nom lisible de la zone
 */
export function getZoneDisplayName(zone: ZoneName): string {
  const names: Record<ZoneName, string> = {
    face: 'Face',
    dos: 'Dos',
    col: 'Col',
    mancheG: 'Manche Gauche',
    mancheD: 'Manche Droite',
    unknown: 'Zone inconnue',
  };
  return names[zone];
}











