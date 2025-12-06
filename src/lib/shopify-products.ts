import { getShopByDomain } from './shopify-shops';

/**
 * Ajoute le tag "customizer" à un produit Shopify
 */
export async function addCustomizerTagToProduct(
  shopDomain: string,
  shopifyProductId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🏷️ Tentative d\'ajout du tag customizer:', { shopDomain, shopifyProductId });
    
    // Récupérer l'access token de la boutique
    const shopData = await getShopByDomain(shopDomain);
    if (!shopData || !shopData.access_token) {
      console.error('❌ Boutique non trouvée ou non installée:', shopDomain);
      return {
        success: false,
        error: 'Shop not found or not installed',
      };
    }

    // Convertir le productId si c'est un GID (gid://shopify/Product/123456) en ID numérique
    let numericProductId = shopifyProductId;
    if (shopifyProductId.startsWith('gid://shopify/Product/')) {
      numericProductId = shopifyProductId.replace('gid://shopify/Product/', '');
      console.log('🔄 Conversion GID vers ID numérique:', numericProductId);
    }

    // Récupérer le produit actuel pour obtenir ses tags existants
    const productResponse = await fetch(
      `https://${shopDomain}/admin/api/2025-01/products/${numericProductId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
        },
      }
    );

    if (!productResponse.ok) {
      const errorText = await productResponse.text();
      console.error('❌ Erreur lors de la récupération du produit:', {
        status: productResponse.status,
        statusText: productResponse.statusText,
        errorText,
        productId: numericProductId,
      });
      return {
        success: false,
        error: `Failed to fetch product: ${productResponse.status} - ${errorText}`,
      };
    }

    const productData = await productResponse.json();
    const product = productData.product;
    const existingTags = product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [];

    // Vérifier si le tag customizer existe déjà
    if (existingTags.some((tag: string) => tag.toLowerCase() === 'customizer')) {
      console.log('✅ Tag "customizer" déjà présent sur le produit');
      return { success: true };
    }

    // Ajouter le tag customizer
    const updatedTags = [...existingTags, 'customizer'].join(', ');

    // Mettre à jour le produit avec le nouveau tag
    const updateResponse = await fetch(
      `https://${shopDomain}/admin/api/2025-01/products/${numericProductId}.json`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopData.access_token,
        },
        body: JSON.stringify({
          product: {
            id: numericProductId,
            tags: updatedTags,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Erreur lors de la mise à jour du produit:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        errorText,
        productId: numericProductId,
        tags: updatedTags,
      });
      return {
        success: false,
        error: `Failed to update product: ${updateResponse.status} - ${errorText}`,
      };
    }

    const updatedProduct = await updateResponse.json();
    console.log('✅ Tag "customizer" ajouté au produit Shopify:', {
      productId: numericProductId,
      productTitle: updatedProduct.product?.title,
      tags: updatedProduct.product?.tags,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du tag customizer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
