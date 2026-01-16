// =====================================================
// API PRODUCTS - Récupérer les produits depuis Prisma
// =====================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        productGid: true,
        handle: true,
        productionTemplates: true,
      },
      orderBy: {
        handle: "asc",
      },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("❌ Erreur GET products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
