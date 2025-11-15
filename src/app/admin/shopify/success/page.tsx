import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function ShopifyInstallSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ShopifySuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopifySuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop || 'Boutique inconnue';

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>✅ Installation Shopify réussie !</h1>
      <p>Votre boutique <strong>{shop}</strong> a été connectée avec succès.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Prochaines étapes</h2>
        <ul>
          <li>✅ L&apos;application est installée sur votre boutique Shopify</li>
          <li>📋 Configurez vos produits avec le configurateur 3D</li>
          <li>🎨 Personnalisez les options disponibles</li>
          <li>🚀 Commencez à recevoir des commandes personnalisées</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <a
          href={`/app/shopify?shop=${shop}`}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#008060',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Accéder au Dashboard →
        </a>
        <a
          href={`https://${shop}/admin`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#f0f0f0',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          Aller sur Shopify Admin →
        </a>
      </div>
    </div>
  );
}

