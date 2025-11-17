'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Card,
  Layout,
  Text,
  Banner,
  Spinner,
  Button,
} from '@shopify/polaris';

interface ShopData {
  id: string;
  shop_domain: string;
  shop_name: string | null;
  shop_email: string | null;
  installed_at: string | null;
  scopes: string | null;
}

/**
 * Page admin accessible via sous-domaine
 * Exemple : stretchmx.gokickflip.com/admin
 */
export default function SubdomainAdminPage() {
  const router = useRouter();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le sous-domaine depuis le host
    const host = window.location.host;
    const subdomainMatch = host.match(/^([^.]+)\./);
    const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
    
    setSubdomain(detectedSubdomain);

    if (!detectedSubdomain) {
      setError('Sous-domaine non détecté');
      setLoading(false);
      return;
    }

    // Charger les données de la boutique associée à ce sous-domaine
    async function loadShopData() {
      try {
        const response = await fetch(`/api/accounts/shop?subdomain=${detectedSubdomain}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();
        setShopData(data.shop);
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
                  Chargement...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const handleConnectShopify = () => {
    if (!subdomain) {
      alert('Sous-domaine non détecté. Veuillez accéder à l\'admin via votre sous-domaine.');
      return;
    }
    
    // Demander le domaine Shopify à l'utilisateur
    const shopDomain = prompt('Entrez votre domaine Shopify (ex: votreboutique.myshopify.com):');
    if (!shopDomain) return;
    
    // Valider le format
    if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      alert('Format invalide. Utilisez: votreboutique.myshopify.com');
      return;
    }
    
    // Rediriger vers le flow OAuth
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
  };

  if (error || !shopData) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Banner 
              status={error ? "critical" : "info"} 
              title={error ? "Erreur" : "Boutique non connectée"}
            >
              <p>{error || 'Aucune boutique Shopify n\'est connectée à ce compte.'}</p>
              {!subdomain && (
                <p style={{ marginTop: '8px' }}>
                  Assurez-vous d&apos;accéder à l&apos;admin via votre sous-domaine : <strong>votresousdomaine.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ton-domaine.com'}/admin</strong>
                </p>
              )}
              {subdomain && !error && (
                <div style={{ marginTop: '16px' }}>
                  <Button primary onClick={handleConnectShopify}>
                    Connecter ma boutique Shopify
                  </Button>
                </div>
              )}
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
          router.push(`/products?shop=${shopData.shop_domain}`);
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
                {subdomain && (
                  <Text variant="bodyMd" as="p">
                    <strong>Sous-domaine :</strong> {subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ton-domaine.com'}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

