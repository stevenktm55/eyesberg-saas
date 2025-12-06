// =====================================================
// API MODELS - VERSION SUPABASE
// =====================================================
import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getSubdomain } from '@/lib/get-subdomain';

export const runtime = "nodejs";

// =====================================================
// OPTIONS - CORS preflight
// =====================================================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// =====================================================
// GET - Récupérer tous les modèles
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopDomain = searchParams.get('shop');

    // Récupérer le subdomain depuis product_builder si shopDomain est fourni
    let subdomain: string | null = null;
    
    if (shopDomain) {
      try {
        const { data: product } = await supabaseAdmin
          .from('product_builder')
          .select('subdomain')
          .eq('shop_domain', shopDomain)
          .limit(1)
          .maybeSingle();
        
        if (product?.subdomain) {
          subdomain = product.subdomain;
        }
      } catch (error) {
        console.warn('Could not fetch subdomain from shop_domain for models API:', error);
      }
    }
    
    // Fallback: essayer de récupérer le subdomain depuis les headers/session
    if (!subdomain) {
      subdomain = await getSubdomain(request);
    }

    // Utiliser supabaseAdmin et filtrer par subdomain si disponible
    let query = supabaseAdmin
      .from('models_3d')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    // Filtrer par subdomain si disponible
    if (subdomain) {
      query = query.eq('subdomain', subdomain);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Erreur GET models:', error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Transformer pour garder la compatibilité
    const items = data.map(model => ({
      id: model.id,
      name: model.name,
      glbUrl: model.glb_url,
      textureMaps: model.metadata?.textureMaps || {},
      materialMaps: model.material_maps || {},
      material_maps: model.material_maps || {},
      materialsSchema: model.metadata?.materialsSchema
    }));

    return NextResponse.json(items, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (err) {
    console.error('Erreur GET models:', err);
    return NextResponse.json({ error: "Failed to fetch models" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// =====================================================
// POST - Créer un nouveau modèle
// =====================================================
export async function POST(request: Request) {
	try {
		const form = await request.formData();
		const file = form.get("file") as File | null;
		const providedName = String(form.get("name") ?? "").trim();
		const uvDesign = form.get("uvDesign") as File | null;
    const normalMap = form.get("normalMap") as File | null;
    const roughnessMap = form.get("roughnessMap") as File | null;
    const metalnessMap = form.get("metalnessMap") as File | null;
    const aoMap = form.get("aoMap") as File | null;
    
		if (!file) {
      return NextResponse.json({ error: "File is required" }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    // Upload du fichier GLB
    const { data: glbData, error: glbError } = await supabase.storage
      .from('models-3D')
      .upload(filename, file, { 
        cacheControl: '3600',
        upsert: false
      });

    if (glbError) {
      console.error('Erreur upload GLB:', glbError);
      return NextResponse.json({ error: glbError.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('models-3D')
      .getPublicUrl(glbData.path);

    // Upload des texture maps
    const textureMaps: Record<string, string> = {};
    
    if (normalMap) {
      const normalFilename = `${timestamp}-normal-${normalMap.name}`;
      const { data: normalData, error: normalError } = await supabase.storage
        .from('models-3D')
        .upload(normalFilename, normalMap, { cacheControl: '3600', upsert: false });
      
      if (!normalError && normalData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(normalData.path);
        textureMaps.normalMap = publicUrl;
      }
    }
    
    if (roughnessMap) {
      const roughnessFilename = `${timestamp}-roughness-${roughnessMap.name}`;
      const { data: roughnessData, error: roughnessError } = await supabase.storage
        .from('models-3D')
        .upload(roughnessFilename, roughnessMap, { cacheControl: '3600', upsert: false });
      
      if (!roughnessError && roughnessData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(roughnessData.path);
        textureMaps.roughnessMap = publicUrl;
      }
    }
    
    if (metalnessMap) {
      const metalnessFilename = `${timestamp}-metalness-${metalnessMap.name}`;
      const { data: metalnessData, error: metalnessError } = await supabase.storage
        .from('models-3D')
        .upload(metalnessFilename, metalnessMap, { cacheControl: '3600', upsert: false });
      
      if (!metalnessError && metalnessData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(metalnessData.path);
        textureMaps.metalnessMap = publicUrl;
      }
    }
    
    if (aoMap) {
      const aoFilename = `${timestamp}-ao-${aoMap.name}`;
      const { data: aoData, error: aoError } = await supabase.storage
        .from('models-3D')
        .upload(aoFilename, aoMap, { cacheControl: '3600', upsert: false });
      
      if (!aoError && aoData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(aoData.path);
        textureMaps.aoMap = publicUrl;
      }
    }

    // Créer le modèle dans la base de données
    const { data: newModel, error: dbError } = await supabase
      .from('models_3d')
      .insert({
        name: providedName || file.name.replace(/\.[^/.]+$/, ""),
        glb_url: publicUrl,
        metadata: {
          textureMaps: textureMaps,
          materialsSchema: {}
        },
        material_maps: {
          ...(textureMaps.normalMap ? { normalMap: textureMaps.normalMap } : {}),
          ...(textureMaps.roughnessMap ? { roughnessMap: textureMaps.roughnessMap } : {}),
          ...(textureMaps.metalnessMap ? { metalnessMap: textureMaps.metalnessMap } : {}),
          ...(textureMaps.aoMap ? { aoMap: textureMaps.aoMap } : {})
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erreur création modèle:', dbError);
      return NextResponse.json({ error: dbError.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Transformer pour garder la compatibilité
    const item = {
      id: newModel.id,
      name: newModel.name,
      glbUrl: newModel.glb_url,
      textureMaps: newModel.metadata?.textureMaps || {},
      materialMaps: newModel.material_maps || {},
      material_maps: newModel.material_maps || {},
      materialsSchema: newModel.metadata?.materialsSchema
    };

    return NextResponse.json(item, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (err) {
    console.error('Erreur POST model:', err);
    return NextResponse.json({ error: "creation failed" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// =====================================================
// PUT - Mettre à jour un modèle
// =====================================================
export async function PUT(request: Request) {
  try {
    const form = await request.formData();
    const id = form.get("id") as string;
    const providedName = String(form.get("name") ?? "").trim();
    const file = form.get("file") as File | null;
    const normalMap = form.get("normalMap") as File | null;
    const roughnessMap = form.get("roughnessMap") as File | null;
    const metalnessMap = form.get("metalnessMap") as File | null;
    const aoMap = form.get("aoMap") as File | null;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Récupérer le modèle existant
    const { data: existingModel, error: fetchError } = await supabase
      .from('models_3d')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingModel) {
      return NextResponse.json({ error: "Model not found" }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const timestamp = Date.now();
    let glbUrl = existingModel.glb_url;

    // Upload du nouveau fichier GLB si fourni
    if (file) {
      const glbFilename = `${timestamp}-${file.name}`;
      const { data: glbData, error: glbError } = await supabase.storage
        .from('models-3D')
        .upload(glbFilename, file, { 
          cacheControl: '3600',
          upsert: false
        });

      if (glbError) {
        console.error('Erreur upload GLB:', glbError);
        return NextResponse.json({ error: glbError.message }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('models-3D')
        .getPublicUrl(glbData.path);
      glbUrl = publicUrl;
    }

    // Récupérer les texture maps existantes
    const existingTextureMaps = existingModel.metadata?.textureMaps || {};
    const textureMaps: Record<string, string> = {};
    
    // Upload des nouvelles texture maps
    if (normalMap && normalMap !== "") {
      const normalFilename = `${timestamp}-normal-${normalMap.name}`;
      const { data: normalData, error: normalError } = await supabase.storage
        .from('models-3D')
        .upload(normalFilename, normalMap, { cacheControl: '3600', upsert: false });
      
      if (!normalError && normalData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(normalData.path);
        textureMaps.normalMap = publicUrl;
      }
    }
    
    if (roughnessMap && roughnessMap !== "") {
      const roughnessFilename = `${timestamp}-roughness-${roughnessMap.name}`;
      const { data: roughnessData, error: roughnessError } = await supabase.storage
        .from('models-3D')
        .upload(roughnessFilename, roughnessMap, { cacheControl: '3600', upsert: false });
      
      if (!roughnessError && roughnessData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(roughnessData.path);
        textureMaps.roughnessMap = publicUrl;
      }
    }
    
    if (metalnessMap && metalnessMap !== "") {
      const metalnessFilename = `${timestamp}-metalness-${metalnessMap.name}`;
      const { data: metalnessData, error: metalnessError } = await supabase.storage
        .from('models-3D')
        .upload(metalnessFilename, metalnessMap, { cacheControl: '3600', upsert: false });
      
      if (!metalnessError && metalnessData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(metalnessData.path);
        textureMaps.metalnessMap = publicUrl;
      }
    }
    
    if (aoMap && aoMap !== "") {
      const aoFilename = `${timestamp}-ao-${aoMap.name}`;
      const { data: aoData, error: aoError } = await supabase.storage
        .from('models-3D')
        .upload(aoFilename, aoMap, { cacheControl: '3600', upsert: false });
      
      if (!aoError && aoData) {
        const { data: { publicUrl } } = supabase.storage.from('models-3D').getPublicUrl(aoData.path);
        textureMaps.aoMap = publicUrl;
      }
    }

    // Fusionner avec les texture maps existantes
    const finalTextureMaps = { ...existingTextureMaps, ...textureMaps };

    // Mettre à jour le modèle dans la base de données
    const { data: updatedModel, error: updateError } = await supabase
      .from('models_3d')
      .update({
        name: providedName || existingModel.name,
        glb_url: glbUrl,
        metadata: {
          ...existingModel.metadata,
          textureMaps: finalTextureMaps
        },
        material_maps: {
          ...existingModel.material_maps,
          ...(textureMaps.normalMap ? { normalMap: textureMaps.normalMap } : {}),
          ...(textureMaps.roughnessMap ? { roughnessMap: textureMaps.roughnessMap } : {}),
          ...(textureMaps.metalnessMap ? { metalnessMap: textureMaps.metalnessMap } : {}),
          ...(textureMaps.aoMap ? { aoMap: textureMaps.aoMap } : {})
        }
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur update model:', updateError);
      return NextResponse.json({ error: updateError.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Transformer pour garder la compatibilité
		const item = {
      id: updatedModel.id,
      name: updatedModel.name,
      glbUrl: updatedModel.glb_url,
      textureMaps: updatedModel.metadata?.textureMaps || {},
      materialMaps: updatedModel.material_maps || {},
      material_maps: updatedModel.material_maps || {},
      materialsSchema: updatedModel.metadata?.materialsSchema
    };

    return NextResponse.json(item, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
	} catch (err) {
    console.error('Erreur PUT model:', err);
    return NextResponse.json({ error: "update failed" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// =====================================================
// DELETE - Supprimer un modèle
// =====================================================
export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Soft delete
    const { error } = await supabase
      .from('models_3d')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      console.error('Erreur DELETE model:', error);
      return NextResponse.json({ error: error.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    return NextResponse.json({ ok: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (err) {
    console.error('Erreur DELETE model:', err);
    return NextResponse.json({ error: "delete failed" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}