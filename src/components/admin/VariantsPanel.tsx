"use client";

interface VariantsPanelProps {
  productId: string;
  shop?: string;
}

export function VariantsPanel({ productId, shop }: VariantsPanelProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Variants</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">Variants management coming soon...</p>
        <p className="text-sm text-gray-400 mt-2">
          This will allow you to manage product variants and link them to Shopify variants
        </p>
      </div>
    </div>
  );
}

