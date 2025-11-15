import { NextRequest, NextResponse } from "next/server";
// Prisma désactivé temporairement (SQLite ne fonctionne pas sur Vercel)
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS pour CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Sauvegarder une configuration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      shopifyProductId,
      shopifyVariantId,
      modelUrl,
      designId,
      designUrl,
      colors,
      texts,
      previewImageUrl,
      customerEmail,
      customerNote,
    } = body;

    // Générer un ID unique pour la configuration
    const configId = crypto.randomUUID();

    // MODE SANS BASE DE DONNÉES (temporaire)
    // Les configurations sont stockées seulement côté client (localStorage)
    console.log("Configuration reçue (mode sans BD):", {
      configId,
      shopifyProductId,
      colors,
      texts,
    });

    // Retourner le succès avec l'ID
    return NextResponse.json({
      success: true,
      configId: configId,
      id: configId,
      mode: "no-database",
    }, { headers: corsHeaders });

    /* VERSION AVEC BASE DE DONNÉES (à réactiver plus tard)
    const config = await prisma.productConfiguration.create({
      data: {
        configId,
        shopifyProductId: shopifyProductId || null,
        shopifyVariantId: shopifyVariantId || null,
        modelUrl: modelUrl || null,
        designId: designId || null,
        designUrl: designUrl || null,
        colors: colors || null,
        texts: texts || null,
        previewImageUrl: previewImageUrl || null,
        customerEmail: customerEmail || null,
        customerNote: customerNote || null,
      },
    });

    return NextResponse.json({
      success: true,
      configId: config.configId,
      id: config.id,
    });
    */
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la configuration:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la sauvegarde" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Récupérer une configuration par son configId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("configId");

    if (!configId) {
      return NextResponse.json(
        { success: false, error: "configId requis" },
        { status: 400, headers: corsHeaders }
      );
    }

    // MODE SANS BASE DE DONNÉES - les configs ne sont pas récupérables
    return NextResponse.json({
      success: false,
      error: "Mode sans base de données - configurations non persistantes",
      configId,
    }, { status: 503, headers: corsHeaders });

    /* VERSION AVEC BASE DE DONNÉES
    const config = await prisma.productConfiguration.findUnique({
      where: { configId },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Configuration non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
    });
    */
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Mettre à jour une configuration existante
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { configId } = body;

    if (!configId) {
      return NextResponse.json(
        { success: false, error: "configId requis" },
        { status: 400, headers: corsHeaders }
      );
    }

    // MODE SANS BASE DE DONNÉES
    return NextResponse.json({
      success: false,
      error: "Mode sans base de données - mise à jour non disponible",
    }, { status: 503, headers: corsHeaders });

    /* VERSION AVEC BASE DE DONNÉES
    const config = await prisma.productConfiguration.update({
      where: { configId },
      data: {
        shopifyProductId: shopifyProductId || undefined,
        shopifyVariantId: shopifyVariantId || undefined,
        modelUrl: modelUrl || undefined,
        designId: designId || undefined,
        designUrl: designUrl || undefined,
        colors: colors || undefined,
        texts: texts || undefined,
        previewImageUrl: previewImageUrl || undefined,
        customerEmail: customerEmail || undefined,
        customerNote: customerNote || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      config,
    });
    */
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour" },
      { status: 500, headers: corsHeaders }
    );
  }
}

