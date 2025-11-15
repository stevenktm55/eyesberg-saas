// =====================================================
// API UPLOAD CHUNKS - Pour fichiers volumineux
// =====================================================
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Configuration pour les chunks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Limite par chunk (1MB + overhead)
    },
  },
};

// =====================================================
// POST - Upload d'un chunk de fichier
// =====================================================
export async function POST(request: Request) {
  try {
    console.log('🔍 API upload-chunk - Début');
    console.log('🔍 Supabase Admin disponible:', !!supabaseAdmin);
    
    const form = await request.formData();
    const chunk = form.get("chunk") as File | null;
    const fileName = String(form.get("fileName") ?? "");
    const chunkIndex = parseInt(String(form.get("chunkIndex") ?? "0"));
    const totalChunks = parseInt(String(form.get("totalChunks") ?? "1"));
    const isLastChunk = String(form.get("isLastChunk") ?? "false") === "true";
    
    console.log('📊 Chunk info:', {
      fileName,
      chunkIndex,
      totalChunks,
      isLastChunk,
      chunkSize: chunk?.size
    });

    if (!chunk || !fileName) {
      return NextResponse.json({ error: "chunk and fileName are required" }, { status: 400 });
    }

    // Uploader le chunk vers Supabase Storage
    const chunkFileName = `${fileName}.chunk.${chunkIndex}`;
    console.log('🔍 Tentative upload vers bucket large-designs:', chunkFileName);
    
    const { data: chunkData, error: chunkError } = await supabaseAdmin.storage
      .from('large-designs')
      .upload(chunkFileName, chunk, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/octet-stream'
      });

    if (chunkError) {
      console.error('❌ Erreur upload chunk:', chunkError);
      return NextResponse.json({ error: chunkError.message }, { status: 500 });
    }

    console.log(`✅ Chunk ${chunkIndex}/${totalChunks} uploadé:`, chunkData.path);

    // Si c'est le dernier chunk, créer un fichier de métadonnées
    if (isLastChunk) {
      const metadata = {
        fileName,
        totalChunks,
        uploadedAt: new Date().toISOString(),
        chunkSize: chunk.size,
        isComplete: false // Sera mis à true quand tous les chunks seront assemblés
      };

      const metadataFileName = `${fileName}.metadata.json`;
      const { error: metadataError } = await supabaseAdmin.storage
        .from('large-designs')
        .upload(metadataFileName, new Blob([JSON.stringify(metadata)], { type: 'application/json' }), {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/json'
        });

      if (metadataError) {
        console.error('❌ Erreur upload métadonnées:', metadataError);
      } else {
        console.log('✅ Métadonnées uploadées:', metadataFileName);
      }
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
      chunkPath: chunkData.path
    });

  } catch (err) {
    console.error('❌ Erreur upload-chunk:', err);
    return NextResponse.json({ error: "chunk upload failed" }, { status: 500 });
  }
}
