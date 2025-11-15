'use client';

import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  Banner,
  Spinner,
  Button,
  ResourceList,
  ResourceItem,
  Thumbnail,
  EmptyState,
  Badge,
  Checkbox,
} from '@shopify/polaris';
import { useCallback } from 'react';
import Link from 'next/link';

interface ShopifyProduct {
  id: string;
  shopify_product_id: string;
  shopify_product_title: string;
  shopify_product_handle: string | null;
  shopify_product_image_url: string | null;
  shopify_product_status: string;
  enabled_for_configurator: boolean;
  shopify_variants: Array<{
    id: string;
    title: string;
    price: string;
    sku?: string | null;
    availableForSale: boolean;
  }>;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

interface SyncResult {
  synced: number;
  updated: number;
  errors: number;
}

export default function ShopifyProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [shop, setShop] = useState<string | null>(null);

  // Récupérer le shop depuis l'URL
  useEffect(() => {
    const shopParam = new URLSearchParams(window.location.search).get('shop');
    setShop(shopParam);
  }, []);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    if (!shop) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/shopify/products?shop=${shop}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    if (shop) {
      loadProducts();
    }
  }, [shop, loadProducts]);

  // Activer/désactiver un produit pour le configurateur
  const handleToggleEnabled = useCallback(async (productId: string, enabled: boolean) => {
    if (!shop) return;

    try {
      const response = await fetch(
        `/api/shopify/products/${productId}/enable?shop=${shop}&enabled=${enabled}`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du produit');
      }

      // Recharger les produits
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [shop, loadProducts]);

  // Synchroniser les produits
  const handleSync = useCallback(async () => {
    if (!shop) return;

    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);

      const response = await fetch(`/api/shopify/products/sync?shop=${shop}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Erreur lors de la synchronisation');
      }

      const data = await response.json();
      setSyncResult(data.result);

      // Recharger les produits après synchronisation
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSyncing(false);
    }
  }, [shop, loadProducts]);

  if (!shop) {
    return (
      <Page title="Produits Shopify">
        <Layout>
          <Layout.Section>
            <Banner status="critical" title="Paramètre manquant">
              <p>Paramètre &quot;shop&quot; manquant dans l&apos;URL</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Produits Shopify"
      primaryAction={{
        content: syncing ? 'Synchronisation...' : 'Synchroniser les produits',
        onAction: handleSync,
        loading: syncing,
        disabled: syncing,
      }}
    >
      <Layout>
        {syncResult && (
          <Layout.Section>
            <Banner
              status={syncResult.errors === 0 ? 'success' : 'warning'}
              title="Synchronisation terminée"
            >
              <p>
                {syncResult.synced} nouveaux produits, {syncResult.updated} mis à jour
                {syncResult.errors > 0 && `, ${syncResult.errors} erreurs`}
              </p>
            </Banner>
          </Layout.Section>
        )}

        {error && (
          <Layout.Section>
            <Banner status="critical" title="Erreur">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          {loading ? (
            <Card>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '40px',
                }}
              >
                <Spinner accessibilityLabel="Chargement..." size="large" />
                <Text variant="bodyMd" as="p">
                  Chargement des produits...
                </Text>
              </div>
            </Card>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState
                heading="Aucun produit synchronisé"
                action={{
                  content: 'Synchroniser les produits',
                  onAction: handleSync,
                  loading: syncing,
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>
                  Les produits de votre boutique Shopify n&apos;ont pas encore été synchronisés.
                  Cliquez sur &quot;Synchroniser les produits&quot; pour commencer.
                </p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <ResourceList
                resourceName={{ singular: 'produit', plural: 'produits' }}
                items={products}
                renderItem={(item) => {
                  const product = item as ShopifyProduct;
                  const media = product.shopify_product_image_url ? (
                    <Thumbnail
                      source={product.shopify_product_image_url}
                      alt={product.shopify_product_title}
                    />
                  ) : undefined;

                  const variantsCount = product.shopify_variants?.length || 0;
                  const priceRange =
                    product.shopify_variants && product.shopify_variants.length > 0
                      ? (() => {
                          const prices = product.shopify_variants
                            .map((v) => parseFloat(v.price))
                            .filter((p) => !isNaN(p));
                          if (prices.length === 0) return 'N/A';
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? `€${min.toFixed(2)}` : `€${min.toFixed(2)} - €${max.toFixed(2)}`;
                        })()
                      : 'N/A';

                  return (
                    <ResourceItem
                      id={product.id}
                      media={media}
                      accessibilityLabel={`Voir les détails de ${product.shopify_product_title}`}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {product.shopify_product_title}
                          </Text>
                          {product.enabled_for_configurator && (
                            <Badge tone="success">Actif pour configurateur</Badge>
                          )}
                        </div>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {variantsCount} variante{variantsCount > 1 ? 's' : ''} • {priceRange} •{' '}
                          {product.shopify_product_status}
                        </Text>
                        {product.shopify_product_handle && (
                          <Text variant="bodySm" tone="subdued" as="p">
                            Handle: {product.shopify_product_handle}
                          </Text>
                        )}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <Checkbox
                            label="Utiliser avec le configurateur 3D"
                            checked={product.enabled_for_configurator}
                            onChange={(checked) => handleToggleEnabled(product.id, checked)}
                          />
                          <Link
                            href={`/app/shopify/products/${product.id}/editor?shop=${shop}`}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#0066cc',
                              color: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '14px',
                              fontWeight: '500',
                            }}
                          >
                            ✏️ Éditer (3D)
                          </Link>
                        </div>
                      </div>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

