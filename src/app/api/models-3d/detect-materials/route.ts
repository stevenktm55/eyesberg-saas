import { NextRequest, NextResponse } from 'next/server';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * POST /api/models-3d/detect-materials
 * Détecte les matériaux présents dans un fichier GLB/GLTF
 * 
 * Note: Pour une détection complète, il faudrait parser le fichier GLB/GLTF
 * Pour l'instant, on retourne des matériaux par défaut basés sur les parties communes
 */
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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Vérifier que c'est un fichier GLB/GLTF
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
      return NextResponse.json(
        { error: 'File must be a GLB or GLTF file' },
        { status: 400 }
      );
    }

    // TODO: Parser le fichier GLB/GLTF pour extraire les matériaux réels
    // Pour l'instant, on retourne des matériaux par défaut basés sur les parties communes d'un vêtement
    
    // Matériaux par défaut pour un modèle textile
    const defaultMaterials: Array<{ name: string; index: number }> = [
      { name: 'Front', index: 0 },
      { name: 'Back', index: 1 },
      { name: 'Sleeves', index: 2 },
      { name: 'Collar', index: 3 },
    ];

    // Dans le futur, on pourrait parser le GLB pour extraire les vrais matériaux :
    // 1. Lire le fichier GLB (format binaire)
    // 2. Extraire le JSON du GLTF
    // 3. Parcourir les meshes et leurs materials
    // 4. Retourner la liste des matériaux avec leurs noms

    return NextResponse.json({
      materials: defaultMaterials,
      message: 'Materials detected (using default materials for now)',
    });
  } catch (error: any) {
    console.error('Error detecting materials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect materials' },
      { status: 500 }
    );
  }
}

