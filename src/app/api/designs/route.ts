// =====================================================
// API DESIGNS - VERSION SUPABASE
// =====================================================
import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getSubdomain } from "@/lib/subdomain";
import { findModelIdForDesign, generateThumbnailFromCanvas, dataURLToBlob } from "@/lib/thumbnail-generator";

export const runtime = "nodejs";

// Configuration pour les gros fichiers (100MB pour Supabase Pro)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

// =====================================================
// GET - Récupérer tous les designs
// =====================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');
    
    // Essayer d'abord avec la colonne active
    let query = supabaseAdmin
      .from('designs')
      .select(`
        id,
        name,
        svg_url,
        thumbnail_url,
        model_type,
        primary_color,
        secondary_color,
        tertiary_color,
        colors
      `);
    
    // Ne pas filtrer par active pour l'instant (la colonne n'existe peut-être pas)
    // On récupère tous les designs
    query = query.order('created_at', { ascending: false });
    
    let { data, error } = await query;

    // Si erreur, logger les détails et réessayer sans filtre
    if (error) {
      console.error('[API/designs] Erreur première tentative:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    // Si erreur liée à la colonne active ou autre, réessayer sans filtre
    if (error && (error.code === '42703' || error.message?.includes('active') || error.code === '42P01' || error.code === '42501')) {
      console.warn('[API/designs] Erreur avec colonne active, réessai sans filtre');
      const retryQuery = supabaseAdmin
        .from('designs')
        .select(`
          id,
          name,
          svg_url,
          thumbnail_url,
          model_type,
          primary_color,
          secondary_color,
          tertiary_color,
          colors
        `)
        .order('created_at', { ascending: false });
      
      const retryResult = await retryQuery;
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('[API/designs] Erreur Supabase GET designs:', error.message);
      console.error('[API/designs] Error details:', error.details);
      console.error('[API/designs] Error hint:', error.hint);
      console.error('[API/designs] Error code:', error.code);
      
      // Si c'est une erreur de colonne manquante ou de permissions, retourner un tableau vide
      if (error.code === '42P01' || error.code === '42703' || error.code === '42501') {
        console.warn('[API/designs] Erreur de colonne/permissions, retour d\'un tableau vide');
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformer pour garder la même structure que l'ancienne API
    const items = (data || []).map(design => ({
      id: design.id,
      name: design.name,
      svgUrl: design.svg_url,
      thumbUrl: design.thumbnail_url,
      model_type: design.model_type, // Type de modèle (maillot/pantalon)
      primaryColor: design.primary_color, // Legacy pour compatibilité
      secondaryColor: design.secondary_color, // Legacy pour compatibilité
      tertiaryColor: design.tertiary_color, // Legacy pour compatibilité
      colors: design.colors || [] // Nouveau système dynamique (fallback sur array vide)
    }));

	return NextResponse.json(items);
  } catch (err) {
    console.error('Erreur GET designs:', err);
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}

// =====================================================
// POST - Créer un nouveau design
// =====================================================
export async function POST(request: Request) {
	try {
    console.log('🔍 API POST designs - Début');
    
    // Vérifier si c'est une requête JSON (pour create_from_url)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      
      if (body.action === 'create_from_url') {
        console.log('🔍 Création design depuis URL:', body.name);
        
        // Créer le design directement avec l'URL fournie
        const { data: design, error: dbError } = await supabaseAdmin
          .from('designs')
          .insert({
            name: body.name,
            svg_url: body.svgUrl,
            primary_color: body.primaryColor || '#000000',
            secondary_color: body.secondaryColor || '#ffffff',
            tertiary_color: body.tertiaryColor || '#cccccc',
            active: true
          })
          .select()
          .single();
        
        if (dbError) {
          console.error('❌ Erreur création design:', dbError);
          console.error('❌ Détails erreur:', JSON.stringify(dbError, null, 2));
          return NextResponse.json({ error: dbError.message, details: dbError }, { status: 500 });
        }
        
        console.log('✅ Design créé depuis contenu SVG:', design);
        
        // Générer une miniature si fournie
        if (body.thumbnail) {
          try {
            const thumbnailBlob = dataURLToBlob(body.thumbnail);
            const thumbnailFileName = `${design.id}-thumb.png`;
            
            const { error: thumbError } = await supabaseAdmin.storage
              .from('design_thumbs')
              .upload(thumbnailFileName, thumbnailBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/png'
              });
            
            if (thumbError) {
              console.error('❌ Erreur upload miniature:', thumbError);
            } else {
              console.log('✅ Miniature uploadée:', thumbnailFileName);
            }
          } catch (thumbErr) {
            console.error('❌ Erreur traitement miniature:', thumbErr);
          }
        }
        
        return NextResponse.json({
          id: design.id,
          name: design.name,
          colors: [] // Retourner un tableau vide pour colors si non fourni
        }, { status: 201 });
      }
      
      if (body.action === 'create_from_chunks') {
        console.log('🔍 Assemblage des chunks pour:', body.fileName);
        
        // Récupérer les métadonnées
        const metadataFileName = `${body.fileName}.metadata.json`;
        const { data: metadataBlob, error: metadataError } = await supabaseAdmin.storage
          .from('large-designs')
          .download(metadataFileName);
        
        if (metadataError) {
          console.error('❌ Erreur récupération métadonnées:', metadataError);
          return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
        }
        
        const metadata = JSON.parse(await metadataBlob.text());
        console.log('📊 Métadonnées:', metadata);
        
        // Télécharger tous les chunks en parallèle (plus rapide)
        console.log('📥 Téléchargement parallèle des chunks...');
        const chunkPromises = Array.from({ length: metadata.totalChunks }, async (_, i) => {
          const chunkFileName = `${body.fileName}.chunk.${i}`;
          const { data: chunkBlob, error: chunkError } = await supabaseAdmin.storage
            .from('large-designs')
            .download(chunkFileName);
          
          if (chunkError) {
            console.error(`❌ Erreur récupération chunk ${i}:`, chunkError);
            throw new Error(`Chunk ${i} not found`);
          }
          
          console.log(`✅ Chunk ${i} récupéré (${chunkBlob.size} bytes)`);
          return chunkBlob;
        });
        
        const chunks = await Promise.all(chunkPromises);
        console.log('✅ Tous les chunks téléchargés en parallèle');
        
        // Assembler le fichier complet
        const completeFile = new Blob(chunks, { type: 'image/svg+xml' });
        console.log('📊 Fichier assemblé:', completeFile.size, 'bytes');
        
        // Uploader le fichier vers Supabase Storage
        const timestamp = Date.now();
        const cleanName = body.name.replace(/[^a-zA-Z0-9]/g, '_');
        const finalFileName = `${timestamp}-${cleanName}.svg`;
        
        console.log('📤 Upload du fichier vers Supabase Storage:', finalFileName, `(${completeFile.size} bytes)`);
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('designs')
          .upload(finalFileName, completeFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/svg+xml'
          });
        
        if (uploadError) {
          console.error('❌ Erreur upload fichier:', uploadError);
          return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }
        
        console.log('✅ Fichier uploadé:', uploadData.path);
        
        // Créer l'URL publique
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('designs')
          .getPublicUrl(finalFileName);
        
        console.log('✅ URL publique:', publicUrlData.publicUrl);
        
        // Créer le design avec l'URL du fichier
        const insertData: any = {
          name: body.name,
          svg_url: publicUrlData.publicUrl,
          primary_color: body.primaryColor || '#000000',
          secondary_color: body.secondaryColor || '#ffffff',
          tertiary_color: body.tertiaryColor || '#cccccc',
          active: true
        };
        
        // Ajouter les couleurs dynamiques si présentes, sinon utiliser un tableau vide
        if (body.colors && body.colors.length > 0) {
          insertData.colors = body.colors;
        } else {
          insertData.colors = [];
        }
        
        console.log('📝 Données à insérer:', JSON.stringify(insertData, null, 2));
        
        const { data: design, error: dbError } = await supabaseAdmin
          .from('designs')
          .insert(insertData)
          .select()
          .single();
        
        if (dbError) {
          console.error('❌ Erreur création design:', dbError);
          console.error('❌ Détails erreur:', JSON.stringify(dbError, null, 2));
          return NextResponse.json({ error: dbError.message, details: dbError }, { status: 500 });
        }
        
        console.log('✅ Design créé depuis chunks:', design);
        
        // Nettoyer les chunks temporaires en arrière-plan (ne pas bloquer la réponse)
        setTimeout(async () => {
          try {
            const chunksToRemove = Array.from({ length: metadata.totalChunks }, (_, i) => `${body.fileName}.chunk.${i}`);
            chunksToRemove.push(metadataFileName);
            
            await supabaseAdmin.storage
              .from('large-designs')
              .remove(chunksToRemove);
            
            console.log('🧹 Chunks temporaires nettoyés');
          } catch (err) {
            console.error('❌ Erreur nettoyage chunks:', err);
          }
        }, 0);
        
        // Générer une miniature si fournie
        if (body.thumbnail) {
          try {
            const thumbnailBlob = dataURLToBlob(body.thumbnail);
            const thumbnailFileName = `${design.id}-thumb.png`;
            
            const { error: thumbError } = await supabaseAdmin.storage
              .from('design_thumbs')
              .upload(thumbnailFileName, thumbnailBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/png'
              });
            
            if (thumbError) {
              console.error('❌ Erreur upload miniature:', thumbError);
            } else {
              console.log('✅ Miniature uploadée:', thumbnailFileName);
            }
          } catch (thumbErr) {
            console.error('❌ Erreur traitement miniature:', thumbErr);
          }
        }
        
        // Retourner les couleurs sauvegardées ou un tableau vide
        const savedColors = design.colors || [];
        
        return NextResponse.json({
          id: design.id,
          name: design.name,
          colors: savedColors
        }, { status: 201 });
      }
      
      if (body.action === 'create_from_content') {
        console.log('🔍 Création design depuis contenu SVG:', body.name);
        
        // Créer le design avec le contenu SVG directement en base
        const { data: design, error: dbError } = await supabaseAdmin
          .from('designs')
          .insert({
            name: body.name,
            svg_url: `data:image/svg+xml;base64,${Buffer.from(body.svgContent).toString('base64')}`, // Encoder en base64
            primary_color: body.primaryColor || '#000000',
            secondary_color: body.secondaryColor || '#ffffff',
            tertiary_color: body.tertiaryColor || '#cccccc',
            active: true
          })
          .select()
          .single();
        
        if (dbError) {
          console.error('❌ Erreur création design:', dbError);
          console.error('❌ Détails erreur:', JSON.stringify(dbError, null, 2));
          return NextResponse.json({ error: dbError.message, details: dbError }, { status: 500 });
        }
        
        console.log('✅ Design créé depuis URL:', design);
        
        // Générer une miniature si fournie
        if (body.thumbnail) {
          try {
            const thumbnailBlob = dataURLToBlob(body.thumbnail);
            const thumbnailFileName = `${design.id}-thumb.png`;
            
            const { error: thumbError } = await supabaseAdmin.storage
              .from('design_thumbs')
              .upload(thumbnailFileName, thumbnailBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/png'
              });
            
            if (thumbError) {
              console.error('❌ Erreur upload miniature:', thumbError);
            } else {
              console.log('✅ Miniature uploadée:', thumbnailFileName);
            }
          } catch (thumbErr) {
            console.error('❌ Erreur traitement miniature:', thumbErr);
          }
        }
        
        return NextResponse.json({
          id: design.id,
          name: design.name,
          svgUrl: design.svg_url,
          colors: design.colors
        }, { status: 201 });
      }
    }
    
    // Vérifier la taille du contenu
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      console.error('❌ Fichier trop volumineux:', contentLength);
      return NextResponse.json({ error: 'File too large. Maximum size: 10MB' }, { status: 413 });
    }
    
		const form = await request.formData();
		const file = form.get("file") as File | null;
		const thumb = form.get("thumbnail") as File | null;
		const providedName = String(form.get("name") ?? "").trim();
    
    console.log('🔍 API POST - file:', !!file, 'name:', providedName, 'thumb:', !!thumb);
    const primaryColor = String(form.get("primaryColor") ?? "#000000");
    const secondaryColor = String(form.get("secondaryColor") ?? "#ffffff");
    const tertiaryColor = String(form.get("tertiaryColor") ?? "#cccccc");
    
    // Nouveau système de couleurs dynamiques
    let colors: Array<{name: string, value: string}> = [];
    try {
      const colorsJson = String(form.get("colors") ?? "[]");
      colors = JSON.parse(colorsJson);
    } catch (error) {
      console.warn("Erreur parsing colors JSON, utilisation des couleurs legacy:", error);
      // Fallback sur les couleurs legacy si le JSON est invalide
      colors = [
        { name: "primary", value: primaryColor },
        { name: "secondary", value: secondaryColor },
        { name: "tertiary", value: tertiaryColor }
      ];
    }

		if (!file) {
      console.log('❌ API POST - Pas de fichier fourni');
			return NextResponse.json({ error: "file is required" }, { status: 400 });
		}

		const originalName = (file as any).name || "design.svg";
    const fileName = `${Date.now()}-${originalName}`;

    // Validation du fichier SVG
    console.log('🔍 Validation du fichier SVG:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Vérifier la taille du fichier (limite 10MB)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      console.error('❌ Fichier trop lourd:', file.size, 'bytes');
      return NextResponse.json({ 
        error: `Fichier trop lourd (${Math.round(file.size / 1024 / 1024)}MB). Maximum autorisé: 10MB` 
      }, { status: 400 });
    }

    // Upload du fichier SVG vers Supabase Storage
    console.log('🚀 Upload SVG vers Supabase:', fileName);
    const { data: svgData, error: svgError } = await supabase.storage
      .from('designs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (svgError) {
      console.error('❌ Erreur upload SVG:', svgError);
      return NextResponse.json({ 
        error: `Erreur upload SVG: ${svgError.message}` 
      }, { status: 500 });
    }
    console.log('✅ SVG uploadé avec succès:', svgData.path);

    // Obtenir l'URL publique du SVG
    const { data: { publicUrl: svgUrl } } = supabase.storage
      .from('designs')
      .getPublicUrl(svgData.path);

    // Upload optionnel de la miniature
		let thumbUrl: string | undefined = undefined;
		if (thumb) {
      const thumbName = `thumb-${Date.now()}-${(thumb as any).name || 'thumb.png'}`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbName, thumb, {
          cacheControl: '3600',
          upsert: false
        });

      if (!thumbError && thumbData) {
        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbData.path);
        thumbUrl = publicUrl;
      }
    }

    // Créer l'entrée dans la base de données
    console.log('💾 Insertion en base de données avec colors:', colors);
    
    // Préparer les données d'insertion
    const insertData: any = {
      name: providedName || originalName,
      svg_url: svgUrl,
      thumbnail_url: thumbUrl,
      primary_color: primaryColor, // Legacy pour compatibilité
      secondary_color: secondaryColor, // Legacy pour compatibilité
      tertiary_color: tertiaryColor, // Legacy pour compatibilité
      active: true
    };
    
    // Ne pas ajouter colors pour l'instant (colonne n'existe pas encore)
    // insertData.colors = colors;
    console.log('⚠️ Colors ignorés temporairement (colonne n\'existe pas encore):', colors);
    
    const { data: design, error: dbError } = await supabase
      .from('designs')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Erreur DB insert design:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    console.log('✅ Design créé en base:', design);

    // Générer automatiquement une miniature si pas fournie
    if (!thumbUrl && design.id) {
      try {
        console.log('🎨 Génération automatique de la miniature pour le design:', design.id);
        
        // Trouver le model_id associé à ce design
        const modelId = await findModelIdForDesign(design.id);
        if (!modelId) {
          console.log('⚠️ Aucun model_id trouvé pour ce design, pas de miniature générée');
        } else {
          console.log('📦 Model_id trouvé:', modelId);
          
          // Récupérer les informations du modèle
          const { data: modelData, error: modelError } = await supabaseAdmin
            .from('models_3d')
            .select('glb_url')
            .eq('id', modelId)
            .single();
            
          if (modelError || !modelData) {
            console.error('❌ Erreur lors de la récupération du modèle:', modelError);
          } else {
            // Convertir les colors en Record<string, string> pour la génération
            const colorsRecord: Record<string, string> = {};
            colors.forEach(color => {
              colorsRecord[color.name] = color.value;
            });
            
            // Générer la miniature (cette partie sera implémentée côté client)
            // Pour l'instant, on retourne le design sans miniature
            console.log('🎯 Miniature à générer avec:', {
              modelUrl: modelData.glb_url,
              designSvgUrl: svgUrl,
              colors: colorsRecord
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la génération de la miniature:', error);
      }
    }

    return NextResponse.json({
      id: design.id,
      name: design.name,
      svgUrl: design.svg_url,
      thumbUrl: design.thumbnail_url,
      primaryColor: design.primary_color, // Legacy pour compatibilité
      secondaryColor: design.secondary_color, // Legacy pour compatibilité
      tertiaryColor: design.tertiary_color, // Legacy pour compatibilité
      colors: colors // Utiliser les colors envoyées (pas de la DB pour l'instant)
    }, { status: 201 });
  } catch (err) {
    console.error('Erreur POST design:', err);
    
    // Gestion spécifique pour les erreurs de taille
    if (err instanceof Error && err.message.includes('413')) {
      return NextResponse.json({ error: "File too large. Maximum size: 10MB" }, { status: 413 });
    }
    
    // Gestion spécifique pour les erreurs de body stream
    if (err instanceof Error && err.message.includes('body stream already read')) {
      return NextResponse.json({ error: "Request body already processed" }, { status: 400 });
    }
    
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}

// =====================================================
// PATCH - Mettre à jour les couleurs ou la miniature d'un design
// =====================================================
export async function PATCH(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      // Mise à jour des couleurs (JSON)
      const body = await request.json();
      const { id, primaryColor, secondaryColor, tertiaryColor, colors } = body;

      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }

      console.log('🎨 PATCH design colors - ID:', id, 'Colors:', { primaryColor, secondaryColor, tertiaryColor });

      // Mettre à jour les couleurs dans la base de données
      const { data, error: updateError } = await supabaseAdmin
        .from('designs')
        .update({ 
          primary_color: primaryColor, // Legacy pour compatibilité
          secondary_color: secondaryColor, // Legacy pour compatibilité
          tertiary_color: tertiaryColor, // Legacy pour compatibilité
          colors: colors // Nouveau système dynamique
        })
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('❌ Erreur update colors:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      console.log('✅ Colors updated successfully:', data);
      return NextResponse.json({ id, primaryColor, secondaryColor, tertiaryColor, colors });
      
    } else {
      // Mise à jour de la miniature (FormData)
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const thumb = form.get("thumbnail") as File | null;

      if (!id || !thumb) {
        return NextResponse.json({ error: "id and thumbnail required" }, { status: 400 });
      }

      // Upload de la nouvelle miniature
      const thumbName = `thumb-${id}-${Date.now()}.png`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbName, thumb, {
          cacheControl: '3600',
          upsert: true
        });

      if (thumbError) {
        console.error('Erreur upload thumbnail:', thumbError);
        return NextResponse.json({ error: thumbError.message }, { status: 500 });
      }

      // Obtenir l'URL publique
      const { data: { publicUrl: thumbUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbData.path);

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('designs')
        .update({ thumbnail_url: thumbUrl })
        .eq('id', id);

      if (updateError) {
        console.error('Erreur update thumbnail:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ id, thumbUrl });
    }
  } catch (err) {
    console.error('Erreur PATCH design:', err);
    return NextResponse.json({ error: "patch failed" }, { status: 500 });
  }
}

// =====================================================
// DELETE - Supprimer un design
// =====================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    console.log('🗑️ DELETE design - ID reçu:', id);

    if (!id) {
      console.log('❌ DELETE design - ID manquant');
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Vérifier d'abord si le design existe avec le client admin
    const { data: existingDesign, error: checkError } = await supabaseAdmin
      .from('designs')
      .select('id, name, active')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('❌ DELETE design - Erreur vérification existence:', checkError);
      return NextResponse.json({ error: `Design non trouvé: ${checkError.message}` }, { status: 404 });
    }

    console.log('🔍 DELETE design - Design trouvé:', existingDesign);

    // Soft delete : on met juste active à false avec le client admin
    const { data, error } = await supabaseAdmin
      .from('designs')
      .update({ active: false })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ DELETE design - Erreur Supabase update:', error);
      return NextResponse.json({ error: `Erreur de suppression: ${error.message}` }, { status: 500 });
    }

    console.log('✅ DELETE design - Suppression réussie:', data);
    return NextResponse.json({ ok: true, deleted: data });
  } catch (err) {
    console.error('❌ DELETE design - Erreur générale:', err);
    return NextResponse.json({ error: `Erreur serveur: ${err instanceof Error ? err.message : 'Erreur inconnue'}` }, { status: 500 });
  }
}


