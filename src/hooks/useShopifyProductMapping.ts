import { useState, useEffect } from 'react';

interface Model {
  id: string;
  name: string;
  fileUrl: string;
}

interface Design {
  id: string;
  name: string;
  svgUrl: string;
}

interface ShopifyProductMapping {
  id: string;
  shopify_product_id: string;
  shopify_product_title: string;
  model_id: string | null;
  design_id: string | null;
  active: boolean;
  model?: Model;
  design?: Design;
}

interface UseShopifyProductMappingResult {
  mappedModel: Model | null;
  mappedDesign: Design | null;
  isLoading: boolean;
  error: string | null;
}

export function useShopifyProductMapping(
  productId?: string
): UseShopifyProductMappingResult {
  const [mappedModel, setMappedModel] = useState<Model | null>(null);
  const [mappedDesign, setMappedDesign] = useState<Design | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setMappedModel(null);
      setMappedDesign(null);
      setError(null);
      return;
    }

    const loadProductMapping = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shopify-products');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des associations');
        }

        const mappings: ShopifyProductMapping[] = await response.json();
        
        // Trouver l'association pour ce produit
        const mapping = mappings.find(
          m => m.shopify_product_id === productId && m.active
        );

        if (mapping) {
          console.log('🎯 Association trouvée pour le produit:', productId, mapping);
          setMappedModel(mapping.model || null);
          setMappedDesign(mapping.design || null);
        } else {
          console.log('⚠️ Aucune association trouvée pour le produit:', productId);
          setMappedModel(null);
          setMappedDesign(null);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des associations produits:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setMappedModel(null);
        setMappedDesign(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductMapping();
  }, [productId]);

  return {
    mappedModel,
    mappedDesign,
    isLoading,
    error
  };
}
