// =====================================================
// API ADMIN - UPLOAD TEMPLATE DE PRODUCTION
// =====================================================
// POST /api/admin/upload-template
// Upload un fichier SVG template pour une taille spécifique
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string;
    const size = formData.get("size") as string; // 'S', 'M', 'L', 'XL', etc.

    if (!file || !productId || !size) {
      return NextResponse.json(
        { error: "file, productId, and size are required" },
        { status: 400 }
      );
    }

    // Vérifier que c'est un fichier SVG
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      return NextResponse.json(
        { error: "File must be an SVG" },
        { status: 400 }
      );
    }

    // Convertir le File en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `production-templates/${productId}/${size}-${timestamp}.svg`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("models-3D") // Ou créer un bucket dédié "production-templates"
      .upload(fileName, buffer, {
        contentType: "image/svg+xml",
        upsert: true, // Remplacer si le fichier existe déjà
      });

    if (uploadError) {
      console.error("❌ Erreur upload template:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload template: " + uploadError.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("models-3D")
      .getPublicUrl(fileName);

    console.log("✅ Template uploadé:", publicUrl);

    // Mettre à jour le Product dans Prisma avec le nouveau template
    try {
      // Récupérer le produit actuel
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Mettre à jour les templates
      const currentTemplates = (product.productionTemplates as Record<string, string>) || {};
      const updatedTemplates = {
        ...currentTemplates,
        [size]: publicUrl,
      };

      await prisma.product.update({
        where: { id: productId },
        data: {
          productionTemplates: updatedTemplates,
        },
      });

      return NextResponse.json({
        success: true,
        url: publicUrl,
        size,
        fileName,
        templates: updatedTemplates,
      });
    } catch (prismaError: any) {
      console.error("❌ Erreur Prisma:", prismaError);
      // Si Prisma échoue, on retourne quand même l'URL uploadée
      return NextResponse.json({
        success: true,
        url: publicUrl,
        size,
        fileName,
        warning: "Template uploaded but database update failed: " + prismaError.message,
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur upload template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload template" },
      { status: 500 }
    );
  }
}
