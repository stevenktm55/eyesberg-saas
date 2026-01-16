// =====================================================
// API PRODUCTION - GÉNÉRER UN FICHIER DE PRODUCTION
// =====================================================
// POST /api/production/generate
// Génère un fichier SVG de production fusionné
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { generatePrintFile } from "@/lib/production-generator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, size, userDesignSvgString, colorConfig } = body;

    if (!productId || !size || !userDesignSvgString || !colorConfig) {
      return NextResponse.json(
        {
          error: "productId, size, userDesignSvgString, and colorConfig are required",
        },
        { status: 400 }
      );
    }

    // Générer le fichier de production
    const generatedSvg = await generatePrintFile(
      productId,
      size,
      userDesignSvgString,
      colorConfig
    );

    // Retourner le SVG généré
    return NextResponse.json({
      success: true,
      svg: generatedSvg,
    });
  } catch (error: any) {
    console.error("❌ Erreur génération fichier production:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate production file",
      },
      { status: 500 }
    );
  }
}
