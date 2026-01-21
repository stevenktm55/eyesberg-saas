import { NextRequest, NextResponse } from "next/server";
import { generateSnapshot } from "@/lib/snapshot-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // On accepte soit { builderData, shopDomain, shopifyProductId }
    // soit directement un objet builderData à la racine.
    const builderData = body.builderData ?? body;
    const shopDomain: string = body.shopDomain ?? builderData.shopDomain ?? "";
    const shopifyProductId: string =
      body.shopifyProductId ??
      builderData.shopifyProductId ??
      builderData.shopify_product_id ??
      builderData.id ??
      "preview-product";

    if (!builderData || typeof builderData !== "object") {
      return NextResponse.json(
        { error: "builderData (objet JSON) est requis" },
        { status: 400 }
      );
    }

    console.log('📦 Génération snapshot preview:', {
      hasBuilderData: !!builderData,
      builderDataKeys: Object.keys(builderData),
      shopDomain,
      shopifyProductId
    });

    const snapshot = await generateSnapshot(builderData, shopDomain, shopifyProductId);

    console.log('✅ Snapshot preview généré:', {
      hasSnapshot: !!snapshot,
      snapshotKeys: snapshot ? Object.keys(snapshot) : [],
      hasDesign2D: !!snapshot?.design2D,
      design2DUrl: snapshot?.design2D?.url,
      hasTextZones: !!snapshot?.textZones,
      textZonesCount: snapshot?.textZones?.length || 0,
      hasFonts: !!snapshot?.fonts,
      fontsCount: snapshot?.fonts?.length || 0,
      modulesCount: snapshot?.customizationModules?.length || 0
    });

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error("❌ Error generating preview snapshot:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
