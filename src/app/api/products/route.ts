// =====================================================
// API PRODUCTS - Récupérer les produits depuis Supabase
// =====================================================
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from("shopify_products")
      .select("id, shopify_product_id, shopify_product_handle, shopify_product_title, production_templates")
      .order("shopify_product_title", { ascending: true });

    if (error) {
      console.error("❌ Erreur Supabase GET products:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Transformer pour correspondre au format attendu
    const transformedProducts = products.map((p: any) => ({
      id: p.id,
      productGid: p.shopify_product_id,
      handle: p.shopify_product_handle || p.shopify_product_title,
      productionTemplates: p.production_templates || null,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error: any) {
    console.error("❌ Erreur GET products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
