'use client';

import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  Banner,
  Spinner,
} from '@shopify/polaris';

interface ShopData {
  id: string;
  shop_domain: string;
  shop_name: string | null;
  shop_email: string | null;
  installed_at: string | null;
  scopes: string | null;
}

export default function ShopifyDashboardPage() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le shop depuis l'URL (pour le développement)
  // En production, on utilisera les headers App Bridge
  useEffect(() => {
    async function loadShopData() {
      try {
        const shopParam = new URLSearchParams(window.location.search).get('shop');
        if (!shopParam) {
          setError('Paramètre "shop" manquant dans l\'URL');
          setLoading(false);
          return;
        }

        // Récupérer les infos de la boutique depuis notre API
        const response = await fetch(`/api/shopify/shop?shop=${shopParam}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données de la boutique');
        }

        const data = await response.json();
        setShopData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);

  if (loading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
                <Spinner accessibilityLabel="Chargement..." size="large" />
                <Text variant="bodyMd" as="p">
                  Chargement des données de la boutique...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error || !shopData) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Banner status="critical" title="Erreur">
              <p>{error || 'Impossible de charger les données de la boutique'}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="StretchMX Configurator"
      primaryAction={{
        content: 'Voir les produits',
        onAction: () => {
          window.location.href = `/app/shopify/products?shop=${shopData.shop_domain}`;
        },
      }}
      secondaryActions={[
        {
          content: 'Synchroniser les produits',
          onAction: async () => {
            try {
              const response = await fetch(`/api/shopify/products/sync?shop=${shopData.shop_domain}`, {
                method: 'POST',
              });
              if (response.ok) {
                const data = await response.json();
                alert(`Synchronisation terminée: ${data.result.synced} nouveaux, ${data.result.updated} mis à jour`);
                // Recharger la page pour mettre à jour les infos
                window.location.reload();
              } else {
                throw new Error('Erreur lors de la synchronisation');
              }
            } catch (error) {
              alert('Erreur lors de la synchronisation: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
            }
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Text variant="headingMd" as="h2">
                Bienvenue sur votre dashboard
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text variant="bodyMd" as="p">
                  <strong>Boutique :</strong> {shopData.shop_name || shopData.shop_domain}
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Domaine :</strong> {shopData.shop_domain}
                </Text>
                {shopData.shop_email && (
                  <Text variant="bodyMd" as="p">
                    <strong>Email :</strong> {shopData.shop_email}
                  </Text>
                )}
                {shopData.installed_at && (
                  <Text variant="bodyMd" as="p">
                    <strong>Installé le :</strong>{' '}
                    {new Date(shopData.installed_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Text variant="headingMd" as="h2">
                Prochaines étapes
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text variant="bodyMd" as="p">
                  ✅ L&apos;application est installée sur votre boutique
                </Text>
                <Text variant="bodyMd" as="p">
                  📋 Configurez vos produits avec le configurateur 3D
                </Text>
                <Text variant="bodyMd" as="p">
                  🎨 Personnalisez les options disponibles pour vos clients
                </Text>
                <Text variant="bodyMd" as="p">
                  🚀 Commencez à recevoir des commandes personnalisées
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Text variant="headingMd" as="h2">
                Statut de l&apos;installation
              </Text>
              <Banner status="success" title="Installation réussie">
                <p>
                  Votre application StretchMX Configurator est correctement installée et
                  configurée sur votre boutique Shopify.
                </p>
              </Banner>
              {shopData.scopes && (
                <Text variant="bodyMd" as="p">
                  <strong>Permissions accordées :</strong>{' '}
                  {shopData.scopes.split(',').join(', ')}
                </Text>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

