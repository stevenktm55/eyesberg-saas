'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ProductEditor3D } from '@/components/admin/ProductEditor3D';

export default function ShopifyProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const shop = searchParams.get('shop');

  if (!shop) {
    return (
      <div className="p-6">
        <p className="text-red-600">Paramètre "shop" manquant dans l'URL</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ProductEditor3D
        productId={productId}
        shop={shop}
        onLeave={() => router.push(`/app/shopify/products?shop=${shop}`)}
      />
    </div>
  );
}

