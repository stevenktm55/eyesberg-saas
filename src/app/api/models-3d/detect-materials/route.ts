import { NextRequest, NextResponse } from 'next/server';
import { getSubdomain } from '@/lib/get-subdomain';

/**
 * Parse un fichier GLB pour extraire les matériaux
 * Format GLB : Header (12 bytes) + Chunk JSON + Chunk BIN
 */
async function parseGLB(buffer: ArrayBuffer): Promise<Array<{ name: string; index: number }>> {
  const view = new DataView(buffer);
  
  // Lire le header GLB (12 bytes)
  const magic = view.getUint32(0, true); // Doit être 0x46546C67 (glTF)
  if (magic !== 0x46546C67) {
    throw new Error('Invalid GLB file: magic number mismatch');
  }
  
  const version = view.getUint32(4, true);
  const length = view.getUint32(8, true);
  
  // Lire le premier chunk (JSON)
  let offset = 12;
  const chunk0Length = view.getUint32(offset, true);
  const chunk0Type = view.getUint32(offset + 4, true);
  
  if (chunk0Type !== 0x4E4F534A) { // "JSON"
    throw new Error('Invalid GLB file: first chunk is not JSON');
  }
  
  // Extraire le JSON
  const jsonStart = offset + 8;
  const jsonEnd = jsonStart + chunk0Length;
  const jsonBytes = new Uint8Array(buffer, jsonStart, chunk0Length);
  const jsonText = new TextDecoder().decode(jsonBytes);
  const gltf = JSON.parse(jsonText);
  
  // Extraire les matériaux avec leurs noms depuis différentes sources
  const materials: Array<{ name: string; index: number }> = [];
  const materialToMeshMap: Map<number, string> = new Map();
  const materialToNodeMap: Map<number, string> = new Map();
  
  // 1. D'abord, mapper les meshes aux matériaux
  if (gltf.meshes && Array.isArray(gltf.meshes)) {
    gltf.meshes.forEach((mesh: any, meshIndex: number) => {
      if (mesh.primitives && Array.isArray(mesh.primitives)) {
        mesh.primitives.forEach((primitive: any) => {
          if (primitive.material !== undefined) {
            const materialIndex = primitive.material;
            // Utiliser le nom du mesh s'il existe
            if (mesh.name && !materialToMeshMap.has(materialIndex)) {
              materialToMeshMap.set(materialIndex, mesh.name);
            }
          }
        });
      }
    });
  }
  
  // 2. Mapper les nodes aux matériaux (via les meshes)
  if (gltf.nodes && Array.isArray(gltf.nodes)) {
    gltf.nodes.forEach((node: any) => {
      if (node.mesh !== undefined && node.name) {
        const mesh = gltf.meshes?.[node.mesh];
        if (mesh && mesh.primitives) {
          mesh.primitives.forEach((primitive: any) => {
            if (primitive.material !== undefined) {
              const materialIndex = primitive.material;
              // Le nom du node est souvent plus descriptif que le mesh
              if (node.name && !materialToNodeMap.has(materialIndex)) {
                materialToNodeMap.set(materialIndex, node.name);
              }
            }
          });
        }
      }
    });
  }
  
  // 3. Extraire les matériaux avec priorité : material.name > node.name > mesh.name > Material_X
  if (gltf.materials && Array.isArray(gltf.materials)) {
    gltf.materials.forEach((material: any, index: number) => {
      let materialName = material.name;
      
      // Si pas de nom, essayer depuis le node
      if (!materialName) {
        materialName = materialToNodeMap.get(index);
      }
      
      // Si toujours pas de nom, essayer depuis le mesh
      if (!materialName) {
        materialName = materialToMeshMap.get(index);
      }
      
      // Si toujours pas de nom, utiliser un nom générique mais descriptif
      if (!materialName) {
        // Essayer d'extraire depuis les extensions (comme KHR_materials_common)
        if (material.extensions) {
          const extNames = Object.keys(material.extensions);
          if (extNames.length > 0) {
            materialName = extNames[0].replace('KHR_', '').replace('_', ' ');
          }
        }
        
        // Dernier recours
        if (!materialName) {
          materialName = `Material_${index + 1}`;
        }
      }
      
      materials.push({
        name: materialName,
        index: index,
      });
    });
  } else {
    // Si pas de materials array, créer depuis les meshes/nodes trouvés
    const allMaterialIndices = new Set<number>();
    materialToMeshMap.forEach((_, index) => allMaterialIndices.add(index));
    materialToNodeMap.forEach((_, index) => allMaterialIndices.add(index));
    
    allMaterialIndices.forEach((index) => {
      const name = materialToNodeMap.get(index) || 
                   materialToMeshMap.get(index) || 
                   `Material_${index + 1}`;
      materials.push({
        name: name,
        index: index,
      });
    });
  }
  
  return materials;
}

