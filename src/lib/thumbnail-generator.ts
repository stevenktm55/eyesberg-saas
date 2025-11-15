import { supabaseAdmin } from './supabase';

/**
 * Trouve le model_id associé à un design via les product_mappings
 */
export async function findModelIdForDesign(designId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_mappings')
      .select('model_id')
      .contains('design_ids', [designId])
      .maybeSingle();

    if (error) {
      console.error('Erreur lors de la recherche du model_id:', error);
      return null;
    }

    return data?.model_id || null;
  } catch (error) {
    console.error('Erreur lors de la recherche du model_id:', error);
    return null;
  }
}

/**
 * Génère une miniature PNG à partir d'un canvas 3D
 */
export function generateThumbnailFromCanvas(canvas: HTMLCanvasElement, size: number = 512): string {
  // Créer un nouveau canvas pour la miniature
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = size;
  thumbnailCanvas.height = size;
  
  const ctx = thumbnailCanvas.getContext('2d');
  if (!ctx) throw new Error('Impossible de créer le contexte canvas');

  // Dessiner le canvas original redimensionné
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);
  
  // Retourner les données en base64
  return thumbnailCanvas.toDataURL('image/png');
}

/**
 * Convertit une data URL en Blob pour l'upload
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
