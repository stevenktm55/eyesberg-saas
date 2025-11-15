"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductEditor3D } from "@/components/admin/ProductEditor3D";

export default function ProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ProductEditor3D productId={productId} onLeave={() => router.push("/admin/products")} />
    </div>
  );
}