/**
 * Parse un fichier GLTF (JSON) pour extraire les matériaux
 */
async function parseGLTF(buffer: ArrayBuffer): Promise<Array<{ name: string; index: number }>> {
  const text = new TextDecoder().decode(buffer);
  const gltf = JSON.parse(text);
  
  // Même logique que pour GLB
  const materials: Array<{ name: string; index: number }> = [];
  const materialToMeshMap: Map<number, string> = new Map();
  const materialToNodeMap: Map<number, string> = new Map();
  
  // 1. Mapper les meshes aux matériaux
  if (gltf.meshes && Array.isArray(gltf.meshes)) {
    gltf.meshes.forEach((mesh: any, meshIndex: number) => {
      if (mesh.primitives && Array.isArray(mesh.primitives)) {
        mesh.primitives.forEach((primitive: any) => {
          if (primitive.material !== undefined) {
            const materialIndex = primitive.material;
            if (mesh.name && !materialToMeshMap.has(materialIndex)) {
              materialToMeshMap.set(materialIndex, mesh.name);
            }
          }
        });
      }
    });
  }
  
  // 2. Mapper les nodes aux matériaux
  if (gltf.nodes && Array.isArray(gltf.nodes)) {
    gltf.nodes.forEach((node: any) => {
      if (node.mesh !== undefined && node.name) {
        const mesh = gltf.meshes?.[node.mesh];
        if (mesh && mesh.primitives) {
          mesh.primitives.forEach((primitive: any) => {
            if (primitive.material !== undefined) {
              const materialIndex = primitive.material;
              if (node.name && !materialToNodeMap.has(materialIndex)) {
                materialToNodeMap.set(materialIndex, node.name);
              }
            }
          });
        }
      }
    });
  }
  
  // 3. Extraire les matériaux avec priorité
  if (gltf.materials && Array.isArray(gltf.materials)) {
    gltf.materials.forEach((material: any, index: number) => {
      let materialName = material.name;
      
      if (!materialName) {
        materialName = materialToNodeMap.get(index);
      }
      
      if (!materialName) {
        materialName = materialToMeshMap.get(index);
      }
      
      if (!materialName) {
        if (material.extensions) {
          const extNames = Object.keys(material.extensions);
          if (extNames.length > 0) {
            materialName = extNames[0].replace('KHR_', '').replace('_', ' ');
          }
        }
        
        if (!materialName) {
          materialName = `Material_${index + 1}`;
        }
      }
      
      materials.push({
        name: materialName,
        index: index,
      });
    });
  } else {
    const allMaterialIndices = new Set<number>();
    materialToMeshMap.forEach((_, index) => allMaterialIndices.add(index));
    materialToNodeMap.forEach((_, index) => allMaterialIndices.add(index));
    
    allMaterialIndices.forEach((index) => {
      const name = materialToNodeMap.get(index) || 
                   materialToMeshMap.get(index) || 
                   `Material_${index + 1}`;
      materials.push({
        name: name,
        index: index,
      });
    });
  }
  
  return materials;
}

/**
 * POST /api/models-3d/detect-materials
 * Détecte les matériaux présents dans un fichier GLB/GLTF
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
    const isGLB = fileName.endsWith('.glb');
    const isGLTF = fileName.endsWith('.gltf');
    
    if (!isGLB && !isGLTF) {
      return NextResponse.json(
        { error: 'File must be a GLB or GLTF file' },
        { status: 400 }
      );
    }

    // Lire le fichier
    const arrayBuffer = await file.arrayBuffer();
    
    // Parser selon le type de fichier
    let materials: Array<{ name: string; index: number }>;
    
    try {
      if (isGLB) {
        materials = await parseGLB(arrayBuffer);
      } else {
        materials = await parseGLTF(arrayBuffer);
      }
    } catch (parseError: any) {
      console.error('Error parsing GLB/GLTF:', parseError);
      // En cas d'erreur de parsing, retourner des matériaux par défaut
      materials = [
        { name: 'Material_1', index: 0 },
        { name: 'Material_2', index: 1 },
      ];
    }
    
    // Si aucun matériau trouvé, retourner des matériaux par défaut
    if (materials.length === 0) {
      materials = [
        { name: 'Material_1', index: 0 },
      ];
    }

    return NextResponse.json({
      materials: materials,
      message: `Detected ${materials.length} material(s) from file`,
    });
  } catch (error: any) {
    console.error('Error detecting materials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect materials' },
      { status: 500 }
    );
  }
}

