export const dynamic = 'force-dynamic';

// TEST: Version ultra-simple sans imports pour vérifier si le problème vient des imports
export default function Page({
  searchParams,
}: {
  searchParams: { shop?: string; productId?: string; variantId?: string; preview?: string };
}) {
  // TEST: Log immédiat
  console.log('🔍🔍🔍 Page component rendering - SIMPLE VERSION', { searchParams });
  
  // TEST: Rendre quelque chose de très simple sans aucun import
  return (
    <div 
      className="h-screen w-screen configurator-panel-wrapper" 
      style={{ 
        backgroundColor: '#ffffff', 
        border: '10px solid green',
        padding: '20px'
      } as React.CSSProperties}
    >
      <div 
        className="configurator-panel-test" 
        style={{ 
          border: '10px solid magenta', 
          padding: '20px', 
          backgroundColor: 'yellow',
          fontSize: '24px',
          fontWeight: 'bold'
        } as React.CSSProperties}
      >
        ✅ TEST: Page.tsx fonctionne ! Cette div devrait être TRÈS visible !
      </div>
      <div style={{ border: '10px solid blue', padding: '20px', backgroundColor: 'lightblue', marginTop: '20px' } as React.CSSProperties}>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Si vous voyez ceci, page.tsx est bien exécuté !</p>
        <p>ProductId: {searchParams?.productId || 'null'}</p>
        <p>Shop: {searchParams?.shop || 'null'}</p>
        <p>Preview: {searchParams?.preview || 'null'}</p>
      </div>
    </div>
  );
}
