'use client';

import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { ModelViewer } from '@/components/ModelViewer';

// Constante pour la font du configurator-panel (Inter - style Tailwind moderne)
const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Constante pour la couleur primaire des boutons (bleu Tailwind)
const CONFIGURATOR_PANEL_PRIMARY_COLOR = '#3b82f6';
const CONFIGURATOR_PANEL_PRIMARY_HOVER = '#2563eb';

// Style global pour forcer le texte en noir dans le Tab Header et les cartes de couleurs
// IMPORTANT: Scoper UNIQUEMENT au .configurator-panel pour ne pas affecter le reste de la page
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .configurator-panel .customizer-tab-name {
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
      -webkit-text-stroke-color: #000000 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .color-class-card-label {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .typography-back-button,
    .configurator-panel .typography-back-button * {
      color: #111827 !important;
      -webkit-text-fill-color: #111827 !important;
      -webkit-text-stroke-color: #111827 !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel .mobile-action-btn-black,
    .configurator-panel .mobile-action-btn-black * {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      -webkit-text-stroke-color: #ffffff !important;
      font-family: ${CONFIGURATOR_PANEL_FONT} !important;
    }
    .configurator-panel button.configurator-panel-sidebar-tab-active {
      border-radius: 12px !important;
      -webkit-border-radius: 12px !important;
      -moz-border-radius: 12px !important;
    }
    button.configurator-panel-sidebar-tab-active {
      border-radius: 12px !important;
      -webkit-border-radius: 12px !important;
      -moz-border-radius: 12px !important;
    }
  `;
  if (!document.getElementById('customizer-tab-style')) {
    style.id = 'customizer-tab-style';
    document.head.appendChild(style);
  }
}

type Tab = 'build' | 'pricing' | 'variants' | 'connect';

type CustomizationModule = {
  id: string;
  tabName: string; // Nom de l'onglet dans la sidebar
  icon: string; // Icône (emoji ou texte) - fallback si iconUrl n'existe pas
  iconUrl?: string; // URL de l'icône image (.svg ou .png)
  inputType: 'thumbnail' | 'dropdown' | 'radio' | 'label' | 'file-upload' | 'text-input' | 'checkbox';
  required?: boolean;
  options?: string[]; // Pour dropdown et radio
  contentType?: 'colors' | 'logos' | 'fonts' | 'designs-2d' | 'sizes' | 'text' | null; // Type de contenu à afficher
  addTextButtonLabel?: string; // Texte du bouton "Ajouter un texte" (par défaut: "Ajouter un texte")
  placedTextsLabel?: string; // Texte de l'en-tête "Textes ajoutés" (par défaut: "Textes ajoutés")
  textPlacementMode?: 'zones' | 'free'; // Mode de placement du texte: zones prédéfinies ou placement libre
  zoneGroupIds?: string[]; // IDs des groupes de zones à afficher (si textPlacementMode === 'zones')
  addLogoButtonLabel?: string; // Texte du bouton "Ajouter un logo" (par défaut: "Ajouter un logo")
  importLogoButtonLabel?: string; // Texte du bouton "Importer un logo" (par défaut: "Importer un logo")
  placedLogosLabel?: string; // Texte de l'en-tête "Logos placés" (par défaut: "Logos placés")
  logoPlacementMode?: 'zones' | 'free'; // Mode de placement du logo: zones prédéfinies ou placement libre
  logoZoneGroupIds?: string[]; // IDs des groupes de zones à afficher pour les logos (si logoPlacementMode === 'zones')
  allowedLogoFileTypes?: string[]; // Types de fichiers autorisés pour l'importation de logos (ex: ['svg', 'png', 'jpg', 'jpeg'])
  enableBackgroundRemover?: boolean; // Activer l'option de suppression du fond pour les logos importés
  // Vues de caméra personnalisées (depuis modèle 3D)
  viewLabels?: { id: string; label: string; cameraViewId?: string }[]; // Labels de vues personnalisés avec liaison aux vues du modèle 3D
  selectedCameraViews?: string[]; // IDs des vues de caméra disponibles depuis le modèle 3D
  // Options d'édition de texte
  enableTextContent?: boolean; // Permettre de modifier le contenu du texte
  enableTextFont?: boolean; // Permettre de changer la police
  enableTextColor?: boolean; // Permettre de changer la couleur
  enableTextStroke?: boolean; // Permettre de modifier le contour
  enableTextDeformation?: boolean; // Permettre de déformer le texte
  textColorPaletteId?: string; // Palette à utiliser pour la couleur du texte
  textStrokePaletteId?: string; // Palette à utiliser pour le contour du texte
  textStrokeMinWidth?: number; // Largeur min du contour (px)
  textMinFontSize?: number; // Taille min (px)
  textMaxFontSize?: number; // Taille max (px)
  textStrokeMaxWidth?: number; // Largeur max du contour (px)
  textBaseStrokeWidth?: number; // Largeur par défaut du contour (px)
  textDefaultColor?: string; // Couleur par défaut du texte
  textDefaultStrokeColor?: string; // Couleur par défaut du contour
  textDefaultFontId?: string; // ID de la police par défaut
  textEnabledDeformations?: string[]; // IDs des déformations activées
  selectedItems?: {
    colorPaletteId?: string;
    logoLibraryId?: string;
    // Liste des bibliothèques de logos visibles dans ce module (si vide => tous)
    logoLibraryIds?: string[];
    fontGroupId?: string;
    // Liste des groupes de fonts visibles dans ce module (si vide => tous)
    fontGroupIds?: string[];
    design2DId?: string;
    // Liste des designs 2D visibles dans ce module (si vide => tous)
    design2DIds?: string[];
    sizePatternId?: string;
  };
  colorClassLabels?: Record<string, string>; // Labels personnalisés pour les classes de couleurs (ex: { primary: 'Principal', secondary: 'Secondaire' })
};

// Garder Question pour compatibilité avec l'ancien système
type Question = {
  id: string;
  type: 'text' | 'number' | 'color' | 'image' | 'select';
  label: string;
  required: boolean;
  options?: string[];
};

type CameraView = {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
  cameraViews?: CameraView[];
};

type Design2D = {
  id: string;
  name: string;
  svg_url?: string;
  svgUrl?: string;
  preview_url?: string | null;
  color_mappings?: Record<string, string> | null;
};


// Composant pour prévisualiser une police avec re-render automatique
function FontPreview({ fontFamily, previewText }: { fontFamily: string; previewText: string }) {
  const [fontReady, setFontReady] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!fontFamily || !divRef.current) return;
    
    // APPLIQUER IMMÉDIATEMENT la police même si elle n'est pas encore chargée
    // Le navigateur l'appliquera automatiquement une fois chargée
    const fontFamilyQuoted = `"${fontFamily}"`;
    if (divRef.current) {
      divRef.current.style.fontFamily = fontFamilyQuoted + ', sans-serif';
      divRef.current.style.setProperty('font-family', fontFamilyQuoted + ', sans-serif', 'important');
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    let checkCount = 0;
    const maxChecks = 200; // Augmenter à 200 vérifications (10 secondes max)
    
    const checkFont = () => {
      if (!isMounted || !divRef.current || checkCount >= maxChecks) {
        // Même si la police n'est pas chargée après maxChecks, forcer quand même le style
        if (divRef.current && !fontReady) {
          divRef.current.style.fontFamily = fontFamilyQuoted + ', sans-serif';
          divRef.current.style.setProperty('font-family', fontFamilyQuoted + ', sans-serif', 'important');
          setFontReady(true);
          setForceUpdate(prev => prev + 1);
        }
        return;
      }
      checkCount++;
      
      // Vérifier si la police est chargée avec différentes tailles et formats
      const isReady = document.fonts.check(`12px ${fontFamilyQuoted}`) || 
                     document.fonts.check(`18px ${fontFamilyQuoted}`) ||
                     document.fonts.check(`24px ${fontFamilyQuoted}`) ||
                     document.fonts.check(`12px '${fontFamily}'`) ||
                     document.fonts.check(`18px '${fontFamily}'`) ||
                     document.fonts.check(`24px '${fontFamily}'`);
      
      if (isReady) {
        setFontReady(true);
        // Forcer aussi directement le style pour être sûr
        if (divRef.current) {
          divRef.current.style.fontFamily = fontFamilyQuoted + ', sans-serif';
          divRef.current.style.setProperty('font-family', fontFamilyQuoted + ', sans-serif', 'important');
          // Forcer un re-render en modifiant une propriété qui déclenche un reflow
          setForceUpdate(prev => prev + 1);
        }
      } else {
        // Continuer à forcer le style même si pas encore chargé
        if (divRef.current) {
          divRef.current.style.fontFamily = fontFamilyQuoted + ', sans-serif';
          divRef.current.style.setProperty('font-family', fontFamilyQuoted + ', sans-serif', 'important');
        }
        // Réessayer après un court délai
        timeoutId = setTimeout(checkFont, 50);
      }
    };
    
    // Démarrer la vérification
    checkFont();
    
    // Écouter aussi l'événement fontsloadingdone
    const handleFontsReady = () => {
      if (isMounted && divRef.current) {
        checkFont();
      }
    };
    
    // Écouter aussi loadstart et load
    const handleFontLoad = () => {
      if (isMounted && divRef.current) {
        setTimeout(checkFont, 100);
      }
    };
    
    document.fonts.addEventListener('loadingdone', handleFontsReady);
    document.fonts.addEventListener('load', handleFontLoad);
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.fonts.removeEventListener('loadingdone', handleFontsReady);
      document.fonts.removeEventListener('load', handleFontLoad);
    };
  }, [fontFamily, fontReady]);
  
  return (
    <div 
      key={`font-preview-${fontFamily}-${forceUpdate}`}
      ref={divRef}
      style={{
        width: '100%',
        padding: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60px',
        fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : 'sans-serif',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#111827'
      }}
    >
      {previewText}
    </div>
  );
}

// Composant pour contrôler la caméra via événements personnalisés
function CameraController({ controlsRef, minDistance = 2, maxDistance = 10, viewHasBeenSetRef }: { controlsRef?: React.RefObject<any>, minDistance?: number, maxDistance?: number, viewHasBeenSetRef?: React.RefObject<boolean> }) {
  const { camera } = useThree();

  useEffect(() => {
    const handleGoToCameraView = (event: any) => {
      // Si l'événement contient juste une string (vue legacy), convertir en coordonnées
      if (typeof event.detail === 'string') {
        const view = event.detail;
        
        // Positions hardcodées pour les vues de base
        const defaultPositions: Record<string, {position: {x: number, y: number, z: number}, target: {x: number, y: number, z: number}}> = {
          'front': { position: { x: 0, y: 0, z: 2.14 }, target: { x: 0, y: 0, z: 0 } },
          'back': { position: { x: 0, y: 0, z: -2.14 }, target: { x: 0, y: 0, z: 0 } },
          'left': { position: { x: -2.14, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
          'right': { position: { x: 2.14, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }
        };
        
        if (defaultPositions[view]) {
          const coords = defaultPositions[view];
          
          // Créer un nouvel événement avec les coordonnées
          const convertedEvent = {
            detail: {
              position: coords.position,
              target: coords.target
            }
          };
          
          // Traiter comme un événement normal
          const { position, target } = convertedEvent.detail;
          processPositionAndTarget(position, target);
          return;
        }
      }
      
      // Traitement normal pour les événements avec position/target
      const { position, target } = event.detail;
      if (!position || !target) {
        return;
      }
      
      processPositionAndTarget(position, target);
    };
    
    const processPositionAndTarget = (position: any, target: any) => {
      
      if (camera && position && target && controlsRef?.current) {
        // Marquer qu'une vue a été définie pour empêcher les systèmes d'initialisation
        if (viewHasBeenSetRef) {
          viewHasBeenSetRef.current = true;
        }
        const controls = controlsRef.current;
        
        // Sauvegarder les limites actuelles
        const originalMinDistance = controls.minDistance;
        const originalMaxDistance = controls.maxDistance;
        
        
        // Désactiver temporairement les limites pour permettre n'importe quelle distance
        controls.minDistance = 0;
        controls.maxDistance = Infinity;
        
        // Appliquer le facteur de correction d'échelle pour l'admin
        // Si Z:2.14 est trop zoomé et devrait être Z≈10, facteur = 10/2.14 ≈ 4.67
        const scaleFactor = 4.67;
        
        const correctedPosition = {
          x: position.x * scaleFactor,
          y: position.y * scaleFactor,
          z: position.z * scaleFactor
        };
        
        
        // Mettre à jour la position et le target avec correction
        camera.position.set(correctedPosition.x, correctedPosition.y, correctedPosition.z);
        
        controls.target.set(target.x, target.y, target.z);
        controls.update();
        
        
        // Restaurer les limites après un délai (utiliser les paramètres du composant)
        setTimeout(() => {
          controls.minDistance = minDistance;
          controls.maxDistance = maxDistance;
        }, 500); // Délai plus long pour être sûr
      }
    };

    // Listener pour setCameraView (utilisé par les zones)
    const handleSetCameraView = (event: any) => {
      // Rediriger vers handleGoToCameraView pour traitement unifié
      handleGoToCameraView(event);
    };

    window.addEventListener('goToCameraView', handleGoToCameraView);
    window.addEventListener('setCameraView', handleSetCameraView);
    return () => {
      window.removeEventListener('goToCameraView', handleGoToCameraView);
      window.removeEventListener('setCameraView', handleSetCameraView);
    };
  }, [camera, controlsRef]);


  return null; // Ne rend pas d'OrbitControls, utilise ceux existants
}

// Composant pour l'iframe de prévisualisation (côté client uniquement)
function PreviewIframe({ productId, shop }: { productId: string; shop: string | null }) {
  const configuratorUrl = useMemo(() => {
    const shopParam = shop || (typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : '');
    return `/configure?shop=${shopParam}&productId=${productId}&variantId=1`;
  }, [productId, shop]);

  return (
    <iframe
      src={configuratorUrl}
      style={{
        flex: 1,
        width: '100%',
        border: 'none',
        backgroundColor: '#ffffff'
      }}
      title="Configurateur Preview"
    />
  );
}

// Composant pour l'onglet Connect
function ConnectTabContent({ 
  shop, 
  productId,
  onProductLinked 
}: { 
  shop: string | null; 
  productId: string | null;
  onProductLinked: (shopifyProductId: string, shopifyVariantId: string) => Promise<any> | void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(null);

  // Charger automatiquement le shop domain depuis les paramètres
  useEffect(() => {
    async function loadShopDomain() {
      try {
        const host = window.location.host;
        const subdomainMatch = host.match(/^([^.]+)\./);
        const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
        
        if (!detectedSubdomain) {
          setError('Impossible de détecter le sous-domaine');
          setLoadingShop(false);
          return;
        }

        const response = await fetch(`/api/accounts/shop?subdomain=${detectedSubdomain}`);
        if (response.status === 404) {
          setError('Aucune boutique Shopify connectée. Veuillez d\'abord connecter une boutique dans Settings > Online stores.');
          setLoadingShop(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.shop && data.shop.shop_domain) {
            setShopDomain(data.shop.shop_domain);
            // Charger automatiquement les produits
            fetchProducts(data.shop.shop_domain);
          } else {
            setError('Aucune boutique Shopify connectée. Veuillez d\'abord connecter une boutique dans Settings > Online stores.');
          }
        } else {
          setError('Erreur lors de la récupération des informations de la boutique');
        }
      } catch (err) {
        console.error('Error loading shop domain:', err);
        setError('Erreur lors de la récupération des informations de la boutique');
      } finally {
        setLoadingShop(false);
      }
    }

    loadShopDomain();
  }, []);

  const fetchProducts = async (domain?: string) => {
    const domainToUse = domain || shopDomain;
    
    if (!domainToUse) {
      setError('Aucune boutique Shopify connectée');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shopify/products?shop=${encodeURIComponent(domainToUse)}`);
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Invalid response from server. Please check the console for details.');
      }

      if (!response.ok) {
        const errorMessage = data.error || 'Erreur lors de la récupération des produits';
        const hint = data.hint ? `\n\n💡 ${data.hint}` : '';
        throw new Error(errorMessage + hint);
      }

      console.log('✅ Products fetched:', data.products?.length || 0);
      setProducts(data.products || []);
      
      if (data.products && data.products.length === 0) {
        setError('Aucun produit trouvé dans cette boutique.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProduct = async () => {
    if (!selectedProduct || !selectedVariant) {
      setError('Veuillez sélectionner un produit et une variante');
      return;
    }

    await onProductLinked(selectedProduct.id, selectedVariant.id);
    setError(null);
    
    // Recharger la date de dernière connexion après la connexion
    // La date est stockée dans builder_data.shopify.lastConnectedAt
    // Attendre un peu pour laisser le temps à la DB de se mettre à jour
    setTimeout(() => {
      // Simplement re-cliquer sur le produit pour recharger les données
      // Cela déclenchera le onClick qui charge la date
      if (selectedProduct) {
        const productElement = document.querySelector(`[data-product-id="${selectedProduct.id}"]`);
        if (productElement) {
          (productElement as HTMLElement).click();
        } else {
          // Sinon, mettre à jour manuellement en simulant le clic
          console.log('📅 Rechargement manuel de la date de connexion');
          // La date sera chargée lors du prochain clic sur le produit
          // Pour l'instant, on peut essayer de la récupérer directement depuis le state
          // ou attendre que l'utilisateur clique à nouveau
        }
      }
    }, 1500);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      padding: '32px',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h2 style={{
          fontSize: '24px',
          color: '#ffffff',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Connecter à Shopify
        </h2>
        <p style={{
          fontSize: '14px',
          fontFamily: CONFIGURATOR_PANEL_FONT,
          color: '#a0a0a0',
          marginBottom: '32px'
        }}>
          Sélectionnez le produit Shopify sur lequel vous souhaitez afficher ce configurateur.
        </p>

        {/* Shop Info */}
        {shopDomain && (
          <div style={{ 
            marginBottom: '24px',
            padding: '12px 16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>🏪</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#888888', marginBottom: '4px' }}>Boutique connectée</div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>{shopDomain}</div>
            </div>
            <button
              onClick={() => fetchProducts()}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#2a2a2a' : '#8eff36',
                border: 'none',
                borderRadius: '6px',
                color: loading ? '#666666' : '#000000',
                fontSize: '12px',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        )}

        {loadingShop && (
          <div style={{ 
            padding: '24px',
            textAlign: 'center',
            color: '#a0a0a0',
            fontFamily: CONFIGURATOR_PANEL_FONT
          }}>
            Chargement de la boutique connectée...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#2a1a1a',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>❌</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ef4444', fontSize: '14px' }}>Erreur</div>
                <div style={{ color: '#ef4444', fontSize: '14px', whiteSpace: 'pre-line' }}>{error}</div>
                {error.includes('protégée par un mot de passe') && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#1a2a1a', borderRadius: '6px', border: '1px solid #8eff36' }}>
                    <div style={{ fontSize: '12px', color: '#8eff36', fontWeight: '600', marginBottom: '8px' }}>💡 Solution :</div>
                    <div style={{ fontSize: '12px', color: '#ffffff' }}>
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Connectez-vous à votre admin Shopify</li>
                        <li>Allez dans <strong>Settings</strong> → <strong>Password protection</strong></li>
                        <li>Désactivez la protection par mot de passe</li>
                        <li>Rechargez les produits ici</li>
                      </ol>
                    </div>
                  </div>
                )}
                {!error.includes('protégée par un mot de passe') && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#888888' }}>
                    <strong>Conseils :</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>Vérifiez que le domaine est correct (ex: <code style={{ color: '#8eff36' }}>votre-boutique.myshopify.com</code>)</li>
                      <li>Assurez-vous que la boutique Shopify est accessible publiquement</li>
                      <li>Vérifiez que l'API publique JSON est activée (par défaut activée)</li>
                      <li>Essayez d'accéder directement à : <code style={{ color: '#8eff36' }}>https://{shopDomain || 'votre-boutique.myshopify.com'}/products.json</code></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        {products.length > 0 && (
          <div>
            <h3 style={{
              fontSize: '18px',
              color: '#ffffff',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Sélectionnez un produit ({products.length} trouvé{products.length > 1 ? 's' : ''})
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={async () => {
                    setSelectedProduct(product);
                    setSelectedVariant(product.variants[0] || null);
                    // Charger la date de dernière connexion si ce produit est déjà connecté
                    if (productId) {
                      try {
                        const response = await fetch(`/api/products/${productId}`);
                        if (response.ok) {
                          const data = await response.json();
                          const lastConnected = data.product?.builder_data?.shopify?.lastConnectedAt;
                          // Vérifier si ce produit Shopify est connecté (peut être dans shopify_product_id ou builder_data.shopify.productId)
                          const connectedProductId = data.product?.shopify_product_id || data.product?.builder_data?.shopify?.productId;
                          // Comparer les IDs en tant que strings pour éviter les problèmes de type
                          const isConnected = lastConnected && (
                            String(connectedProductId) === String(product.id) || 
                            String(connectedProductId) === String(product.id.toString())
                          );
                          console.log('📅 Produit data:', {
                            shopify_product_id: data.product?.shopify_product_id,
                            builder_data_shopify_productId: data.product?.builder_data?.shopify?.productId,
                            connectedProductId,
                            product_id: product.id,
                            product_id_string: String(product.id),
                            isConnected,
                            lastConnected
                          });
                          if (isConnected) {
                            console.log('📅 Date de connexion trouvée:', lastConnected);
                            setLastConnectedAt(lastConnected);
                          } else {
                            console.log('📅 Pas de date de connexion pour ce produit');
                            setLastConnectedAt(null);
                          }
                        }
                      } catch (err) {
                        console.error('Error loading last connected at:', err);
                        setLastConnectedAt(null);
                      }
                    }
                  }}
                  style={{
                    padding: '16px',
                    backgroundColor: selectedProduct?.id === product.id ? '#1a1a1a' : '#0a0a0a',
                    border: selectedProduct?.id === product.id ? '2px solid #8eff36' : '1px solid #2a2a2a',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {product.images[0] && (
                      <img
                        src={product.images[0].src}
                        alt={product.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          backgroundColor: '#1a1a1a'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#ffffff',
                        margin: '0 0 8px 0',
                        fontWeight: '600'
                      }}>
                        {product.title}
                      </h4>
                      {product.vendor && (
                        <p style={{
                          fontSize: '12px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#a0a0a0',
                          margin: '0 0 8px 0'
                        }}>
                          {product.vendor}
                        </p>
                      )}
                      {selectedProduct?.id === product.id && (
                        <div style={{ marginTop: '12px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            color: '#a0a0a0',
                            marginBottom: '8px'
                          }}>
                            Variante
                          </label>
                          <select
                            value={selectedVariant?.id || ''}
                            onChange={(e) => {
                              const variant = product.variants.find((v: any) => v.id === e.target.value);
                              setSelectedVariant(variant || null);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              backgroundColor: '#0a0a0a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '14px',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {product.variants.map((variant: any) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.title} - {variant.price}€
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Date de dernière connexion en bas à droite */}
                  {selectedProduct?.id === product.id && lastConnectedAt && (
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '16px',
                      fontSize: '11px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      color: '#888888',
                      textAlign: 'right',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      zIndex: 10
                    }}>
                      <div style={{ marginBottom: '2px', fontSize: '10px' }}>Dernière connexion:</div>
                      <div style={{ fontWeight: '500', color: '#ffffff', fontSize: '11px' }}>
                        {new Date(lastConnectedAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Link Button */}
            {selectedProduct && selectedVariant && (
              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={handleLinkProduct}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#8eff36',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000000',
                    fontSize: '16px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7ae626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#8eff36';
                  }}
                >
                  Connecter "{selectedProduct.title}" à ce configurateur
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && products.length === 0 && shopDomain && (
          <p style={{
            fontSize: '14px',
            fontFamily: CONFIGURATOR_PANEL_FONT,
            color: '#a0a0a0',
            textAlign: 'center',
            padding: '32px'
          }}>
            Aucun produit trouvé. Vérifiez que le domaine est correct.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProductBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('Untitled Product');
  
  const [activeTab, setActiveTab] = useState<Tab>('build');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customizationModules, setCustomizationModules] = useState<CustomizationModule[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionSettings, setShowQuestionSettings] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [newModule, setNewModule] = useState<Partial<CustomizationModule>>({
    tabName: '',
    icon: '🎨',
    inputType: 'thumbnail', // Par défaut, sera toujours 'thumbnail' pour la V1
    contentType: null
  });
  const [newModuleIconFile, setNewModuleIconFile] = useState<File | null>(null);
  const [selectedModuleIconFile, setSelectedModuleIconFile] = useState<File | null>(null);
  const [selectedModule, setSelectedModule] = useState<CustomizationModule | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deformationsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colorScrollRef = useRef<HTMLDivElement>(null);
  const strokeScrollRef = useRef<HTMLDivElement>(null);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [designs2D, setDesigns2D] = useState<Design2D[]>([]);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<string | null>(null);
  const [mobileActivePanel, setMobileActivePanel] = useState<string | null>(null); // Panneau actif dans la simulation mobile
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [selectedColorClass, setSelectedColorClass] = useState<string | null>(null); // Pour gérer l'étape de sélection de couleur
  const [designColors, setDesignColors] = useState<Record<string, string>>({}); // Stocker les couleurs sélectionnées pour le design
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null); // Pour le drag & drop des modules dans la sidebar gauche
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // Index de l'élément survolé pendant le drag
  const [logoLibraries, setLogoLibraries] = useState<any[]>([]);
  const [fontGroups, setFontGroups] = useState<any[]>([]);
  const [sizePatterns, setSizePatterns] = useState<any[]>([]);
  const [materialMaps, setMaterialMaps] = useState<any[]>([]);
  const [modelMaterialMaps, setModelMaterialMaps] = useState<Record<string, any>>({}); // material_map_id -> material map avec fichiers
  const [modelSpecificMaterialMaps, setModelSpecificMaterialMaps] = useState<Record<string, any>>({}); // Material maps spécifiques au modèle depuis /api/models/[id]/materials
  const [show3DSettings, setShow3DSettings] = useState(false);
  const [zoomSpeed, setZoomSpeed] = useState(1);
  
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(10);
  const [initialZoom, setInitialZoom] = useState(5);
  const [initialRotation, setInitialRotation] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [snapshots, setSnapshots] = useState<{ mobile: string | null; desktop: string | null } | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<'mobile' | 'desktop'>('desktop');
  // Distances de zoom par vue
  const [viewDistance, setViewDistance] = useState<Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', number>>({
    'torse': 5,
    'dos': 5,
    'bras-gauche': 5,
    'bras-droit': 5
  });
  // Shopify connection
  const [shopifyProductId, setShopifyProductId] = useState<string | null>(null);
  const [shopifyVariantId, setShopifyVariantId] = useState<string | null>(null);
  
  // Text management states
  const [uv2Canvas, setUv2Canvas] = useState<HTMLCanvasElement | null>(null);
  const [uv2PreviewUrl, setUv2PreviewUrl] = useState<string | null>(null);
  
  // Update UV2 preview when canvas changes
  useEffect(() => {
    if (uv2Canvas) {
      const updatePreview = () => {
        setUv2PreviewUrl(uv2Canvas.toDataURL());
      };
      updatePreview();
      // Update preview periodically to catch canvas changes
      const interval = setInterval(updatePreview, 100);
      return () => clearInterval(interval);
    } else {
      setUv2PreviewUrl(null);
    }
  }, [uv2Canvas]);
  const [placedLogos, setPlacedLogos] = useState<Array<{
    id: string;
    logoId: string;
    variantId: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
    width?: number;
    height?: number;
  }>>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [texts, setTexts] = useState<Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    rotation: number;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeWidthUnit?: 'px';
    deformation?: string;
    deformationIntensity?: number;
    fillType?: 'solid' | 'gradient';
    gradientColors?: string[];
    gradientDirection?: 'horizontal' | 'vertical';
  }>>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [activeTextTab, setActiveTextTab] = useState<'contenu' | 'police' | 'couleur' | 'contour' | 'deformation'>('contenu');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isRotatingText, setIsRotatingText] = useState(false);
  const [isResizingText, setIsResizingText] = useState(false);
  const [isPlacingText, setIsPlacingText] = useState<'nom' | 'numero' | null>(null);
  const [zoneGroups, setZoneGroups] = useState<Array<{ id: string; name: string; zones: Array<{ id: string; name: string; view?: string; position: [number, number, number]; thumbnailUrl?: string; rotation?: number; width?: number; height?: number }> }>>([
    {
      id: 'f9f8c4fa-66a3-4f59-9296-6466dda70f24', // Utiliser le vrai ID du groupe
      name: 'Zones Test',
      zones: [
        {
          id: 'test-zone-face',
          name: 'Zone Face Test',
          position: [0.5, 0.5, 0],
          view: 'Face',
          width: 0.2,
          height: 0.2
        },
        {
          id: 'test-zone-dos',
          name: 'Zone Dos Test', 
          position: [0.5, 0.3, 0],
          view: 'Dos',
          width: 0.2,
          height: 0.2
        }
      ]
    }
  ]);
  const [textZones, setTextZones] = useState<any[]>([]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const [showZoneSelectionModal, setShowZoneSelectionModal] = useState(false);
  const [targetView, setTargetView] = useState<'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null>(null);
  // Ref persistant pour marquer qu'une vue a été définie via les boutons (ne se réinitialise jamais)
  const viewHasBeenSetRef = useRef(false);
  // États pour le module logos
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [showLogoZoneModal, setShowLogoZoneModal] = useState(false);
  const [selectedLogoForZone, setSelectedLogoForZone] = useState<{logoId: string, variantId?: string, variantFile?: string} | null>(null);
  const [activeLogoView, setActiveLogoView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [selectedLogoZoneId, setSelectedLogoZoneId] = useState<string>('');
  const [selectedLogoForVariants, setSelectedLogoForVariants] = useState<any | null>(null);
  const [logoToReplace, setLogoToReplace] = useState<string | null>(null); // ID du logo placé à remplacer
  const [logoSearchQuery, setLogoSearchQuery] = useState<string>('');
  const logoScrollRef = useRef<HTMLDivElement>(null);
  
  // États pour l'importation de logo
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importedFilePreview, setImportedFilePreview] = useState<string | null>(null);
  const [showBackgroundRemoverModal, setShowBackgroundRemoverModal] = useState(false);
  const [backgroundRemoverEnabled, setBackgroundRemoverEnabled] = useState(false);
  const [backgroundRemoverPreview, setBackgroundRemoverPreview] = useState<{original: string, processed: string} | null>(null);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'logo' | 'text'} | null>(null);
  
  // Sélectionner automatiquement la première vue quand le panel logo s'ouvre
  useEffect(() => {
    const activeModule = customizationModules.find(m => m.id === activeCustomizerTab) || 
                         customizationModules.find(m => m.id === mobileActivePanel);
    if (activeModule?.contentType === 'logos' && activeModule.logoPlacementMode === 'zones') {
      const customViews = activeModule.viewLabels || [];
      if (customViews.length > 0) {
        // Vérifier si la vue actuelle existe dans les vues disponibles
        const currentViewExists = customViews.some(v => v.id === activeLogoView);
        if (!currentViewExists) {
          // Sélectionner la première vue (à gauche)
          const firstView = customViews[0];
          if (firstView) {
            setActiveLogoView(firstView.id as any);
            
            // Charger les vues de caméra du modèle 3D et pivoter si nécessaire
            const selectedModel = models3D.find(m => m.id === selectedModel3DId);
            const modelCameraViews = selectedModel?.cameraViews || [];
            
            // Si une vue de caméra personnalisée est configurée, l'utiliser
            if (firstView.cameraViewId) {
              const cameraView = modelCameraViews.find(cv => cv.id === firstView.cameraViewId);
              if (cameraView) {
                window.dispatchEvent(new CustomEvent('goToCameraView', { 
                  detail: {
                    position: cameraView.position,
                    target: cameraView.target
                  }
                }));
              } else {
                window.dispatchEvent(new CustomEvent('setCameraView', { detail: firstView.id }));
              }
            } else {
              window.dispatchEvent(new CustomEvent('setCameraView', { detail: firstView.id }));
            }
          }
        }
      }
    }
  }, [activeCustomizerTab, mobileActivePanel, customizationModules, models3D, selectedModel3DId]);

  // Ouvrir/fermer la bibliothèque selon la sélection du logo
  useEffect(() => {
    // Vérifier si on est dans le module logos
    const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
    if (activeModule?.contentType === 'logos') {
      if (selectedLogoId) {
        // Logo sélectionné : ouvrir la bibliothèque si nécessaire
        const logo = placedLogos.find(l => l.id === selectedLogoId);
        if (logo) {
          // Si on n'est pas déjà en mode remplacement, définir logoToReplace (peu importe si bibliothèque déjà ouverte)
          if (!logoToReplace) {
            // Ouvrir la bibliothèque pour remplacer le logo
            setLogoToReplace(selectedLogoId);
            setShowLogoLibrary(true);
          } else {
          }
        }
      } else {
        // Logo désélectionné : fermer la bibliothèque si elle était ouverte pour un remplacement
        if (logoToReplace && showLogoLibrary) {
          setShowLogoLibrary(false);
          setLogoToReplace(null);
          setSelectedLogoForVariants(null);
        }
      }
    }
  }, [selectedLogoId, activeCustomizerTab, customizationModules, placedLogos, logoToReplace, showLogoLibrary]);

  // Forcer les styles du configurator-panel après le rendu (pour surcharger les styles inline React)
  // Fonction SCOPÉE pour forcer Inter et couleurs bleues UNIQUEMENT dans le configurator-panel
  const forceConfiguratorPanelStyles = useCallback((element?: Element) => {
    // Fonction pour vérifier si un élément appartient au configurator-panel ou à ses modaux
    const isInConfiguratorPanel = (el: Element): boolean => {
      const panel = document.querySelector('.configurator-panel');
      if (!panel) return false;
      
      // Vérifier si l'élément est dans le panel
      if (panel.contains(el)) return true;
      
      // Vérifier si l'élément est dans un modal du configurator (UNIQUEMENT les classes spécifiques)
      const isInModal = el.closest('.configurator-panel-modal') !== null ||
                       el.closest('.zone-selection-modal-content') !== null ||
                       el.classList.contains('configurator-panel-modal') ||
                       el.classList.contains('zone-selection-modal-content');
      
      return isInModal;
    };
    
    // Vérifier d'abord que le panel existe
    const panel = document.querySelector('.configurator-panel');
    if (!panel) return; // Ne rien faire si le panel n'existe pas
    
    // Traiter le panel ET tous les modaux même en dehors
    const modals = document.querySelectorAll('.configurator-panel-modal, .zone-selection-modal-content');
    
    const targets: Element[] = [];
    if (element && isInConfiguratorPanel(element)) {
      targets.push(element);
    } else {
      targets.push(panel);
      modals.forEach(modal => targets.push(modal));
    }
    
    if (targets.length === 0) return;

    // Traiter chaque cible et tous ses enfants
    targets.forEach(target => {
      // Vérifier que la cible est bien dans le configurator-panel
      if (!isInConfiguratorPanel(target)) return;
      
      const allElements = target.querySelectorAll('*');
      const elementsToProcess = [target, ...Array.from(allElements)];
      
      elementsToProcess.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl) return;
        
        // VÉRIFIER que l'élément est bien dans le configurator-panel avant d'appliquer les styles
        if (!isInConfiguratorPanel(el)) return;
        
        // NE PAS forcer Inter via JavaScript - laisser le CSS faire le travail
        // Le CSS est déjà bien scoped et devrait suffire
        // On force uniquement les couleurs des boutons ici
        
        // FORCER les styles pour les inputs dans les modaux desktop
        if (htmlEl.tagName === 'INPUT' && (htmlEl.closest('.zone-selection-modal-content') || htmlEl.closest('.configurator-panel-modal'))) {
          // Forcer le backgroundColor blanc et la couleur du texte noire
          htmlEl.style.setProperty('background-color', '#ffffff', 'important');
          htmlEl.style.setProperty('backgroundColor', '#ffffff', 'important');
          htmlEl.style.setProperty('background', '#ffffff', 'important');
          htmlEl.style.setProperty('color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
          htmlEl.style.setProperty('border', '1px solid #d1d5db', 'important');
          htmlEl.style.setProperty('border-radius', '6px', 'important');
        }
        
        // FORCER les polices dans les cartes de prévisualisation
        // Chercher les divs qui contiennent du texte de prévisualisation de police
        if (htmlEl.tagName === 'DIV' && htmlEl.closest('.configurator-panel')) {
          const style = htmlEl.getAttribute('style') || '';
          const hasPreviewStyle = style.includes('backgroundColor: #f5f5f5') || 
                                 style.includes('background-color: #f5f5f5') ||
                                 htmlEl.style.backgroundColor === 'rgb(245, 245, 245)' ||
                                 htmlEl.style.backgroundColor === '#f5f5f5';
          
          if (hasPreviewStyle && htmlEl.textContent && htmlEl.textContent.length > 0 && htmlEl.textContent.length < 20) {
            // C'est probablement une carte de prévisualisation de police
            // Vérifier si une fontFamily est définie dans le style
            const fontFamilyMatch = style.match(/fontFamily:\s*["']([^"']+)["']/i) || 
                                   style.match(/font-family:\s*["']([^"']+)["']/i);
            
            if (fontFamilyMatch && fontFamilyMatch[1]) {
              const fontFamily = fontFamilyMatch[1];
              // Forcer l'application de la police
              htmlEl.style.setProperty('font-family', `"${fontFamily}", sans-serif`, 'important');
              htmlEl.style.fontFamily = `"${fontFamily}", sans-serif`;
            }
          }
        }
        
        // FORCER les labels du background remover en noir
        if (htmlEl.classList.contains('background-remover-label')) {
          htmlEl.style.setProperty('color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
          htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
        }
        
        // FORCER les noms des zones en noir dans les modaux desktop
        // Chercher tous les paragraphes et spans dans les modaux qui contiennent des noms de zones
        if ((htmlEl.tagName === 'P' || htmlEl.tagName === 'SPAN' || htmlEl.tagName === 'DIV') && 
            (htmlEl.closest('.zone-selection-modal-content') || htmlEl.closest('.configurator-panel-modal'))) {
          // Vérifier si c'est un label de zone (contenant le nom de la zone)
          const parentDiv = htmlEl.closest('div');
          const textContent = (htmlEl.textContent || '').toLowerCase();
          const parentStyle = parentDiv?.getAttribute('style') || '';
          // Si le texte contient des noms de zones typiques ou si le parent a un padding spécifique
          if (parentDiv && (
              parentDiv.style.padding === '12px' || 
              parentDiv.style.padding === '10px' || 
              parentStyle.includes('padding: 12px') || 
              parentStyle.includes('padding: 10px') ||
              parentStyle.includes("padding: '12px'") ||
              parentStyle.includes("padding: '10px'") ||
              textContent.includes('dos') ||
              textContent.includes('face') ||
              textContent.includes('nom') ||
              textContent.includes('zone') ||
              textContent.includes('logo') ||
              textContent.includes('bras') ||
              textContent.includes('torse')
            )) {
            // C'est probablement un label de zone - forcer la couleur noire
            htmlEl.style.setProperty('color', '#111827', 'important');
            htmlEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
            htmlEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
            // Forcer aussi sur tous les enfants
            const children = htmlEl.querySelectorAll('*');
            children.forEach((child: Element) => {
              const childEl = child as HTMLElement;
              childEl.style.setProperty('color', '#111827', 'important');
              childEl.style.setProperty('-webkit-text-fill-color', '#111827', 'important');
              childEl.style.setProperty('-webkit-text-stroke-color', '#111827', 'important');
            });
          }
        }
        
        // FORCER le backgroundColor et borderRadius pour les cercles de couleurs depuis l'attribut data-color
        // Cela permet de contourner les règles CSS avec !important qui surchargent les styles inline React
        if (htmlEl.classList.contains('color-circle-button') || htmlEl.classList.contains('color-circle-indicator')) {
          const dataColor = htmlEl.getAttribute('data-color');
          if (dataColor && dataColor !== 'transparent' && dataColor !== 'undefined') {
            // Forcer le backgroundColor depuis l'attribut data-color avec !important
            htmlEl.style.setProperty('background-color', dataColor, 'important');
            htmlEl.style.setProperty('backgroundColor', dataColor, 'important');
          }
          
          // FORCER le borderRadius à 50% pour les cercles (uniquement pour les boutons, pas les divs)
          if (htmlEl.classList.contains('color-circle-button')) {
            // Forcer le borderRadius à 50% pour créer un cercle parfait (comme dans le header)
            htmlEl.style.setProperty('border-radius', '50%', 'important');
            htmlEl.style.setProperty('borderRadius', '50%', 'important');
            // S'assurer que l'aspectRatio est 1:1 pour un cercle parfait
            htmlEl.style.setProperty('aspect-ratio', '1', 'important');
            htmlEl.style.setProperty('aspectRatio', '1', 'important');
            // FORCER la border pour correspondre au style du header
            // Les styles inline React définissent '2px solid #e5e7eb', on force avec !important
            const inlineStyle = htmlEl.getAttribute('style') || '';
            // Vérifier si une border est déjà définie dans les styles inline
            if (inlineStyle.includes('border:') || inlineStyle.includes('border:')) {
              // Extraire la border depuis les styles inline si possible
              const borderMatch = inlineStyle.match(/border:\s*([^;]+)/i);
              if (borderMatch) {
                htmlEl.style.setProperty('border', borderMatch[1].trim(), 'important');
              } else {
                // Fallback: utiliser la même border que dans le code React
                htmlEl.style.setProperty('border', '2px solid #e5e7eb', 'important');
              }
            } else {
              // Si pas de border dans les styles inline, utiliser la valeur par défaut
              htmlEl.style.setProperty('border', '2px solid #e5e7eb', 'important');
            }
          }
        }
        
        // FORCER BLEU sur TOUS les boutons primaires ET FORCER TEXTE BLANC
        if (htmlEl.tagName === 'BUTTON') {
          // Ne pas traiter les boutons de couleurs ici
          if (htmlEl.classList.contains('color-circle-button')) {
            return; // Déjà traité ci-dessus
          }
          
          // Ne pas traiter les boutons de viewport (desktop/mobile switch)
          const buttonTitle = htmlEl.getAttribute('title') || '';
          if (buttonTitle === 'Vue ordinateur' || buttonTitle === 'Vue téléphone') {
            // Forcer le backgroundColor blanc et le SVG noir pour les boutons de viewport
            htmlEl.style.setProperty('background-color', '#ffffff', 'important');
            htmlEl.style.setProperty('backgroundColor', '#ffffff', 'important');
            
            // Forcer le SVG et ses paths en noir
            const svgs = htmlEl.querySelectorAll('svg');
            svgs.forEach((svg: Element) => {
              const svgEl = svg as HTMLElement;
              svgEl.style.setProperty('stroke', '#000000', 'important');
              svgEl.style.setProperty('fill', 'none', 'important');
              svgEl.setAttribute('stroke', '#000000');
              svgEl.setAttribute('fill', 'none');
              
              const paths = svgEl.querySelectorAll('path');
              paths.forEach((path: Element) => {
                const pathEl = path as HTMLElement;
                pathEl.style.setProperty('stroke', '#000000', 'important');
                pathEl.setAttribute('stroke', '#000000');
              });
            });
            
            return; // Ne pas traiter ce bouton comme un bouton primaire
          }
          
          const reactBgColor = htmlEl.style.backgroundColor || htmlEl.style.getPropertyValue('background-color');
          const inlineStyle = htmlEl.getAttribute('style') || '';
          
          // Détecter bouton primaire (bleu ou noir qui doit être bleu)
          const isPrimaryButton = reactBgColor === 'rgb(59, 130, 246)' ||
                                 reactBgColor === '#3b82f6' ||
                                 reactBgColor === 'rgb(0, 0, 0)' || 
                                 reactBgColor === '#000000' || 
                                 reactBgColor === 'black' ||
                                 htmlEl.classList.contains('btn-primary') ||
                                 htmlEl.classList.contains('mobile-action-btn-black') ||
                                 inlineStyle.includes('backgroundColor: \'#3b82f6\'') ||
                                 inlineStyle.includes('background-color: #3b82f6') ||
                                 inlineStyle.includes('backgroundColor: \'#000000\'') ||
                                 inlineStyle.includes('background-color: #000000') ||
                                 inlineStyle.includes('backgroundColor:#000000') ||
                                 inlineStyle.includes('rgb(0, 0, 0)') ||
                                 inlineStyle.includes('rgb(0,0,0)');
          
          // Ne pas changer si c'est un bouton de couleur (qui affiche une couleur réelle)
          const isColorButton = inlineStyle.includes('color?.hex') || 
                               htmlEl.getAttribute('data-color-button') === 'true' ||
                               htmlEl.closest('[class*="color"]') !== null;
          
          if (isPrimaryButton && !isColorButton) {
            // Forcer le fond bleu
            htmlEl.style.setProperty('background-color', '#3b82f6', 'important');
            htmlEl.style.setProperty('backgroundColor', '#3b82f6', 'important');
            
            // FORCER LE TEXTE EN BLANC sur le bouton
            htmlEl.style.setProperty('color', '#ffffff', 'important');
            htmlEl.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
            
            // Forcer aussi sur tous les éléments enfants (span, div, p, etc.)
            const children = htmlEl.querySelectorAll('*');
            children.forEach((child: Element) => {
              const childEl = child as HTMLElement;
              childEl.style.setProperty('color', '#ffffff', 'important');
              childEl.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
              
              // Forcer aussi sur les SVG
              if (childEl.tagName === 'svg') {
                childEl.style.setProperty('stroke', '#ffffff', 'important');
                childEl.style.setProperty('fill', '#ffffff', 'important');
                childEl.setAttribute('stroke', '#ffffff');
                childEl.setAttribute('fill', 'none');
              }
              
              // Forcer aussi sur les paths dans les SVG
              if (childEl.tagName === 'path') {
                childEl.style.setProperty('stroke', '#ffffff', 'important');
                childEl.setAttribute('stroke', '#ffffff');
              }
            });
            
            // Mettre à jour aussi l'attribut style si présent
            if (inlineStyle.includes('backgroundColor: \'#000000\'')) {
              const newStyle = inlineStyle.replace(/backgroundColor:\s*['"]#000000['"]/g, "backgroundColor: '#3b82f6'");
              htmlEl.setAttribute('style', newStyle);
            }
            if (inlineStyle.includes('background-color: #000000')) {
              const newStyle = inlineStyle.replace(/background-color:\s*#000000/g, "background-color: #3b82f6");
              htmlEl.setAttribute('style', newStyle);
            }
          }
        }
      });
    });
  }, []);

  // Utiliser useLayoutEffect et useEffect avec MutationObserver pour détecter les changements DOM
  // IMPORTANT: Ne s'exécute QUE si le panel existe et uniquement sur les éléments du panel
  useEffect(() => {
    const panel = document.querySelector('.configurator-panel');
    if (!panel) return;

    // Vérifier que le panel existe avant d'exécuter
    const checkAndForce = () => {
      const currentPanel = document.querySelector('.configurator-panel');
      if (!currentPanel) return;
      forceConfiguratorPanelStyles();
    };

    // Exécuter immédiatement
    checkAndForce();

    // Fonction pour vérifier si un élément appartient au configurator-panel ou à ses modaux
    const isConfiguratorElement = (element: Element): boolean => {
      return panel.contains(element) || 
             element.classList.contains('configurator-panel') ||
             element.classList.contains('configurator-panel-modal') ||
             element.classList.contains('zone-selection-modal-content') ||
             (element.closest('.configurator-panel-modal') !== null) ||
             (element.closest('.zone-selection-modal-content') !== null);
    };

    // Créer un MutationObserver pour détecter les changements DOM en temps réel dans le panel
    const panelObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (isConfiguratorElement(element)) {
              forceConfiguratorPanelStyles(element);
            }
          }
        });
        
        // Vérifier aussi les changements d'attributs (comme style)
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          if (isConfiguratorElement(target)) {
            forceConfiguratorPanelStyles(target);
          }
        }
      });
    });

    // Observer les changements dans le panel
    panelObserver.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    // Observer aussi document.body pour capturer les modaux qui sont rendus en dehors du panel
    // IMPORTANT: Observer UNIQUEMENT les modaux avec les classes spécifiques
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Vérifier UNIQUEMENT si c'est un modal du configurator avec les classes spécifiques
            // Ne pas utiliser querySelector car ça pourrait matcher d'autres éléments
            const isConfiguratorModal = element.classList.contains('configurator-panel-modal') ||
                element.classList.contains('zone-selection-modal-content');
            
            // Vérifier aussi si l'élément contient un modal du configurator (mais pas via querySelector qui est trop large)
            const hasConfiguratorModalChild = Array.from(element.children).some(child => 
              child.classList.contains('configurator-panel-modal') ||
              child.classList.contains('zone-selection-modal-content')
            );
            
            if (isConfiguratorModal || hasConfiguratorModalChild) {
              // Attendre un peu pour que le modal soit complètement rendu
              setTimeout(() => {
                forceConfiguratorPanelStyles(element);
              }, 50);
              // Forcer aussi immédiatement
              forceConfiguratorPanelStyles(element);
            }
          }
        });
        
        // Vérifier aussi les changements d'attributs sur les modaux
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          // Vérifier UNIQUEMENT les classes spécifiques
          const isConfiguratorModal = target.classList.contains('configurator-panel-modal') ||
              target.classList.contains('zone-selection-modal-content');
          
          // Vérifier aussi si l'élément est dans un modal du configurator
          const isInConfiguratorModal = target.closest('.configurator-panel-modal') !== null ||
              target.closest('.zone-selection-modal-content') !== null;
          
          if (isConfiguratorModal || isInConfiguratorModal) {
            forceConfiguratorPanelStyles(target);
          }
        }
      });
    });

    // Observer document.body pour les modaux mais UNIQUEMENT ceux avec les classes spécifiques
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Exécuter périodiquement aussi pour capturer les éléments qui pourraient être manqués
    // IMPORTANT: Vérifier que le panel existe à chaque fois
    const interval = setInterval(() => {
      const currentPanel = document.querySelector('.configurator-panel');
      if (!currentPanel) return; // Ne rien faire si le panel n'existe pas
      
      // Forcer uniquement sur le panel et les modaux spécifiques
      forceConfiguratorPanelStyles();
      
      // Forcer aussi sur les modaux qui sont en dehors du panel (UNIQUEMENT les classes spécifiques)
      const modals = document.querySelectorAll('.configurator-panel-modal, .zone-selection-modal-content');
      modals.forEach(modal => {
        forceConfiguratorPanelStyles(modal);
      });
    }, 300); // Plus fréquent pour capturer plus rapidement

    return () => {
      panelObserver.disconnect();
      bodyObserver.disconnect();
      clearInterval(interval);
    };
  }, [forceConfiguratorPanelStyles, customizationModules, activeCustomizerTab, selectedLogoId, texts, placedLogos]);

  const getTextModuleConfig = useCallback(() => {
    if (!customizationModules || customizationModules.length === 0) return undefined;
    const activeTextModule = customizationModules.find(
      module => module.contentType === 'text' && module.id === activeCustomizerTab
    );
    if (activeTextModule) return activeTextModule;
    return customizationModules.find(module => module.contentType === 'text');
  }, [customizationModules, activeCustomizerTab]);

  // Charger les fonts pour la prévisualisation et le 3D
  useEffect(() => {
    if (fontGroups.length === 0) return;
    
    const activeModule = getTextModuleConfig();
    const allowedGroupIds = activeModule?.selectedItems?.fontGroupIds;
    
    const fontsToLoad: Array<{ id: string; name: string; display_name: string; file_url: string; file_type?: string }> = [];
    fontGroups.forEach(group => {
      if (group.fonts && (!allowedGroupIds || allowedGroupIds.length === 0 || allowedGroupIds.includes(group.id))) {
        group.fonts.forEach((font: any) => {
          if (font.file_url && (font.name || font.display_name)) {
            fontsToLoad.push({
              id: font.id,
              name: font.name || font.display_name,
              display_name: font.display_name || font.name,
              file_url: font.file_url,
              file_type: font.file_type || font.format
            });
          }
        });
      }
    });
    
    // Charger toutes les fonts en parallèle avec FontFace API (comme dans ModelViewer)
    Promise.all(fontsToLoad.map(async (font) => {
      // Vérifier si la font est déjà chargée
      if (loadedFonts.has(font.id)) return;
      const existingStyle = document.querySelector(`style[data-font-id="${font.id}"]`);
      if (existingStyle) {
        // Vérifier si la police est réellement chargée dans document.fonts
        const fontFamily = font.display_name || font.name;
        if (document.fonts.check(`12px "${fontFamily}"`)) {
          setLoadedFonts(prev => new Set([...prev, font.id]));
          return;
        }
      }
      
      try {
        // Utiliser display_name comme font-family (comme dans ModelViewer)
        const fontFamily = font.display_name || font.name;
        
        // Charger la police comme blob (comme dans ModelViewer)
        const response = await fetch(font.file_url);
        if (!response.ok) {
          console.error('Failed to fetch font:', font.name || font.display_name, 'Status:', response.status);
          return;
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Créer le @font-face rule
        const style = document.createElement('style');
        style.setAttribute('data-font-id', font.id);
        const format = font.file_type === 'woff' ? 'woff' : 
                      font.file_type === 'woff2' ? 'woff2' : 
                      font.file_type === 'otf' ? 'opentype' : 
                      'truetype';
        style.textContent = `@font-face { font-family: '${fontFamily}'; src: url('${blobUrl}') format('${format}'); }`;
        document.head.appendChild(style);
        
        // Créer FontFace et attendre qu'elle soit chargée (comme dans ModelViewer)
        const fontFace = new FontFace(fontFamily, `url('${blobUrl}')`);
        try {
          await fontFace.load();
          document.fonts.add(fontFace);
          setLoadedFonts(prev => new Set([...prev, font.id]));
        } catch (err) {
          console.error('Failed to load FontFace for:', font.name || font.display_name, err);
          // Même si FontFace échoue, on marque comme chargé car le @font-face est créé
          setLoadedFonts(prev => new Set([...prev, font.id]));
        }
      } catch (err) {
        console.error('Failed to load font:', font.name || font.display_name, err);
      }
    }));
  }, [fontGroups, customizationModules, activeCustomizerTab]);

  const convertLegacyStrokeWidth = (value: number, minPx: number, maxPx: number) => {
    if (!Number.isFinite(value)) return minPx;
    if (value <= 2 && maxPx > minPx) {
      const ratio = value <= 1 ? value : value / 2;
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      return minPx + (maxPx - minPx) * clampedRatio;
    }
    return value;
  };

  const getTextConstraintValues = useCallback(() => {
    const module = getTextModuleConfig();

    let minFontSizePx = Number(module?.textMinFontSize ?? 10);
    let maxFontSizePx = Number(module?.textMaxFontSize ?? 500);
    if (!Number.isFinite(minFontSizePx) || minFontSizePx <= 0) minFontSizePx = 10;
    if (!Number.isFinite(maxFontSizePx) || maxFontSizePx <= 0) maxFontSizePx = 500;
    if (maxFontSizePx < minFontSizePx) {
      const temp = minFontSizePx;
      minFontSizePx = maxFontSizePx;
      maxFontSizePx = temp;
    }

    let strokeMinWidthPx = Number(module?.textStrokeMinWidth ?? 0);
    if (!Number.isFinite(strokeMinWidthPx) || strokeMinWidthPx < 0) strokeMinWidthPx = 0;

    let strokeMaxWidthPx = Number(module?.textStrokeMaxWidth ?? 50);
    if (!Number.isFinite(strokeMaxWidthPx) || strokeMaxWidthPx <= strokeMinWidthPx) {
      strokeMaxWidthPx = Math.max(strokeMinWidthPx + 1, 50);
    }

    let baseStrokeWidthPx = Number(module?.textBaseStrokeWidth ?? strokeMinWidthPx);
    if (!Number.isFinite(baseStrokeWidthPx)) baseStrokeWidthPx = strokeMinWidthPx;
    // Ne pas utiliser convertLegacyStrokeWidth pour les valeurs déjà en px (si >= min, c'est déjà en px)
    // Seulement convertir si la valeur est < min (ancien format legacy)
    if (baseStrokeWidthPx < strokeMinWidthPx) {
      baseStrokeWidthPx = convertLegacyStrokeWidth(baseStrokeWidthPx, strokeMinWidthPx, strokeMaxWidthPx);
    }
    baseStrokeWidthPx = Math.min(strokeMaxWidthPx, Math.max(strokeMinWidthPx, baseStrokeWidthPx));

    const defaultColor = module?.textDefaultColor || '#000000';
    const defaultStrokeColor = module?.textDefaultStrokeColor || '#000000';

    return {
      minFontSizePx,
      maxFontSizePx,
      strokeMinWidthPx,
      strokeMaxWidthPx,
      baseStrokeWidthPx,
      defaultColor,
      defaultStrokeColor
    };
  }, [getTextModuleConfig]);

  const clampFontSize = useCallback((value: number) => {
    const { minFontSizePx, maxFontSizePx } = getTextConstraintValues();
    if (!Number.isFinite(value)) return minFontSizePx;
    return Math.min(maxFontSizePx, Math.max(minFontSizePx, value));
  }, [getTextConstraintValues]);

  const clampStrokeWidth = useCallback((value: number) => {
    const { strokeMinWidthPx, strokeMaxWidthPx } = getTextConstraintValues();
    if (!Number.isFinite(value)) return strokeMinWidthPx;
    const pxValue = convertLegacyStrokeWidth(value, strokeMinWidthPx, strokeMaxWidthPx);
    return Math.min(strokeMaxWidthPx, Math.max(strokeMinWidthPx, pxValue));
  }, [getTextConstraintValues]);

  const textConstraints = getTextConstraintValues();
  const getDisplayStrokeWidthPx = (value?: number) => {
    if (value === undefined || value === null) return textConstraints.baseStrokeWidthPx;
    return clampStrokeWidth(value);
  };

  useEffect(() => {
    setTexts(prev => {
      let changed = false;
      const updated = prev.map(text => {
        let next = text;
        const clampedFont = clampFontSize(text.fontSize ?? textConstraints.minFontSizePx);
        if (clampedFont !== text.fontSize) {
          next = { ...next, fontSize: clampedFont };
          changed = true;
        }
        const rawStroke = text.strokeWidth ?? textConstraints.baseStrokeWidthPx;
        const clampedStroke = clampStrokeWidth(rawStroke);
        const strokeUnit = (text as any).strokeWidthUnit === 'px' ? 'px' : 'legacy';
        if (clampedStroke !== text.strokeWidth || strokeUnit !== 'px') {
          next = { ...next, strokeWidth: clampedStroke, strokeWidthUnit: 'px' as const };
          changed = true;
        }
        return next;
      });
      return changed ? updated : prev;
    });
  }, [
    clampFontSize,
    clampStrokeWidth,
    textConstraints.minFontSizePx,
    textConstraints.maxFontSizePx,
    textConstraints.strokeMinWidthPx,
    textConstraints.strokeMaxWidthPx,
    textConstraints.baseStrokeWidthPx
  ]);


  useEffect(() => {
    // Récupérer le shop depuis l'URL
    const shop = searchParams.get('shop');
    const id = searchParams.get('id');
    
    if (!shop && !id) {
      router.push('/admin');
      return;
    }

    // Charger le produit existant ou créer un nouveau
    async function loadProduct() {
      try {
        if (id) {
          // Charger un produit existant
          const res = await fetch(`/api/product-builder?id=${encodeURIComponent(id)}&for=admin`);
          if (res.ok) {
            const product = await res.json();
            setProductId(product.id);
            setProductName(product.name || 'Untitled Product');
            
            // Charger questions et customizationModules
            let loadedQuestions = product.builder_data?.questions || [];
            let loadedCustomizationModules = product.builder_data?.customizationModules || [];
            
            // Si customizationModules est vide mais qu'on a un model3DId, 
            // cela signifie que le produit a été configuré mais les modules n'ont pas été sauvegardés
            // Dans ce cas, on garde les données telles quelles (le builder devrait permettre de créer des modules)
            // Mais si les deux sont vides ET qu'on a un model3DId, c'est un produit nouveau ou réinitialisé
            
            
            console.log('📦 Questions détaillées:', loadedQuestions);
            console.log('📦 CustomizationModules détaillés:', loadedCustomizationModules);
            
            setQuestions(loadedQuestions);
            setCustomizationModules(loadedCustomizationModules);
            
            // Log après setState pour vérifier que les states sont bien mis à jour
            setTimeout(() => {
              console.log('📦 État après setState - questions:', loadedQuestions.length, 'customizationModules:', loadedCustomizationModules.length);
            }, 100);
            setSelectedModel3DId(product.builder_data?.model3DId || null);
            setSelectedDesign2DId(product.builder_data?.design2DId || null);
            // Charger les réglages 3D
            const settings = product.builder_data?.settings || {};
            if (settings.zoomSpeed !== undefined) {
              setZoomSpeed(settings.zoomSpeed);
            }
            if (settings.rotateSpeed !== undefined) {
              setRotateSpeed(settings.rotateSpeed);
            }
            if (settings.minZoom !== undefined) {
              setMinZoom(settings.minZoom);
            }
            if (settings.maxZoom !== undefined) {
              setMaxZoom(settings.maxZoom);
            }
            if (settings.initialZoom !== undefined) {
              setInitialZoom(settings.initialZoom);
            }
            if (settings.initialRotation !== undefined) {
              setInitialRotation(settings.initialRotation);
            }
            // Charger les distances par vue
            if (settings.viewDistance) {
              setViewDistance(prev => {
                const newViewDistance = {
                  ...prev,
                  ...settings.viewDistance
                };
                return newViewDistance;
              });
            } else {
            }
          }
        } else if (shop) {
          // Créer un nouveau produit
          const res = await fetch(`/api/product-builder?shop=${encodeURIComponent(shop)}&for=admin`);
          if (res.ok) {
            const product = await res.json();
            setProductId(product.id);
            // Mettre à jour l'URL avec l'ID pour permettre le rechargement
            router.replace(`/admin/products/new?shop=${encodeURIComponent(shop)}&id=${product.id}`);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      }
    }

    loadProduct();
    fetchModels3D();
    fetchDesigns2D();
    fetchColorPalettes();
    fetchLogoLibraries();
    fetchFontGroups();
    fetchSizePatterns();
    fetchMaterialMaps();
    fetchZoneGroups();
  }, [searchParams, router]);

  // Charger les snapshots quand on entre en preview mode
  useEffect(() => {
    if (previewMode && productId && searchParams.get('shop')) {
      loadSnapshots();
    }
  }, [previewMode, productId, searchParams]);

  const loadSnapshots = async () => {
    if (!productId || !searchParams.get('shop')) return;

    try {
      const response = await fetch(`/api/shopify/products/${productId}/snapshots?shop=${searchParams.get('shop')}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.snapshots) {
          setSnapshots(data.snapshots);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des snapshots:', err);
    }
  };

  async function fetchModels3D() {
    try {
      const res = await fetch('/api/models-3d');
      if (res.ok) {
        const data = await res.json();
        // ✅ Mapper camera_views (snake_case) vers cameraViews (camelCase)
        const mappedData = Array.isArray(data) 
          ? data.map((model: any) => ({
              ...model,
              cameraViews: model.camera_views || []
            }))
          : [];
        setModels3D(mappedData);
      }
    } catch (error) {
      console.error('Error fetching 3D models:', error);
    }
  }

  async function fetchDesigns2D() {
    try {
      const res = await fetch('/api/designs-2d');
      if (res.ok) {
        const data = await res.json();
        setDesigns2D(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching 2D designs:', error);
    }
  }

  async function fetchColorPalettes() {
    try {
      const res = await fetch('/api/color-palettes');
      if (res.ok) {
        const data = await res.json();
        setColorPalettes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching color palettes:', error);
    }
  }

  async function fetchLogoLibraries() {
    try {
      const res = await fetch('/api/logo-libraries');
      if (res.ok) {
        const data = await res.json();
        setLogoLibraries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching logo libraries:', error);
    }
  }

  async function fetchFontGroups() {
    try {
      const res = await fetch('/api/font-groups');
      if (res.ok) {
        const data = await res.json();
        setFontGroups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching font groups:', error);
    }
  }

  async function fetchZoneGroups() {
    try {
      const res = await fetch('/api/zone-groups');
      if (res.ok) {
        const data = await res.json();
        setZoneGroups(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch zone groups:', res.statusText);
        setZoneGroups([]);
      }
    } catch (error) {
      console.error('Error fetching zone groups:', error);
      setZoneGroups([]);
    }
  }

  async function fetchSizePatterns() {
    try {
      const res = await fetch('/api/size-patterns');
      if (res.ok) {
        const data = await res.json();
        setSizePatterns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching size patterns:', error);
    }
  }

  async function fetchMaterialMaps() {
    try {
      const res = await fetch('/api/material-maps');
      if (res.ok) {
        const data = await res.json();
        setMaterialMaps(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching material maps:', error);
    }
  }

  // Récupérer les material maps assignés au modèle 3D sélectionné
  useEffect(() => {
    if (!selectedModel3DId || models3D.length === 0) {
      setModelMaterialMaps({});
      setModelSpecificMaterialMaps({});
      return;
    }

    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
    if (!selectedModel || !(selectedModel as any).model_parts) {
      setModelMaterialMaps({});
      setModelSpecificMaterialMaps({});
      return;
    }

    // Créer un map des material_map_id vers les material maps avec leurs fichiers
    const materialMapMap: Record<string, any> = {};
    const parts = (selectedModel as any).model_parts || [];
    
    parts.forEach((part: any) => {
      if (part.material_map_id && !materialMapMap[part.material_map_id]) {
        const materialMap = materialMaps.find(m => m.id === part.material_map_id);
        if (materialMap) {
          materialMapMap[part.material_map_id] = materialMap;
        }
      }
    });

    setModelMaterialMaps(materialMapMap);
    
    // Charger les material maps spécifiques au modèle depuis /api/models/[id]/materials
    async function loadModelSpecificMaterialMaps() {
      try {
        const res = await fetch(`/api/models/${selectedModel3DId}/materials`);
        if (res.ok) {
          const data = await res.json();
          setModelSpecificMaterialMaps(data.materialMaps || {});
        } else {
          setModelSpecificMaterialMaps({});
        }
      } catch (error) {
        setModelSpecificMaterialMaps({});
      }
    }
    
    loadModelSpecificMaterialMaps();
  }, [selectedModel3DId, models3D, materialMaps]);

  // Fonction de sauvegarde automatique avec debounce
  const autoSave = useCallback(async () => {
    if (!productId) return;

    setSaving(true);
    try {
      const settingsToSave = {
        zoomSpeed,
        rotateSpeed,
        minZoom,
        maxZoom,
        initialZoom,
        initialRotation,
        viewDistance
      };
      
      console.log('💾 Sauvegarde des réglages 3D:', settingsToSave);
      
      const res = await fetch('/api/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          name: productName,
          builderData: {
            questions: questions,
            customizationModules: customizationModules,
            activeTab: activeTab,
            model3DId: selectedModel3DId,
            design2DId: selectedDesign2DId,
            settings: settingsToSave
          },
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    } finally {
      setSaving(false);
    }
  }, [productId, productName, questions, customizationModules, activeTab, selectedModel3DId, selectedDesign2DId, zoomSpeed, rotateSpeed, minZoom, maxZoom, initialZoom, initialRotation, viewDistance]);

  // Debounce pour la sauvegarde automatique
  useEffect(() => {
    if (!productId) return;

    // Nettoyer le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Créer un nouveau timeout
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Sauvegarder 1 seconde après la dernière modification

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [productName, questions, customizationModules, activeTab, productId, selectedModel3DId, selectedDesign2DId, zoomSpeed, rotateSpeed, minZoom, maxZoom, initialZoom, initialRotation, autoSave]);

  // Ref pour empêcher la réouverture automatique du panneau après fermeture manuelle
  const isManuallyClosingRef = useRef(false);
  const manualCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref pour suivre le texte qui vient d'être désélectionné manuellement
  const manuallyDeselectedTextIdRef = useRef<string | null>(null);
  const manuallyDeselectedLogoIdRef = useRef<string | null>(null);
  // Ref pour indiquer qu'on ouvre manuellement le panneau (via les onglets)
  const isManuallyOpeningRef = useRef<boolean>(false);

  // Fermer le panneau mobile typographie quand le texte est désélectionné
  useEffect(() => {
    // Ne pas fermer si on ouvre manuellement
    if (isManuallyOpeningRef.current) {
      return;
    }
    if (viewportMode === 'mobile' && !selectedTextId && mobileActivePanel) {
      const activeModule = customizationModules.find(m => m.id === mobileActivePanel);
      if (activeModule && activeModule.contentType === 'text') {
        // Ne pas fermer si on vient de fermer manuellement (pour éviter les conflits)
        if (!isManuallyClosingRef.current) {
          setMobileActivePanel(null);
          setSelectedColorClass(null);
        } else {
          console.log('⏭️ Fermeture manuelle en cours, on ne ferme pas automatiquement');
        }
      }
    }
  }, [selectedTextId, viewportMode, mobileActivePanel, customizationModules]);

  // Ouvrir automatiquement le panneau mobile typographie quand un texte est sélectionné
  useEffect(() => {
    // Ne pas ouvrir automatiquement si on ouvre manuellement
    if (isManuallyOpeningRef.current) {
      return;
    }
    // Ne pas ouvrir si on vient de fermer manuellement le panneau
    if (isManuallyClosingRef.current) {
      return;
    }
    // Ne pas ouvrir si le texte sélectionné est celui qu'on vient de désélectionner manuellement
    if (selectedTextId && manuallyDeselectedTextIdRef.current === selectedTextId) {
      manuallyDeselectedTextIdRef.current = null;
      return;
    }
    // Ne pas ouvrir automatiquement si le panneau est déjà ouvert ET que c'est le même module
    if (mobileActivePanel && selectedTextId) {
      const activeModule = customizationModules.find(m => m.id === mobileActivePanel);
      if (activeModule && activeModule.contentType === 'text') {
        // Le panneau texte est déjà ouvert pour ce texte, ne rien faire
        return;
      }
    }
    if (viewportMode === 'mobile' && selectedTextId) {
      // Trouver le module texte actif
      const textModule = customizationModules.find(m => m.contentType === 'text');
      if (textModule) {
        setMobileActivePanel(textModule.id);
      }
    }
  }, [selectedTextId, viewportMode, customizationModules, mobileActivePanel]);

  // Fermer le panneau mobile logos quand le logo est désélectionné
  useEffect(() => {
    // Ne pas fermer si on ouvre manuellement
    if (isManuallyOpeningRef.current) {
      return;
    }
    if (viewportMode === 'mobile' && !selectedLogoId && mobileActivePanel) {
      const activeModule = customizationModules.find(m => m.id === mobileActivePanel);
      if (activeModule && activeModule.contentType === 'logos') {
        // Ne pas fermer si on vient de fermer manuellement (pour éviter les conflits)
        if (!isManuallyClosingRef.current) {
          setMobileActivePanel(null);
          setSelectedColorClass(null);
        }
      }
    }
  }, [selectedLogoId, viewportMode, mobileActivePanel, customizationModules]);

  // Ouvrir automatiquement le panneau mobile logos quand un logo est sélectionné
  useEffect(() => {
    // Ne pas ouvrir automatiquement si on ouvre manuellement
    if (isManuallyOpeningRef.current) {
      return;
    }
    // Ne pas ouvrir si on vient de fermer manuellement le panneau
    if (isManuallyClosingRef.current) {
      return;
    }
    // Ne pas ouvrir si le logo sélectionné est celui qu'on vient de désélectionner manuellement
    if (selectedLogoId && manuallyDeselectedLogoIdRef.current === selectedLogoId) {
      manuallyDeselectedLogoIdRef.current = null;
      return;
    }
    // Ne pas ouvrir automatiquement si le panneau est déjà ouvert ET que c'est le même module
    if (mobileActivePanel && selectedLogoId) {
      const activeModule = customizationModules.find(m => m.id === mobileActivePanel);
      if (activeModule && activeModule.contentType === 'logos') {
        // Le panneau logos est déjà ouvert pour ce logo, ne rien faire
        return;
      }
    }
    if (viewportMode === 'mobile' && selectedLogoId) {
      // Trouver le module logos actif
      const logoModule = customizationModules.find(m => m.contentType === 'logos');
      if (logoModule) {
        setMobileActivePanel(logoModule.id);
      }
    }
  }, [selectedLogoId, viewportMode, customizationModules, mobileActivePanel]);

  // Ouvrir automatiquement le premier onglet sur desktop au chargement
  useEffect(() => {
    if (
      viewportMode === 'desktop' &&
      selectedModel3DId &&
      !activeCustomizerTab &&
      customizationModules.length > 0
    ) {
      // Sélectionner le premier module de customisation
      setActiveCustomizerTab(customizationModules[0].id);
    }
  }, [viewportMode, selectedModel3DId, activeCustomizerTab, customizationModules]);

  // Forcer le borderRadius sur les onglets actifs de la sidebar
  useEffect(() => {
    const forceBorderRadius = () => {
      const activeTabs = document.querySelectorAll('.configurator-panel-sidebar-tab-active');
      activeTabs.forEach((tab) => {
        const htmlEl = tab as HTMLElement;
        if (htmlEl) {
          htmlEl.style.setProperty('border-radius', '12px', 'important');
          htmlEl.style.setProperty('borderRadius', '12px', 'important');
          htmlEl.style.setProperty('-webkit-border-radius', '12px', 'important');
          htmlEl.style.setProperty('-moz-border-radius', '12px', 'important');
        }
      });
    };
    
    // Exécuter immédiatement
    forceBorderRadius();
    
    // Observer les changements DOM pour appliquer le style quand les onglets changent
    const observer = new MutationObserver(() => {
      forceBorderRadius();
    });
    
    const panel = document.querySelector('.configurator-panel');
    if (panel) {
      observer.observe(panel, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    // Exécuter périodiquement aussi
    const interval = setInterval(forceBorderRadius, 100);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [activeCustomizerTab, viewportMode, selectedModel3DId]);

  function addQuestion() {
    // Ouvrir le modal de création de module
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail', // Toujours 'thumbnail' pour la V1
      contentType: null
    });
    setShowCreateModuleModal(true);
  }

  async function createModule() {
    if (!newModule.tabName || !newModule.icon || !newModule.contentType) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    let iconUrl: string | undefined = undefined;

    // Upload de l'icône si un fichier est fourni
    if (newModuleIconFile) {
      try {
        const formData = new FormData();
        formData.append('file', newModuleIconFile);
        formData.append('folder', 'module-icons');

        const res = await fetch('/api/upload-icon', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          iconUrl = data.url;
        } else {
          console.error('Error uploading icon');
        }
      } catch (error) {
        console.error('Error uploading icon:', error);
      }
    }

    const module: CustomizationModule = {
      id: `module-${Date.now()}`,
      tabName: newModule.tabName!,
      icon: newModule.icon!,
      iconUrl: iconUrl,
      inputType: 'thumbnail', // Toujours 'thumbnail' pour la V1
      required: newModule.required || false,
      contentType: newModule.contentType as CustomizationModule['contentType']
    };

    setCustomizationModules([...customizationModules, module]);
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail',
      contentType: null
    });
    setNewModuleIconFile(null);
    setShowCreateModuleModal(false);
  }

  function deleteModule(moduleId: string) {
    setCustomizationModules(customizationModules.filter(m => m.id !== moduleId));
    // Si le module supprimé était sélectionné, réinitialiser la sélection
    if (selectedModule?.id === moduleId) {
      setSelectedModule(null);
      setShowQuestionSettings(false);
    }
    // Si le module supprimé était actif dans le customizer, fermer l'onglet
    if (activeCustomizerTab === moduleId) {
      setActiveCustomizerTab(null);
    }
  }

  // Text management functions
  const addText = (content: string, position?: [number, number, number], defaultFontFamily?: string, category: 'text' | 'nom' | 'numero' = 'text', initialFontSize?: number, zoneCategory?: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit', initialRotation?: number) => {
    const resolvedPosition: [number, number, number] = position
      ? [position[0], position[1], position[2] ?? 0]
      : [0.5, 0.5, 0];

    const constraints = getTextConstraintValues();
    const module = getTextModuleConfig();
    
    // Utiliser la police par défaut du module si aucune n'est fournie
    let resolvedFontFamily = defaultFontFamily;
    if (!resolvedFontFamily && module?.textDefaultFontId) {
      // Chercher la police par son ID dans les groupes de fonts disponibles
      for (const group of fontGroups) {
        if (group.fonts) {
          const font = group.fonts.find((f: any) => f.id === module.textDefaultFontId);
          if (font) {
            resolvedFontFamily = font.display_name || font.name;
            break;
          }
        }
      }
    }
    
    const resolvedFontSize = clampFontSize(initialFontSize ?? 700);
    // Utiliser directement baseStrokeWidthPx sans conversion legacy (déjà converti dans getTextConstraintValues)
    const resolvedStrokeWidth = Math.min(
      constraints.strokeMaxWidthPx,
      Math.max(constraints.strokeMinWidthPx, constraints.baseStrokeWidthPx)
    );

    const newText = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      position: resolvedPosition,
      fontSize: resolvedFontSize,
      color: constraints.defaultColor,
      editable: true,
      rotation: initialRotation ?? 0,
      category,
      zoneCategory,
      fontFamily: resolvedFontFamily,
      strokeColor: constraints.defaultStrokeColor,
      strokeWidth: resolvedStrokeWidth,
      strokeWidthUnit: 'px' as const,
      deformation: 'none',
      deformationIntensity: 0,
      fillType: 'solid' as const,
      gradientColors: [constraints.defaultColor, constraints.defaultColor],
      gradientDirection: 'horizontal' as const
    };
    
    setTexts(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
    setIsPlacingText(null); // Désactiver le mode placement après ajout
  };

  const updateText = (id: string, updates: Partial<typeof texts[0]>) => {
    const sanitizedUpdates = { ...updates };

    if (sanitizedUpdates.fontSize !== undefined) {
      sanitizedUpdates.fontSize = clampFontSize(sanitizedUpdates.fontSize);
    }
    if (sanitizedUpdates.strokeWidth !== undefined) {
      // Ne pas utiliser clampStrokeWidth qui fait la conversion legacy
      // Clamper directement la valeur entre min et max sans conversion
      const { strokeMinWidthPx, strokeMaxWidthPx } = getTextConstraintValues();
      const rawValue = sanitizedUpdates.strokeWidth;
      if (Number.isFinite(rawValue)) {
        // Clamper directement sans conversion legacy
        sanitizedUpdates.strokeWidth = Math.min(strokeMaxWidthPx, Math.max(strokeMinWidthPx, rawValue));
      } else {
        sanitizedUpdates.strokeWidth = strokeMinWidthPx;
      }
      (sanitizedUpdates as any).strokeWidthUnit = 'px';
    }

    setTexts(prev => prev.map(text => 
      text.id === id 
        ? { 
            ...text, 
            ...sanitizedUpdates,
            position: sanitizedUpdates.position
              ? [sanitizedUpdates.position[0], sanitizedUpdates.position[1], sanitizedUpdates.position[2] ?? 0] as [number, number, number]
              : text.position
          }
        : text
    ));
  };

  const removeText = (id: string) => {
    setTexts(prev => prev.filter(text => text.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };
  
  const confirmDeleteText = (id: string) => {
    console.log('🗑️ confirmDeleteText called with id:', id);
    console.log('📋 texts:', texts);
    const text = texts.find(t => t.id === id);
    if (text) {
      console.log('✅ Setting delete modal for text:', text.content);
      setItemToDelete({
        id,
        name: text.content || 'Texte',
        type: 'text'
      });
      setShowDeleteModal(true);
      console.log('✅ Modal should be visible now');
    } else {
      console.error('❌ Text not found with id:', id);
    }
  };
  
  const confirmDeleteLogo = (id: string) => {
    console.log('🗑️ confirmDeleteLogo called with id:', id);
    console.log('📋 placedLogos:', placedLogos);
    console.log('📚 logoLibraries:', logoLibraries);
    const logo = placedLogos.find(l => l.id === id);
    if (logo) {
      // Trouver le nom du logo depuis les bibliothèques
      let logoName = 'Logo';
      if (logoLibraries && logoLibraries.length > 0) {
        for (const library of logoLibraries) {
          const foundLogo = library.logos?.find((l: any) => l.id === logo.logoId);
          if (foundLogo) {
            logoName = foundLogo.name || 'Logo';
            break;
          }
        }
      }
      console.log('✅ Setting delete modal for logo:', logoName);
      setItemToDelete({
        id,
        name: logoName,
        type: 'logo'
      });
      setShowDeleteModal(true);
      console.log('✅ Modal state set - showDeleteModal:', true, 'itemToDelete:', { id, name: logoName, type: 'logo' });
    } else {
      console.error('❌ Logo not found with id:', id);
      // Ouvrir quand même le modal avec un nom par défaut
      setItemToDelete({
        id,
        name: 'Logo',
        type: 'logo'
      });
      setShowDeleteModal(true);
    }
  };
  
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'text') {
        removeText(itemToDelete.id);
      } else {
        removeLogo(itemToDelete.id);
        // Fermer la bibliothèque et réinitialiser les états après suppression d'un logo
        setShowLogoLibrary(false);
        setLogoToReplace(null);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const updateTextPosition = (id: string, position: [number, number, number]) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, position: [position[0], position[1], position[2] ?? 0] as [number, number, number] } : text
    ));
  };

  const updateTextRotation = (id: string, rotation: number) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, rotation } : text
    ));
  };

  const updateTextSize = (id: string, fontSize: number) => {
    updateText(id, { fontSize });
  };

  const selectText = (id: string | null, autoOpenTypography?: boolean) => {
    console.log('📝 selectText called:', id, 'autoOpenTypography:', autoOpenTypography);
    setSelectedTextId(id);
    if (id) {
      setActiveTextTab('contenu'); // Réinitialiser à l'onglet Contenu quand on sélectionne un texte
      
      // Pivoter la caméra vers la vue correspondant à la zone du texte sélectionné
      const text = texts.find(t => t.id === id);
      if (text && text.zoneCategory) {
        const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
          'torse': 'front',
          'dos': 'back',
          'bras-gauche': 'left',
          'bras-droit': 'right'
        };
        const view = viewMap[text.zoneCategory];
        if (view) {
          console.log('📸 Pivoting camera to view:', view, 'for selected text zoneCategory:', text.zoneCategory);
          // Marquer que la vue a été définie pour empêcher CameraInitializer de réinitialiser
          viewHasBeenSetRef.current = true;
          // Utiliser un délai pour s'assurer que l'événement est bien traité
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
          }, 10);
        }
      }
    } else {
      // Si on désélectionne, marquer comme désélection manuelle pour éviter la réouverture
      if (viewportMode === 'mobile') {
        manuallyDeselectedTextIdRef.current = id === null ? selectedTextId : null;
        isManuallyClosingRef.current = true;
        if (manualCloseTimeoutRef.current) {
          clearTimeout(manualCloseTimeoutRef.current);
        }
        manualCloseTimeoutRef.current = setTimeout(() => {
          isManuallyClosingRef.current = false;
          manuallyDeselectedTextIdRef.current = null;
        }, 1000);
      }
    }
  };

  const toggleTextLock = (id: string) => {
    setTexts(prev => prev.map(text => 
      text.id === id ? { ...text, locked: !text.locked } : text
    ));
  };

  const handleTextPlaced = (category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => {
    console.log('📍 handleTextPlaced called:', { category, position, zoneCategory, rotation, isPlacingText });
    // Toujours ajouter le texte si onTextPlaced est appelé, même si isPlacingText est null (au cas où)
    const textCategory = isPlacingText || category || 'nom';
    console.log('✅ Adding text with category:', textCategory, 'at position:', position);
    
    // Pivoter la caméra vers la vue correspondant à la zone
    if (zoneCategory) {
      const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
        'torse': 'front',
        'dos': 'back',
        'bras-gauche': 'left',
        'bras-droit': 'right'
      };
      const view = viewMap[zoneCategory];
      if (view) {
        console.log('📸 Pivoting camera to view:', view, 'for zoneCategory:', zoneCategory);
        window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
      }
    }
    
    addText('Texte', position, undefined, textCategory, 700, zoneCategory as any, rotation);
    // Désactiver le mode placement après ajout
    setIsPlacingText(null);
  };

  // Fonctions de gestion de l'importation de logo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Vérifier le module actif selon le mode (desktop ou mobile)
    const activeModule = customizationModules.find(m => m.id === activeCustomizerTab) || 
                         customizationModules.find(m => m.id === mobileActivePanel);
    if (!activeModule || activeModule.contentType !== 'logos') return;
    
    // Vérifier le type de fichier
        const defaultTypes = ['svg', 'png', 'jpg', 'jpeg', 'eps', 'ai', 'pdf', 'heic'];
        const allowedTypes = activeModule.allowedLogoFileTypes || defaultTypes;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ').toUpperCase()}`);
      return;
    }
    
    setImportedFile(file);
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setImportedFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Fonction pour redimensionner une image (max 4MB pour éviter l'erreur 413)
  // NOTE: Temporairement désactivé car @imgly/background-removal ne fonctionne pas sur Vercel/serverless
  const resizeImageForApi = async (file: File, maxSizeMB: number = 3.5): Promise<File> => {
    // Si l'image est déjà assez petite, la retourner telle quelle
    if (file.size <= maxSizeMB * 1024 * 1024) {
      return file;
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionner progressivement jusqu'à ce que la taille soit acceptable
        let quality = 0.9;
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryResize = () => {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Fallback: retourner le fichier original
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file); // Fallback: retourner le fichier original
              return;
            }
            
            const sizeMB = blob.size / (1024 * 1024);
            
            if (sizeMB > maxSizeMB && attempts < maxAttempts) {
              // Réduire encore la taille
              width = Math.floor(width * 0.9);
              height = Math.floor(height * 0.9);
              quality = Math.max(0.5, quality - 0.1);
              attempts++;
              tryResize();
            } else {
              // Créer un nouveau File avec le blob redimensionné
              const resizedFile = new File([blob], file.name, {
                type: file.type || 'image/png',
                lastModified: Date.now()
              });
              resolve(resizedFile);
            }
          }, file.type || 'image/png', quality);
        };
        
        tryResize();
      };
      img.onerror = () => {
        resolve(file); // Fallback: retourner le fichier original en cas d'erreur
      };
      img.src = URL.createObjectURL(file);
    });
  };
  
  const handleImportLogo = async () => {
    if (!importedFile || !importedFilePreview) return;
    
    const activeModule = customizationModules.find(m => m.id === activeCustomizerTab) || customizationModules.find(m => m.id === mobileActivePanel);
    if (!activeModule || activeModule.contentType !== 'logos') return;
    
    // Si background remover est activé et le fichier est un format raster (jpg/jpeg/png), ouvrir le modal de confirmation
    const fileExtension = importedFile.name.toLowerCase().split('.').pop();
    const isRasterImage = fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png';
    
    if (activeModule.enableBackgroundRemover && isRasterImage) {
      setIsProcessingBackground(true);
      setShowBackgroundRemoverModal(true);
      setBackgroundRemoverPreview({
        original: importedFilePreview,
        processed: importedFilePreview // Afficher l'original en attendant
      });
      
      // Appeler l'API de background remover
      try {
        // Redimensionner l'image avant de l'envoyer (max 3.5MB pour éviter l'erreur 413)
        const resizedFile = await resizeImageForApi(importedFile, 3.5);
        
        const formData = new FormData();
        formData.append('image', resizedFile);
        
        const response = await fetch('/api/background-remover', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          // Notre API retourne dataUrl, pas image
          const processedImageUrl = data.dataUrl || data.image || importedFilePreview;
          setBackgroundRemoverPreview({
            original: importedFilePreview,
            processed: processedImageUrl
          });
        } else {
          console.error('Error calling background remover API:', response.status);
          // Fallback: utiliser l'image originale
          setBackgroundRemoverPreview({
            original: importedFilePreview,
            processed: importedFilePreview
          });
        }
      } catch (error) {
        console.error('Error processing image with background remover:', error);
        // Fallback: utiliser l'image originale
        setBackgroundRemoverPreview({
          original: importedFilePreview,
          processed: importedFilePreview
        });
      } finally {
        setIsProcessingBackground(false);
      }
    } else {
      // Aller directement à la sélection de zone
      proceedToZoneSelection(importedFilePreview);
    }
  };
  
  const proceedToZoneSelection = (fileUrl: string) => {
    // Fermer le modal d'importation
    setShowImportModal(false);
    setShowBackgroundRemoverModal(false);
    
    // Stocker le fichier importé pour la sélection de zone
    setSelectedLogoForZone({
      logoId: 'imported',
      variantFile: fileUrl
    });
    
    // Ouvrir le modal de sélection de zone
    setShowLogoZoneModal(true);
  };
  
  const handleBackgroundRemoverChoice = (apply: boolean) => {
    if (!backgroundRemoverPreview) return;
    
    const fileUrl = apply ? backgroundRemoverPreview.processed : backgroundRemoverPreview.original;
    proceedToZoneSelection(fileUrl);
  };

  // Logo management functions
  const addLogo = async (
    logoId: string,
    variantId: string | undefined,
    variantFile: string,
    position: [number, number, number],
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit',
    zoneWidth?: number,
    zoneHeight?: number,
    zoneRotation?: number
  ) => {
    // Calculer l'échelle pour que le logo s'adapte à la taille de la zone
    // ModelViewer utilise: scaledWidth = baseWidth * scale * SCALE_FACTOR (où SCALE_FACTOR = 0.50)
    // Si zoneWidth et zoneHeight sont fournis (en UV space 0-1), on doit calculer le scale
    let scale = 1;
    let logoWidth: number | undefined = undefined;
    let logoHeight: number | undefined = undefined;
    
    if (zoneWidth && zoneHeight && zoneWidth > 0 && zoneHeight > 0) {
      // Récupérer les dimensions réelles du logo
      try {
        let actualWidth = 0;
        let actualHeight = 0;
        
        // Si c'est un logo importé (data URL ou blob URL), utiliser Image pour obtenir les dimensions
        if (logoId === 'imported' || variantFile.startsWith('data:') || variantFile.startsWith('blob:')) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              actualWidth = img.naturalWidth || img.width;
              actualHeight = img.naturalHeight || img.height;
              resolve();
            };
            img.onerror = () => {
              reject(new Error('Failed to load image'));
            };
            img.src = variantFile;
          });
        } else {
          // Pour les SVG de la bibliothèque
          const response = await fetch(variantFile);
          const svgText = await response.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          if (svgElement) {
            const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
            const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
            const viewBox = svgElement.getAttribute('viewBox');
            
            actualWidth = svgWidth;
            actualHeight = svgHeight;
            
            if (viewBox) {
              const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
              if (vbWidth && vbHeight) {
                actualWidth = vbWidth;
                actualHeight = vbHeight;
              }
            }
          }
        }
        
        if (actualWidth > 0 && actualHeight > 0) {
          // Stocker les dimensions réelles du logo
          logoWidth = actualWidth;
          logoHeight = actualHeight;
          
          // Convertir les dimensions de la zone en pixels (canvas 2048x2048)
          const CANVAS_SIZE = 2048;
          const SCALE_FACTOR = 0.50; // Même facteur que dans ModelViewer
          const zoneWidthPx = zoneWidth * CANVAS_SIZE;
          const zoneHeightPx = zoneHeight * CANVAS_SIZE;
          
          // On veut que le logo tienne dans 80% de la zone
          const targetWidthPx = zoneWidthPx * 0.8;
          const targetHeightPx = zoneHeightPx * 0.8;
          
          // Calculer le scale pour que le logo tienne dans la zone
          // scaledWidth = baseWidth * scale * SCALE_FACTOR
          // Donc: scale = targetWidthPx / (baseWidth * SCALE_FACTOR)
          const scaleX = targetWidthPx / (actualWidth * SCALE_FACTOR);
          const scaleY = targetHeightPx / (actualHeight * SCALE_FACTOR);
          scale = Math.min(scaleX, scaleY);
          
          console.log('📐 Logo scale calculation:', {
            zoneWidth,
            zoneHeight,
            zoneWidthPx,
            zoneHeightPx,
            actualWidth,
            actualHeight,
            targetWidthPx,
            targetHeightPx,
            scaleX,
            scaleY,
            finalScale: scale,
            isImported: logoId === 'imported'
          });
        }
      } catch (error) {
        console.error('Erreur lors du calcul des dimensions du logo:', error);
        // Utiliser un scale par défaut si l'extraction échoue
        scale = 0.1;
      }
    } else {
      // Si pas de dimensions de zone, utiliser un scale par défaut
      scale = 0.1;
    }
    
    // Si on remplace un logo existant, utiliser son ID et ses propriétés (position, scale, rotation, category)
    if (logoToReplace) {
      const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
      if (logoToReplaceData) {
        setPlacedLogos(prev => prev.map(logo => 
          logo.id === logoToReplace 
            ? {
                ...logo,
                logoId,
                variantId,
                variantFile,
                width: logoWidth,
                height: logoHeight,
                scale // Garder le scale calculé pour la zone
              }
            : logo
        ));
        setSelectedLogoId(logoToReplace);
        setLogoToReplace(null); // Réinitialiser
        return;
      }
    }
    
    // Sinon, ajouter un nouveau logo
    const newLogo = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      logoId,
      variantId,
      variantFile,
      position,
      scale,
      rotation: zoneRotation ?? 0,
      category,
      width: logoWidth,
      height: logoHeight
    };
    
    setPlacedLogos(prev => [...prev, newLogo]);
    setSelectedLogoId(newLogo.id);
  };

  const updateLogoPosition = (id: string, position: [number, number, number]) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, position } : logo
    ));
  };

  const updateLogoScale = (id: string, scale: number) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, scale } : logo
    ));
  };

  const updateLogoRotation = (id: string, rotation: number) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, rotation } : logo
    ));
  };

  const removeLogo = (id: string) => {
    setPlacedLogos(prev => prev.filter(logo => logo.id !== id));
    if (selectedLogoId === id) {
      setSelectedLogoId(null);
    }
  };

  const toggleLogoLock = (id: string) => {
    setPlacedLogos(prev => prev.map(logo => 
      logo.id === id ? { ...logo, locked: !logo.locked } : logo
    ));
  };

  function updateQuestion(questionId: string, updates: Partial<Question>) {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion({ ...selectedQuestion, ...updates });
    }
  }

  function deleteQuestion(questionId: string) {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(null);
      setShowQuestionSettings(false);
    }
    // La sauvegarde automatique sera déclenchée par le useEffect
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000', // Background principal reste noir
      display: 'flex',
      fontFamily: CONFIGURATOR_PANEL_FONT,
      flexDirection: 'column'
    }}>
      {/* Animations CSS pour le mobile */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .mobile-panel-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .mobile-panel-slide-down {
          animation: slideDown 0.2s ease-in forwards;
        }
        .mobile-content-fade {
          animation: scaleIn 0.25s ease-out forwards;
          animation-delay: 0.05s;
          opacity: 0;
        }
        .mobile-tab-btn {
          transition: all 0.2s ease;
        }
        .mobile-tab-btn:active {
          transform: scale(0.95);
        }
        .mobile-action-btn {
          transition: all 0.15s ease;
        }
        .mobile-action-btn:active {
          transform: scale(0.97);
        }
        .mobile-color-btn {
          transition: all 0.15s ease;
        }
        .mobile-color-btn:hover {
          transform: scale(1.1);
        }
        .mobile-color-btn:active {
          transform: scale(0.95);
        }
        .mobile-card {
          transition: all 0.2s ease;
        }
        .mobile-card:active {
          transform: scale(0.97);
        }
      `}</style>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header - Hidden in preview mode */}
        {!previewMode && (
        <div style={{
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Product Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <img
                src="/eyesberg.svg"
                alt="Eyesberg"
                style={{
                  height: '32px',
                  width: 'auto'
                }}
              />
            </button>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#111827',
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                outline: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                minWidth: '200px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
            <span style={{ color: '#a0a0a0', fontSize: '14px' }}>▼</span>
            {/* Auto-save indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              {saving ? (
                <span style={{ color: '#8eff36', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>

          {/* Center: Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('build')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'build' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'build' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: activeTab === 'build' ? '600' : '400'
              }}
            >
              Build
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'pricing' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'pricing' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: activeTab === 'pricing' ? '600' : '400'
              }}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'variants' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'variants' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: activeTab === 'variants' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Variants
              <span style={{ fontSize: '12px' }}>🔒</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'connect' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'connect' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: activeTab === 'connect' ? '600' : '400'
              }}
            >
              Connect
            </button>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 12px',
                backgroundColor: previewMode ? '#8eff36' : '#1a1a1a',
                borderRadius: '4px',
                border: '1px solid #2a2a2a',
                cursor: 'pointer',
                color: previewMode ? '#000000' : '#a0a0a0',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title="Prévisualiser le configurateur"
            >
              👁
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              border: '1px solid #2a2a2a',
              cursor: 'pointer'
            }}>
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>?</span>
              <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>Logic</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              border: '1px solid #2a2a2a',
              cursor: 'pointer'
            }}>
              <span style={{ color: '#8eff36', fontSize: '12px' }}>👁</span>
              <span style={{ color: '#8eff36', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>Published</span>
            </div>
            <span style={{ color: '#a0a0a0', fontSize: '12px', cursor: 'pointer' }}>▼</span>
          </div>
        </div>
        )}

        {/* Preview Mode - Show snapshot or iframe (no sidebar, just final render) */}
        {previewMode && (
          <>
            {/* Preview Header */}
            <div style={{
              backgroundColor: '#0a0a0a',
              borderBottom: '1px solid #1a1a1a',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                fontWeight: '600'
              }}>
                Mode Prévisualisation - {productName}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {/* Toggle Mobile/Desktop si on a les deux snapshots */}
                {snapshots && snapshots.mobile && snapshots.desktop && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPreviewViewMode('mobile')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: previewViewMode === 'mobile' ? '#8eff36' : '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: previewViewMode === 'mobile' ? '#000000' : '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer'
                      }}
                    >
                      📱 Mobile
                    </button>
                    <button
                      onClick={() => setPreviewViewMode('desktop')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: previewViewMode === 'desktop' ? '#8eff36' : '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: previewViewMode === 'desktop' ? '#000000' : '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer'
                      }}
                    >
                      💻 Desktop
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPreviewMode(false);
                    setSnapshots(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                >
                  Fermer la prévisualisation
                </button>
              </div>
            </div>

            {/* Preview Content - Snapshot ou iframe */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              overflow: 'auto',
              padding: '20px'
            }}>
              {snapshots && (
                (previewViewMode === 'mobile' && snapshots.mobile) || 
                (previewViewMode === 'desktop' && snapshots.desktop)
              ) ? (
                // Afficher le snapshot
                <img
                  src={previewViewMode === 'mobile' ? snapshots.mobile : snapshots.desktop}
                  alt={`Snapshot ${previewViewMode} du produit`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                />
              ) : (
                // Fallback: iframe vers /configure (configurateur client sans sidebar)
                <PreviewIframe productId={productId} shop={searchParams.get('shop')} />
              )}
            </div>
          </>
        )}

        {/* Main Builder Area - Hidden in preview mode */}
        {!previewMode && (
          <>
        {activeTab === 'connect' ? (
          <ConnectTabContent 
            shop={searchParams.get('shop')}
            productId={productId}
            onProductLinked={async (shopifyProductId: string, shopifyVariantId: string) => {
              // Linking logic...
            }}
          />
        ) : false ? (
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            backgroundColor: '#0a0a0a'
          }}>
            {/* Viewer 3D */}
            <div style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#1a1a1a'
            }}>
              <Canvas
                camera={{ position: [0, 0, 15], fov: 50 }}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)'
                }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                
                <Suspense fallback={null}>
                  {models3D[0]?.glbUrl ? (
                    <ModelViewer 
                      key={models3D[0].glbUrl}
                      url={models3D[0].glbUrl}
                      designTexture={null}
                      colors={{}}
                      texts={[]}
                      updateTextPosition={() => {}}
                      selectedTextId={null}
                      updateTextRotation={() => {}}
                      updateTextSize={() => {}}
                      placedLogos={[]}
                      updateLogoPosition={() => {}}
                      updateLogoRotation={() => {}}
                      updateLogoScale={() => {}}
                      selectedLogoId={null}
                      setIsDraggingText={() => {}}
                      isDraggingText={false}
                      setIsRotatingText={() => {}}
                      isRotatingText={false}
                      setIsResizingText={() => {}}
                      isResizingText={false}
                      setIsDraggingLogo={() => {}}
                      isDraggingLogo={false}
                      setIsRotatingLogo={() => {}}
                      isRotatingLogo={false}
                      setIsResizingLogo={() => {}}
                      isResizingLogo={false}
                      selectedDesign={{ id: null, svgUrl: null }}
                    />
                  ) : (
                    <mesh>
                      <boxGeometry args={[2, 2, 2]} />
                      <meshStandardMaterial color="#8eff36" />
                    </mesh>
                  )}
                </Suspense>
                
                <OrbitControls 
                  ref={controlsRef}
                  enablePan={false}
                  enableZoom={true}
                  enableRotate={true}
                  minDistance={5}
                  maxDistance={50}
                  onChange={(e) => {
                    if (e?.target) {
                      const camera = (e.target as any).object;
                      const target = (e.target as any).target;
                      setCurrentCameraPosition({
                        x: parseFloat(camera.position.x.toFixed(2)),
                        y: parseFloat(camera.position.y.toFixed(2)),
                        z: parseFloat(camera.position.z.toFixed(2))
                      });
                      setCurrentCameraTarget({
                        x: parseFloat(target.x.toFixed(2)),
                        y: parseFloat(target.y.toFixed(2)),
                        z: parseFloat(target.z.toFixed(2))
                      });
                    }
                  }}
                />
              </Canvas>

              {/* Overlay Info quand mode capture actif */}
              {captureMode && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '2px solid #8eff36',
                  borderRadius: '8px',
                  padding: '16px 24px',
                  zIndex: 10,
                  color: '#ffffff',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#8eff36' }}>
                    📷 Mode Capture Actif
                  </div>
                  <div style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>
                    Positionnez la caméra comme vous le souhaitez
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                    Position: X:{currentCameraPosition.x} Y:{currentCameraPosition.y} Z:{currentCameraPosition.z}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                    Target: X:{currentCameraTarget.x} Y:{currentCameraTarget.y} Z:{currentCameraTarget.z}
                  </div>
                </div>
              )}
            </div>

            {/* Panel de gestion des vues */}
            <div style={{
              width: '400px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #1a1a1a'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  📷 Vues Caméra
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: '#a0a0a0',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  margin: 0,
                  marginBottom: '16px'
                }}>
                  Gérez les vues caméra de votre modèle 3D
                </p>

                {/* Sélecteur de modèle 3D */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#a0a0a0',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Modèle 3D
                  </label>
                  <select
                    value={models3D[0]?.id || ''}
                    onChange={(e) => {
                      const selectedModel = models3D.find(m => m.id === e.target.value);
                      if (selectedModel) {
                        // Mettre à jour le modèle sélectionné
                        const updatedModels = [selectedModel, ...models3D.filter(m => m.id !== selectedModel.id)];
                        setModels3D(updatedModels);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1a1a' }}>
                      {models3D.length === 0 ? 'Aucun modèle disponible' : 'Sélectionner un modèle'}
                    </option>
                    {models3D.map(model => (
                      <option key={model.id} value={model.id} style={{ backgroundColor: '#1a1a1a' }}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {models3D.length === 0 && (
                    <p style={{
                      fontSize: '11px',
                      color: '#666',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      marginTop: '6px',
                      fontStyle: 'italic'
                    }}>
                      Ajoutez un modèle 3D dans "My Configurations 2D/3D"
                    </p>
                  )}
                </div>
              </div>

              {/* Liste des vues */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px'
              }}>
                {cameraViews.map((view) => (
                  <div
                    key={view.id}
                    style={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '18px' }}>👁️</span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#ffffff'
                        }}>
                          {view.name}
                        </span>
                        {view.isDefault && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#2a2a2a',
                            color: '#8eff36',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            Default
                          </span>
                        )}
                      </div>
                      {!view.isDefault && (
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer la vue "${view.name}" ?`)) {
                              setCameraViews(cameraViews.filter(v => v.id !== view.id));
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px'
                          }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      fontFamily: 'monospace',
                      marginBottom: '8px'
                    }}>
                      <div>Pos: X:{view.position.x} Y:{view.position.y} Z:{view.position.z}</div>
                      <div>Target: X:{view.target.x} Y:{view.target.y} Z:{view.target.z}</div>
                    </div>

                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('setCameraView', {
                          detail: {
                            position: view.position,
                            target: view.target
                          }
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                        e.currentTarget.style.borderColor = '#8eff36';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                        e.currentTarget.style.borderColor = '#3a3a3a';
                      }}
                    >
                      📍 Aller à cette vue
                    </button>
                  </div>
                ))}
              </div>

              {/* Bouton Capturer */}
              <div style={{
                padding: '16px',
                borderTop: '1px solid #1a1a1a'
              }}>
                {!captureMode ? (
                  <button
                    onClick={() => {
                      setCaptureMode(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: '#8eff36',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#7de82e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#8eff36';
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>📸</span>
                    Capturer une nouvelle vue
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setCaptureMode(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        setShowNameViewModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#8eff36',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000000',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📸</span>
                      Capturer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'connect' ? (
          <ConnectTabContent 
            shop={searchParams.get('shop')}
            productId={productId}
            onProductLinked={async (shopifyProductId: string, shopifyVariantId: string) => {
              if (!productId) {
                console.error('❌ No product ID available');
                return;
              }

              try {
                console.log('🔗 Linking product:', { productId, shopifyProductId, shopifyVariantId });
                
                const response = await fetch(`/api/products/${productId}/shopify-link`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    shopifyProductId,
                    shopifyVariantId,
                    shopDomain: searchParams.get('shop'),
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to link product');
                }

                console.log('✅ Product linked successfully:', data);
                
                // Afficher un message de succès avec un modal temporaire
                const successModal = document.createElement('div');
                successModal.className = 'configurator-panel-modal';
                successModal.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: #1a1a1a;
                  border: 2px solid #8eff36;
                  border-radius: 12px;
                  padding: 24px;
                  z-index: 10000;
                  max-width: 400px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                `;
                successModal.innerHTML = `
                  <div style="text-align: center; color: #ffffff;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #8eff36;">Produit lié avec succès !</div>
                    <div style="font-size: 14px; color: #a0a0a0; margin-bottom: 16px;">
                      Le produit Shopify a été connecté à ce configurateur.
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                      padding: 10px 24px;
                      background: #8eff36;
                      color: #000000;
                      border: none;
                      border-radius: 6px;
                      font-size: 14px;
                      font-weight: 600;
                      cursor: pointer;
                    ">Fermer</button>
                  </div>
                `;
                document.body.appendChild(successModal);
                
                // Retirer le modal après 5 secondes
                setTimeout(() => {
                  if (successModal.parentElement) {
                    successModal.remove();
                  }
                }, 5000);
                
              } catch (error) {
                console.error('❌ Error linking product:', error);
                const errorModal = document.createElement('div');
                errorModal.className = 'configurator-panel-modal';
                errorModal.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: #2a1a1a;
                  border: 2px solid #ef4444;
                  border-radius: 12px;
                  padding: 24px;
                  z-index: 10000;
                  max-width: 400px;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                `;
                errorModal.innerHTML = `
                  <div style="text-align: center; color: #ffffff;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #ef4444;">Erreur</div>
                    <div style="font-size: 14px; color: #a0a0a0; margin-bottom: 16px;">
                      ${error instanceof Error ? error.message : 'Erreur inconnue'}
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                      padding: 10px 24px;
                      background: #ef4444;
                      color: #ffffff;
                      border: none;
                      border-radius: 6px;
                      font-size: 14px;
                      font-weight: 600;
                      cursor: pointer;
                    ">Fermer</button>
                  </div>
                `;
                document.body.appendChild(errorModal);
                
                setTimeout(() => {
                  if (errorModal.parentElement) {
                    errorModal.remove();
                  }
                }, 5000);
              }
            }}
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
          {/* Left Sidebar - Questions - Toujours visible (même en mobile) */}
          <div style={{
            width: '320px',
            backgroundColor: '#0a0a0a',
            borderRight: '1px solid #1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Sidebar Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setShow3DSettings(!show3DSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: show3DSettings ? '#8eff36' : '#a0a0a0',
                  fontSize: '22px',
                  transition: 'color 0.2s'
                }}
                title="3D Viewer Settings"
              >
                ⚙
              </button>
              <button
                onClick={addQuestion}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#8eff36',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#000000',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  fontWeight: '600'
                }}
              >
                +
              </button>
            </div>

            {/* Modules/Questions List */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                position: 'relative'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Si on drop sur le conteneur (pas sur un élément), placer à la fin
                if (draggedModuleId) {
                  const draggedIndex = customizationModules.findIndex(m => m.id === draggedModuleId);
                  if (draggedIndex !== -1) {
                    const newModules = [...customizationModules];
                    const [removed] = newModules.splice(draggedIndex, 1);
                    newModules.push(removed);
                    setCustomizationModules(newModules);
                  }
                }
                setDraggedModuleId(null);
                setDragOverIndex(null);
              }}
            >
              {/* 3D Viewer Settings Overlay */}
              {show3DSettings && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#0a0a0a',
                  zIndex: 10,
                  padding: '16px',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    color: '#ffffff',
                    marginBottom: '20px',
                    fontWeight: '600'
                  }}>
                    3D Viewer Settings
                  </div>
                  
                  {/* Zoom Speed */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Zoom Speed
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {zoomSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={zoomSpeed}
                      onChange={(e) => setZoomSpeed(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(zoomSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a ${(zoomSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Rotate Speed */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Rotate Speed
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {rotateSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={rotateSpeed}
                      onChange={(e) => setRotateSpeed(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(rotateSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a ${(rotateSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Min Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Min Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {minZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={minZoom}
                      onChange={(e) => setMinZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(minZoom - 0.5) / (5 - 0.5) * 100}%, #1a1a1a ${(minZoom - 0.5) / (5 - 0.5) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>0.5</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  {/* Max Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Max Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {maxZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={maxZoom}
                      onChange={(e) => setMaxZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(maxZoom - 1) / (20 - 1) * 100}%, #1a1a1a ${(maxZoom - 1) / (20 - 1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>1.0</span>
                      <span>20.0</span>
                    </div>
                  </div>

                  {/* Initial Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Initial Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {initialZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.1"
                      value={initialZoom}
                      onChange={(e) => setInitialZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(initialZoom - 1) / (15 - 1) * 100}%, #1a1a1a ${(initialZoom - 1) / (15 - 1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>1.0</span>
                      <span>15.0</span>
                    </div>
                  </div>

                  {/* Initial Rotation */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        Initial Rotation Angle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {initialRotation}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={initialRotation}
                      onChange={(e) => setInitialRotation(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(initialRotation / 360) * 100}%, #1a1a1a ${(initialRotation / 360) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>0°</span>
                      <span>360°</span>
                    </div>
                  </div>

                </div>
              )}
              
              {/* Questions/Modules Content (hidden when settings are open) */}
              {!show3DSettings && (
                customizationModules.length === 0 && questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#a0a0a0',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '2px dashed #333',
                  borderRadius: '8px',
                  margin: '16px',
                  backgroundColor: '#0a0a0a'
                }}>
                  <p style={{
                    fontSize: '16px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    marginBottom: '12px',
                    color: '#ffffff',
                    fontWeight: '600'
                  }}>
                    There are no questions, yet
                  </p>
                  <p style={{
                    fontSize: '13px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    marginBottom: '24px',
                    color: '#a0a0a0',
                    maxWidth: '400px'
                  }}>
                    Create your first question to start building your customizer.
                  </p>
                  <button
                    onClick={addQuestion}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#8eff36',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(142, 255, 54, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#a0ff50';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#8eff36';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>+</span>
                    Create question
                  </button>
                </div>
              ) : customizationModules.length === 0 && questions.length > 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#a0a0a0'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    marginBottom: '8px',
                    color: '#ff6b6b'
                  }}>
                    ⚠️ Modules de personnalisation manquants
                  </p>
                  <p style={{
                    fontSize: '12px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    marginBottom: '24px',
                    color: '#a0a0a0'
                  }}>
                    Les questions existent mais les modules de personnalisation sont vides. Cliquez sur "Create question" pour créer un nouveau module.
                  </p>
                  <button
                    onClick={addQuestion}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#8eff36',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto'
                    }}
                  >
                    <span>+</span>
                    Create question
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Customization Modules */}
                  {customizationModules.map((module, index) => (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedModuleId(module.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', module.id);
                        e.dataTransfer.setData('application/json', JSON.stringify({ id: module.id, index }));
                        if (e.currentTarget.style) {
                          e.currentTarget.style.cursor = 'grabbing';
                          e.currentTarget.style.opacity = '0.5';
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverIndex(index);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedModuleId && draggedModuleId !== module.id) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragLeave={(e) => {
                        // Ne pas réinitialiser dragOverIndex ici pour éviter les flickers
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const draggedId = draggedModuleId || e.dataTransfer.getData('text/plain');
                        const targetIndex = index;
                        
                        if (draggedId && draggedId !== module.id) {
                          const draggedIndex = customizationModules.findIndex(m => m.id === draggedId);
                          
                          if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
                            // Créer un nouveau tableau avec l'ordre modifié
                            const newModules = [...customizationModules];
                            const [removed] = newModules.splice(draggedIndex, 1);
                            newModules.splice(targetIndex, 0, removed);
                            // Mettre à jour l'état avec le nouveau tableau
                            setCustomizationModules([...newModules]);
                          }
                        }
                        setDraggedModuleId(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={(e) => {
                        setDraggedModuleId(null);
                        setDragOverIndex(null);
                        if (e.currentTarget.style) {
                          e.currentTarget.style.cursor = 'grab';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onClick={(e) => {
                        // Ne pas sélectionner si on vient de faire un drag & drop
                        if (draggedModuleId) {
                          return;
                        }
                        setSelectedModule(module);
                        setSelectedQuestion(null);
                        setShowQuestionSettings(true);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedModule?.id === module.id ? '#1a1a1a' : '#0a0a0a',
                        border: selectedModule?.id === module.id ? '1px solid #8eff36' : '1px solid #1a1a1a',
                        borderRadius: '4px',
                        cursor: draggedModuleId === module.id ? 'grabbing' : 'grab',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        opacity: draggedModuleId === module.id ? 0.5 : 1
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '20px'
                      }}>
                        {module.iconUrl ? (
                          <img
                            src={module.iconUrl}
                            alt={module.tabName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          module.icon
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#ffffff',
                        flex: 1
                      }}>
                        {module.tabName}
                      </div>
                    </div>
                  ))}
                  {/* Legacy Questions */}
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        setSelectedQuestion(question);
                        setSelectedModule(null);
                        setShowQuestionSettings(true);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedQuestion?.id === question.id ? '#1a1a1a' : '#0a0a0a',
                        border: selectedQuestion?.id === question.id ? '1px solid #8eff36' : '1px solid #1a1a1a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        {question.label}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        color: '#a0a0a0'
                      }}>
                        {question.type}
                      </div>
                    </div>
                  ))}
                </div>
                )
              )}
            </div>

            {/* Behind the scene (modèle 3D + design par défaut) */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #1a1a1a',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* 3D Model Selector */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#a0a0a0',
                  marginBottom: '6px'
                }}>
                  Modèle 3D
                </label>
                <select
                  value={selectedModel3DId || ''}
                  onChange={(e) => setSelectedModel3DId(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Sélectionner un modèle 3D</option>
                  {models3D.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2D Design Selector (optionnel) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#a0a0a0',
                  marginBottom: '6px'
                }}>
                  Design 2D par défaut (optionnel)
                </label>
                <select
                  value={selectedDesign2DId || ''}
                  onChange={(e) => setSelectedDesign2DId(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Aucun design 2D</option>
                  {designs2D.map((design) => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Center: Customizer Preview Area */}
          <div 
            className="configurator-panel"
            style={{
              flex: 1,
              backgroundColor: '#ffffff',
              display: 'flex',
              position: 'relative',
              overflow: 'hidden'
            } as React.CSSProperties}
          >
            {/* Viewport selector buttons */}
            <div 
              style={{ 
                position: 'fixed',
                top: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999999,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'auto',
                height: 'auto',
                visibility: 'visible',
                opacity: 1
              }}
            >
              <div 
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  border: '3px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  minWidth: '100px',
                  minHeight: '50px',
                  visibility: 'visible',
                  opacity: 1,
                  borderRadius: '8px'
                }}
              >
                <button
                  onClick={() => setViewportMode('desktop')}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: viewportMode === 'desktop' ? '2px solid #000000' : '2px solid transparent',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.outline = 'none';
                  }}
                  title="Vue ordinateur"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    fill="none" 
                    stroke={viewportMode === 'desktop' ? '#000000' : '#000000'} 
                    strokeWidth={viewportMode === 'desktop' ? 2.5 : 2} 
                    viewBox="0 0 24 24"
                    style={{
                      fill: 'none',
                      stroke: '#000000'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: viewportMode === 'mobile' ? '2px solid #000000' : '2px solid transparent',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.outline = 'none';
                  }}
                  title="Vue téléphone"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    fill="none" 
                    stroke={viewportMode === 'mobile' ? '#000000' : '#000000'} 
                    strokeWidth={viewportMode === 'mobile' ? 2.5 : 2} 
                    viewBox="0 0 24 24"
                    style={{
                      fill: 'none',
                      stroke: '#000000'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Left Sidebar - Customizer Tabs (only visible when model is selected AND en mode desktop) */}
            {selectedModel3DId && viewportMode === 'desktop' && (
              <div style={{
                width: '80px',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #d0d0d0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                gap: '8px'
              }}>
                {customizationModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      // Ne pas fermer la sidebar, toujours ouvrir l'onglet
                      const newTab = module.id;
                      setActiveCustomizerTab(newTab);
                      // Réinitialiser la sélection de couleur quand on change d'onglet
                      if (newTab !== activeCustomizerTab) {
                        setSelectedColorClass(null);
                      }
                    }}
                    className={activeCustomizerTab === module.id ? 'configurator-panel-sidebar-tab-active' : ''}
                    style={{
                      width: '64px',
                      height: '64px',
                      padding: '0',
                      backgroundColor: activeCustomizerTab === module.id ? CONFIGURATOR_PANEL_PRIMARY_COLOR : '#ffffff',
                      border: 'none',
                      borderRadius: activeCustomizerTab === module.id ? '12px' : '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '20px',
                      transition: 'all 0.15s ease',
                      gap: '4px',
                      overflow: 'hidden'
                    }}
                    title={module.tabName}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'transparent',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                    {module.iconUrl ? (
                      <img
                        src={module.iconUrl}
                        alt={module.tabName}
                        style={{
                            width: '14px',
                            height: '14px',
                            maxWidth: '14px',
                            maxHeight: '14px',
                          objectFit: 'contain',
                            display: 'block',
                            filter: activeCustomizerTab === module.id ? 'invert(1)' : 'invert(0)'
                        }}
                      />
                    ) : (
                        <span style={{ 
                          fontSize: '14px', 
                          lineHeight: '1',
                          color: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
                        }}>
                        {module.icon}
                      </span>
                    )}
                    </div>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '400',
                      lineHeight: '1.2',
                      textAlign: 'center',
                      color: activeCustomizerTab === module.id ? '#ffffff' : '#000000',
                      WebkitTextFillColor: activeCustomizerTab === module.id ? '#ffffff' : '#000000',
                      WebkitTextStrokeColor: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
                    }}>
                      {module.tabName}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Customizer Tab Panel (slides in from left) - Desktop uniquement */}
            {selectedModel3DId && activeCustomizerTab && viewportMode === 'desktop' && (() => {
              const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
              if (!activeModule) return null;
              
              return (
                <div style={{
                  width: '420px',
                  backgroundColor: '#ffffff',
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  animation: 'slideIn 0.3s ease-out',
                  marginLeft: '16px'
                }}>
                  {/* Tab Header */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#000000' // Force la couleur noire sur le conteneur parent
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '28px', 
                      height: '28px',
                      flexShrink: 0,
                      minWidth: '28px',
                      minHeight: '28px',
                      color: '#000000'
                    }}>
                      {activeModule.iconUrl ? (
                        <img
                          src={activeModule.iconUrl}
                          alt={activeModule.tabName}
                          style={{
                            width: '28px',
                            height: '28px',
                            maxWidth: '28px',
                            maxHeight: '28px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#000000', fontSize: '20px', lineHeight: '1' }}>
                          {activeModule.icon}
                        </span>
                      )}
                    </div>
                    <span 
                      style={{ 
                        color: '#000000',
                        fontSize: '14px', 
                        fontFamily: CONFIGURATOR_PANEL_FONT, 
                        fontWeight: '500',
                        display: 'block',
                        lineHeight: '1.2'
                      }}
                      className="customizer-tab-name"
                    >
                      {activeModule.tabName}
                    </span>
                  </div>

                  {/* Tab Content */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px'
                  }}>
                    {!activeModule.contentType ? (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                          Configurez le module dans les settings pour afficher du contenu.
                        </p>
                      </div>
                    ) : activeModule.contentType === 'colors' ? (() => {
                      // Détecter automatiquement les couleurs disponibles à modifier
                      const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary', 'nonary', 'denary'];
                      
                      // Trouver le design 2D sélectionné pour détecter les couleurs
                      let availableColorClasses: string[] = [];
                      let designIdToUse: string | null = null;
                      if (activeCustomizerTab) {
                        const designModule = customizationModules.find(m => 
                          m.contentType === 'designs-2d' && m.selectedItems?.design2DId
                        );
                        if (designModule?.selectedItems?.design2DId) {
                          designIdToUse = designModule.selectedItems.design2DId;
                        }
                      }
                      if (!designIdToUse) {
                        designIdToUse = selectedDesign2DId;
                      }
                      
                      const selectedDesign = designs2D.find(d => d.id === designIdToUse);
                      
                      // PRIORITÉ à design.colors (source de vérité depuis SVG Color Mapper)
                      if (selectedDesign?.colors && Array.isArray(selectedDesign.colors) && selectedDesign.colors.length > 0) {
                        // Extraire les classes depuis design.colors (format [{name, value}])
                        availableColorClasses = selectedDesign.colors.map((c: any) => c.name).filter(Boolean);
                      } else if (selectedDesign?.color_mappings) {
                        // Fallback sur color_mappings si design.colors n'existe pas
                        availableColorClasses = Object.keys(selectedDesign.color_mappings);
                      } else {
                        availableColorClasses = ['primary', 'secondary', 'tertiary'];
                      }
                      
                      availableColorClasses = availableColorClasses.filter(c => ordinalColors.includes(c.toLowerCase()));
                      if (availableColorClasses.length === 0) {
                        availableColorClasses = ['primary', 'secondary', 'tertiary'];
                      }
                      
                      // Si on a sélectionné une classe de couleur, afficher la grille de couleurs
                      if (selectedColorClass && activeModule.selectedItems?.colorPaletteId) {
                        const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                        if (!palette) return <p style={{ color: '#666', fontSize: '14px' }}>Palette non trouvée</p>;
                        
                        const allColors: Array<{ id: string; name: string; hex: string }> = [];
                        if (palette.colors) {
                          palette.colors.forEach((color: any, index: number) => {
                            const colorId = color.id || `${palette.id}-${index}-${color.hex}`;
                            allColors.push({
                              id: colorId,
                              name: color.name || '',
                              hex: color.hex || '#000000'
                            });
                          });
                        }
                        
                        const selectedColorId = selectedDesign?.color_mappings?.[selectedColorClass] || designColors[selectedColorClass];
                        
                        const currentColorHex = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.hex : null;
                        const currentColorName = selectedColorId ? allColors.find(c => c.id === selectedColorId)?.name : '';
                        
                        return (
                          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Header avec bouton retour et couleur actuelle */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '16px',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <button
                                onClick={() => setSelectedColorClass(null)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  WebkitTextFillColor: '#111827',
                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                  transition: 'color 0.2s'
                                }}
                                className="color-class-card-label"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#1f2937';
                                  (e.currentTarget.style as any).webkitTextFillColor = '#1f2937';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#111827';
                                  (e.currentTarget.style as any).webkitTextFillColor = '#111827';
                                }}
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#111827' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span style={{ color: '#111827', WebkitTextFillColor: '#111827' }}>Retour</span>
                              </button>
                              
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <span style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  WebkitTextFillColor: '#111827',
                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                }} className="color-class-card-label">
                                  {currentColorName || activeModule.colorClassLabels?.[selectedColorClass] || selectedColorClass.charAt(0).toUpperCase() + selectedColorClass.slice(1)}
                                </span>
                                <div 
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '2px solid #d1d5db',
                                    backgroundColor: currentColorHex || 'transparent'
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Grille de couleurs */}
                            <div style={{
                              flex: 1,
                              padding: '16px',
                              overflowY: 'auto'
                            }}>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(6, 1fr)', 
                                gap: '12px' 
                              }}>
                                {allColors.map((color) => {
                                  const isSelected = color.id === selectedColorId;
                                  return (
                                    <button
                                      key={color.id}
                                      className="color-circle-button"
                                      data-color={color.hex}
                                      onClick={() => {
                                        const newDesignColors = { ...designColors };
                                        newDesignColors[selectedColorClass] = color.id;
                                        setDesignColors(newDesignColors);
                                        
                                        if (selectedDesign) {
                                          const updatedMappings = {
                                            ...(selectedDesign.color_mappings || {}),
                                            [selectedColorClass]: color.id
                                          };
                                          
                                          fetch(`/api/designs-2d?id=${selectedDesign.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ color_mappings: updatedMappings })
                                          }).catch(err => console.error('Error updating color mappings:', err));
                                          
                                          setDesigns2D(designs2D.map(d => 
                                            d.id === selectedDesign.id 
                                              ? { ...d, color_mappings: updatedMappings }
                                              : d
                                          ));
                                        }
                                      }}
                                      style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        border: '2px solid #e5e7eb',
                                        backgroundColor: color.hex,
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                        overflow: 'hidden',
                                        padding: 0
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                      }}
                                    >
                                      {/* Coche si couleur sélectionnée */}
                                      {isSelected && (
                                        <div style={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}>
                                          <div style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: '#ffffff',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                          }}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#000000' }}>
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Afficher les cartes de sélection de classe de couleur
                      return (
                        <div>
                          {!activeModule.selectedItems?.colorPaletteId ? (
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                              Veuillez sélectionner une palette dans les paramètres du module.
                            </p>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '12px'
                            }}>
                              {availableColorClasses.map((colorClass) => {
                                const currentColorId = selectedDesign?.color_mappings?.[colorClass];
                                let currentColorHex = '#cccccc';
                                
                                if (currentColorId && activeModule.selectedItems?.colorPaletteId) {
                                  const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                                  if (palette?.colors) {
                                    palette.colors.forEach((color: any, index: number) => {
                                      const colorId = color.id || `${palette.id}-${index}-${color.hex}`;
                                      if (colorId === currentColorId) {
                                        currentColorHex = color.hex || '#cccccc';
                                      }
                                    });
                                  }
                                }
                                
                                return (
                                  <div
                                    key={colorClass}
                                    onClick={() => setSelectedColorClass(colorClass)}
                                    style={{
                                      padding: '16px',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#ffffff';
                                    }}
                                  >
                                    <div
                                      className="color-circle-indicator"
                                      data-color={currentColorHex && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF' ? currentColorHex : undefined}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: currentColorHex && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF'
                                          ? currentColorHex
                                          : 'transparent',
                                        borderRadius: '50%',
                                        border: currentColorHex && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF'
                                          ? '2px solid #d1d5db'
                                          : '2px solid #9ca3af'
                                      }}
                                    />
                                    <span style={{
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      textAlign: 'center'
                                    }} className="color-class-card-label">
                                      {activeModule.colorClassLabels?.[colorClass] || colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'logos' ? (() => {
                      // Label du bouton personnalisable
                      const buttonLabel = activeModule.addLogoButtonLabel || 'Ajouter un logo';
                      
                      // Vérifier si des bibliothèques sont sélectionnées
                      const hasSelectedLibraries = activeModule.selectedItems?.logoLibraryIds && 
                        Array.isArray(activeModule.selectedItems.logoLibraryIds) && 
                        activeModule.selectedItems.logoLibraryIds.length > 0;
                      
                      if (!hasSelectedLibraries) {
                        return (
                          <div>
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                              Sélectionnez des bibliothèques de logos dans les settings du module.
                            </p>
                          </div>
                        );
                      }
                      
                      // Récupérer toutes les bibliothèques sélectionnées
                      const selectedLibraries = logoLibraries.filter(l => 
                        activeModule.selectedItems?.logoLibraryIds?.includes(l.id)
                      );
                      
                      // Récupérer tous les logos de toutes les bibliothèques sélectionnées
                      const allLogos: any[] = [];
                      selectedLibraries.forEach(library => {
                        if (library.logos && Array.isArray(library.logos)) {
                          allLogos.push(...library.logos);
                        }
                      });
                      
                      // Si on affiche la bibliothèque de logos
                      if (showLogoLibrary && activeCustomizerTab === activeModule.id) {
                        // Si un logo est sélectionné pour afficher ses variantes
                        if (selectedLogoForVariants) {
                          // Construire la liste des variantes : logo de base + variantes
                          const baseVariant = {
                            id: 'base',
                            file_url: selectedLogoForVariants.file_url || '',
                            name: selectedLogoForVariants.name || 'Logo de base'
                          };
                          const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              {/* Bouton retour */}
                              <div style={{ marginBottom: '12px' }}>
                                <button
                                  onClick={() => setSelectedLogoForVariants(null)}
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#374151',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  ← Retour
                                </button>
                              </div>
                              
                              {/* Titre avec nom du logo */}
                              <div style={{ marginBottom: '16px' }}>
                                <h3 style={{
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: '#000000',
                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                  margin: 0
                                }}>
                                  {selectedLogoForVariants.name}
                                </h3>
                              </div>
                              
                              {/* Liste des variantes */}
                              {allVariants.length === 0 ? (
                                <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                  Aucune variante disponible
                                </p>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', overflowY: 'auto' }}>
                                  {allVariants.map((variant: any, index: number) => (
                                    <div
                                      key={variant.id || `base-${index}`}
                                      onClick={async () => {
                                        // Si on est en mode remplacement, remplacer directement le logo
                                        if (logoToReplace) {
                                          const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                                          if (logoToReplaceData) {
                                            // Pour le logo de base, utiliser file_url, pour les variantes utiliser variant.file_url
                                            const fileToUse = variant.id === 'base' 
                                              ? selectedLogoForVariants.file_url 
                                              : (variant.file_url || selectedLogoForVariants.file_url);
                                            
                                            // Calculer les dimensions du nouveau logo
                                            let logoWidth: number | undefined = undefined;
                                            let logoHeight: number | undefined = undefined;
                                            
                                            try {
                                              const response = await fetch(fileToUse);
                                              const svgText = await response.text();
                                              const parser = new DOMParser();
                                              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                              const svgElement = svgDoc.querySelector('svg');
                                              if (svgElement) {
                                                const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                                const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                                const viewBox = svgElement.getAttribute('viewBox');
                                                
                                                let actualWidth = svgWidth;
                                                let actualHeight = svgHeight;
                                                
                                                if (viewBox) {
                                                  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                                  if (vbWidth && vbHeight) {
                                                    actualWidth = vbWidth;
                                                    actualHeight = vbHeight;
                                                  }
                                                }
                                                
                                                if (actualWidth > 0 && actualHeight > 0) {
                                                  logoWidth = actualWidth;
                                                  logoHeight = actualHeight;
                                                }
                                              }
                                            } catch (error) {
                                              console.error('Erreur lors du calcul des dimensions du logo:', error);
                                            }
                                            
                                            // Calculer le nouveau scale pour conserver la même taille visuelle
                                            let newScale = logoToReplaceData.scale;
                                            if (logoWidth && logoHeight && logoToReplaceData.width && logoToReplaceData.height) {
                                              // Taille visuelle actuelle = width * scale * SCALE_FACTOR
                                              // On veut que le nouveau logo ait la même taille visuelle
                                              // nouvelle_taille_visuelle = newWidth * newScale * SCALE_FACTOR
                                              // Donc: newScale = (oldWidth * oldScale) / newWidth
                                              
                                              // Calculer la taille visuelle actuelle (en pixels)
                                              const SCALE_FACTOR = 0.50;
                                              const currentVisualWidth = logoToReplaceData.width * logoToReplaceData.scale * SCALE_FACTOR;
                                              const currentVisualHeight = logoToReplaceData.height * logoToReplaceData.scale * SCALE_FACTOR;
                                              
                                              // Calculer le scale nécessaire pour le nouveau logo
                                              const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                              const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                              
                                              // Prendre le minimum pour garder les proportions
                                              newScale = Math.min(scaleX, scaleY);
                                              
                                              console.log('📐 Scale adjustment:', {
                                                oldWidth: logoToReplaceData.width,
                                                oldHeight: logoToReplaceData.height,
                                                oldScale: logoToReplaceData.scale,
                                                newWidth: logoWidth,
                                                newHeight: logoHeight,
                                                newScale: newScale,
                                                currentVisualWidth,
                                                currentVisualHeight
                                              });
                                            }
                                            
                                            // Remplacer le logo en conservant position, rotation, category, et ajuster le scale
                                            setPlacedLogos(prev => prev.map(l => 
                                              l.id === logoToReplace 
                                                ? {
                                                    ...l,
                                                    logoId: selectedLogoForVariants.id,
                                                    variantId: variant.id === 'base' ? undefined : variant.id,
                                                    variantFile: fileToUse,
                                                    width: logoWidth,
                                                    height: logoHeight,
                                                    scale: newScale
                                                  }
                                                : l
                                            ));
                                            setSelectedLogoId(logoToReplace);
                                            setLogoToReplace(null);
                                            setSelectedLogoForVariants(null);
                                            setShowLogoLibrary(false);
                                            return;
                                          }
                                        }
                                        
                                        // Si mode zones, ouvrir le modal de sélection de zone
                                        if (activeModule.logoPlacementMode === 'zones') {
                                          // Pour le logo de base, utiliser file_url, pour les variantes utiliser variant.file_url
                                          const fileToUse = variant.id === 'base' 
                                            ? selectedLogoForVariants.file_url 
                                            : (variant.file_url || selectedLogoForVariants.file_url);
                                          
                                          setSelectedLogoForZone({
                                            logoId: selectedLogoForVariants.id,
                                            variantId: variant.id === 'base' ? undefined : variant.id,
                                            variantFile: fileToUse
                                          });
                                          setShowLogoZoneModal(true);
                                          setSelectedLogoForVariants(null);
                                        } else {
                                          // Mode libre : ajouter directement (à implémenter)
                                          console.log('Mode libre - variante sélectionnée:', variant.id);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #e0e0e0',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: '80px',
                                          height: '80px',
                                          backgroundColor: '#f0f0f0',
                                          borderRadius: '4px',
                                          border: '1px solid #e0e0e0',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '8px'
                                        }}
                                      >
                                        <img
                                          src={variant.id === 'base' 
                                            ? selectedLogoForVariants.file_url 
                                            : (variant.file_url || selectedLogoForVariants.file_url)}
                                          alt={variant.name || selectedLogoForVariants.name}
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      </div>
                                      <span style={{ 
                                        fontSize: '11px', 
                                        color: '#000000', 
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        WebkitTextFillColor: '#000000',
                                        WebkitTextStrokeColor: '#000000'
                                      }}>
                                        {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // Vue principale de la bibliothèque
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Boutons de vue en haut - uniquement si mode zones ET bibliothèque non ouverte */}
                            {activeModule.logoPlacementMode === 'zones' && !showLogoLibrary && (
                              <div style={{ 
                                display: 'flex', 
                                gap: '0', 
                                marginBottom: '12px',
                                paddingBottom: '0',
                                borderBottom: '1px solid #e0e0e0'
                              }}>
                                {(['front', 'back', 'left', 'right'] as const).map((view) => (
                                  <button
                                    key={view}
                                    onClick={() => {
                                      setActiveLogoView(view);
                                      // Mapper les vues aux catégories pour la caméra - DÉSACTIVÉ
                                      // const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                      //   'front': 'torse',
                                      //   'back': 'dos',
                                      //   'left': 'bras-gauche', // Voir le côté gauche
                                      //   'right': 'bras-droit' // Voir le côté droit
                                      // };
                                      // setTargetView(viewToCategory[view]);
                                    }}
                                    style={{
                                      height: '42px',
                                      padding: '0 12px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      border: 'none',
                                      borderRadius: '0',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      color: activeLogoView === view ? '#000000' : '#606060',
                                      transition: 'all 0.15s',
                                      position: 'relative',
                                      borderBottom: activeLogoView === view ? '2px solid #000000' : '2px solid transparent',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {viewLabels[view]}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Bouton retour */}
                            <div style={{ marginBottom: '12px' }}>
                              <button
                                onClick={() => {
                                  setShowLogoLibrary(false);
                                  setSelectedLogoForVariants(null);
                                  setLogoToReplace(null);
                                  setSelectedLogoId(null); // Désélectionner le logo
                                }}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '14px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                ← Retour
                              </button>
                            </div>
                            
                            {/* Boutons "Supprimer" et "Importer un logo" */}
                            {!selectedLogoForVariants && (
                              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                                {/* Bouton Supprimer - visible uniquement si un logo est sélectionné */}
                                {selectedLogoId && placedLogos.find(l => l.id === selectedLogoId) && (
                                  <button
                                    onClick={() => {
                                      const logoToDelete = placedLogos.find(l => l.id === selectedLogoId);
                                      if (logoToDelete) {
                                        // Trouver le nom du logo dans les bibliothèques
                                        let logoName = 'Logo';
                                        for (const library of logoLibraries) {
                                          const foundLogo = library.logos?.find((l: any) => l.id === logoToDelete.logoId);
                                          if (foundLogo) {
                                            logoName = foundLogo.name || 'Logo';
                                            break;
                                          }
                                        }
                                        
                                        // Ouvrir le modal de confirmation
                                        setItemToDelete({
                                          id: selectedLogoId,
                                          name: logoName,
                                          type: 'logo'
                                        });
                                        setShowDeleteModal(true);
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '12px 24px',
                                      fontSize: '14px',
                                      fontWeight: '500',
                                      backgroundColor: '#ef4444',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '8px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#dc2626';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#ef4444';
                                    }}
                                  >
                                    <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Supprimer
                                  </button>
                                )}
                                
                                {/* Bouton Importer un logo */}
                                <button
                                  className="btn-primary"
                                  onClick={() => {
                                    // Réinitialiser les états
                                    setImportedFile(null);
                                    setImportedFilePreview(null);
                                    setShowBackgroundRemoverModal(false);
                                    setBackgroundRemoverPreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                    setShowImportModal(true);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3b82f6';
                                  }}
                                >
                                  <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span style={{ color: '#ffffff' }}>{activeModule.importLogoButtonLabel || 'Importer un logo'}</span>
                                </button>
                              </div>
                            )}
                            
                            {/* Bibliothèque de logos */}
                            {allLogos.length === 0 ? (
                              <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                Aucun logo disponible dans les bibliothèques sélectionnées
                              </p>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', overflowY: 'auto' }}>
                                {allLogos.map((logo: any) => {
                                  const hasVariants = logo.variants && logo.variants.length > 0;
                                  
                                  return (
                                    <div
                                      key={logo.id}
                                      onClick={async () => {
                                        
                                        // Si on est en mode remplacement, vérifier d'abord
                                        if (logoToReplace) {
                                          // Si le logo a des variantes, ouvrir la vue des variantes pour choisir
                                        if (hasVariants) {
                                          setSelectedLogoForVariants(logo);
                                          return;
                                        }
                                        
                                          // Sinon, remplacer directement
                                          const logoToReplaceData = placedLogos.find(l => l.id === logoToReplace);
                                          if (logoToReplaceData) {
                                            // Calculer les dimensions du nouveau logo
                                            let logoWidth: number | undefined = undefined;
                                            let logoHeight: number | undefined = undefined;
                                            
                                            try {
                                              const response = await fetch(logo.file_url);
                                              const svgText = await response.text();
                                              const parser = new DOMParser();
                                              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                              const svgElement = svgDoc.querySelector('svg');
                                              if (svgElement) {
                                                const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                                const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                                const viewBox = svgElement.getAttribute('viewBox');
                                                
                                                let actualWidth = svgWidth;
                                                let actualHeight = svgHeight;
                                                
                                                if (viewBox) {
                                                  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                                  if (vbWidth && vbHeight) {
                                                    actualWidth = vbWidth;
                                                    actualHeight = vbHeight;
                                                  }
                                                }
                                                
                                                if (actualWidth > 0 && actualHeight > 0) {
                                                  logoWidth = actualWidth;
                                                  logoHeight = actualHeight;
                                                }
                                              }
                                            } catch (error) {
                                              console.error('Erreur lors du calcul des dimensions du logo:', error);
                                            }
                                            
                                            // Calculer le nouveau scale pour conserver la même taille visuelle
                                            let newScale = logoToReplaceData.scale;
                                            if (logoWidth && logoHeight && logoToReplaceData.width && logoToReplaceData.height) {
                                              // Taille visuelle actuelle = width * scale * SCALE_FACTOR
                                              // On veut que le nouveau logo ait la même taille visuelle
                                              // nouvelle_taille_visuelle = newWidth * newScale * SCALE_FACTOR
                                              // Donc: newScale = (oldWidth * oldScale) / newWidth
                                              
                                              // Calculer la taille visuelle actuelle (en pixels)
                                              const SCALE_FACTOR = 0.50;
                                              const currentVisualWidth = logoToReplaceData.width * logoToReplaceData.scale * SCALE_FACTOR;
                                              const currentVisualHeight = logoToReplaceData.height * logoToReplaceData.scale * SCALE_FACTOR;
                                              
                                              // Calculer le scale nécessaire pour le nouveau logo
                                              const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                              const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                              
                                              // Prendre le minimum pour garder les proportions
                                              newScale = Math.min(scaleX, scaleY);
                                              
                                              console.log('📐 Scale adjustment:', {
                                                oldWidth: logoToReplaceData.width,
                                                oldHeight: logoToReplaceData.height,
                                                oldScale: logoToReplaceData.scale,
                                                newWidth: logoWidth,
                                                newHeight: logoHeight,
                                                newScale: newScale,
                                                currentVisualWidth,
                                                currentVisualHeight
                                              });
                                            }
                                            
                                            // Remplacer le logo en conservant position, rotation, category, et ajuster le scale
                                            setPlacedLogos(prev => prev.map(l => 
                                              l.id === logoToReplace 
                                                ? {
                                                    ...l,
                                                    logoId: logo.id,
                                                    variantId: undefined,
                                                    variantFile: logo.file_url,
                                                    width: logoWidth,
                                                    height: logoHeight,
                                                    scale: newScale
                                                  }
                                                : l
                                            ));
                                            setSelectedLogoId(logoToReplace);
                                            setLogoToReplace(null);
                                            setShowLogoLibrary(false);
                                            return;
                                          }
                                        }
                                        
                                        // Si le logo a des variantes, ouvrir la vue des variantes
                                        if (hasVariants) {
                                          setSelectedLogoForVariants(logo);
                                          return;
                                        }
                                        
                                        // Si mode zones, ouvrir directement le modal de sélection de zone
                                        if (activeModule.logoPlacementMode === 'zones') {
                                          setSelectedLogoForZone({
                                            logoId: logo.id,
                                            variantId: undefined,
                                            variantFile: logo.file_url
                                          });
                                          setShowLogoZoneModal(true);
                                        } else {
                                          // Mode libre : ajouter directement (à implémenter)
                                          console.log('Mode libre - logo sélectionné:', logo.id);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #e0e0e0',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: '80px',
                                          height: '80px',
                                          backgroundColor: '#f0f0f0',
                                          borderRadius: '4px',
                                          border: '1px solid #e0e0e0',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '8px'
                                        }}
                                      >
                                        <img
                                          src={logo.file_url}
                                          alt={logo.name}
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <span style={{ 
                                          fontSize: '11px', 
                                          color: '#000000', 
                                          textAlign: 'center', 
                                          fontWeight: '500',
                                          WebkitTextFillColor: '#000000',
                                          WebkitTextStrokeColor: '#000000'
                                        }}>
                                          {logo.name}
                                        </span>
                                        {hasVariants && (
                                          <span style={{ 
                                            fontSize: '10px', 
                                            color: '#999999', 
                                            textAlign: 'center',
                                            WebkitTextFillColor: '#999999',
                                            WebkitTextStrokeColor: '#999999'
                                          }}>
                                            variantes
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Vue par défaut : boutons de vue + bouton "Ajouter un logo" + logos placés
                      // Utiliser uniquement les vues personnalisées configurées dans le module
                      const customViews = activeModule.viewLabels || [];
                      
                      // Mapper les catégories aux vues pour le filtrage
                      const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                        'torse': 'front',
                        'dos': 'back',
                        'bras-gauche': 'left', // Bras gauche = vue gauche
                        'bras-droit': 'right' // Bras droit = vue droite
                      };
                      
                      // Filtrer les logos selon la vue active
                      // Mapper activeLogoView (qui peut être un ID personnalisé) vers 'front'/'back'/'left'/'right'
                      let currentViewForFilter: 'front' | 'back' | 'left' | 'right' | null = null;
                      const activeViewConfig = customViews.find(v => v.id === activeLogoView);
                      if (activeViewConfig) {
                        // Si la vue personnalisée a un ID standard, l'utiliser
                        if (activeViewConfig.id === 'front' || activeViewConfig.id === 'back' || 
                            activeViewConfig.id === 'left' || activeViewConfig.id === 'right') {
                          currentViewForFilter = activeViewConfig.id;
                        } else {
                          // Sinon, mapper le label vers la vue standard
                          const labelToView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                            'Face': 'front',
                            'DOS': 'back',
                            'Dos': 'back',
                            'Gauche': 'left',
                            'Left': 'left',
                            'Droite': 'right',
                            'Right': 'right'
                          };
                          currentViewForFilter = labelToView[activeViewConfig.label] || null;
                        }
                      } else if (activeLogoView === 'front' || activeLogoView === 'back' || 
                                 activeLogoView === 'left' || activeLogoView === 'right') {
                        currentViewForFilter = activeLogoView;
                      }
                      
                      const filteredPlacedLogos = placedLogos.filter(logo => {
                        if (activeModule.logoPlacementMode === 'zones' && currentViewForFilter) {
                          const logoView = categoryToView[logo.category as keyof typeof categoryToView];
                          return logoView === currentViewForFilter;
                        }
                        return true; // En mode libre ou si pas de vue trouvée, afficher tous les logos
                      });
                      
                      // Charger les vues de caméra du modèle 3D
                      const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                      const modelCameraViews = selectedModel?.cameraViews || [];
                      
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Boutons de vue en haut - uniquement si mode zones */}
                          {activeModule.logoPlacementMode === 'zones' && (
                            <div style={{ 
                              display: 'flex', 
                              gap: '8px',
                              padding: '4px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              {customViews.map((viewConfig) => {
                                const isActive = activeLogoView === viewConfig.id;
                                return (
                                  <button
                                    key={viewConfig.id}
                                    onClick={() => {
                                      setActiveLogoView(viewConfig.id as any);
                                      
                                      // Si une vue de caméra personnalisée est configurée, l'utiliser
                                      if (viewConfig.cameraViewId) {
                                        const cameraView = modelCameraViews.find(cv => cv.id === viewConfig.cameraViewId);
                                        if (cameraView) {
                                          // Dispatcher l'événement avec les coordonnées de la vue
                                          window.dispatchEvent(new CustomEvent('goToCameraView', { 
                                            detail: {
                                              position: cameraView.position,
                                              target: cameraView.target
                                            }
                                          }));
                                        } else {
                                          // Fallback sur la vue legacy
                                          const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                            'front': 'torse',
                                            'back': 'dos',
                                            'left': 'bras-droit',
                                            'right': 'bras-gauche'
                                          };
                                          const category = viewToCategory[viewConfig.id] || 'torse';
                                          // setTargetView(category); // DÉSACTIVÉ - Conflit avec CameraController
                                        }
                                      } else {
                                        // Utiliser la vue legacy (front, back, left, right)
                                        const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                          'front': 'torse',
                                          'back': 'dos',
                                          'left': 'bras-droit',
                                          'right': 'bras-gauche'
                                        };
                                        const category = viewToCategory[viewConfig.id] || 'torse';
                                        // setTargetView(category); // DÉSACTIVÉ - Conflit avec CameraController
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      height: '42px',
                                      padding: '0 16px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      border: isActive ? '2px solid #374151' : '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      backgroundColor: isActive ? '#111827' : 'transparent',
                                      cursor: 'pointer',
                                      color: isActive ? '#ffffff' : '#6b7280',
                                      transition: 'all 0.2s ease',
                                      whiteSpace: 'nowrap',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}
                                    onTouchStart={(e) => {
                                      if (!isActive) {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                        e.currentTarget.style.color = '#111827';
                                      }
                                    }}
                                    onTouchEnd={(e) => {
                                      if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#6b7280';
                                      }
                                    }}
                                  >
                                    {isActive && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: '2px',
                                        right: '2px',
                                        bottom: '2px',
                                        border: '2px solid #6b7280',
                                        borderRadius: '6px',
                                        pointerEvents: 'none'
                                      }} />
                                    )}
                                    {viewConfig.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Bouton "Ajouter un logo" - Ne s'affiche pas si on est en mode remplacement */}
                          {!logoToReplace && (
                          <button
                            className="btn-primary"
                            onClick={() => {
                              setShowLogoLibrary(true);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 20px',
                              fontSize: '14px',
                              fontWeight: '500',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                            }}
                          >
                            <span style={{ fontSize: '18px', fontWeight: '300', color: '#ffffff' }}>+</span>
                            <span style={{ color: '#ffffff' }}>{buttonLabel}</span>
                          </button>
                          )}
                          
                          {/* Logos placés */}
                          {filteredPlacedLogos.length > 0 && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <div style={{
                                fontSize: '14px',
                                color: '#000000',
                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {activeModule.placedLogosLabel || 'Logos placés'} ({filteredPlacedLogos.length})
                              </div>
                              {filteredPlacedLogos.map((logo) => {
                                // Trouver le nom du logo depuis les bibliothèques
                                let logoName = 'Logo';
                                for (const library of logoLibraries) {
                                  const foundLogo = library.logos?.find((l: any) => l.id === logo.logoId);
                                  if (foundLogo) {
                                    logoName = foundLogo.name || 'Logo';
                                    break;
                                  }
                                }
                                
                                // Mapper la catégorie à la vue pour pivoter
                                const categoryToViewId: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', string> = {
                                  'torse': 'front',
                                  'dos': 'back',
                                  'bras-gauche': 'left',
                                  'bras-droit': 'right'
                                };
                                
                                return (
                                  <div
                                    key={logo.id}
                                    onClick={() => {
                                      // 1. Pivoter vers la vue du logo
                                      const logoViewId = categoryToViewId[logo.category as keyof typeof categoryToViewId];
                                      if (logoViewId) {
                                        setActiveLogoView(logoViewId as any);
                                        // Trouver la vue de caméra correspondante
                                        const viewConfig = customViews.find(v => v.id === logoViewId);
                                        if (viewConfig?.cameraViewId) {
                                          const cameraView = modelCameraViews.find(cv => cv.id === viewConfig.cameraViewId);
                                          if (cameraView) {
                                            window.dispatchEvent(new CustomEvent('goToCameraView', { 
                                              detail: {
                                                position: cameraView.position,
                                                target: cameraView.target
                                              }
                                            }));
                                          }
                                        } else {
                                          window.dispatchEvent(new CustomEvent('setCameraView', { detail: logoViewId }));
                                        }
                                      }
                                      
                                      // 2. Sélectionner le logo
                                      setSelectedLogoId(logo.id);
                                      
                                      // 3. Ouvrir le panel d'édition (mode remplacement)
                                      setLogoToReplace(logo.id);
                                      setShowLogoLibrary(true);
                                    }}
                                    style={{
                                      padding: '14px',
                                      backgroundColor: selectedLogoId === logo.id ? '#fafafa' : '#fafafa',
                                      border: selectedLogoId === logo.id ? '2px solid #000000' : '1px solid #e0e0e0',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedLogoId !== logo.id) {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                        e.currentTarget.style.borderColor = '#000000';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedLogoId !== logo.id) {
                                        e.currentTarget.style.backgroundColor = '#fafafa';
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                      }
                                    }}
                                  >
                                    <div style={{
                                      flex: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px'
                                    }}>
                                      {/* Aperçu du logo */}
                                      <div style={{
                                        width: '48px',
                                        height: '48px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        padding: '4px'
                                      }}>
                                        {logo.variantFile ? (
                                          <img
                                            src={logo.variantFile}
                                            alt={logoName}
                                            style={{
                                              maxWidth: '100%',
                                              maxHeight: '100%',
                                              objectFit: 'contain'
                                            }}
                                          />
                                        ) : (
                                          <div style={{
                                            fontSize: '10px',
                                            color: '#9ca3af',
                                            textAlign: 'center'
                                          }}>
                                            No img
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDeleteLogo(logo.id);
                                      }}
                                      style={{
                                        padding: '8px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: '#9ca3af',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                        e.currentTarget.style.color = '#ef4444';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#9ca3af';
                                      }}
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'fonts' && activeModule.selectedItems?.fontGroupId ? (() => {
                      const group = fontGroups.find(g => g.id === activeModule.selectedItems?.fontGroupId);
                      if (!group) return <p style={{ color: '#666', fontSize: '14px' }}>Groupe non trouvé</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              color: '#111827',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner une font</option>
                              {group.fonts?.map((font: any) => (
                                <option key={font.id} value={font.id}>
                                  {font.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'designs-2d' ? (() => {
                      // Afficher uniquement les designs autorisés pour ce module (si défini)
                      const allowedIds = activeModule.selectedItems?.design2DIds;
                      const visibleDesigns = Array.isArray(allowedIds) && allowedIds.length > 0
                        ? designs2D.filter(d => allowedIds.includes(d.id))
                        : designs2D;
                      const selectedDesignId = activeModule.selectedItems?.design2DId;
                      
                      return (
                        <div>
                          {visibleDesigns.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                              Aucun design disponible. Cochez des designs dans les settings du module.
                            </p>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '12px'
                            }}>
                              {visibleDesigns.map((design) => {
                                const isSelected = design.id === selectedDesignId;
                                return (
                                  <div
                                    key={design.id}
                                    onClick={() => {
                                      const updated = {
                                        ...activeModule,
                                        selectedItems: {
                                          ...activeModule.selectedItems,
                                          design2DId: design.id
                                        }
                                      };
                                      setCustomizationModules(customizationModules.map(m =>
                                        m.id === activeModule.id ? updated : m
                                      ));
                                      if (selectedModule?.id === activeModule.id) {
                                        setSelectedModule(updated);
                                      }
                                    }}
                                    style={{
                                      padding: '12px',
                                      backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                      borderRadius: '4px',
                                      border: isSelected ? '2px solid #333333' : '1px solid #e0e0e0',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <div style={{
                                      width: '100%',
                                      padding: '0',
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minHeight: '120px',
                                      maxHeight: '120px',
                                      overflow: 'hidden'
                                    }}>
                                      {(design.preview_url && design.preview_url.trim() !== '') ? (
                                        <img
                                          key={design.preview_url}
                                          src={design.preview_url}
                                          alt={design.name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                          onError={(e) => {
                                            // Fallback to SVG if preview fails to load
                                            const svgUrl = design.svg_url || design.svgUrl;
                                            if (svgUrl) {
                                              e.currentTarget.src = svgUrl;
                                            }
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={design.svg_url || design.svgUrl}
                                          alt={design.name}
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      )}
                                    </div>
                                    <p 
                                      className="customizer-tab-name"
                                      style={{
                                        color: '#000000',
                                        fontSize: '12px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        fontWeight: isSelected ? '600' : '400',
                                        textAlign: 'center',
                                        margin: 0,
                                        WebkitTextFillColor: '#000000'
                                      } as React.CSSProperties}
                                    >
                                      {design.name}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'sizes' && activeModule.selectedItems?.sizePatternId ? (() => {
                      const pattern = sizePatterns.find(p => p.id === activeModule.selectedItems?.sizePatternId);
                      if (!pattern) return <p style={{ color: '#666', fontSize: '14px' }}>Groupe non trouvé</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              color: '#111827',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner une taille</option>
                              {pattern.sizes?.map((size: any) => (
                                <option key={size.id} value={size.id}>
                                  {size.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'text' ? (
                      <div>
                        {/* Bouton "Ajouter un texte" - masqué quand un texte est sélectionné */}
                        {!selectedTextId && (
                          <button
                            className="btn-primary"
                            onClick={() => {
                              if (activeModule.textPlacementMode === 'zones') {
                                // Mode zones : ouvrir le modal de sélection de zones
                                setShowZoneSelectionModal(true);
                                setSelectedZoneId(null);
                                setTextInputValue('');
                              } else {
                                // Mode libre : activer le mode placement
                                if (isPlacingText) {
                                  setIsPlacingText(null);
                                } else {
                                  setIsPlacingText('nom');
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 20px',
                              backgroundColor: isPlacingText ? '#8eff36' : '#3b82f6',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              textTransform: 'none',
                              letterSpacing: 'normal'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isPlacingText ? '#7ae62e' : '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isPlacingText ? '#8eff36' : '#3b82f6';
                            }}
                          >
                            <span style={{ color: '#ffffff' }}>
                              {isPlacingText ? 'Cliquez sur le modèle pour placer le texte (ou cliquez ici pour annuler)' : (activeModule.addTextButtonLabel || 'Ajouter un texte')}
                            </span>
                          </button>
                        )}
                        
                        {/* Liste des textes ajoutés - affichée uniquement quand aucun texte n'est sélectionné */}
                        {!selectedTextId && texts.length > 0 && (
                          <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              color: '#000000',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              marginBottom: '4px',
                              fontWeight: '600'
                            }}>
                              {activeModule.placedTextsLabel || 'Textes ajoutés'} ({texts.length})
                            </div>
                            {texts.map((text) => (
                              <div
                                key={text.id}
                                style={{
                                  padding: '16px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  transition: 'all 0.2s',
                                  cursor: 'default'
                                }}
                              >
                                <div 
                                  onClick={() => selectText(text.id)}
                                  style={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                    gap: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <div style={{
                                    fontSize: text.fontSize ? `${text.fontSize / 10}px` : '15px',
                                    color: text.color || '#111827',
                                    fontFamily: text.fontFamily || CONFIGURATOR_PANEL_FONT,
                                    fontWeight: '500',
                                    lineHeight: '1.4',
                                    ...(text.strokeColor && text.strokeWidth ? {
                                      WebkitTextStroke: `${text.strokeWidth}px ${text.strokeColor}`,
                                      textStroke: `${text.strokeWidth}px ${text.strokeColor}`
                                    } : {})
                                  }}>
                                    {text.content || '(Texte vide)'}
                                    {text.locked && ' 🔒'}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteText(text.id);
                                  }}
                                  style={{
                                    padding: '8px',
                                    backgroundColor: '#ef4444',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    flexShrink: 0,
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ef4444';
                                  }}
                                  title="Supprimer"
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Interface d'édition du texte sélectionné */}
                        {selectedTextId && (() => {
                          const selectedText = texts.find(t => t.id === selectedTextId);
                          if (!selectedText) return null;
                          
                          const tabs = [
                            { id: 'contenu' as const, label: 'Contenu', enabled: activeModule.enableTextContent !== false },
                            { id: 'police' as const, label: 'Police', enabled: activeModule.enableTextFont !== false },
                            { id: 'couleur' as const, label: 'Couleur', enabled: activeModule.enableTextColor !== false },
                            { id: 'contour' as const, label: 'Contour', enabled: activeModule.enableTextStroke !== false },
                            { id: 'deformation' as const, label: 'Déformation', enabled: activeModule.enableTextDeformation !== false }
                          ].filter(tab => tab.enabled);
                          
                          return (
                            <div style={{
                              marginTop: '20px',
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid #e5e5e5'
                            }}>
                              {/* Header */}
                              <div style={{
                                padding: '12px 16px',
                                backgroundColor: '#ffffff',
                                borderBottom: '1px solid #e5e5e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}>
                                <button
                                  onClick={() => selectText(null)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '16px',
                                    color: '#111827',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontFamily: CONFIGURATOR_PANEL_FONT
                                  }}
                                  className="typography-back-button"
                                >
                                  <span style={{ color: '#111827' }}>←</span>
                                  <span style={{ color: '#111827' }}>Retour</span>
                                </button>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#111827',
                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                }}>
                                  Typographie
                                </div>
                                <div style={{ width: '80px' }} /> {/* Spacer pour centrer */}
                              </div>

                              {/* Onglets */}
                              <div style={{
                                display: 'flex',
                                borderBottom: '1px solid #e5e5e5',
                                backgroundColor: '#ffffff',
                                overflow: 'hidden'
                              }}>
                                {tabs.map((tab) => (
                                  <button
                                    key={tab.id}
                                    onClick={() => setActiveTextTab(tab.id)}
                                    style={{
                                      flex: '1 1 0',
                                      minWidth: '0',
                                      padding: '10px 8px',
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: activeTextTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                                      color: activeTextTab === tab.id ? '#111827' : '#6b7280',
                                      fontSize: '12px',
                                      fontWeight: activeTextTab === tab.id ? '600' : '400',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (activeTextTab !== tab.id) {
                                        e.currentTarget.style.color = '#111827';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (activeTextTab !== tab.id) {
                                        e.currentTarget.style.color = '#6b7280';
                                      }
                                    }}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              {/* Contenu de l'onglet sélectionné */}
                              <div style={{ padding: '20px' }}>
                                {/* Onglet Contenu */}
                                {activeTextTab === 'contenu' && (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      marginBottom: '12px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}>
                                      Contenu du texte
                                    </div>
                                    <input
                                      type="text"
                                      value={selectedText.content}
                                      onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                                      style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        color: '#111827',
                                        fontSize: '14px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = '#8eff36'}
                                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                  </div>
                                )}

                                {/* Onglet Police */}
                                {activeTextTab === 'police' && (() => {
                                  // Filtrer les polices selon les groupes sélectionnés
                                  const allowedGroupIds = activeModule?.selectedItems?.fontGroupIds;
                                  const visibleFonts = (() => {
                                    const allFonts: Array<{ id: string; name: string; display_name?: string; file_url?: string; file_type?: string; groupId: string }> = [];
                                    fontGroups.forEach(group => {
                                      if (group.fonts) {
                                        group.fonts.forEach((font: any) => {
                                          allFonts.push({
                                            id: font.id,
                                            name: font.name || font.id,
                                            display_name: font.display_name,
                                            file_url: font.file_url,
                                            file_type: font.file_type || font.format,
                                            groupId: group.id
                                          });
                                        });
                                      }
                                    });
                                    
                                    if (allowedGroupIds && allowedGroupIds.length > 0) {
                                      return allFonts.filter(font => allowedGroupIds.includes(font.groupId));
                                    }
                                    return allFonts;
                                  })();
                                  
                                  // Texte de prévisualisation (utiliser le contenu du texte sélectionné ou "ZG" par défaut)
                                  const previewText = selectedText.content && selectedText.content.trim() !== '' 
                                    ? selectedText.content 
                                    : 'ZG';
                                  
                                  return (
                                    <div>
                                      <div style={{
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: '#111827',
                                        marginBottom: '12px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT
                                      }}>
                                        Police
                                      </div>
                                      {visibleFonts.length === 0 ? (
                                        <p style={{ 
                                          color: '#6b7280', 
                                          fontSize: '12px', 
                                          fontFamily: CONFIGURATOR_PANEL_FONT,
                                          padding: '12px',
                                          backgroundColor: '#f9fafb',
                                          borderRadius: '8px'
                                        }}>
                                          Aucune police disponible. Cochez des groupes de polices dans les settings du module.
                                        </p>
                                      ) : (
                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(4, 1fr)',
                                          gap: '12px',
                                          padding: '4px'
                                        }}>
                                          {/* Polices disponibles */}
                                          {visibleFonts.map((font) => {
                                            const isSelected = selectedText.fontFamily === font.id;
                                            // Utiliser display_name comme fontFamily (comme dans ModelViewer)
                                            const fontFamilyValue = font.display_name || font.name;
                                            
                                            // Vérifier si la police est chargée
                                            const fontFamilyQuoted = fontFamilyValue ? `"${fontFamilyValue}"` : '';
                                            const isFontLoaded = fontFamilyValue ? (
                                              document.fonts.check(`12px ${fontFamilyQuoted}`) ||
                                              document.fonts.check(`18px ${fontFamilyQuoted}`) ||
                                              document.fonts.check(`24px ${fontFamilyQuoted}`)
                                            ) : false;
                                            
                                            return (
                                              <div
                                                key={font.id}
                                                onClick={() => updateText(selectedTextId, { fontFamily: font.id })}
                                                style={{
                                                  padding: '12px',
                                                  backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                                  borderRadius: '8px',
                                                  border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.2s',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  gap: '8px',
                                                  minHeight: '100px',
                                                  position: 'relative'
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minHeight: '60px',
                                                    fontFamily: fontFamilyValue ? `${fontFamilyQuoted}, sans-serif` : 'sans-serif',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    color: '#111827'
                                                  }}
                                                  ref={(el) => {
                                                    if (el && fontFamilyValue) {
                                                      // Forcer immédiatement la police
                                                      el.style.fontFamily = `${fontFamilyQuoted}, sans-serif`;
                                                      el.style.setProperty('font-family', `${fontFamilyQuoted}, sans-serif`, 'important');
                                                      
                                                      // Vérifier périodiquement si la police est chargée et forcer le style
                                                      const checkAndForce = () => {
                                                        if (el) {
                                                          el.style.fontFamily = `${fontFamilyQuoted}, sans-serif`;
                                                          el.style.setProperty('font-family', `${fontFamilyQuoted}, sans-serif`, 'important');
                                                          
                                                          // Vérifier si la police est maintenant chargée
                                                          const isReady = document.fonts.check(`12px ${fontFamilyQuoted}`) ||
                                                                         document.fonts.check(`18px ${fontFamilyQuoted}`) ||
                                                                         document.fonts.check(`24px ${fontFamilyQuoted}`);
                                                          if (!isReady) {
                                                            setTimeout(checkAndForce, 100);
                                                          }
                                                        }
                                                      };
                                                      checkAndForce();
                                                    }
                                                  }}
                                                >
                                                  {previewText}
                                                </div>
                                                <span style={{
                                                  fontSize: '11px',
                                                  color: '#111827',
                                                  WebkitTextFillColor: '#111827',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                                  textAlign: 'center',
                                                  fontWeight: '500',
                                                  backgroundColor: 'transparent'
                                                }}>
                                                  {font.display_name || font.name}
                                                </span>
                                                {isSelected && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    bottom: '8px',
                                                    right: '8px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#111827',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}>
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    <div style={{ marginTop: '16px' }}>
                                      <div style={{
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: '#111827',
                                        marginBottom: '8px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                      }}>
                                        <span>Taille du texte</span>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                          {Math.round(textConstraints.minFontSizePx)} px – {Math.round(textConstraints.maxFontSizePx)} px
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                          type="range"
                                          min={textConstraints.minFontSizePx}
                                          max={textConstraints.maxFontSizePx}
                                          step={1}
                                          value={selectedText.fontSize}
                                          onChange={(e) => updateText(selectedTextId, { fontSize: parseFloat(e.target.value) })}
                                          style={{
                                            flex: 1,
                                            accentColor: '#111827'
                                          }}
                                        />
                                        <span style={{
                                          fontSize: '13px',
                                          fontWeight: '600',
                                          color: '#111827',
                                          minWidth: '48px',
                                          textAlign: 'right',
                                          fontFamily: CONFIGURATOR_PANEL_FONT
                                        }}>
                                          {Math.round(selectedText.fontSize)} px
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  );
                                })()}

                                {/* Onglet Couleur */}
                                {activeTextTab === 'couleur' && (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      marginBottom: '12px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}>
                                      Couleur
                                    </div>
                                    {activeModule.textColorPaletteId ? (() => {
                                      const palette = colorPalettes.find(p => p.id === activeModule.textColorPaletteId);
                                      if (!palette) {
                                        return (
                                          <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                            Palette introuvable. Veuillez en sélectionner une autre.
                                          </p>
                                        );
                                      }
                                      const paletteColors = palette.colors || [];
                                      if (paletteColors.length === 0) {
                                        return (
                                          <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                            La palette sélectionnée ne contient aucune couleur.
                                          </p>
                                        );
                                      }
                                      return (
                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                          gap: '12px'
                                        }}>
                                          {paletteColors.map((color: any, index: number) => {
                                            const hex = (color?.hex || '#000000').toLowerCase();
                                            const isSelected = (selectedText.color || '').toLowerCase() === hex;
                                            return (
                                              <button
                                                key={color?.id || `${palette.id}-${index}`}
                                                onClick={() => updateText(selectedTextId, { color: color?.hex || '#000000' })}
                                                style={{
                                                  border: isSelected ? '2px solid #111827' : '1px solid #e5e5e5',
                                                  borderRadius: '10px',
                                                  padding: '10px',
                                                  backgroundColor: '#ffffff',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                  cursor: 'pointer',
                                                  transition: 'border-color 0.2s, transform 0.2s'
                                                }}
                                              >
                                                <span style={{
                                                  width: '36px',
                                                  height: '36px',
                                                  borderRadius: '50%',
                                                  border: '1px solid #d1d5db',
                                                  backgroundColor: color?.hex || '#000000',
                                                  display: 'inline-block'
                                                }} />
                                                <span style={{
                                                  fontSize: '11px',
                                                  color: '#111827',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                                  textAlign: 'center'
                                                }}>
                                                  {color?.name || (color?.hex || '#000000').toUpperCase()}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })() : (
                                      <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                        Sélectionnez une palette de couleurs pour le texte dans les réglages du module.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Onglet Contour */}
                                {activeTextTab === 'contour' && (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      marginBottom: '12px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}>
                                      Contour
                                    </div>
                                    {activeModule.textStrokePaletteId ? (() => {
                                      const palette = colorPalettes.find(p => p.id === activeModule.textStrokePaletteId);
                                      if (!palette) {
                                        return (
                                          <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                            Palette introuvable. Veuillez en sélectionner une autre.
                                          </p>
                                        );
                                      }
                                      const paletteColors = palette.colors || [];
                                      if (paletteColors.length === 0) {
                                        return (
                                          <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                            La palette sélectionnée ne contient aucune couleur.
                                          </p>
                                        );
                                      }
                                      return (
                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                          gap: '12px',
                                          marginBottom: '20px'
                                        }}>
                                          {paletteColors.map((color: any, index: number) => {
                                            const hex = (color?.hex || '#000000').toLowerCase();
                                            const isSelected = (selectedText.strokeColor || '').toLowerCase() === hex;
                                            return (
                                              <button
                                                key={color?.id || `${palette.id}-${index}`}
                                                onClick={() => updateText(selectedTextId, { strokeColor: color?.hex || '#000000' })}
                                                style={{
                                                  border: isSelected ? '2px solid #111827' : '1px solid #e5e5e5',
                                                  borderRadius: '10px',
                                                  padding: '10px',
                                                  backgroundColor: '#ffffff',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                  cursor: 'pointer',
                                                  transition: 'border-color 0.2s, transform 0.2s'
                                                }}
                                              >
                                                <span style={{
                                                  width: '36px',
                                                  height: '36px',
                                                  borderRadius: '50%',
                                                  border: '1px solid #d1d5db',
                                                  backgroundColor: color?.hex || '#000000',
                                                  display: 'inline-block'
                                                }} />
                                                <span style={{
                                                  fontSize: '11px',
                                                  color: '#111827',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                                  textAlign: 'center'
                                                }}>
                                                  {color?.name || (color?.hex || '#000000').toUpperCase()}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      );
                                    })() : (
                                      <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '20px' }}>
                                        Sélectionnez une palette de contours dans les réglages du module.
                                      </p>
                                    )}
                                    <div>
                                      {(() => {
                                        const sliderMin = textConstraints.strokeMinWidthPx;
                                        const sliderMax = textConstraints.strokeMaxWidthPx;
                                        const sliderRange = sliderMax - sliderMin;
                                        
                                        // Utiliser directement la valeur stockée
                                        const rawValue = selectedText.strokeWidth ?? textConstraints.baseStrokeWidthPx;
                                        let currentPxValue = Number.isFinite(rawValue) ? rawValue : sliderMin;
                                        
                                        // Clamper strictement entre min et max
                                        currentPxValue = Math.min(sliderMax, Math.max(sliderMin, currentPxValue));
                                        
                                        // Arrondir à l'entier le plus proche (step de 1px)
                                        currentPxValue = Math.round(currentPxValue);
                                        
                                        // S'assurer que la valeur ne dépasse jamais les limites après arrondi
                                        if (currentPxValue < sliderMin) currentPxValue = sliderMin;
                                        if (currentPxValue > sliderMax) currentPxValue = sliderMax;
                                        
                                        const sliderId = `stroke-slider-${selectedTextId}`;
                                        
                                        return (
                                          <div style={{ width: '100%' }}>
                                            <div style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              marginBottom: '8px'
                                            }}>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                fontFamily: CONFIGURATOR_PANEL_FONT
                                              }}>
                                                Épaisseur {currentPxValue}
                                              </div>
                                            </div>
                                            <style>{`
                                              #${sliderId} {
                                                -webkit-appearance: none;
                                                appearance: none;
                                                width: 100%;
                                                height: 6px;
                                                border-radius: 3px;
                                                background: #e5e7eb;
                                                outline: none;
                                                padding: 0;
                                                margin: 0;
                                              }
                                              #${sliderId}::-webkit-slider-thumb {
                                                -webkit-appearance: none;
                                                appearance: none;
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #3b82f6;
                                                cursor: pointer;
                                                border: none;
                                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                              }
                                              #${sliderId}::-moz-range-thumb {
                                                width: 18px;
                                                height: 18px;
                                                border-radius: 50%;
                                                background: #3b82f6;
                                                cursor: pointer;
                                                border: none;
                                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                              }
                                              #${sliderId}::-webkit-slider-runnable-track {
                                                width: 100%;
                                                height: 6px;
                                                background: #e5e7eb;
                                                border-radius: 3px;
                                              }
                                              #${sliderId}::-moz-range-track {
                                                width: 100%;
                                                height: 6px;
                                                background: #e5e7eb;
                                                border-radius: 3px;
                                                border: none;
                                              }
                                            `}</style>
                                            <input
                                              id={sliderId}
                                              type="range"
                                              min={sliderMin}
                                              max={sliderMax}
                                              step="1"
                                              value={currentPxValue}
                                              onChange={(e) => {
                                                const pxValue = parseFloat(e.target.value);
                                                
                                                // Vérifier que la valeur est valide
                                                if (!Number.isFinite(pxValue)) return;
                                                
                                                // Clamper strictement entre min et max
                                                let clampedValue = Math.min(sliderMax, Math.max(sliderMin, pxValue));
                                                
                                                // Arrondir à l'entier le plus proche (step de 1px)
                                                clampedValue = Math.round(clampedValue);
                                                
                                                // Double vérification après arrondi
                                                if (clampedValue < sliderMin) clampedValue = sliderMin;
                                                if (clampedValue > sliderMax) clampedValue = sliderMax;
                                                
                                                updateText(selectedTextId, { strokeWidth: clampedValue });
                                              }}
                                              disabled={sliderRange <= 0}
                                            />
                                            <div style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              marginTop: '6px',
                                              paddingTop: '4px',
                                              fontSize: '11px',
                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                              fontWeight: '400'
                                            }}>
                                              <span style={{ 
                                                flex: '0 0 auto',
                                                color: '#111827',
                                                WebkitTextFillColor: '#111827'
                                              }}>Min.</span>
                                              <span style={{ 
                                                flex: '0 0 auto',
                                                color: '#111827',
                                                WebkitTextFillColor: '#111827'
                                              }}>Max.</span>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Onglet Déformation */}
                                {activeTextTab === 'deformation' && (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#111827',
                                      marginBottom: '12px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}>
                                      Type de déformation
                                    </div>
                                    <div>
                                      <style>{`
                                        select.deformation-select {
                                          color: #111827 !important;
                                        }
                                        select.deformation-select option {
                                          color: #111827 !important;
                                          background-color: #ffffff !important;
                                        }
                                        select.deformation-select:focus {
                                          color: #111827 !important;
                                        }
                                      `}</style>
                                      <select
                                        className="deformation-select"
                                        value={selectedText.deformation || ''}
                                        onChange={(e) => updateText(selectedTextId, { 
                                          deformation: e.target.value || undefined 
                                        })}
                                        style={{
                                          width: '100%',
                                          padding: '12px 16px',
                                          backgroundColor: '#ffffff',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '8px',
                                          color: '#111827',
                                          fontSize: '14px',
                                          fontFamily: CONFIGURATOR_PANEL_FONT,
                                          cursor: 'pointer',
                                          outline: 'none',
                                          marginBottom: selectedText.deformation ? '20px' : '0',
                                          transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#8eff36'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                      >
                                      {(() => {
                                        // Liste complète des déformations avec leurs labels
                                        const allDeformations = [
                                          { value: '', label: 'Aucune' },
                                          { value: 'arc', label: 'Arc' },
                                          { value: 'wave', label: 'Vague' },
                                          { value: 'bulge', label: 'Bombé' },
                                          { value: 'pinch', label: 'Pincement' },
                                          { value: 'flag', label: 'Drapeau' },
                                          { value: 'fisheye', label: 'Fisheye' },
                                          { value: 'squeeze', label: 'Compression' },
                                          { value: 'skew', label: 'Inclinaison' },
                                          { value: 'spiral', label: 'Spirale' },
                                          { value: 'rotate', label: 'Rotation progressive' },
                                          { value: 'tilt', label: 'Tilt' },
                                          { value: 'perspective', label: 'Perspective' },
                                          { value: 'fade', label: 'Fondu' },
                                          { value: 'ribbon', label: 'Ruban' },
                                          { value: 'incline', label: 'Montée/descente' },
                                          { value: 'staircase', label: 'Escalier' },
                                          { value: 'wave-arc', label: 'Vague + Arc' },
                                          { value: 'pulse', label: 'Pulse' },
                                        ];
                                        
                                        // Filtrer selon textEnabledDeformations du module actif
                                        const enabledDeformations = activeModule?.textEnabledDeformations;
                                        const filteredDeformations = enabledDeformations && enabledDeformations.length > 0
                                          ? allDeformations.filter(def => 
                                              def.value === '' || enabledDeformations.includes(def.value)
                                            )
                                          : allDeformations; // Si aucune restriction, afficher toutes
                                        
                                        return filteredDeformations.map(def => (
                                          <option key={def.value} value={def.value} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{def.label}</option>
                                        ));
                                      })()}
                                      </select>
                                    </div>
                                    {selectedText.deformation && (() => {
                                      const sliderId = `deformation-slider-${selectedTextId}`;
                                      const intensity = selectedText.deformationIntensity ?? 0;
                                      // Calculer la position en pourcentage pour le gradient (0 à 100% de la plage -100 à +100)
                                      const positionPercent = ((intensity + 100) / 200) * 100;
                                      
                                      return (
                                        <div style={{ marginTop: '20px' }}>
                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                          }}>
                                            <div style={{
                                              fontSize: '13px',
                                              fontWeight: '500',
                                              color: '#111827',
                                              fontFamily: CONFIGURATOR_PANEL_FONT
                                            }}>
                                              Intensité
                                            </div>
                                            <div style={{
                                              fontSize: '13px',
                                              fontWeight: '600',
                                              color: '#111827',
                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                              minWidth: '60px',
                                              textAlign: 'right'
                                            }}>
                                              {intensity > 0 ? `+${intensity}` : intensity.toString()}
                                            </div>
                                          </div>
                                          <style>{`
                                            #${sliderId} {
                                              -webkit-appearance: none;
                                              appearance: none;
                                              width: 100%;
                                              height: 6px;
                                              border-radius: 3px;
                                              background: #e5e7eb;
                                              outline: none;
                                              padding: 0;
                                              margin: 0;
                                            }
                                            #${sliderId}::-webkit-slider-thumb {
                                              -webkit-appearance: none;
                                              appearance: none;
                                              width: 18px;
                                              height: 18px;
                                              border-radius: 50%;
                                              background: #8eff36;
                                              border: 2px solid #ffffff;
                                              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                              cursor: pointer;
                                            }
                                            #${sliderId}::-moz-range-thumb {
                                              width: 18px;
                                              height: 18px;
                                              border-radius: 50%;
                                              background: #8eff36;
                                              border: 2px solid #ffffff;
                                              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                              cursor: pointer;
                                            }
                                            #${sliderId}::-webkit-slider-runnable-track {
                                              width: 100%;
                                              height: 6px;
                                              border-radius: 3px;
                                              background: #e5e7eb;
                                            }
                                            #${sliderId}::-moz-range-track {
                                              width: 100%;
                                              height: 6px;
                                              border-radius: 3px;
                                              background: #e5e7eb;
                                            }
                                          `}</style>
                                          <input
                                            id={sliderId}
                                            type="range"
                                            min="-100"
                                            max="100"
                                            step="1"
                                            value={intensity}
                                            onChange={(e) => updateText(selectedTextId, { 
                                              deformationIntensity: parseInt(e.target.value) 
                                            })}
                                          />
                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '6px',
                                            paddingTop: '4px',
                                            fontSize: '11px',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            fontWeight: '400'
                                          }}>
                                            <span style={{ 
                                              flex: '0 0 auto',
                                              color: '#111827',
                                              WebkitTextFillColor: '#111827'
                                            }}>-100</span>
                                            <span style={{ 
                                              flex: '0 0 auto',
                                              color: '#111827',
                                              WebkitTextFillColor: '#111827'
                                            }}>0</span>
                                            <span style={{ 
                                              flex: '0 0 auto',
                                              color: '#111827',
                                              WebkitTextFillColor: '#111827'
                                            }}>+100</span>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                          Sélectionnez un élément dans les settings du module.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Action Buttons */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => {
                        // TODO: Implémenter la sauvegarde
                        console.log('Sauvegarder');
                      }}
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implémenter l'ajout au panier
                        console.log('Ajouter au panier');
                      }}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" stroke="#ffffff" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z"></path>
                      </svg>
                      <span style={{ color: '#ffffff' }}>Ajouter au panier</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Center: 3D Model Display */}
            <div style={{
              flex: 1,
              backgroundColor: '#f8f8f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'auto'
            }}>
              {selectedModel3DId ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(() => {
                    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                    if (selectedModel) {
                      const modelUrl = selectedModel.glb_url || selectedModel.glbUrl || '';
                      
                      // Chercher le design sélectionné dans tous les modules de type designs-2d
                      // Prioriser celui de l'onglet actif, sinon prendre le premier trouvé
                      let designIdToUse: string | null = null;
                      
                      // D'abord, chercher dans l'onglet actif
                      if (activeCustomizerTab) {
                        const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
                        if (activeModule?.contentType === 'designs-2d' && activeModule.selectedItems?.design2DId) {
                          designIdToUse = activeModule.selectedItems.design2DId;
                        }
                      }
                      
                      // Si aucun design dans l'onglet actif, chercher dans tous les autres modules
                      if (!designIdToUse) {
                        const designModule = customizationModules.find(m => 
                          m.contentType === 'designs-2d' && m.selectedItems?.design2DId
                        );
                        if (designModule?.selectedItems?.design2DId) {
                          designIdToUse = designModule.selectedItems.design2DId;
                        }
                      }
                      
                      // Si toujours aucun design, utiliser le design de base
                      if (!designIdToUse) {
                        designIdToUse = selectedDesign2DId;
                      }
                      
                      const selectedDesign = designs2D.find(d => d.id === designIdToUse);
                      const designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || null;
                      
                      // Récupérer les color_mappings du design et construire les couleurs par classe
                      const designColorMappings = selectedDesign?.color_mappings || null;
                      
                      // Map intermédiaire: colorId -> { hex, name }
                      const colorsMap: Record<string, { hex: string; name: string }> = {};
                      if (colorPalettes.length > 0) {
                        // Construire une map de toutes les couleurs disponibles (toutes palettes confondues)
                        colorPalettes.forEach((palette) => {
                          if (palette.colors) {
                            palette.colors.forEach((color: any, index: number) => {
                              // Générer un ID unique pour chaque couleur (même logique que dans l'admin)
                              const colorId = color.id || `${palette.id}-${index}-${color.hex}`;
                              colorsMap[colorId] = {
                                hex: color.hex || '#000000',
                                name: color.name || ''
                              };
                            });
                          }
                        });
                      }

                      // Map final passé au ModelViewer: class CSS -> hex
                      const colorsForViewer: Record<string, string> = {};

                      // 1) Appliquer les color_mappings du design (valeur = colorId)
                      if (designColorMappings) {
                        Object.entries(designColorMappings).forEach(([colorClass, mappedColorId]) => {
                          // Priorité aux overrides locaux (designColors) si présents
                          const effectiveColorId = designColors[colorClass] || mappedColorId;
                          const color = colorsMap[effectiveColorId];
                          if (color?.hex) {
                            colorsForViewer[colorClass] = color.hex;
                          }
                        });
                      }

                      // 2) Appliquer aussi les overrides définis seulement dans designColors
                      Object.entries(designColors).forEach(([colorClass, colorId]) => {
                        const color = colorsMap[colorId];
                        if (color?.hex) {
                          colorsForViewer[colorClass] = color.hex;
                        }
                      });
                      
                      // Préparer les material maps pour chaque partie du modèle
                      // ModelViewer attend les material maps indexés par nom de matériau
                      const parts = (selectedModel as any).model_parts || [];
                      const materialMapsForModel: Record<string, any> = {};
                      parts.forEach((part: any) => {
                        if (part.material_map_id && modelMaterialMaps[part.material_map_id]) {
                          const materialMap = modelMaterialMaps[part.material_map_id];
                          const materialMapFiles = materialMap.material_map_files || [];
                          
                          // Récupérer les valeurs spécifiques au modèle depuis modelSpecificMaterialMaps
                          const partName = part.name || '';
                          const modelSpecificMap = modelSpecificMaterialMaps[partName] || {};
                          
                          // Transformer la structure pour ModelViewer
                          const transformedMap: any = {
                            materialName: part.name, // Utiliser le nom de la partie comme materialName
                          };
                          
                          // Extraire les fichiers et les transformer en format attendu par ModelViewer
                          // Le scale est utilisé pour repeatX/repeatY (dimensions de répétition de la texture)
                          // L'intensité est utilisée pour les facteurs d'intensité (roughnessFactor, metalnessFactor, etc.)
                          let globalRepeatX: number | undefined;
                          let globalRepeatY: number | undefined;
                          
                          materialMapFiles.forEach((file: any) => {
                            const mapType = file.map_type?.toLowerCase();
                            const fileUrl = file.file_url;
                            // Utiliser les valeurs spécifiques au modèle si disponibles, sinon utiliser celles des fichiers globaux
                            const intensity = file.intensity !== undefined ? file.intensity / 100 : 1;
                            const scale = file.scale !== undefined ? file.scale : 1;
                            
                            if (!fileUrl) return;
                            
                            // Appliquer les dimensions (repeat) globalement - utiliser le scale du premier fichier trouvé
                            // Priorité aux valeurs spécifiques au modèle (repeatX/repeatY)
                            if (modelSpecificMap.repeatX !== undefined) {
                              globalRepeatX = modelSpecificMap.repeatX;
                              globalRepeatY = modelSpecificMap.repeatY !== undefined ? modelSpecificMap.repeatY : modelSpecificMap.repeatX;
                              transformedMap.repeatX = globalRepeatX;
                              transformedMap.repeatY = globalRepeatY;
                            } else if (scale !== 1 && globalRepeatX === undefined) {
                              globalRepeatX = scale;
                              globalRepeatY = scale;
                              transformedMap.repeatX = scale;
                              transformedMap.repeatY = scale;
                            }
                            transformedMap.scaleX = globalRepeatX || scale;
                            transformedMap.scaleY = globalRepeatY || scale;
                            transformedMap.tilingX = globalRepeatX || scale;
                            transformedMap.tilingY = globalRepeatY || scale;
                            
                            // Mapper les types de fichiers vers les propriétés attendues par ModelViewer
                            if (mapType === 'normal' || mapType === 'normalmap') {
                              transformedMap.normalMap = fileUrl;
                              transformedMap.normal = fileUrl;
                              transformedMap.normalTexture = fileUrl;
                              // Priorité aux valeurs spécifiques au modèle (normalIntensity)
                              if (typeof modelSpecificMap.normalIntensity === 'number') {
                                transformedMap.normalIntensity = modelSpecificMap.normalIntensity;
                                transformedMap.normalScale = modelSpecificMap.normalIntensity;
                                transformedMap.normalScaleX = modelSpecificMap.normalIntensity;
                                transformedMap.normalScaleY = modelSpecificMap.normalIntensity;
                              } else {
                                // Utiliser l'intensité depuis les fichiers globaux (pas le scale qui est pour le repeat)
                                transformedMap.normalIntensity = intensity;
                                transformedMap.normalScale = intensity;
                                transformedMap.normalScaleX = intensity;
                                transformedMap.normalScaleY = intensity;
                              }
                            } else if (mapType === 'roughness' || mapType === 'roughnessmap') {
                              transformedMap.roughnessMap = fileUrl;
                              transformedMap.roughness = fileUrl;
                              transformedMap.roughnessTexture = fileUrl;
                              // Priorité aux valeurs spécifiques au modèle (roughnessValue)
                              if (typeof modelSpecificMap.roughnessValue === 'number') {
                                transformedMap.roughnessValue = modelSpecificMap.roughnessValue;
                                transformedMap.roughnessFactor = modelSpecificMap.roughnessValue;
                                transformedMap.roughness = modelSpecificMap.roughnessValue;
                              } else {
                                transformedMap.roughnessFactor = intensity;
                              }
                            } else if (mapType === 'metalness' || mapType === 'metallic' || mapType === 'metalnessmap') {
                              transformedMap.metalnessMap = fileUrl;
                              transformedMap.metallicMap = fileUrl;
                              transformedMap.metalness = fileUrl;
                              transformedMap.metalnessTexture = fileUrl;
                              // Priorité aux valeurs spécifiques au modèle (metalnessValue)
                              if (typeof modelSpecificMap.metalnessValue === 'number') {
                                transformedMap.metalnessValue = modelSpecificMap.metalnessValue;
                                transformedMap.metalnessFactor = modelSpecificMap.metalnessValue;
                                transformedMap.metallic = modelSpecificMap.metalnessValue;
                                transformedMap.metalness = modelSpecificMap.metalnessValue;
                              } else {
                                transformedMap.metalnessFactor = intensity;
                                transformedMap.metallic = intensity;
                              }
                            } else if (mapType === 'ao' || mapType === 'ambientocclusion' || mapType === 'occlusion' || mapType === 'aomap') {
                              transformedMap.aoMap = fileUrl;
                              transformedMap.ambientOcclusionMap = fileUrl;
                              transformedMap.occlusionMap = fileUrl;
                              // Priorité aux valeurs spécifiques au modèle (aoIntensity)
                              if (typeof modelSpecificMap.aoIntensity === 'number') {
                                transformedMap.aoIntensity = modelSpecificMap.aoIntensity;
                                transformedMap.occlusionIntensity = modelSpecificMap.aoIntensity;
                              } else {
                                transformedMap.aoIntensity = intensity;
                                transformedMap.occlusionIntensity = intensity;
                              }
                            } else if (mapType === 'orm' || mapType === 'occlusionroughnessmetalness') {
                              transformedMap.ormMap = fileUrl;
                              transformedMap.occlusionRoughnessMetalnessMap = fileUrl;
                              transformedMap.occlusion_roughness_metalness = fileUrl;
                            }
                          });
                          
                          // Indexer par nom de partie (qui correspond au nom de matériau dans le modèle)
                          // Utiliser plusieurs variantes du nom pour faciliter la correspondance
                          if (partName) {
                            materialMapsForModel[partName] = transformedMap;
                            materialMapsForModel[partName.toLowerCase()] = transformedMap;
                            materialMapsForModel[partName.toUpperCase()] = transformedMap;
                            // Aussi garder l'ID comme clé de secours
                            materialMapsForModel[part.material_map_id] = transformedMap;
                          }
                        }
                      });
                      
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '600px',
                          backgroundColor: '#e8e8e8',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          ...(viewportMode === 'mobile' ? {
                            maxWidth: '393px',
                            maxHeight: '852px',
                            width: '393px',
                            height: '852px',
                            margin: '0 auto',
                            border: '8px solid #1f2937',
                            borderRadius: '20px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            overflow: 'hidden'
                          } : {
                            maxWidth: '100%',
                            maxHeight: '100%',
                            margin: '0',
                            overflow: 'hidden'
                          })
                        }}>
                          {/* Canvas 3D - prend l'espace restant */}
                          <div style={{ flex: '1 1 0%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                          {(() => {
                            // Utiliser les mêmes paramètres que le configurateur pour aligner les échelles
                            const cameraPosition = viewportMode === 'mobile' ? [0, 0, 8] : [0, 0, 15];
                            const cameraFov = viewportMode === 'mobile' ? 65 : 50;
                            
                            return (
                              <Canvas
                                key={`canvas-${selectedModel3DId}`}
                                camera={{ 
                                  position: cameraPosition, 
                                  fov: cameraFov
                                }}
                                gl={{ preserveDrawingBuffer: true }}
                                style={{ width: '100%', height: '100%' }}
                              >
                            {/* Composant pour initialiser la caméra avec les réglages - UNIQUEMENT au chargement initial */}
                            {(() => {
                              function CameraInitializer({ initialZoom, initialRotation, viewHasBeenSetRef }: { initialZoom: number; initialRotation: number; viewHasBeenSetRef: React.MutableRefObject<boolean> }) {
                                const { camera } = useThree();
                                const initializedRef = useRef(false);
                                const lastZoomRef = useRef<number | null>(null);
                                const lastRotationRef = useRef<number | null>(null);
                                
                                useEffect(() => {
                                  // Ne s'exécuter qu'une seule fois au montage et seulement si aucune vue n'a été définie
                                  // Si viewHasBeenSetRef est true, ne JAMAIS réinitialiser la caméra, même si le composant se remonte
                                  if (initializedRef.current || viewHasBeenSetRef.current) {
                                    // Si une vue a été définie, marquer comme initialisé pour éviter toute réinitialisation
                                    initializedRef.current = true;
                                    return;
                                  }
                                  
                                  // Attendre que les valeurs soient chargées depuis le produit (pas les valeurs par défaut)
                                  // Si initialZoom est toujours la valeur par défaut (5) et qu'on n'a pas encore initialisé, attendre un peu plus
                                  if (initialZoom === 5 && !lastZoomRef.current) {
                                    // Attendre un peu pour que les valeurs soient chargées depuis le produit
                                    const checkTimer = setTimeout(() => {
                                      if (!initializedRef.current && !viewHasBeenSetRef.current) {
                                        // Utiliser les valeurs actuelles même si ce sont les valeurs par défaut
                                        const distance = initialZoom || 5;
                                        camera.position.set(0, 0, distance);
                                        
                                        if (initialRotation !== 0) {
                                          const angleRad = (initialRotation * Math.PI) / 180;
                                          const x = 0;
                                          const z = distance;
                                          const newX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
                                          const newZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
                                          camera.position.set(newX, camera.position.y, newZ);
                                        }
                                        
                                        camera.updateProjectionMatrix();
                                        initializedRef.current = true;
                                        lastZoomRef.current = initialZoom;
                                        lastRotationRef.current = initialRotation;
                                      }
                                    }, 500);
                                    return () => clearTimeout(checkTimer);
                                  }
                                  
                                  // Si les valeurs ont changé depuis la dernière initialisation, réinitialiser
                                  // MAIS seulement si viewHasBeenSetRef est false (pas de vue définie par l'utilisateur)
                                  if (lastZoomRef.current !== null && (lastZoomRef.current !== initialZoom || lastRotationRef.current !== initialRotation)) {
                                    // Ne pas réinitialiser si une vue a été définie par l'utilisateur
                                    if (!viewHasBeenSetRef.current) {
                                      const distance = initialZoom || 5;
                                      camera.position.set(0, 0, distance);
                                      
                                      if (initialRotation !== 0) {
                                        const angleRad = (initialRotation * Math.PI) / 180;
                                        const x = 0;
                                        const z = distance;
                                        const newX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
                                        const newZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
                                        camera.position.set(newX, camera.position.y, newZ);
                                      }
                                      
                                      camera.updateProjectionMatrix();
                                      lastZoomRef.current = initialZoom;
                                      lastRotationRef.current = initialRotation;
                                    }
                                    // Même si on ne réinitialise pas, mettre à jour les refs pour éviter les réinitialisations futures
                                    lastZoomRef.current = initialZoom;
                                    lastRotationRef.current = initialRotation;
                                    return;
                                  }
                                  
                                  // Première initialisation
                                  if (!initializedRef.current) {
                                    const timer = setTimeout(() => {
                                      if (initializedRef.current || viewHasBeenSetRef.current) return;
                                      
                                      const distance = initialZoom || 5;
                                      camera.position.set(0, 0, distance);
                                      
                                      if (initialRotation !== 0) {
                                        const angleRad = (initialRotation * Math.PI) / 180;
                                        const x = 0;
                                        const z = distance;
                                        const newX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
                                        const newZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
                                        camera.position.set(newX, camera.position.y, newZ);
                                      }
                                      
                                      camera.updateProjectionMatrix();
                                      initializedRef.current = true;
                                      lastZoomRef.current = initialZoom;
                                      lastRotationRef.current = initialRotation;
                                    }, 200);
                                    
                                    return () => clearTimeout(timer);
                                  }
                                }, [initialZoom, initialRotation, camera, viewHasBeenSetRef]);
                                
                                // Ne jamais réinitialiser la caméra si une vue a été définie par l'utilisateur
                                // Même si initialZoom ou initialRotation changent, on ne doit pas réinitialiser
                                // si l'utilisateur a déjà positionné la caméra
                                // Protection supplémentaire : si viewHasBeenSetRef est true, ne jamais toucher à la caméra
                                useEffect(() => {
                                  if (viewHasBeenSetRef.current) {
                                    initializedRef.current = true;
                                  }
                                }, [viewHasBeenSetRef]);
                                
                                return null;
                              }
                              // Passer le ref persistant pour savoir si une vue a été définie
                              const alignedInitialZoom = viewportMode === 'mobile' ? 8 : 15; // Aligné avec le configurateur
                              return <CameraInitializer initialZoom={alignedInitialZoom} initialRotation={initialRotation} viewHasBeenSetRef={viewHasBeenSetRef} />;
                            })()}
                            <ambientLight intensity={0.4} color="#f5f5f5" />
                            <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" />
                            <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
                            <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
                            <Suspense fallback={
                              <mesh>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial color="#3b82f6" wireframe />
                              </mesh>
                            }>
                              {modelUrl && (() => {
                                // Créer un tableau de toutes les fonts disponibles pour ModelViewer
                                const allFontsForViewer: Array<{ id: string; display_name: string; font_url: string }> = [];
                                const activeModule = getTextModuleConfig();
                                const allowedGroupIds = activeModule?.selectedItems?.fontGroupIds;
                                
                                fontGroups.forEach(group => {
                                  if (group.fonts && (!allowedGroupIds || allowedGroupIds.length === 0 || allowedGroupIds.includes(group.id))) {
                                    group.fonts.forEach((font: any) => {
                                      if (font.file_url && (font.name || font.display_name)) {
                                        allFontsForViewer.push({
                                          id: font.id,
                                          display_name: font.display_name || font.name, // ModelViewer utilise display_name
                                          font_url: font.file_url // ModelViewer attend font_url
                                        });
                                      }
                                    });
                                  }
                                });
                                
                                return (
                                  <ModelViewer
                                    url={modelUrl}
                                    color="#ffffff"
                                    designTexture={designUrl || undefined}
                                    materialMaps={materialMapsForModel}
                                    colors={Object.keys(colorsForViewer).length > 0 ? colorsForViewer : undefined}
                                    selectedDesign={selectedDesign ? { id: selectedDesign.id, svgUrl: designUrl } : undefined}
                                    texts={texts}
                                    fonts={allFontsForViewer}
                                    updateTextPosition={updateTextPosition}
                                    updateTextRotation={updateTextRotation}
                                    updateTextSize={updateTextSize}
                                    toggleTextLock={toggleTextLock}
                                    removeText={removeText}
                                    onRequestTextDelete={confirmDeleteText}
                                    selectedTextId={selectedTextId}
                                    selectText={selectText}
                                    isDraggingText={isDraggingText}
                                    setIsDraggingText={setIsDraggingText}
                                    isRotatingText={isRotatingText}
                                    setIsRotatingText={setIsRotatingText}
                                    isResizingText={isResizingText}
                                    setIsResizingText={setIsResizingText}
                                    isPlacingText={isPlacingText}
                                    textZones={[
                                      {
                                        id: 'test-zone-face',
                                        name: 'Zone Face Test',
                                        position: [0.5, 0.5, 0],
                                        view: 'Face',
                                        is_logo: true,
                                        categories: ['logo-torse']
                                      },
                                      {
                                        id: 'test-zone-dos',
                                        name: 'Zone Dos Test', 
                                        position: [0.5, 0.3, 0],
                                        view: 'Dos',
                                        is_logo: true,
                                        categories: ['logo-dos']
                                      }
                                    ]} // Zones de test pour vérifier le système
                                    onTextPlaced={handleTextPlaced}
                                    onCanvasReady={(canvas: HTMLCanvasElement | null) => setUv2Canvas(canvas)}
                                    textSizeLimits={{ min: textConstraints.minFontSizePx, max: textConstraints.maxFontSizePx }}
                                    placedLogos={placedLogos}
                                    updateLogoPosition={updateLogoPosition}
                                    updateLogoScale={updateLogoScale}
                                    updateLogoRotation={updateLogoRotation}
                                    selectedLogoId={selectedLogoId}
                                    selectLogo={setSelectedLogoId}
                                    onRequestLogoDelete={confirmDeleteLogo}
                                    toggleLogoLock={toggleLogoLock}
                                    setIsDraggingLogo={setIsDraggingLogo}
                                  />
                                );
                              })()}
                            </Suspense>
                            {(() => {
                              // Composant pour gérer OrbitControls avec les réglages
                              function ControlsManager({ 
                                targetView, 
                                viewDistance, 
                                initialZoom, 
                                initialRotation, 
                                zoomSpeed, 
                                rotateSpeed, 
                                minZoom, 
                                maxZoom,
                                selectedTextId,
                                isPlacingText,
                                isDraggingText,
                                isRotatingText,
                                isResizingText,
                                setTargetView,
                                viewHasBeenSetRef,
                                mobileActivePanel
                              }: {
                                targetView: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null;
                                viewDistance: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', number>;
                                initialZoom: number;
                                initialRotation: number;
                                zoomSpeed: number;
                                rotateSpeed: number;
                                minZoom: number;
                                maxZoom: number;
                                selectedTextId: string | null;
                                isPlacingText: 'nom' | 'numero' | null;
                                isDraggingText: boolean;
                                isRotatingText: boolean;
                                isResizingText: boolean;
                                setTargetView: (view: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit' | null) => void;
                                viewHasBeenSetRef: React.MutableRefObject<boolean>;
                                mobileActivePanel: string | null;
                              }) {
                                const controlsRef = useRef<any>(null);
                                const rotationInitializedRef = useRef(false);
                                const savedCameraStateRef = useRef<{ position: [number, number, number], target: [number, number, number], distance: number } | null>(null);
                                const isRestoringRef = useRef(false);
                                
                                // La rotation initiale est gérée par CameraInitializer, pas besoin de la gérer ici
                                
                                // NE PAS sauvegarder/restaurer la caméra automatiquement en mobile
                                // Cela causait un retour à la vue de face à chaque ouverture d'onglet
                                // La caméra doit garder sa position actuelle même quand un panneau s'ouvre/ferme
                                
                                // Mettre à jour les réglages quand ils changent
                                useEffect(() => {
                                  if (controlsRef.current && !isRestoringRef.current) {
                                    controlsRef.current.zoomSpeed = zoomSpeed;
                                    controlsRef.current.rotateSpeed = rotateSpeed;
                                    controlsRef.current.minDistance = minZoom;
                                    controlsRef.current.maxDistance = maxZoom;
                                    controlsRef.current.update();
                                  }
                                }, [zoomSpeed, rotateSpeed, minZoom, maxZoom]);
                                
                                // Ne pas maintenir la distance de force - laisser la caméra libre
                                
                                // DÉSACTIVÉ - Conflit avec le CameraController principal qui gère le facteur 4.67x
                                // useEffect(() => {
                                //   const handleSetCameraView = (event: CustomEvent) => {
                                //     if (!controlsRef.current) {
                                //       return;
                                //     }
                                //     
                                //     // Marquer qu'une vue a été définie pour empêcher CameraInitializer de réinitialiser
                                //     viewHasBeenSetRef.current = true;
                                //     
                                //     const camera = controlsRef.current.object;
                                //     const target = controlsRef.current.target;
                                //     const maxDistance = maxZoom;
                                //     
                                //     const view = event.detail as 'front' | 'back' | 'left' | 'right';
                                //     
                                //     // Mapper la vue à la catégorie pour utiliser la bonne distance
                                //     const viewToCategory: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                //       'front': 'torse',
                                //       'back': 'dos',
                                //       'left': 'bras-gauche',
                                //       'right': 'bras-droit'
                                //     };
                                //     
                                //     const category = viewToCategory[view];
                                //     const distance = viewDistance[category] || maxDistance;
                                //     
                                //     if (view === 'front') {
                                //       camera.position.set(0, 0, distance);
                                //       target.set(0, 0, 0);
                                //     } else if (view === 'back') {
                                //       camera.position.set(0, 0, -distance);
                                //       target.set(0, 0, 0);
                                //     } else if (view === 'left') {
                                //       camera.position.set(-distance, 0, 0);
                                //       target.set(0, 0, 0);
                                //     } else if (view === 'right') {
                                //       camera.position.set(distance, 0, 0);
                                //       target.set(0, 0, 0);
                                //     }
                                //     
                                //     camera.rotation.set(0, 0, 0);
                                //     camera.updateProjectionMatrix();
                                //     controlsRef.current.update();
                                //     
                                //     // Forcer la mise à jour plusieurs fois pour s'assurer que ça prend
                                //     requestAnimationFrame(() => {
                                //         if (controlsRef.current) {
                                //           controlsRef.current.update();
                                //           requestAnimationFrame(() => {
                                //             if (controlsRef.current) {
                                //               controlsRef.current.update();
                                //             }
                                //           });
                                //         }
                                //       });
                                //   };
                                //   
                                //   window.addEventListener('setCameraView', handleSetCameraView as EventListener);
                                //   return () => window.removeEventListener('setCameraView', handleSetCameraView as EventListener);
                                // }, [viewDistance, maxZoom, viewportMode, mobileActivePanel, viewHasBeenSetRef]);
                                
                                // DÉSACTIVÉ - Conflit avec CameraController principal qui gère le facteur 4.67x
                                // useEffect(() => {
                                //   if (controlsRef.current && targetView) {
                                //     // Marquer qu'une vue a été définie (persistant, ne se réinitialise jamais)
                                //     viewHasBeenSetRef.current = true;
                                //     
                                //     const camera = controlsRef.current.object;
                                //     const distance = viewDistance[targetView] || initialZoom;
                                //     
                                //     // Positionner la caméra aux positions standard (sans rotation initiale)
                                //     switch (targetView) {
                                //       case 'torse':
                                //         camera.position.set(0, 0, distance);
                                //         controlsRef.current.target.set(0, 0, 0);
                                //         break;
                                //       case 'dos':
                                //         camera.position.set(0, 0, -distance);
                                //         controlsRef.current.target.set(0, 0, 0);
                                //         break;
                                //       case 'bras-gauche':
                                //         camera.position.set(-distance, 0, 0);
                                //         controlsRef.current.target.set(0, 0, 0);
                                //         break;
                                //       case 'bras-droit':
                                //         camera.position.set(distance, 0, 0);
                                //         controlsRef.current.target.set(0, 0, 0);
                                //         break;
                                //     }
                                //     // S'assurer que la rotation de la caméra est réinitialisée (pas de rotation initiale lors du changement de vue)
                                //     camera.rotation.set(0, 0, 0);
                                //     controlsRef.current.update();
                                //     setTimeout(() => {
                                //       setTargetView(null);
                                //     }, 100);
                                //   }
                                // }, [targetView, viewDistance, initialZoom, setTargetView, viewHasBeenSetRef]);
                                
                                // Désactiver OrbitControls quand un texte est sélectionné en mode mobile pour permettre ModelViewer de gérer les événements
                                const shouldDisableOrbitControls = viewportMode === 'mobile' && selectedTextId && mobileActivePanel;
                                const orbitControlsEnabled = !isDraggingText && 
                                  !isRotatingText && 
                                  !isResizingText && 
                                  !isPlacingText && 
                                  !isRestoringRef.current &&
                                  !shouldDisableOrbitControls;
                                
                                console.log('🎮 OrbitControls enabled check:', {
                                  viewportMode,
                                  selectedTextId,
                                  mobileActivePanel,
                                  shouldDisableOrbitControls,
                                  isDraggingText,
                                  isRotatingText,
                                  isResizingText,
                                  isPlacingText,
                                  isRestoringRef: isRestoringRef.current,
                                  orbitControlsEnabled
                                });
                                
                                return (
                                  <>
                                    <OrbitControls
                                      ref={controlsRef}
                                      enablePan={false}
                                      // Permettre le zoom et la rotation même quand un texte est sélectionné (pour permettre le déplacement du texte)
                                      enableZoom={!isPlacingText && !isRestoringRef.current && !shouldDisableOrbitControls}
                                      enableRotate={!isPlacingText && !isRestoringRef.current && !shouldDisableOrbitControls}
                                      // Désactiver OrbitControls quand un texte est sélectionné en mode mobile pour permettre ModelViewer de gérer les événements
                                      // Sinon, OrbitControls reste actif sauf pendant le placement, le drag, la rotation ou le resize
                                      enabled={orbitControlsEnabled}
                                      minDistance={minZoom}
                                      maxDistance={maxZoom}
                                      zoomSpeed={zoomSpeed}
                                      rotateSpeed={rotateSpeed}
                                      makeDefault={false}
                                    />
                                    
                                    <CameraController controlsRef={controlsRef} viewHasBeenSetRef={viewHasBeenSetRef} />
                                  </>
                                );
                              }
                              
                              // Ajuster tous les paramètres pour mobile - alignés avec le configurateur
                              const alignedInitialZoom = viewportMode === 'mobile' ? 8 : 15; // Même que le configurateur
                              const adjustedMinZoom = viewportMode === 'mobile' ? minZoom * 1.5 : minZoom;
                              const adjustedMaxZoom = viewportMode === 'mobile' ? maxZoom * 1.5 : maxZoom;
                              // Ajuster viewDistance pour mobile
                              const adjustedViewDistance = viewportMode === 'mobile' ? {
                                'torse': viewDistance.torse * 1.5,
                                'dos': viewDistance.dos * 1.5,
                                'bras-gauche': viewDistance['bras-gauche'] * 1.5,
                                'bras-droit': viewDistance['bras-droit'] * 1.5
                              } : viewDistance;
                              
                              return (
                                <>
                                  <ControlsManager
                                    targetView={targetView}
                                    viewDistance={adjustedViewDistance}
                                    initialZoom={alignedInitialZoom}
                                    initialRotation={initialRotation}
                                    zoomSpeed={zoomSpeed}
                                    rotateSpeed={rotateSpeed}
                                    minZoom={adjustedMinZoom}
                                    maxZoom={adjustedMaxZoom}
                                    selectedTextId={selectedTextId}
                                    isPlacingText={isPlacingText}
                                    isDraggingText={isDraggingText}
                                    isRotatingText={isRotatingText}
                                    isResizingText={isResizingText}
                                    setTargetView={setTargetView}
                                    viewHasBeenSetRef={viewHasBeenSetRef}
                                    mobileActivePanel={mobileActivePanel}
                                  />
                                </>
                              );
                            })()}
                          </Canvas>
                            );
                          })()}
                          </div>
                          
                          {/* SUPPRIMÉ : Modal de bibliothèque de logos desktop - La bibliothèque est maintenant dans la sidebar */}
                          {false && showLogoLibrary && viewportMode !== 'mobile' && (() => {
                            const activeModule = customizationModules.find(m => m.id === mobileActivePanel) || customizationModules.find(m => m.id === activeCustomizerTab);
                            if (!activeModule || activeModule.contentType !== 'logos') return null;
                            
                            // Si un logo est sélectionné pour afficher ses variantes
                            if (selectedLogoForVariants) {
                              const baseVariant = {
                                id: 'base',
                                file_url: selectedLogoForVariants.file_url || '',
                                name: selectedLogoForVariants.name || 'Logo de base'
                              };
                              const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
                              
                              return (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 300
                                  }}
                                  onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                      setShowLogoLibrary(false);
                                      setSelectedLogoForVariants(null);
                                    }
                                  }}
                                >
                                  <div
                                    className="zone-selection-modal-content configurator-panel-modal"
                                    style={{
                                      backgroundColor: '#ffffff',
                                      borderRadius: '8px',
                                      padding: '20px',
                                      width: '90%',
                                      maxWidth: '100%',
                                      maxHeight: '80vh',
                                      overflowY: 'auto',
                                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                      color: '#111827'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <style>{`
                                      .zone-selection-modal-content,
                                      .zone-selection-modal-content *,
                                      .zone-selection-modal-content p,
                                      .zone-selection-modal-content span,
                                      .zone-selection-modal-content div,
                                      .zone-selection-modal-content h2,
                                      .zone-selection-modal-content h3,
                                      .zone-selection-modal-content h4,
                                      .zone-selection-modal-content label,
                                      .zone-selection-modal-content input,
                                      .zone-selection-modal-content textarea {
                                        color: #111827 !important;
                                      }
                                      .zone-selection-modal-content button:not([style*="background-color: #000"]):not([style*="background-color:#000"]):not([style*="background-color: '#000"]):not([style*="background-color:'#000"]):not([style*="background-color: '#000000"]):not([style*="background-color:'#000000"]):not([style*="background-color: black"]):not([style*="background-color:black"]) {
                                        color: #111827 !important;
                                      }
                                      .zone-selection-modal-content button[style*="background-color: #000"],
                                      .zone-selection-modal-content button[style*="background-color:#000"],
                                      .zone-selection-modal-content button[style*="background-color: '#000"],
                                      .zone-selection-modal-content button[style*="background-color:'#000"],
                                      .zone-selection-modal-content button[style*="background-color: '#000000"],
                                      .zone-selection-modal-content button[style*="background-color:'#000000"],
                                      .zone-selection-modal-content button[style*="background-color: black"],
                                      .zone-selection-modal-content button[style*="background-color:black"] {
                                        color: #ffffff !important;
                                      }
                                    `}</style>
                                    {/* Header */}
                            <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '20px'
                                    }}>
                                      <h2 style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#000000',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        margin: 0
                                      }}>
                                        {selectedLogoForVariants.name}
                                      </h2>
                                      <button
                                        onClick={() => {
                                          setSelectedLogoForVariants(null);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#666666',
                                          fontSize: '24px',
                                          cursor: 'pointer',
                                          padding: '0',
                                          width: '32px',
                                          height: '32px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          lineHeight: '1'
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    
                                    {/* Liste des variantes */}
                                    {allVariants.length === 0 ? (
                                      <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                                        Aucune variante disponible
                                      </p>
                                    ) : (
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px'
                                      }}>
                                        {allVariants.map((variant: any, index: number) => {
                                          // Définir fileToUse dans le scope du map, pas dans onClick
                                          const fileToUse = variant.id === 'base' 
                                            ? selectedLogoForVariants.file_url 
                                            : (variant.file_url || selectedLogoForVariants.file_url);
                                          
                                          return (
                                            <div
                                              key={variant.id || `base-${index}`}
                                              onClick={async () => {
                                                // Si mode zones, ouvrir le modal de sélection de zone
                                                if (activeModule.logoPlacementMode === 'zones') {
                                                  setSelectedLogoForZone({
                                                    logoId: selectedLogoForVariants.id,
                                                    variantId: variant.id === 'base' ? undefined : variant.id,
                                                    variantFile: fileToUse
                                                  });
                                                  setShowLogoZoneModal(true);
                                                  setSelectedLogoForVariants(null);
                                                  setShowLogoLibrary(false);
                                                } else {
                                                  // Mode libre : ajouter directement au centre
                                                  const categoryToView: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                                    'front': 'torse',
                                                    'back': 'dos',
                                                    'left': 'bras-gauche',
                                                    'right': 'bras-droit'
                                                  };
                                                  const category = categoryToView[activeLogoView] || 'torse';
                                                  await addLogo(
                                                    selectedLogoForVariants.id,
                                                    variant.id === 'base' ? undefined : variant.id,
                                                    fileToUse,
                                                    [0.5, 0.5, 0],
                                                    category
                                                  );
                                                  setShowLogoLibrary(false);
                                                  setSelectedLogoForVariants(null);
                                                }
                                              }}
                                              style={{
                                                cursor: 'pointer',
                                                border: '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#ffffff',
                                                transition: 'all 0.2s',
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px'
                                              }}
                                            >
                                              <div style={{
                                                width: '100%',
                                                height: '100px',
                                                backgroundColor: '#f5f5f5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                padding: '8px'
                                              }}>
                                                <img
                                                  src={fileToUse}
                                                  alt={variant.name || selectedLogoForVariants.name}
                                                  style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain'
                                                  }}
                                                />
                                              </div>
                                              <p style={{
                                                margin: 0,
                                                fontSize: '11px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                                textAlign: 'center'
                                              }}>
                                                {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Vue principale de la bibliothèque
                            // Récupérer toutes les bibliothèques sélectionnées
                            const selectedLibraries = logoLibraries.filter(l => 
                              activeModule.selectedItems?.logoLibraryIds?.includes(l.id)
                            );
                            
                            // Récupérer tous les logos de toutes les bibliothèques sélectionnées
                            const allLogos: any[] = [];
                            selectedLibraries.forEach(library => {
                              if (library.logos && Array.isArray(library.logos)) {
                                allLogos.push(...library.logos);
                              }
                            });
                            
                            return (
                              <div
                                style={{
                              position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 300
                                }}
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setShowLogoLibrary(false);
                                    setSelectedLogoForVariants(null);
                                  }
                                }}
                              >
                                <div
                                  className="zone-selection-modal-content"
                                  style={{
                                    backgroundColor: '#ffffff',
                              borderRadius: '8px',
                                    padding: '20px',
                                    width: '90%',
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    color: '#111827'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <style>{`
                                    .zone-selection-modal-content,
                                    .zone-selection-modal-content *,
                                    .zone-selection-modal-content p,
                                    .zone-selection-modal-content span,
                                    .zone-selection-modal-content div,
                                    .zone-selection-modal-content h2,
                                    .zone-selection-modal-content h3,
                                    .zone-selection-modal-content h4,
                                    .zone-selection-modal-content label,
                                    .zone-selection-modal-content input,
                                    .zone-selection-modal-content textarea {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button:not([style*="background-color: #000"]):not([style*="background-color:#000"]):not([style*="background-color: '#000"]):not([style*="background-color:'#000"]):not([style*="background-color: '#000000"]):not([style*="background-color:'#000000"]):not([style*="background-color: black"]):not([style*="background-color:black"]) {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button[style*="background-color: #000"],
                                    .zone-selection-modal-content button[style*="background-color:#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000000"],
                                    .zone-selection-modal-content button[style*="background-color: black"],
                                    .zone-selection-modal-content button[style*="background-color:black"] {
                                      color: #ffffff !important;
                                    }
                                  `}</style>
                                  {/* Header */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                  }}>
                                    <h2 style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#000000',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      margin: 0
                                    }}>
                                      {activeModule.addLogoButtonLabel || 'Ajouter un logo'}
                                    </h2>
                                    <button
                                      onClick={() => {
                                        setShowLogoLibrary(false);
                                        setSelectedLogoForVariants(null);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#666666',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '0',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  
                                  {allLogos.length === 0 ? (
                                    <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                                      Aucun logo disponible. Veuillez sélectionner des bibliothèques de logos dans les settings du module.
                                    </p>
                                  ) : (
                              <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: '12px'
                                    }}>
                                      {allLogos.map((logo: any) => {
                                        const hasVariants = logo.variants && logo.variants.length > 0;
                                        
                                        return (
                                          <div
                                            key={logo.id}
                                            onClick={async () => {
                                              
                                              // Si on est en mode remplacement
                                              if (logoToReplace) {
                                                // Si le logo a des variantes, ouvrir la vue des variantes
                                                if (hasVariants) {
                                                  setSelectedLogoForVariants(logo);
                                                  return;
                                                }
                                                
                                                // Sinon, remplacer directement le logo
                                                const logoToUpdate = placedLogos.find(l => l.id === logoToReplace);
                                                if (logoToUpdate) {
                                                  setPlacedLogos(placedLogos.map(l => 
                                                    l.id === logoToReplace 
                                                      ? { ...l, logoId: logo.id, variantId: undefined, variantFile: logo.file_url }
                                                      : l
                                                  ));
                                                  
                                                  // Réinitialiser les états
                                                  setLogoToReplace(null);
                                                  setShowLogoLibrary(false);
                                                  setSelectedLogoId(null);
                                                }
                                                return;
                                              }
                                              
                                              // Comportement normal : ouvrir les variantes
                                              setSelectedLogoForVariants(logo);
                                            }}
                                            style={{
                                              cursor: 'pointer',
                                              border: '1px solid #e0e0e0',
                                              borderRadius: '8px',
                                              overflow: 'hidden',
                                              backgroundColor: '#ffffff',
                                              transition: 'all 0.2s',
                                              padding: '12px',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}
                                        >
                                          <div style={{
                                            width: '100%',
                                            height: '100px',
                                            backgroundColor: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            padding: '8px'
                                          }}>
                                            {logo.file_url ? (
                                              <img
                                                src={logo.file_url}
                                                alt={logo.name}
                                                style={{
                                                  maxWidth: '100%',
                                                  maxHeight: '100%',
                                                  objectFit: 'contain'
                                                }}
                                              />
                                            ) : (
                                              <div style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#e0e0e0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                fontSize: '11px',
                                                color: '#666',
                                                textAlign: 'center',
                                                padding: '8px'
                                              }}>
                                                {logo.name}
                                              </div>
                                            )}
                                          </div>
                                          <p style={{
                                            margin: 0,
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            color: '#111827',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            textAlign: 'center'
                                          }}>
                                            {logo.name}
                                          </p>
                                        </div>
                                      );
                                    })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Modal de sélection de zones de logos - Mobile uniquement */}
                          {showLogoZoneModal && viewportMode === 'mobile' && selectedLogoForZone && (() => {
                            const activeModule = customizationModules.find(m => m.id === mobileActivePanel) || customizationModules.find(m => m.id === activeCustomizerTab);
                            if (!activeModule || activeModule.contentType !== 'logos') return null;
                            
                            // Récupérer les zones des groupes sélectionnés pour les logos
                            // Utiliser la même logique que pour les textes
                            const logoZoneGroupIds = activeModule.logoZoneGroupIds ||
                                                     activeModule.config?.logoZoneGroupIds || 
                                                     activeModule.selectedItems?.logoZoneGroupIds || 
                                                     activeModule.zoneGroupIds ||
                                                     activeModule.config?.zoneGroupIds ||
                                                     activeModule.selectedItems?.zoneGroupIds ||
                                                     [];
                            
                            let availableZones = zoneGroups
                              .filter(group => logoZoneGroupIds.includes(group.id))
                              .flatMap(group => group.zones.map(zone => ({ ...zone, groupName: group.name })));
                            
                            // Filtrer les zones selon la vue de caméra actuelle
                            // Utiliser la même logique que desktop avec viewLabels du module
                            const customViews = activeModule.viewLabels || [];
                            const activeViewConfig = customViews.find(v => v.id === activeLogoView);
                            const activeViewLabel = activeViewConfig?.label || activeLogoView;
                            
                            // Si aucune vue n'est définie, utiliser activeLogoView directement
                            const viewLabels: Record<string, string> = {
                              'Face': 'front',
                              'Dos': 'back',
                              'Gauche': 'left',
                              'Droite': 'right'
                            };
                            
                            availableZones = availableZones.filter(zone => {
                              // Comparer avec le label de la vue active
                              if (zone.view && zone.view !== activeViewLabel) return false;
                              return true;
                            });
                            
                            // Si aucune zone trouvée avec le filtre strict, essayer sans filtre pour debug
                            if (availableZones.length === 0 && zoneGroups.length > 0) {
                              // Réessayer sans filtre pour voir toutes les zones disponibles
                              availableZones = zoneGroups
                                .filter(group => logoZoneGroupIds.includes(group.id))
                                .flatMap(group => group.zones.map(zone => ({ ...zone, groupName: group.name })));
                            }
                            
                            return (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10002,
                                  padding: '12px',
                                  boxSizing: 'border-box'
                                }}
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setShowLogoZoneModal(false);
                                    setSelectedLogoForZone(null);
                                  }
                                }}
                              >
                                <div
                                  className="zone-selection-modal-content"
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    width: '100%',
                                    maxWidth: 'calc(100% - 24px)',
                                    maxHeight: 'calc(100% - 24px)',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    color: '#111827',
                                    boxSizing: 'border-box'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <style>{`
                                    .zone-selection-modal-content,
                                    .zone-selection-modal-content *,
                                    .zone-selection-modal-content p,
                                    .zone-selection-modal-content span,
                                    .zone-selection-modal-content div,
                                    .zone-selection-modal-content h2,
                                    .zone-selection-modal-content h3,
                                    .zone-selection-modal-content h4,
                                    .zone-selection-modal-content label,
                                    .zone-selection-modal-content input,
                                    .zone-selection-modal-content textarea {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button:not([style*="background-color: #000"]):not([style*="background-color:#000"]):not([style*="background-color: '#000"]):not([style*="background-color:'#000"]):not([style*="background-color: '#000000"]):not([style*="background-color:'#000000"]):not([style*="background-color: black"]):not([style*="background-color:black"]) {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button[style*="background-color: #000"],
                                    .zone-selection-modal-content button[style*="background-color:#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000000"],
                                    .zone-selection-modal-content button[style*="background-color: black"],
                                    .zone-selection-modal-content button[style*="background-color:black"] {
                                      color: #ffffff !important;
                                    }
                                  `}</style>
                                  {/* Header */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                  }}>
                                    <h2 style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#000000',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      margin: 0
                                    }}>
                                      {activeModule.addLogoButtonLabel || 'Placer un logo'}
                                    </h2>
                                    <button
                                      onClick={() => {
                                        setShowLogoZoneModal(false);
                                        setSelectedLogoForZone(null);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#666666',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '0',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  
                                  {availableZones.length === 0 ? (
                                    <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                                      Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les settings du module.
                                    </p>
                                  ) : (
                                    <div>
                                      <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#000000',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        marginBottom: '12px'
                                      }}>
                                        Choisissez une position standard
                                      </h3>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '10px',
                                        marginBottom: '16px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                      }}>
                                        {availableZones.map((zone) => {
                                          const isSelected = selectedLogoZoneId === zone.id;
                                          return (
                                            <div
                                              key={zone.id}
                                              onClick={() => {
                                                setSelectedLogoZoneId(zone.id);
                                              }}
                                              style={{
                                                position: 'relative',
                                                cursor: 'pointer',
                                                border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#ffffff',
                                                transition: 'all 0.2s'
                                              }}
                                            >
                                              {zone.thumbnailUrl ? (
                                                <img
                                                  src={zone.thumbnailUrl}
                                                  alt={zone.name}
                                                  style={{
                                                    width: '100%',
                                                    height: '120px',
                                                    objectFit: 'cover'
                                                  }}
                                                />
                                              ) : (
                                                <div style={{
                                                  width: '100%',
                                                  height: '120px',
                                                  backgroundColor: '#e0e0e0',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  fontSize: '11px',
                                                  color: '#666',
                                                  textAlign: 'center',
                                                  padding: '8px'
                                                }}>
                                                  {zone.name}
                                                </div>
                                              )}
                                              
                                              <div style={{
                                                padding: '10px',
                                                textAlign: 'center',
                                                backgroundColor: '#ffffff'
                                              }}>
                                                <p style={{
                                                  margin: 0,
                                                  fontSize: '11px',
                                                  fontWeight: '500',
                                                  color: '#111827',
                                fontFamily: CONFIGURATOR_PANEL_FONT
                              }}>
                                                  {zone.name}
                                                  {zone.view && ` (${zone.view})`}
                                                </p>
                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Bouton de confirmation */}
                                      {selectedLogoZoneId && (
                                        <button
                                          onClick={async () => {
                                            const selectedZone = availableZones.find(z => z.id === selectedLogoZoneId);
                                            if (selectedZone && selectedLogoForZone) {
                                              const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                                'Face': 'torse',
                                                'Dos': 'dos',
                                                'Gauche': 'bras-gauche',
                                                'Droite': 'bras-droit'
                                              };
                                              const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                                              const zonePosition: [number, number, number] = [
                                                selectedZone.position[0],
                                                1 - selectedZone.position[1],
                                                selectedZone.position[2] || 0
                                              ];
                                              
                                              // Récupérer les dimensions et rotation de la zone si disponibles
                                              const zoneWidth = (selectedZone as any)?.width as number | undefined;
                                              const zoneHeight = (selectedZone as any)?.height as number | undefined;
                                              const zoneRotationRaw = (selectedZone as any)?.defaultRotation as number | undefined;
                                              const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                                                ? zoneRotationRaw * (Math.PI / 180) 
                                                : undefined;
                                              
                                              await addLogo(
                                                selectedLogoForZone.logoId,
                                                selectedLogoForZone.variantId,
                                                selectedLogoForZone.variantFile || '',
                                                zonePosition,
                                                zoneCategory || 'torse',
                                                zoneWidth,
                                                zoneHeight,
                                                zoneRotation
                                              );
                                              
                                              // Positionner la caméra selon la vue de la zone
                                              const viewToCameraView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                                'Face': 'front',
                                                'Dos': 'back',
                                                'Gauche': 'left',
                                                'Droite': 'right',
                                                'front': 'front',
                                                'back': 'back',
                                                'left': 'left',
                                                'right': 'right'
                                              };
                                              
                                              // Déterminer la vue de la caméra
                                              let cameraView: 'front' | 'back' | 'left' | 'right' | null = null;
                                              
                                              // Si la zone a une vue, l'utiliser directement
                                              if (selectedZone.view) {
                                                const zoneView = String(selectedZone.view);
                                                if (viewToCameraView[zoneView]) {
                                                  cameraView = viewToCameraView[zoneView];
                                                }
                                              }
                                              
                                              // Sinon, mapper la catégorie à une vue
                                              if (!cameraView && zoneCategory) {
                                                const categoryToView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                                  'torse': 'front',
                                                  'dos': 'back',
                                                  'bras-gauche': 'left',
                                                  'bras-droit': 'right'
                                                };
                                                if (categoryToView[zoneCategory]) {
                                                  cameraView = categoryToView[zoneCategory];
                                                }
                                              }
                                              
                                              // Déclencher l'événement avec un délai pour éviter qu'il soit écrasé
                                              if (cameraView) {
                                                setTimeout(() => {
                                                  
                                                  window.dispatchEvent(new CustomEvent('setCameraView', { detail: cameraView }));
                                                }, 100);
                                              }
                                              
                                              setShowLogoZoneModal(false);
                                              setSelectedLogoForZone(null);
                                              setSelectedLogoZoneId('');
                                            }
                                          }}
                                          className="btn-primary"
                                          style={{
                                            width: '100%',
                                            padding: '10px 20px',
                                            backgroundColor: '#3b82f6',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                          }}
                                        >
                                          Placer le logo
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Modal de sélection de zones - Mobile uniquement (rendu dans le conteneur mobile) */}
                          {showZoneSelectionModal && viewportMode === 'mobile' && (() => {
                            const activeModule = customizationModules.find(m => m.id === mobileActivePanel) || customizationModules.find(m => m.id === activeCustomizerTab);
                            if (!activeModule) return null;
                            
                            // Récupérer les zones des groupes sélectionnés pour les textes
                            // Essayer plusieurs propriétés possibles pour les zoneGroupIds
                            const textZoneGroupIds = activeModule.config?.textZoneGroupIds || 
                                                     activeModule.selectedItems?.textZoneGroupIds || 
                                                     activeModule.zoneGroupIds ||
                                                     activeModule.config?.zoneGroupIds ||
                                                     activeModule.selectedItems?.zoneGroupIds ||
                                                     [];
                            
                            const availableZones = zoneGroups
                              .filter(group => textZoneGroupIds.includes(group.id))
                              .flatMap(group => group.zones.map(zone => ({ ...zone, groupName: group.name })));
                            
                            return (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 300
                                }}
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setShowZoneSelectionModal(false);
                                    setSelectedZoneId(null);
                                    setTextInputValue('');
                                  }
                                }}
                              >
                                <div
                                  className="zone-selection-modal-content"
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    width: '90%',
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    color: '#111827'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <style>{`
                                    .zone-selection-modal-content,
                                    .zone-selection-modal-content *,
                                    .zone-selection-modal-content p,
                                    .zone-selection-modal-content span,
                                    .zone-selection-modal-content div,
                                    .zone-selection-modal-content h2,
                                    .zone-selection-modal-content h3,
                                    .zone-selection-modal-content h4,
                                    .zone-selection-modal-content label,
                                    .zone-selection-modal-content input,
                                    .zone-selection-modal-content textarea {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button:not([style*="background-color: #000"]):not([style*="background-color:#000"]):not([style*="background-color: '#000"]):not([style*="background-color:'#000"]):not([style*="background-color: '#000000"]):not([style*="background-color:'#000000"]):not([style*="background-color: black"]):not([style*="background-color:black"]) {
                                      color: #111827 !important;
                                    }
                                    .zone-selection-modal-content button[style*="background-color: #000"],
                                    .zone-selection-modal-content button[style*="background-color:#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000"],
                                    .zone-selection-modal-content button[style*="background-color: '#000000"],
                                    .zone-selection-modal-content button[style*="background-color:'#000000"],
                                    .zone-selection-modal-content button[style*="background-color: black"],
                                    .zone-selection-modal-content button[style*="background-color:black"] {
                                      color: #ffffff !important;
                                    }
                                  `}</style>
                                  {/* Header */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                  }}>
                                    <h2 style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#000000',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      margin: 0
                                    }}>
                                      {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                                    </h2>
                                    <button
                                      onClick={() => {
                                        setShowZoneSelectionModal(false);
                                        setSelectedZoneId(null);
                                        setTextInputValue('');
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#666666',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '0',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        lineHeight: '1'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  
                                  {availableZones.length === 0 ? (
                                    <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                                      Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les settings du module.
                                    </p>
                                  ) : (
                                    <div>
                                      <h3 style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#000000',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        marginBottom: '12px'
                                      }}>
                                        Choisissez une position standard
                                      </h3>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px',
                                        marginBottom: '20px'
                                      }}>
                                        {availableZones.map((zone) => {
                                          const isSelected = selectedZoneId === zone.id;
                                          return (
                            <div
                              key={zone.id}
                              onClick={() => {
                                setSelectedZoneId(zone.id);
                                setTextInputValue('');
                                
                                // Pivoter la caméra vers la vue correspondant à la zone
                                const zoneView = (zone as any)?.view as ('front'|'back'|'left'|'right') | undefined;
                                if (zoneView) {
                                  const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                    'Face': 'front',
                                    'Dos': 'back',
                                    'Gauche': 'left',
                                    'Droite': 'right',
                                    'front': 'front',
                                    'back': 'back',
                                    'left': 'left',
                                    'right': 'right'
                                  };
                                  const view = viewMap[zoneView] || viewMap[zoneView?.toLowerCase() || ''];
                                  if (view) {
                                    console.log('📸 Pivoting camera to view:', view, 'for zone:', zone.name);
                                    window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                                  }
                                } else if ((zone as any)?.zoneCategory) {
                                  const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                    'torse': 'front',
                                    'dos': 'back',
                                    'bras-gauche': 'left',
                                    'bras-droit': 'right'
                                  };
                                  const view = viewMap[(zone as any).zoneCategory];
                                  if (view) {
                                    console.log('📸 Pivoting camera to view:', view, 'for zoneCategory:', (zone as any).zoneCategory);
                                    window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                                  }
                                }
                              }}
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s'
                              }}
                            >
                                              {isSelected && (
                                                <div style={{
                                                  position: 'absolute',
                                                  top: '8px',
                                                  right: '8px',
                                                  width: '24px',
                                                  height: '24px',
                                                  backgroundColor: CONFIGURATOR_PANEL_PRIMARY_COLOR,
                                                  borderRadius: '50%',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  zIndex: 10
                                                }}>
                                                  <span style={{
                                                    color: '#ffffff',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                  }}>
                                                    ✓
                                                  </span>
                                                </div>
                                              )}
                                              
                                              <div style={{
                                                width: '100%',
                                                height: '100px',
                                                backgroundColor: '#f5f5f5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                padding: '8px'
                                              }}>
                                                {zone.thumbnailUrl && !zone.thumbnailUrl.startsWith('blob:') ? (
                                                  <img
                                                    src={zone.thumbnailUrl}
                                                    alt={zone.name}
                                style={{
                                                      maxWidth: '100%',
                                                      maxHeight: '100%',
                                                      objectFit: 'contain'
                                                    }}
                                                  />
                                                ) : (
                                                  <div style={{
                                  width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#e0e0e0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    color: '#666',
                                                    textAlign: 'center',
                                                    padding: '8px'
                                                  }}>
                                                    {zone.name}
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <div style={{
                                                padding: '10px',
                                                textAlign: 'center',
                                                backgroundColor: '#ffffff'
                                              }}>
                                                <p style={{
                                                  margin: 0,
                                                  fontSize: '11px',
                                                  fontWeight: '500',
                                                  color: '#111827',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                                }}>
                                                  {zone.name}
                                                  {zone.view && ` (${zone.view})`}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Input pour le texte */}
                                      {selectedZoneId && (
                                        <div>
                                          <label style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#000000',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            marginBottom: '8px'
                                          }}>
                                            Entrez le texte
                                          </label>
                                          <input
                                            type="text"
                                            value={textInputValue}
                                            onChange={(e) => setTextInputValue(e.target.value)}
                                            placeholder="Votre texte ici"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && textInputValue.trim() && selectedZoneId) {
                                                const selectedZone = availableZones.find(z => z.id === selectedZoneId);
                                                if (selectedZone) {
                                                  const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                                    'Face': 'torse',
                                                    'Dos': 'dos',
                                                    'Gauche': 'bras-gauche',
                                                    'Droite': 'bras-droit'
                                                  };
                                                  const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                                                  const zonePosition: [number, number, number] = [
                                                    selectedZone.position[0],
                                                    1 - selectedZone.position[1],
                                                    selectedZone.position[2] || 0
                                                  ];
                                                  const zoneRotationRaw = (selectedZone as any).rotation;
                                                  const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                                                    ? zoneRotationRaw * (Math.PI / 180) 
                                                    : 0;
                                                  const zoneWidth = (selectedZone as any).width || 0.1;
                                                  const zoneHeight = (selectedZone as any).height || 0.1;
                                                  const CANVAS_SIZE = 2048;
                                                  const SCALE_FACTOR = 0.5;
                                                  const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                                                  const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                                                  const availableWidth = zoneWidthPx * 0.8;
                                                  const availableHeight = zoneHeightPx * 0.8;
                                                  const estimatedCharWidth = 0.6;
                                                  const textLength = textInputValue.length || 1;
                                                  const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                                                  const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                                                  const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                                                  const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                                                  
                                                  addText(
                                                    textInputValue,
                                                    zonePosition,
                                                    undefined,
                                                    'text',
                                                    finalFontSize,
                                                    zoneCategory,
                                                    zoneRotation
                                                  );
                                                  
                                                  // Pivoter la caméra vers l'emplacement du texte (même en mobile)
                                                  // if (zoneCategory) {
                                                  //   setTargetView(zoneCategory);
                                                  // }
                                                  
                                                  setShowZoneSelectionModal(false);
                                                  setSelectedZoneId(null);
                                                  setTextInputValue('');
                                                }
                                              }
                                            }}
                                            style={{
                                              width: '100%',
                                              padding: '12px',
                                              border: '1px solid #e0e0e0',
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                              color: '#111827',
                                              outline: 'none',
                                              boxSizing: 'border-box',
                                              marginBottom: '12px',
                                              backgroundColor: '#ffffff'
                                            }}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => {
                                              const selectedZone = availableZones.find(z => z.id === selectedZoneId);
                                              if (selectedZone && textInputValue.trim()) {
                                                const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                                  'Face': 'torse',
                                                  'Dos': 'dos',
                                                  'Gauche': 'bras-gauche',
                                                  'Droite': 'bras-droit'
                                                };
                                                const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                                                const zonePosition: [number, number, number] = [
                                                  selectedZone.position[0],
                                                  1 - selectedZone.position[1],
                                                  selectedZone.position[2] || 0
                                                ];
                                                const zoneRotationRaw = (selectedZone as any).rotation;
                                                const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                                                  ? zoneRotationRaw * (Math.PI / 180) 
                                                  : 0;
                                                const zoneWidth = (selectedZone as any).width || 0.1;
                                                const zoneHeight = (selectedZone as any).height || 0.1;
                                                const CANVAS_SIZE = 2048;
                                                const SCALE_FACTOR = 0.5;
                                                const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                                                const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                                                const availableWidth = zoneWidthPx * 0.8;
                                                const availableHeight = zoneHeightPx * 0.8;
                                                const estimatedCharWidth = 0.6;
                                                const textLength = textInputValue.length || 1;
                                                const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                                                const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                                                const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                                                const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                                                
                                                addText(
                                                  textInputValue.trim(),
                                                  zonePosition,
                                                  undefined,
                                                  'text',
                                                  finalFontSize,
                                                  zoneCategory,
                                                  zoneRotation
                                                );
                                                
                                                // Pivoter la caméra vers l'emplacement du texte (même en mobile)
                                                // if (zoneCategory) {
                                                //   setTargetView(zoneCategory);
                                                // }
                                                
                                                setShowZoneSelectionModal(false);
                                                setSelectedZoneId(null);
                                                setTextInputValue('');
                                              }
                                            }}
                                            disabled={!textInputValue.trim() || !selectedZoneId}
                                            className="btn-primary"
                                            style={{
                                              width: '100%',
                                              padding: '10px 20px',
                                              backgroundColor: (!textInputValue.trim() || !selectedZoneId) ? '#cccccc' : CONFIGURATOR_PANEL_PRIMARY_COLOR,
                                              border: 'none',
                                              borderRadius: '8px',
                                              fontSize: '14px',
                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                              color: '#ffffff',
                                              cursor: (!textInputValue.trim() || !selectedZoneId) ? 'not-allowed' : 'pointer',
                                              fontWeight: '500',
                                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                              transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!(!textInputValue.trim() || !selectedZoneId)) {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                              }
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!(!textInputValue.trim() || !selectedZoneId)) {
                                                e.currentTarget.style.backgroundColor = CONFIGURATOR_PANEL_PRIMARY_COLOR;
                                              }
                                            }}
                                          >
                                            Ajouter
                                          </button>
                            </div>
                          )}
                          </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Pas d'overlay - ModelViewer gère la désélection directement */}
                          
                          {/* Panneau de contenu mobile - Style configurator.stretchmx.com */}
                          {viewportMode === 'mobile' && mobileActivePanel && (() => {
                            const activeModule = customizationModules.find(m => m.id === mobileActivePanel);
                            if (!activeModule) {
                              return null;
                            }
                            
                            // Rendu du contenu selon le type de module
                            const renderMobileModuleContent = () => {
                              if (!activeModule.contentType) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#9ca3af' }}>
                                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p style={{ fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>Configurez le module dans les paramètres</p>
                                  </div>
                                );
                              }
                              
                              // MODULE COLORS - Style stretchmx
                              if (activeModule.contentType === 'colors') {
                                const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
                                let availableColorClasses: string[] = [];
                                const designModule = customizationModules.find(m => m.contentType === 'designs-2d' && m.selectedItems?.design2DId);
                                const designIdToUse = designModule?.selectedItems?.design2DId || selectedDesign2DId;
                                const selectedDesign = designs2D.find(d => d.id === designIdToUse);
                                
                                if (selectedDesign?.color_mappings) {
                                  availableColorClasses = Object.keys(selectedDesign.color_mappings).filter(c => ordinalColors.includes(c.toLowerCase()));
                                }
                                if (availableColorClasses.length === 0) availableColorClasses = ['primary', 'secondary', 'tertiary'];
                                
                                // Vue sélection de couleur (après clic sur classe)
                                if (selectedColorClass && activeModule.selectedItems?.colorPaletteId) {
                                  const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                                  if (!palette) return null;
                                  
                                  const allColors: Array<{ id: string; name: string; hex: string }> = [];
                                  palette.colors?.forEach((color: any, index: number) => {
                                    allColors.push({ id: color.id || `${palette.id}-${index}-${color.hex}`, name: color.name || '', hex: color.hex || '#000000' });
                                  });
                                  
                                  const currentColorId = selectedDesign?.color_mappings?.[selectedColorClass] || designColors[selectedColorClass];
                                  const currentColor = allColors.find(c => c.id === currentColorId);
                                  
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                      {/* Sub-header avec retour et couleur actuelle */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>
                                        <button onClick={() => setSelectedColorClass(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                          Retour
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '13px', color: '#374151' }}>{currentColor?.name || 'Sélectionner'}</span>
                                          <div 
                                            className="color-circle-indicator"
                                            data-color={currentColor?.hex && currentColor.hex !== '#ccc' && currentColor.hex !== '#cccccc' && currentColor.hex !== '#ffffff' && currentColor.hex !== '#FFFFFF' ? currentColor.hex : undefined}
                                            style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currentColor?.hex || '#ccc', border: '2px solid #e5e7eb' }} 
                                          />
                                        </div>
                                      </div>
                                      {/* Grille de couleurs scrollable horizontalement */}
                                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {allColors.map((color) => {
                                          const isSelected = color.id === currentColorId;
                                          return (
                                            <button
                                              key={color.id}
                                              onClick={() => {
                                                setDesignColors({ ...designColors, [selectedColorClass]: color.id });
                                                if (selectedDesign) {
                                                  setDesigns2D(designs2D.map(d => d.id === selectedDesign.id ? { ...d, color_mappings: { ...d.color_mappings, [selectedColorClass]: color.id } } : d));
                                                }
                                              }}
                                              className="mobile-color-btn color-circle-button"
                                              data-color={color.hex}
                                              style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%', backgroundColor: color.hex, border: isSelected ? '3px solid #000' : '2px solid #e5e7eb', cursor: 'pointer', position: 'relative', padding: 0 }}
                                            >
                                              {isSelected && (
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                  <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Vue classes de couleur
                                if (!activeModule.selectedItems?.colorPaletteId) {
                                  return <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sélectionnez une palette dans les paramètres.</p>;
                                }
                                
                                return (
                                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    {availableColorClasses.map((colorClass) => {
                                      const currentColorId = selectedDesign?.color_mappings?.[colorClass];
                                      let currentColorHex = '#e5e7eb';
                                      if (currentColorId) {
                                        const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                                        palette?.colors?.forEach((c: any, i: number) => {
                                          if ((c.id || `${palette.id}-${i}-${c.hex}`) === currentColorId) currentColorHex = c.hex;
                                        });
                                      }
                                      return (
                                        <button key={colorClass} className="mobile-card" onClick={() => setSelectedColorClass(colorClass)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', minWidth: '80px' }}>
                                          <div 
                                            className="color-circle-indicator"
                                            data-color={currentColorHex && currentColorHex !== '#e5e7eb' && currentColorHex !== '#cccccc' && currentColorHex !== '#ffffff' && currentColorHex !== '#FFFFFF' ? currentColorHex : undefined}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: currentColorHex, border: '2px solid #d1d5db' }} 
                                          />
                                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                                            {activeModule.colorClassLabels?.[colorClass] || (colorClass === 'primary' ? 'Principal' : colorClass === 'secondary' ? 'Secondaire' : colorClass === 'tertiary' ? 'Tertiaire' : colorClass.charAt(0).toUpperCase() + colorClass.slice(1))}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              // MODULE DESIGNS-2D - Style stretchmx (cartes avec thumbnail + nom + pastilles)
                              if (activeModule.contentType === 'designs-2d') {
                                const allowedDesignIds = activeModule.selectedItems?.design2DIds || [];
                                const filteredDesigns = designs2D.filter(d => allowedDesignIds.includes(d.id));
                                
                                if (filteredDesigns.length === 0) {
                                  return <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucun design configuré.</p>;
                                }
                                
                                return (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                    {filteredDesigns.map((design) => {
                                      const isSelected = design.id === selectedDesign2DId;
                                      const colorMappings = design.color_mappings || {};
                                      const colorKeys = Object.keys(colorMappings).slice(0, 3);
                                      
                                      return (
                                        <button
                                          key={design.id}
                                          onClick={() => {
                                            setSelectedDesign2DId(design.id);
                                            setCustomizationModules(customizationModules.map(m => m.contentType === 'designs-2d' ? { ...m, selectedItems: { ...m.selectedItems, design2DId: design.id } } : m));
                                          }}
                                          className="mobile-card"
                                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', backgroundColor: '#fff', border: isSelected ? '2px solid #000' : '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', minWidth: '100px', maxWidth: '120px' }}
                                        >
                                          <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                            {design.svg_url ? (
                                              <img src={design.svg_url} alt={design.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            ) : (
                                              <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
                                            )}
                                          </div>
                                          <span style={{ fontSize: '12px', fontWeight: '500', color: '#111827', marginBottom: '6px', textAlign: 'center' }}>"{design.label}"</span>
                                          {colorKeys.length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                              {colorKeys.map((key) => {
                                                const colorModule = customizationModules.find(m => m.contentType === 'colors');
                                                const palette = colorPalettes.find(p => p.id === colorModule?.selectedItems?.colorPaletteId);
                                                let hex = '#ccc';
                                                palette?.colors?.forEach((c: any, i: number) => {
                                                  if ((c.id || `${palette.id}-${i}-${c.hex}`) === colorMappings[key]) hex = c.hex;
                                                });
                                                return <div key={key} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: hex, border: '1px solid #d1d5db' }} />;
                                              })}
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              // MODULE LOGOS - Style stretchmx (tabs vues + bouton ajouter + logos placés OU bibliothèque)
                              if (activeModule.contentType === 'logos') {
                                // Utiliser les vues personnalisées si configurées, sinon fallback sur les legacy
                                // Utiliser uniquement les vues personnalisées configurées dans le module
                                const customViews = activeModule.viewLabels || [];
                                    
                                // Charger les vues de caméra du modèle 3D
                                const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                                const modelCameraViews = selectedModel?.cameraViews || [];
                                
                                // Filtrer les logos selon la vue active (comme sur desktop)
                                const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
                                  'torse': 'front',
                                  'dos': 'back',
                                  'bras-gauche': 'left',
                                  'bras-droit': 'right'
                                };
                                
                                let modulePlacedLogos = placedLogos.filter(l => l.category);
                                
                                // Filtrer selon la vue active si mode zones
                                // Mapper activeLogoView (qui peut être un ID personnalisé) vers 'front'/'back'/'left'/'right'
                                let currentViewForFilter: 'front' | 'back' | 'left' | 'right' | null = null;
                                if (activeModule.logoPlacementMode === 'zones') {
                                  const activeViewConfig = customViews.find(v => v.id === activeLogoView);
                                  if (activeViewConfig) {
                                    // Si la vue personnalisée a un ID standard, l'utiliser
                                    if (activeViewConfig.id === 'front' || activeViewConfig.id === 'back' || 
                                        activeViewConfig.id === 'left' || activeViewConfig.id === 'right') {
                                      currentViewForFilter = activeViewConfig.id;
                                    } else {
                                      // Sinon, mapper le label vers la vue standard
                                      const labelToView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                        'Face': 'front',
                                        'DOS': 'back',
                                        'Dos': 'back',
                                        'Gauche': 'left',
                                        'Left': 'left',
                                        'Droite': 'right',
                                        'Right': 'right'
                                      };
                                      currentViewForFilter = labelToView[activeViewConfig.label] || null;
                                    }
                                  } else if (activeLogoView === 'front' || activeLogoView === 'back' || 
                                             activeLogoView === 'left' || activeLogoView === 'right') {
                                    currentViewForFilter = activeLogoView;
                                  }
                                  
                                  if (currentViewForFilter) {
                                    modulePlacedLogos = modulePlacedLogos.filter(logo => {
                                      const logoView = categoryToView[logo.category as keyof typeof categoryToView];
                                      return logoView === currentViewForFilter;
                                    });
                                  }
                                }
                                
                                // Récupérer les bibliothèques de logos sélectionnées
                                const selectedLibraries = logoLibraries.filter(l => 
                                  activeModule.selectedItems?.logoLibraryIds?.includes(l.id)
                                );
                                
                                // Récupérer tous les logos de toutes les bibliothèques sélectionnées
                                const allLogos: any[] = [];
                                selectedLibraries.forEach(library => {
                                  if (library.logos && Array.isArray(library.logos)) {
                                    allLogos.push(...library.logos);
                                  }
                                });
                                
                                // Filtrer les logos selon la recherche
                                const filteredLogos = logoSearchQuery.trim() 
                                  ? allLogos.filter(logo => 
                                      logo.name?.toLowerCase().includes(logoSearchQuery.toLowerCase())
                                    )
                                  : allLogos;
                                
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Tabs de vue - Masqués si on est en train de choisir une variante OU si la bibliothèque est ouverte */}
                                    {activeModule.logoPlacementMode === 'zones' && !selectedLogoForVariants && !showLogoLibrary && (
                                      <div style={{ 
                                        display: 'flex', 
                                        gap: '8px',
                                        padding: '4px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                      }}>
                                        {customViews.map((viewConfig) => {
                                          const isActive = activeLogoView === viewConfig.id;
                                          return (
                                            <button 
                                              key={viewConfig.id} 
                                              onClick={() => {
                                                setActiveLogoView(viewConfig.id as any);
                                                
                                                // Si une vue de caméra personnalisée est configurée, l'utiliser
                                                if (viewConfig.cameraViewId) {
                                                  const cameraView = modelCameraViews.find(cv => cv.id === viewConfig.cameraViewId);
                                                  if (cameraView) {
                                                    // Dispatcher l'événement avec les coordonnées de la vue
                                                    window.dispatchEvent(new CustomEvent('goToCameraView', { 
                                                      detail: {
                                                        position: cameraView.position,
                                                        target: cameraView.target
                                                      }
                                                    }));
                                                  } else {
                                                    // Fallback sur la vue legacy
                                                    window.dispatchEvent(new CustomEvent('setCameraView', { detail: viewConfig.id }));
                                                  }
                                                } else {
                                                  // Utiliser la vue legacy (front, back, left, right)
                                                  window.dispatchEvent(new CustomEvent('setCameraView', { detail: viewConfig.id }));
                                                }
                                              }} 
                                              style={{ 
                                                flex: 1, 
                                                padding: '10px 16px', 
                                                fontSize: '13px', 
                                                fontWeight: '600', 
                                                color: isActive ? '#ffffff' : '#6b7280', 
                                                backgroundColor: isActive ? '#111827' : 'transparent',
                                                border: isActive ? '2px solid #374151' : '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer', 
                                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                                transition: 'all 0.2s ease',
                                                whiteSpace: 'nowrap',
                                                position: 'relative',
                                                overflow: 'hidden'
                                              }}
                                              onMouseEnter={(e) => {
                                                if (!isActive) {
                                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                  e.currentTarget.style.color = '#111827';
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (!isActive) {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                  e.currentTarget.style.color = '#6b7280';
                                                }
                                              }}
                                            >
                                              {isActive && (
                                                <div style={{
                                                  position: 'absolute',
                                                  top: '2px',
                                                  left: '2px',
                                                  right: '2px',
                                                  bottom: '2px',
                                                  border: '2px solid #6b7280',
                                                  borderRadius: '6px',
                                                  pointerEvents: 'none'
                                                }} />
                                              )}
                                              {viewConfig.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    
                                    {/* Si la bibliothèque est ouverte (après clic sur "Ajouter un logo") */}
                                    {showLogoLibrary ? (
                                      <>
                                        {/* Boutons Supprimer et Importer - Masqués si on est en train de choisir une variante */}
                                        {!selectedLogoForVariants && (
                                          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                            {/* Bouton Supprimer - visible uniquement si un logo est sélectionné */}
                                            {selectedLogoId && placedLogos.find(l => l.id === selectedLogoId) && (
                                              <button
                                                onClick={() => {
                                                  const logoToDelete = placedLogos.find(l => l.id === selectedLogoId);
                                                  if (logoToDelete) {
                                                    // Trouver le nom du logo dans les bibliothèques
                                                    let logoName = 'Logo';
                                                    for (const library of logoLibraries) {
                                                      const foundLogo = library.logos?.find((l: any) => l.id === logoToDelete.logoId);
                                                      if (foundLogo) {
                                                        logoName = foundLogo.name || 'Logo';
                                                        break;
                                                      }
                                                    }
                                                    
                                                    // Ouvrir le modal de confirmation
                                                    setItemToDelete({
                                                      id: selectedLogoId,
                                                      name: logoName,
                                                      type: 'logo'
                                                    });
                                                    setShowDeleteModal(true);
                                                  }
                                                }}
                                                style={{ 
                                                  flex: 1,
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'center', 
                                                  gap: '8px', 
                                                  padding: '12px', 
                                                  backgroundColor: '#ef4444', 
                                                  color: '#ffffff', 
                                                  border: 'none', 
                                                  borderRadius: '8px', 
                                                  fontSize: '13px', 
                                                  fontWeight: '500', 
                                                  cursor: 'pointer', 
                                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                                }}
                                              >
                                                <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Supprimer
                                              </button>
                                            )}
                                            
                                            {/* Bouton Importer un logo */}
                                            <button
                                              className="btn-primary mobile-action-btn-black"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Réinitialiser les états
                                                setImportedFile(null);
                                                setImportedFilePreview(null);
                                                setShowBackgroundRemoverModal(false);
                                                setBackgroundRemoverPreview(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                setShowImportModal(true);
                                              }}
                                              style={{ 
                                                flex: 1,
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '8px', 
                                                padding: '10px 20px', 
                                                backgroundColor: '#3b82f6', 
                                                color: '#ffffff', 
                                                border: 'none', 
                                                borderRadius: '8px', 
                                                fontSize: '14px', 
                                                fontWeight: '500', 
                                                cursor: 'pointer', 
                                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#2563eb';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#3b82f6';
                                              }}
                                            >
                                              <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                              {activeModule.importLogoButtonLabel || 'Importer un logo'}
                                            </button>
                                          </div>
                                        )}
                                        
                                        {/* Barre de recherche */}
                                        <input
                                          type="text"
                                          placeholder="Rechercher un logo..."
                                          value={logoSearchQuery}
                                          onChange={(e) => setLogoSearchQuery(e.target.value)}
                                          style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            color: '#111827',
                                            backgroundColor: '#ffffff'
                                          }}
                                        />
                                        
                                        {/* Si un logo est sélectionné pour afficher ses variantes */}
                                        {selectedLogoForVariants ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Titre centré sans bouton retour (le bouton retour principal du header suffit) */}
                                            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                                              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, fontFamily: CONFIGURATOR_PANEL_FONT, textAlign: 'center' }}>
                                                {selectedLogoForVariants.name}
                                              </h3>
                                            </div>
                                            
                                            {/* Liste des variantes en scroll horizontal */}
                                            {(() => {
                                              const baseVariant = {
                                                id: 'base',
                                                file_url: selectedLogoForVariants.file_url || '',
                                                name: selectedLogoForVariants.name || 'Logo de base'
                                              };
                                              const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
                                              
                                              return (
                                                <div style={{ position: 'relative' }}>
                                                  {/* Scroll horizontal des variantes */}
                                                  <div
                                                    ref={logoScrollRef}
                                                    className="logo-variants-scroll"
                                                    onWheel={(e) => {
                                                      if (logoScrollRef.current) {
                                                        e.preventDefault();
                                                        logoScrollRef.current.scrollLeft += e.deltaY;
                                                      }
                                                    }}
                                                    style={{
                                                      display: 'flex',
                                                      gap: '12px',
                                                      overflowX: 'auto',
                                                      overflowY: 'hidden',
                                                      padding: '8px 0',
                                                      scrollBehavior: 'smooth',
                                                      WebkitOverflowScrolling: 'touch',
                                                      scrollbarWidth: 'none',
                                                      msOverflowStyle: 'none'
                                                    }}
                                                  >
                                                    <style>{`
                                                      .logo-variants-scroll::-webkit-scrollbar {
                                                        display: none;
                                                      }
                                                    `}</style>
                                                    {allVariants.map((variant: any, index: number) => {
                                                      const fileToUse = variant.id === 'base' 
                                                        ? selectedLogoForVariants.file_url 
                                                        : (variant.file_url || selectedLogoForVariants.file_url);
                                                      
                                                      return (
                                                        <div
                                                          key={variant.id || `base-${index}`}
                                                          onClick={async () => {
                                                            
                                                            // Si on est en mode remplacement, remplacer directement le logo
                                                            if (logoToReplace) {
                                                              const logoToUpdate = placedLogos.find(l => l.id === logoToReplace);
                                                              if (logoToUpdate) {
                                                                // Calculer les dimensions du nouveau logo
                                                                let logoWidth: number | undefined = undefined;
                                                                let logoHeight: number | undefined = undefined;
                                                                
                                                                try {
                                                                  const response = await fetch(fileToUse);
                                                                  const svgText = await response.text();
                                                                  const parser = new DOMParser();
                                                                  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                                                  const svgElement = svgDoc.querySelector('svg');
                                                                  if (svgElement) {
                                                                    const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                                                    const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                                                    const viewBox = svgElement.getAttribute('viewBox');
                                                                    
                                                                    let actualWidth = svgWidth;
                                                                    let actualHeight = svgHeight;
                                                                    
                                                                    if (viewBox) {
                                                                      const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                                                      if (vbWidth && vbHeight) {
                                                                        actualWidth = vbWidth;
                                                                        actualHeight = vbHeight;
                                                                      }
                                                                    }
                                                                    
                                                                    if (actualWidth > 0 && actualHeight > 0) {
                                                                      logoWidth = actualWidth;
                                                                      logoHeight = actualHeight;
                                                                    }
                                                                  }
                                                                } catch (error) {
                                                                  console.error('Erreur lors du calcul des dimensions du logo:', error);
                                                                }
                                                                
                                                                // Calculer le nouveau scale pour conserver la même taille visuelle
                                                                let newScale = logoToUpdate.scale;
                                                                if (logoWidth && logoHeight && logoToUpdate.width && logoToUpdate.height) {
                                                                  const SCALE_FACTOR = 0.50;
                                                                  const currentVisualWidth = logoToUpdate.width * logoToUpdate.scale * SCALE_FACTOR;
                                                                  const currentVisualHeight = logoToUpdate.height * logoToUpdate.scale * SCALE_FACTOR;
                                                                  
                                                                  const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                                                  const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                                                  
                                                                  newScale = Math.min(scaleX, scaleY);
                                                                  
                                                                  console.log('📐 Mobile - Scale adjustment (variante):', {
                                                                    oldWidth: logoToUpdate.width,
                                                                    oldHeight: logoToUpdate.height,
                                                                    oldScale: logoToUpdate.scale,
                                                                    newWidth: logoWidth,
                                                                    newHeight: logoHeight,
                                                                    newScale: newScale,
                                                                    currentVisualWidth,
                                                                    currentVisualHeight
                                                                  });
                                                                }
                                                                
                                                                // Mettre à jour le logo avec les nouvelles dimensions
                                                                setPlacedLogos(placedLogos.map(l => 
                                                                  l.id === logoToReplace 
                                                                    ? { 
                                                                        ...l, 
                                                                        logoId: selectedLogoForVariants.id, 
                                                                        variantId: variant.id === 'base' ? undefined : variant.id, 
                                                                        variantFile: fileToUse,
                                                                        width: logoWidth,
                                                                        height: logoHeight,
                                                                        scale: newScale
                                                                      }
                                                                    : l
                                                                ));
                                                                
                                                                // Réinitialiser les états (mais garder le logo sélectionné pour pouvoir continuer à le modifier)
                                                                setLogoToReplace(null);
                                                                setShowLogoLibrary(false);
                                                                setSelectedLogoForVariants(null);
                                                                // setSelectedLogoId(null); // Ne pas désélectionner pour pouvoir continuer à modifier le logo
                                                              }
                                                              return;
                                                            }
                                                            
                                                            // Sinon, comportement normal
                                                            // Si mode zones, ouvrir le modal de sélection de zone
                                                            if (activeModule.logoPlacementMode === 'zones') {
                                                              setSelectedLogoForZone({
                                                                logoId: selectedLogoForVariants.id,
                                                                variantId: variant.id === 'base' ? undefined : variant.id,
                                                                variantFile: fileToUse
                                                              });
                                                              setShowLogoZoneModal(true);
                                                              setSelectedLogoForVariants(null);
                                                            } else {
                                                              // Mode libre : ajouter directement au centre
                                                              const categoryToView: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                                                'front': 'torse',
                                                                'back': 'dos',
                                                                'left': 'bras-gauche',
                                                                'right': 'bras-droit'
                                                              };
                                                              const category = categoryToView[activeLogoView] || 'torse';
                                                              await addLogo(
                                                                selectedLogoForVariants.id,
                                                                variant.id === 'base' ? undefined : variant.id,
                                                                fileToUse,
                                                                [0.5, 0.5, 0],
                                                                category
                                                              );
                                                              setSelectedLogoForVariants(null);
                                                            }
                                                          }}
                                                          style={{
                                                            minWidth: '100px',
                                                            width: '100px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            cursor: 'pointer',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e5e7eb',
                                                            backgroundColor: '#ffffff',
                                                            transition: 'all 0.2s'
                                                          }}
                                                        >
                                                          <div style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            backgroundColor: '#f5f5f5',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            borderRadius: '6px',
                                                            padding: '4px'
                                                          }}>
                                                            <img
                                                              src={fileToUse}
                                                              alt={variant.name || selectedLogoForVariants.name}
                                                              style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '100%',
                                                                objectFit: 'contain'
                                                              }}
                                                            />
                                                          </div>
                                                          <p style={{
                                                            margin: 0,
                                                            fontSize: '10px',
                                                            fontWeight: '500',
                                                            color: '#111827',
                                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                                            textAlign: 'center'
                                                          }}>
                                                            {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                                                          </p>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        ) : (
                                          <>
                                            {/* Bibliothèque de logos en scroll horizontal */}
                                            {allLogos.length === 0 ? (
                                              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                Aucun logo disponible. Veuillez sélectionner des bibliothèques de logos dans les settings du module.
                                              </p>
                                            ) : filteredLogos.length === 0 ? (
                                              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                Aucun logo trouvé pour "{logoSearchQuery}"
                                              </p>
                                            ) : (
                                              <div style={{ position: 'relative' }}>
                                                {/* Scroll horizontal des logos */}
                                                <div
                                                  ref={logoScrollRef}
                                                  className="logo-library-scroll"
                                                  onWheel={(e) => {
                                                    if (logoScrollRef.current) {
                                                      e.preventDefault();
                                                      logoScrollRef.current.scrollLeft += e.deltaY;
                                                    }
                                                  }}
                                                  style={{
                                                    display: 'flex',
                                                    gap: '12px',
                                                    overflowX: 'auto',
                                                    overflowY: 'hidden',
                                                    padding: '8px 0',
                                                    scrollBehavior: 'smooth',
                                                    WebkitOverflowScrolling: 'touch',
                                                    scrollbarWidth: 'none',
                                                    msOverflowStyle: 'none'
                                                  }}
                                                >
                                                  <style>{`
                                                    .logo-library-scroll::-webkit-scrollbar {
                                                      display: none;
                                                    }
                                                  `}</style>
                                                  {filteredLogos.map((logo: any) => {
                                                    const hasVariants = logo.variants && Array.isArray(logo.variants) && logo.variants.length > 0;
                                                    
                                                    return (
                                                      <div
                                                        key={logo.id}
                                                        onClick={async () => {
                                                          
                                                          // Si on est en mode remplacement, vérifier d'abord les variantes
                                                          if (logoToReplace) {
                                                            
                                                            // Si le logo a des variantes, ouvrir la vue des variantes pour choisir
                                                            if (hasVariants) {
                                                              setSelectedLogoForVariants(logo);
                                                              return;
                                                            }
                                                            
                                                          // Sinon, remplacer directement le logo
                                                          const logoToUpdate = placedLogos.find(l => l.id === logoToReplace);
                                                          if (logoToUpdate) {
                                                            // Déterminer le fichier à utiliser (logo de base ou première variante)
                                                            const fileToUse = logo.file_url;
                                                            
                                                            // Calculer les dimensions du nouveau logo
                                                            let logoWidth: number | undefined = undefined;
                                                            let logoHeight: number | undefined = undefined;
                                                            
                                                            try {
                                                              const response = await fetch(fileToUse);
                                                              const svgText = await response.text();
                                                              const parser = new DOMParser();
                                                              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                                                              const svgElement = svgDoc.querySelector('svg');
                                                              if (svgElement) {
                                                                const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
                                                                const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
                                                                const viewBox = svgElement.getAttribute('viewBox');
                                                                
                                                                let actualWidth = svgWidth;
                                                                let actualHeight = svgHeight;
                                                                
                                                                if (viewBox) {
                                                                  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
                                                                  if (vbWidth && vbHeight) {
                                                                    actualWidth = vbWidth;
                                                                    actualHeight = vbHeight;
                                                                  }
                                                                }
                                                                
                                                                if (actualWidth > 0 && actualHeight > 0) {
                                                                  logoWidth = actualWidth;
                                                                  logoHeight = actualHeight;
                                                                }
                                                              }
                                                            } catch (error) {
                                                              console.error('Erreur lors du calcul des dimensions du logo:', error);
                                                            }
                                                            
                                                            // Calculer le nouveau scale pour conserver la même taille visuelle
                                                            let newScale = logoToUpdate.scale;
                                                            if (logoWidth && logoHeight && logoToUpdate.width && logoToUpdate.height) {
                                                              const SCALE_FACTOR = 0.50;
                                                              const currentVisualWidth = logoToUpdate.width * logoToUpdate.scale * SCALE_FACTOR;
                                                              const currentVisualHeight = logoToUpdate.height * logoToUpdate.scale * SCALE_FACTOR;
                                                              
                                                              const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
                                                              const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
                                                              
                                                              newScale = Math.min(scaleX, scaleY);
                                                              
                                                              console.log('📐 Mobile - Scale adjustment:', {
                                                                oldWidth: logoToUpdate.width,
                                                                oldHeight: logoToUpdate.height,
                                                                oldScale: logoToUpdate.scale,
                                                                newWidth: logoWidth,
                                                                newHeight: logoHeight,
                                                                newScale: newScale,
                                                                currentVisualWidth,
                                                                currentVisualHeight
                                                              });
                                                            }
                                                            
                                                            // Mettre à jour le logo avec les nouvelles dimensions
                                                            setPlacedLogos(placedLogos.map(l => 
                                                              l.id === logoToReplace 
                                                                ? { 
                                                                    ...l, 
                                                                    logoId: logo.id, 
                                                                    variantId: undefined, 
                                                                    variantFile: fileToUse,
                                                                    width: logoWidth,
                                                                    height: logoHeight,
                                                                    scale: newScale
                                                                  }
                                                                : l
                                                            ));
                                                            
                                                            // Réinitialiser les états (mais garder le logo sélectionné pour pouvoir continuer à le modifier)
                                                            setLogoToReplace(null);
                                                            setShowLogoLibrary(false);
                                                            // setSelectedLogoId(null); // Ne pas désélectionner pour pouvoir continuer à modifier le logo
                                                          }
                                                            return;
                                                          }
                                                          
                                                          
                                                          // Vérifier si le logo a des variantes
                                                          if (!hasVariants && activeModule.logoPlacementMode === 'zones') {
                                                            // Pas de variantes + mode zones : ouvrir directement le modal de zone
                                                            setSelectedLogoForZone({
                                                              logoId: logo.id,
                                                              variantId: undefined,
                                                              variantFile: logo.file_url
                                                            });
                                                            setShowLogoZoneModal(true);
                                                          } else {
                                                            // A des variantes ou mode libre : afficher les variantes
                                                            setSelectedLogoForVariants(logo);
                                                          }
                                                        }}
                                                        style={{
                                                          minWidth: '100px',
                                                          width: '100px',
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          alignItems: 'center',
                                                          gap: '8px',
                                                          cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: '#ffffff',
                                                        transition: 'all 0.2s'
                                                      }}
                                                    >
                                                      <div style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        backgroundColor: '#f5f5f5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden',
                                                        borderRadius: '6px',
                                                        padding: '4px'
                                                      }}>
                                                        {logo.file_url ? (
                                                          <img
                                                            src={logo.file_url}
                                                            alt={logo.name}
                                                            style={{
                                                              maxWidth: '100%',
                                                              maxHeight: '100%',
                                                              objectFit: 'contain'
                                                            }}
                                                          />
                                                        ) : (
                                                          <div style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            backgroundColor: '#e0e0e0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            color: '#666',
                                                            textAlign: 'center',
                                                            padding: '4px'
                                                          }}>
                                                            {logo.name}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <p style={{
                                                        margin: 0,
                                                        fontSize: '10px',
                                                        fontWeight: '500',
                                                        color: '#111827',
                                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                                        textAlign: 'center'
                                                      }}>
                                                        {logo.name}
                                                      </p>
                                                    </div>
                                                  );
                                                })}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      // Vue initiale : Bouton ajouter + logos placés
                                      <>
                                    {/* Bouton ajouter */}
                                    <button
                                          className="btn-primary mobile-action-btn-black"
                                          onClick={() => {
                                            setShowLogoLibrary(true);
                                          }}
                                          style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px', 
                                            padding: '10px 20px', 
                                            backgroundColor: '#3b82f6', 
                                            color: '#ffffff', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            fontSize: '14px', 
                                            fontWeight: '500', 
                                            cursor: 'pointer', 
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#3b82f6';
                                          }}
                                    >
                                      <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                      <span style={{ color: '#ffffff' }}>{activeModule.addLogoButtonLabel || 'Ajouter un logo'}</span>
                                    </button>
                                    {/* Logos placés */}
                                    <div>
                                          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', fontFamily: CONFIGURATOR_PANEL_FONT }}>{activeModule.placedLogosLabel || 'Logos placés'} ({modulePlacedLogos.length})</h3>
                                      {modulePlacedLogos.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#9ca3af' }}>
                                          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                              <p style={{ fontSize: '12px', marginTop: '8px', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>Aucun logo ajouté</p>
                                              <p style={{ fontSize: '11px', color: '#9ca3af', fontFamily: CONFIGURATOR_PANEL_FONT }}>Cliquez sur "Ajouter un logo" pour commencer</p>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                          {modulePlacedLogos.map((logo) => {
                                            // Mapper la catégorie à la vue pour pivoter
                                            const categoryToViewId: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', string> = {
                                              'torse': 'front',
                                              'dos': 'back',
                                              'bras-gauche': 'left',
                                              'bras-droit': 'right'
                                            };
                                            
                                            return (
                                              <div 
                                                key={logo.id} 
                                                onClick={() => {
                                                  // 1. Pivoter vers la vue du logo
                                                  const logoViewId = categoryToViewId[logo.category as keyof typeof categoryToViewId];
                                                  if (logoViewId) {
                                                    setActiveLogoView(logoViewId as any);
                                                    // Trouver la vue de caméra correspondante
                                                    if (logoViewId) {
                                                      const viewConfig = customViews.find(v => v.id === logoViewId);
                                                      if (viewConfig?.cameraViewId) {
                                                        const cameraView = modelCameraViews.find(cv => cv.id === viewConfig.cameraViewId);
                                                        if (cameraView) {
                                                          window.dispatchEvent(new CustomEvent('goToCameraView', { 
                                                            detail: {
                                                              position: cameraView.position,
                                                              target: cameraView.target
                                                            }
                                                          }));
                                                        }
                                                      } else {
                                                        window.dispatchEvent(new CustomEvent('setCameraView', { detail: logoViewId }));
                                                      }
                                                    }
                                                  }
                                                  
                                                  // 2. Sélectionner le logo
                                                  setSelectedLogoId(logo.id);
                                                  
                                                  // 3. Ouvrir le panel d'édition (mode remplacement)
                                                  setLogoToReplace(logo.id);
                                                  setShowLogoLibrary(true);
                                                }} 
                                                style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: selectedLogoId === logo.id ? '2px solid #000' : '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}
                                              >
                                                <img src={logo.variantFile} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                      </>
                                    )}
                                  </div>
                                );
                              }
                              
                              // MODULE TEXT - Style stretchmx (bouton ajouter + textes placés OU bloc typographie si texte sélectionné)
                              if (activeModule.contentType === 'text') {
                                // Récupérer les zones de texte configurées
                                const textZoneGroupIds = activeModule.config?.textZoneGroupIds || activeModule.selectedItems?.textZoneGroupIds || [];
                                const isZoneMode = activeModule.config?.textPlacementMode === 'zones' || activeModule.textPlacementMode === 'zones';
                                
                                // Si un texte est sélectionné, afficher uniquement le bloc typographie (remplace "ajouter du texte et textes placés")
                                if (selectedTextId) {
                                  const selectedText = texts.find((t: any) => t.id === selectedTextId);
                                  if (!selectedText) return null;
                                  
                                  const tabs = [
                                    { id: 'contenu' as const, label: 'Contenu', enabled: activeModule.enableTextContent !== false },
                                    { id: 'police' as const, label: 'Police', enabled: activeModule.enableTextFont !== false },
                                    { id: 'couleur' as const, label: 'Couleur', enabled: activeModule.enableTextColor !== false },
                                    { id: 'contour' as const, label: 'Contour', enabled: activeModule.enableTextStroke !== false },
                                    { id: 'deformation' as const, label: 'Déformation', enabled: activeModule.enableTextDeformation !== false }
                                  ].filter(tab => tab.enabled);
                                  
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {/* Bloc Typographie - Style stretchmx */}
                                      <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid #e5e5e5'
                                      }}>
                                        {/* Onglets */}
                                        <div style={{
                                          display: 'flex',
                                          borderBottom: '1px solid #e5e5e5',
                                          backgroundColor: '#ffffff',
                                          overflowX: 'auto'
                                        }}>
                                          {tabs.map((tab) => (
                                            <button
                                              key={tab.id}
                                              onClick={() => setActiveTextTab(tab.id)}
                                              style={{
                                                flex: '1 1 0',
                                                minWidth: '60px',
                                                padding: '10px 8px',
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: activeTextTab === tab.id ? '2px solid #111827' : '2px solid transparent',
                                                color: activeTextTab === tab.id ? '#111827' : '#6b7280',
                                                fontSize: '11px',
                                                fontWeight: activeTextTab === tab.id ? '600' : '400',
                                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                              }}
                                            >
                                              {tab.label}
                                            </button>
                                          ))}
                                        </div>

                                        {/* Contenu de l'onglet sélectionné */}
                                        <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                                          {/* Onglet Contenu */}
                                          {activeTextTab === 'contenu' && (
                                            <div>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                marginBottom: '12px',
                                                fontFamily: CONFIGURATOR_PANEL_FONT
                                              }}>
                                                Contenu du texte
                                              </div>
                                              <input
                                                type="text"
                                                value={selectedText.content}
                                                onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '12px',
                                                  backgroundColor: '#ffffff',
                                                  border: '1px solid #d1d5db',
                                                  borderRadius: '6px',
                                                  fontSize: '14px',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                                  color: '#111827',
                                                  outline: 'none',
                                                  boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => {
                                                  e.currentTarget.style.borderColor = '#3b82f6';
                                                }}
                                                onBlur={(e) => {
                                                  e.currentTarget.style.borderColor = '#d1d5db';
                                                }}
                                              />
                                            </div>
                                          )}
                                          
                                          {/* Onglet Police */}
                                          {activeTextTab === 'police' && (() => {
                                            // Filtrer les polices selon les groupes sélectionnés
                                            const allowedGroupIds = activeModule?.selectedItems?.fontGroupIds;
                                            const visibleFonts = (() => {
                                              const allFonts: Array<{ id: string; name: string; display_name?: string; file_url?: string; file_type?: string; groupId: string }> = [];
                                              fontGroups.forEach(group => {
                                                if (group.fonts) {
                                                  group.fonts.forEach((font: any) => {
                                                    allFonts.push({
                                                      id: font.id,
                                                      name: font.name || font.id,
                                                      display_name: font.display_name,
                                                      file_url: font.file_url,
                                                      file_type: font.file_type || font.format,
                                                      groupId: group.id
                                                    });
                                                  });
                                                }
                                              });
                                              
                                              if (allowedGroupIds && allowedGroupIds.length > 0) {
                                                return allFonts.filter(font => allowedGroupIds.includes(font.groupId));
                                              }
                                              return allFonts;
                                            })();
                                            
                                            // Texte de prévisualisation
                                            const previewText = selectedText.content && selectedText.content.trim() !== '' 
                                              ? selectedText.content 
                                              : 'ZG';
                                            
                                            return (
                                              <div>
                                                <div style={{
                                                  fontSize: '13px',
                                                  fontWeight: '500',
                                                  color: '#111827',
                                                  marginBottom: '12px',
                                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                                }}>
                                                  Police
                                                </div>
                                                {visibleFonts.length === 0 ? (
                                                  <p style={{ 
                                                    color: '#6b7280', 
                                                    fontSize: '12px', 
                                                    fontFamily: CONFIGURATOR_PANEL_FONT,
                                                    padding: '12px',
                                                    backgroundColor: '#f9fafb',
                                                    borderRadius: '8px'
                                                  }}>
                                                    Aucune police disponible. Cochez des groupes de polices dans les settings du module.
                                                  </p>
                                                ) : (
                                                  <div style={{
                                                    position: 'relative',
                                                    width: '100%',
                                                    overflow: 'hidden'
                                                  }}>
                                                    <div
                                                      style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        overflowX: 'auto',
                                                        overflowY: 'hidden',
                                                        padding: '4px 0',
                                                        scrollBehavior: 'smooth',
                                                        WebkitOverflowScrolling: 'touch',
                                                        scrollbarWidth: 'none',
                                                        msOverflowStyle: 'none'
                                                      }}
                                                      onWheel={(e) => {
                                                        e.currentTarget.scrollLeft += e.deltaY;
                                                        e.preventDefault();
                                                      }}
                                                      onScroll={(e) => {
                                                        const target = e.currentTarget;
                                                        target.style.scrollbarWidth = 'none';
                                                      }}
                                                    >
                                                      <style>{`
                                                        div::-webkit-scrollbar {
                                                          display: none;
                                                        }
                                                      `}</style>
                                                      {visibleFonts.map((font) => {
                                                        const isSelected = selectedText.fontFamily === font.id;
                                                        const fontFamilyValue = font.display_name || font.name;
                                                        
                                                        // Vérifier si la police est chargée
                                                        const fontFamilyQuoted = fontFamilyValue ? `"${fontFamilyValue}"` : '';
                                                        const isFontLoaded = fontFamilyValue ? (
                                                          document.fonts.check(`12px ${fontFamilyQuoted}`) ||
                                                          document.fonts.check(`18px ${fontFamilyQuoted}`) ||
                                                          document.fonts.check(`24px ${fontFamilyQuoted}`)
                                                        ) : false;
                                                        
                                                        return (
                                                          <div
                                                            key={font.id}
                                                            onClick={() => updateText(selectedTextId, { fontFamily: font.id })}
                                                            style={{
                                                              flexShrink: 0,
                                                              width: '120px',
                                                              padding: '12px',
                                                              backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                                              borderRadius: '8px',
                                                              border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                                                              cursor: 'pointer',
                                                              transition: 'all 0.2s',
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              alignItems: 'center',
                                                              gap: '8px',
                                                              minHeight: '100px',
                                                              position: 'relative'
                                                            }}
                                                          >
                                                            <div
                                                              style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                backgroundColor: '#f5f5f5',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                minHeight: '60px',
                                                                fontFamily: fontFamilyValue ? `${fontFamilyQuoted}, sans-serif` : 'sans-serif',
                                                                fontSize: '18px',
                                                                fontWeight: 'bold',
                                                                color: '#111827'
                                                              }}
                                                              ref={(el) => {
                                                                if (el && fontFamilyValue) {
                                                                  // Forcer immédiatement la police
                                                                  el.style.fontFamily = `${fontFamilyQuoted}, sans-serif`;
                                                                  el.style.setProperty('font-family', `${fontFamilyQuoted}, sans-serif`, 'important');
                                                                  
                                                                  // Vérifier périodiquement si la police est chargée et forcer le style
                                                                  const checkAndForce = () => {
                                                                    if (el) {
                                                                      el.style.fontFamily = `${fontFamilyQuoted}, sans-serif`;
                                                                      el.style.setProperty('font-family', `${fontFamilyQuoted}, sans-serif`, 'important');
                                                                      
                                                                      // Vérifier si la police est maintenant chargée
                                                                      const isReady = document.fonts.check(`12px ${fontFamilyQuoted}`) ||
                                                                                     document.fonts.check(`18px ${fontFamilyQuoted}`) ||
                                                                                     document.fonts.check(`24px ${fontFamilyQuoted}`);
                                                                      if (!isReady) {
                                                                        setTimeout(checkAndForce, 100);
                                                                      }
                                                                    }
                                                                  };
                                                                  checkAndForce();
                                                                }
                                                              }}
                                                            >
                                                              {previewText}
                                                            </div>
                                                            <span style={{
                                                              fontSize: '11px',
                                                              color: '#111827',
                                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                                              textAlign: 'center',
                                                              fontWeight: '500'
                                                            }}>
                                                              {font.display_name || font.name}
                                                            </span>
                                                            {isSelected && (
                                                              <div style={{
                                                                position: 'absolute',
                                                                bottom: '8px',
                                                                right: '8px',
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#111827',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                              }}>
                                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                                <div style={{ marginTop: '16px' }}>
                                                  <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    color: '#111827',
                                                    marginBottom: '8px',
                                                    fontFamily: CONFIGURATOR_PANEL_FONT,
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                  }}>
                                                    <span>Taille du texte</span>
                                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                      {Math.round(textConstraints.minFontSizePx)} px – {Math.round(textConstraints.maxFontSizePx)} px
                                                    </span>
                                                  </div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <input
                                                      type="range"
                                                      min={textConstraints.minFontSizePx}
                                                      max={textConstraints.maxFontSizePx}
                                                      step={1}
                                                      value={selectedText.fontSize}
                                                      onChange={(e) => updateText(selectedTextId, { fontSize: parseFloat(e.target.value) })}
                                                      style={{
                                                        flex: 1,
                                                        accentColor: '#111827'
                                                      }}
                                                    />
                                                    <span style={{
                                                      fontSize: '13px',
                                                      fontWeight: '600',
                                                      color: '#111827',
                                                      minWidth: '48px',
                                                      textAlign: 'right',
                                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                                    }}>
                                                      {Math.round(selectedText.fontSize)} px
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Onglet Couleur */}
                                          {activeTextTab === 'couleur' && (
                                            <div>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                marginBottom: '12px',
                                                fontFamily: CONFIGURATOR_PANEL_FONT
                                              }}>
                                                Couleur
                                              </div>
                                              {activeModule.textColorPaletteId ? (() => {
                                                const palette = colorPalettes.find(p => p.id === activeModule.textColorPaletteId);
                                                if (!palette) {
                                                  return (
                                                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                      Palette introuvable. Veuillez en sélectionner une autre.
                                                    </p>
                                                  );
                                                }
                                                const paletteColors = palette.colors || [];
                                                if (paletteColors.length === 0) {
                                                  return (
                                                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                      La palette sélectionnée ne contient aucune couleur.
                                                    </p>
                                                  );
                                                }
                                                
                                                const scrollColors = (direction: 'left' | 'right') => {
                                                  if (colorScrollRef.current) {
                                                    const scrollAmount = 100;
                                                    colorScrollRef.current.scrollBy({
                                                      left: direction === 'right' ? scrollAmount : -scrollAmount,
                                                      behavior: 'smooth'
                                                    });
                                                  }
                                                };
                                                
                                                return (
                                                  <div style={{ position: 'relative', width: '100%' }}>
                                                    <button
                                                      onClick={() => scrollColors('left')}
                                                      style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 10,
                                                        width: '36px',
                                                        height: '36px',
                                                        minWidth: '36px',
                                                        minHeight: '36px',
                                                        maxWidth: '36px',
                                                        maxHeight: '36px',
                                                        borderRadius: '50%',
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        padding: 0
                                                      }}
                                                    >
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                                                        <path d="M15 18l-6-6 6-6"/>
                                                      </svg>
                                                    </button>
                                                    <div
                                                      ref={colorScrollRef}
                                                      style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        overflowX: 'auto',
                                                        overflowY: 'hidden',
                                                        padding: '8px 40px',
                                                        scrollBehavior: 'smooth',
                                                        WebkitOverflowScrolling: 'touch',
                                                        scrollbarWidth: 'none',
                                                        msOverflowStyle: 'none'
                                                      }}
                                                      onWheel={(e) => {
                                                        if (colorScrollRef.current) {
                                                          colorScrollRef.current.scrollLeft += e.deltaY;
                                                          e.preventDefault();
                                                        }
                                                      }}
                                                    >
                                                      <style>{`
                                                        div::-webkit-scrollbar {
                                                          display: none;
                                                        }
                                                      `}</style>
                                                      {paletteColors.map((color: any, index: number) => {
                                                        const hex = (color?.hex || '#000000').toLowerCase();
                                                        const isSelected = (selectedText.color || '').toLowerCase() === hex;
                                                        return (
                                                          <button
                                                            key={color?.id || `${palette.id}-${index}`}
                                                            onClick={() => updateText(selectedTextId, { color: color?.hex || '#000000' })}
                                                            style={{
                                                              flexShrink: 0,
                                                              width: '48px',
                                                              height: '48px',
                                                              borderRadius: '50%',
                                                              border: isSelected ? '2px solid #111827' : '1px solid #d1d5db',
                                                              backgroundColor: color?.hex || '#000000',
                                                              cursor: 'pointer',
                                                              transition: 'all 0.2s',
                                                              padding: 0,
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center'
                                                            }}
                                                          />
                                                        );
                                                      })}
                                                    </div>
                                                    <button
                                                      onClick={() => scrollColors('right')}
                                                      style={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        zIndex: 10,
                                                        width: '36px',
                                                        height: '36px',
                                                        minWidth: '36px',
                                                        minHeight: '36px',
                                                        maxWidth: '36px',
                                                        maxHeight: '36px',
                                                        borderRadius: '50%',
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: '#ffffff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        padding: 0
                                                      }}
                                                    >
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                                                        <path d="M9 18l6-6-6-6"/>
                                                      </svg>
                                                    </button>
                                                  </div>
                                                );
                                              })() : (
                                                <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                  Sélectionnez une palette de couleurs pour le texte dans les réglages du module.
                                                </p>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Onglet Contour */}
                                          {activeTextTab === 'contour' && (
                                            <div>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                marginBottom: '12px',
                                                fontFamily: CONFIGURATOR_PANEL_FONT
                                              }}>
                                                Contour
                                              </div>
                                              {activeModule.textStrokePaletteId ? (() => {
                                                const palette = colorPalettes.find(p => p.id === activeModule.textStrokePaletteId);
                                                if (!palette) {
                                                  return (
                                                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                      Palette introuvable. Veuillez en sélectionner une autre.
                                                    </p>
                                                  );
                                                }
                                                const paletteColors = palette.colors || [];
                                                if (paletteColors.length === 0) {
                                                  return (
                                                    <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                                      La palette sélectionnée ne contient aucune couleur.
                                                    </p>
                                                  );
                                                }
                                                
                                                const scrollStrokeColors = (direction: 'left' | 'right') => {
                                                  if (strokeScrollRef.current) {
                                                    const scrollAmount = 100;
                                                    strokeScrollRef.current.scrollBy({
                                                      left: direction === 'right' ? scrollAmount : -scrollAmount,
                                                      behavior: 'smooth'
                                                    });
                                                  }
                                                };
                                                
                                                return (
                                                  <div>
                                                    <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
                                                      <button
                                                        onClick={() => scrollStrokeColors('left')}
                                                        style={{
                                                          position: 'absolute',
                                                          left: 0,
                                                          top: '50%',
                                                          transform: 'translateY(-50%)',
                                                          zIndex: 10,
                                                          width: '36px',
                                                          height: '36px',
                                                          minWidth: '36px',
                                                          minHeight: '36px',
                                                          maxWidth: '36px',
                                                          maxHeight: '36px',
                                                          borderRadius: '50%',
                                                          border: '1px solid #e5e7eb',
                                                          backgroundColor: '#ffffff',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          cursor: 'pointer',
                                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                          padding: 0
                                                        }}
                                                      >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                                                          <path d="M15 18l-6-6 6-6"/>
                                                        </svg>
                                                      </button>
                                                      <div
                                                        ref={strokeScrollRef}
                                                        style={{
                                                          display: 'flex',
                                                          gap: '12px',
                                                          overflowX: 'auto',
                                                          overflowY: 'hidden',
                                                          padding: '8px 40px',
                                                          scrollBehavior: 'smooth',
                                                          WebkitOverflowScrolling: 'touch',
                                                          scrollbarWidth: 'none',
                                                          msOverflowStyle: 'none'
                                                        }}
                                                        onWheel={(e) => {
                                                          if (strokeScrollRef.current) {
                                                            strokeScrollRef.current.scrollLeft += e.deltaY;
                                                            e.preventDefault();
                                                          }
                                                        }}
                                                      >
                                                        <style>{`
                                                          div::-webkit-scrollbar {
                                                            display: none;
                                                          }
                                                        `}</style>
                                                        {paletteColors.map((color: any, index: number) => {
                                                          const hex = (color?.hex || '#000000').toLowerCase();
                                                          const isSelected = (selectedText.strokeColor || '').toLowerCase() === hex;
                                                          return (
                                                            <button
                                                              key={color?.id || `${palette.id}-${index}`}
                                                              onClick={() => updateText(selectedTextId, { strokeColor: color?.hex || '#000000' })}
                                                              style={{
                                                                flexShrink: 0,
                                                                width: '48px',
                                                                height: '48px',
                                                                borderRadius: '50%',
                                                                border: isSelected ? '2px solid #111827' : '1px solid #d1d5db',
                                                                backgroundColor: color?.hex || '#000000',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                padding: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                              }}
                                                            />
                                                          );
                                                        })}
                                                      </div>
                                                      <button
                                                        onClick={() => scrollStrokeColors('right')}
                                                        style={{
                                                          position: 'absolute',
                                                          right: 0,
                                                          top: '50%',
                                                          transform: 'translateY(-50%)',
                                                          zIndex: 10,
                                                          width: '36px',
                                                          height: '36px',
                                                          minWidth: '36px',
                                                          minHeight: '36px',
                                                          maxWidth: '36px',
                                                          maxHeight: '36px',
                                                          borderRadius: '50%',
                                                          border: '1px solid #e5e7eb',
                                                          backgroundColor: '#ffffff',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          cursor: 'pointer',
                                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                          padding: 0
                                                        }}
                                                      >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                                                          <path d="M9 18l6-6-6-6"/>
                                                        </svg>
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })() : (
                                                <p style={{ color: '#6b7280', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT, marginBottom: '16px' }}>
                                                  Sélectionnez une palette de contours dans les réglages du module.
                                                </p>
                                              )}
                                              <div>
                                                {(() => {
                                                  const sliderMin = textConstraints.strokeMinWidthPx;
                                                  const sliderMax = textConstraints.strokeMaxWidthPx;
                                                  const sliderRange = sliderMax - sliderMin;
                                                  
                                                  const rawValue = selectedText.strokeWidth ?? textConstraints.baseStrokeWidthPx;
                                                  let currentPxValue = Number.isFinite(rawValue) ? rawValue : sliderMin;
                                                  currentPxValue = Math.min(sliderMax, Math.max(sliderMin, currentPxValue));
                                                  currentPxValue = Math.round(currentPxValue);
                                                  if (currentPxValue < sliderMin) currentPxValue = sliderMin;
                                                  if (currentPxValue > sliderMax) currentPxValue = sliderMax;
                                                  
                                                  const sliderId = `stroke-slider-mobile-${selectedTextId}`;
                                                  
                                                  return (
                                                    <div style={{ width: '100%' }}>
                                                      <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '8px'
                                                      }}>
                                                        <div style={{
                                                          fontSize: '13px',
                                                          fontWeight: '500',
                                                          color: '#111827',
                                                          fontFamily: CONFIGURATOR_PANEL_FONT
                                                        }}>
                                                          Épaisseur {currentPxValue}
                                                        </div>
                                                      </div>
                                                      <style>{`
                                                        #${sliderId} {
                                                          -webkit-appearance: none;
                                                          appearance: none;
                                                          width: 100%;
                                                          height: 6px;
                                                          border-radius: 3px;
                                                          background: #e5e7eb;
                                                          outline: none;
                                                          padding: 0;
                                                          margin: 0;
                                                        }
                                                        #${sliderId}::-webkit-slider-thumb {
                                                          -webkit-appearance: none;
                                                          appearance: none;
                                                          width: 18px;
                                                          height: 18px;
                                                          border-radius: 50%;
                                                          background: #3b82f6;
                                                          cursor: pointer;
                                                          border: none;
                                                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                        }
                                                        #${sliderId}::-moz-range-thumb {
                                                          width: 18px;
                                                          height: 18px;
                                                          border-radius: 50%;
                                                          background: #3b82f6;
                                                          cursor: pointer;
                                                          border: none;
                                                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                                        }
                                                      `}</style>
                                                      <input
                                                        id={sliderId}
                                                        type="range"
                                                        min={sliderMin}
                                                        max={sliderMax}
                                                        step="1"
                                                        value={currentPxValue}
                                                        onChange={(e) => {
                                                          const pxValue = parseFloat(e.target.value);
                                                          if (!Number.isFinite(pxValue)) return;
                                                          let clampedValue = Math.min(sliderMax, Math.max(sliderMin, pxValue));
                                                          clampedValue = Math.round(clampedValue);
                                                          if (clampedValue < sliderMin) clampedValue = sliderMin;
                                                          if (clampedValue > sliderMax) clampedValue = sliderMax;
                                                          updateText(selectedTextId, { strokeWidth: clampedValue });
                                                        }}
                                                        disabled={sliderRange <= 0}
                                                      />
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Onglet Déformation */}
                                          {activeTextTab === 'deformation' && (
                                            <div>
                                              <div style={{
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: '#111827',
                                                marginBottom: '12px',
                                                fontFamily: CONFIGURATOR_PANEL_FONT
                                              }}>
                                                Type de déformation
                                              </div>
                                              <div>
                                                <style>{`
                                                  select.deformation-select-mobile {
                                                    color: #111827 !important;
                                                  }
                                                  select.deformation-select-mobile option {
                                                    color: #111827 !important;
                                                    background-color: #ffffff !important;
                                                  }
                                                `}</style>
                                                <select
                                                  className="deformation-select-mobile"
                                                  value={selectedText.deformation || ''}
                                                  onChange={(e) => updateText(selectedTextId, { 
                                                    deformation: e.target.value || undefined 
                                                  })}
                                                  style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    color: '#111827',
                                                    fontSize: '14px',
                                                    fontFamily: CONFIGURATOR_PANEL_FONT,
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    marginBottom: selectedText.deformation ? '16px' : '0'
                                                  }}
                                                >
                                                  {(() => {
                                                    const allDeformations = [
                                                      { value: '', label: 'Aucune' },
                                                      { value: 'arc', label: 'Arc' },
                                                      { value: 'wave', label: 'Vague' },
                                                      { value: 'bulge', label: 'Bombé' },
                                                      { value: 'pinch', label: 'Pincement' },
                                                      { value: 'flag', label: 'Drapeau' },
                                                      { value: 'fisheye', label: 'Fisheye' },
                                                      { value: 'squeeze', label: 'Compression' },
                                                      { value: 'skew', label: 'Inclinaison' },
                                                      { value: 'spiral', label: 'Spirale' },
                                                      { value: 'rotate', label: 'Rotation progressive' },
                                                      { value: 'tilt', label: 'Tilt' },
                                                      { value: 'perspective', label: 'Perspective' },
                                                      { value: 'fade', label: 'Fondu' },
                                                      { value: 'ribbon', label: 'Ruban' },
                                                      { value: 'incline', label: 'Montée/descente' },
                                                      { value: 'staircase', label: 'Escalier' },
                                                      { value: 'wave-arc', label: 'Vague + Arc' },
                                                      { value: 'pulse', label: 'Pulse' },
                                                    ];
                                                    
                                                    const enabledDeformations = activeModule?.textEnabledDeformations;
                                                    const filteredDeformations = enabledDeformations && enabledDeformations.length > 0
                                                      ? allDeformations.filter(def => 
                                                          def.value === '' || enabledDeformations.includes(def.value)
                                                        )
                                                      : allDeformations;
                                                    
                                                    return filteredDeformations.map(def => (
                                                      <option key={def.value} value={def.value} style={{ color: '#111827', backgroundColor: '#ffffff' }}>{def.label}</option>
                                                    ));
                                                  })()}
                                                </select>
                                              </div>
                                              {selectedText.deformation && (() => {
                                                const sliderId = `deformation-slider-mobile-${selectedTextId}`;
                                                const intensity = selectedText.deformationIntensity ?? 0;
                                                
                                                return (
                                                  <div style={{ marginTop: '16px' }}>
                                                    <div style={{
                                                      display: 'flex',
                                                      justifyContent: 'space-between',
                                                      alignItems: 'center',
                                                      marginBottom: '8px'
                                                    }}>
                                                      <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        color: '#111827',
                                                        fontFamily: CONFIGURATOR_PANEL_FONT
                                                      }}>
                                                        Intensité
                                                      </div>
                                                      <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        color: '#111827',
                                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                                        minWidth: '60px',
                                                        textAlign: 'right'
                                                      }}>
                                                        {intensity > 0 ? `+${intensity}` : intensity.toString()}
                                                      </div>
                                                    </div>
                                                    <style>{`
                                                      #${sliderId} {
                                                        -webkit-appearance: none;
                                                        appearance: none;
                                                        width: 100%;
                                                        height: 6px;
                                                        border-radius: 3px;
                                                        background: #e5e7eb;
                                                        outline: none;
                                                        padding: 0;
                                                        margin: 0;
                                                      }
                                                      #${sliderId}::-webkit-slider-thumb {
                                                        -webkit-appearance: none;
                                                        appearance: none;
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #8eff36;
                                                        border: 2px solid #ffffff;
                                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                        cursor: pointer;
                                                      }
                                                      #${sliderId}::-moz-range-thumb {
                                                        width: 18px;
                                                        height: 18px;
                                                        border-radius: 50%;
                                                        background: #8eff36;
                                                        border: 2px solid #ffffff;
                                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                                                        cursor: pointer;
                                                      }
                                                    `}</style>
                                                    <input
                                                      id={sliderId}
                                                      type="range"
                                                      min="-100"
                                                      max="100"
                                                      step="1"
                                                      value={intensity}
                                                      onChange={(e) => updateText(selectedTextId, { 
                                                        deformationIntensity: parseInt(e.target.value) 
                                                      })}
                                                    />
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Si aucun texte n'est sélectionné, afficher "ajouter du texte et textes placés"
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Bouton ajouter */}
                                    <button 
                                      className="btn-primary mobile-action-btn mobile-action-btn-black"
                                      onClick={() => {
                                        if (isZoneMode) {
                                          // Mode zones : ouvrir le modal de sélection de zones
                                          setShowZoneSelectionModal(true);
                                          setSelectedZoneId(null);
                                          setTextInputValue('');
                                          // Ne pas ouvrir la sidebar desktop en mode mobile
                                          if (viewportMode !== 'mobile') {
                                          setActiveCustomizerTab(activeModule.id);
                                          }
                                        } else {
                                          // Mode libre : activer le mode placement
                                          if (isPlacingText) {
                                            setIsPlacingText(null);
                                          } else {
                                            setIsPlacingText('nom');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        width: '100%',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        padding: '10px 20px', 
                                        backgroundColor: '#3b82f6', 
                                        color: '#ffffff', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        fontSize: '14px', 
                                        fontWeight: '500', 
                                        cursor: 'pointer', 
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2563eb';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3b82f6';
                                      }}
                                    >
                                      <svg width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                      {activeModule.addTextButtonLabel || 'Ajouter du texte'}
                                    </button>
                                    
                                    {/* Textes placés */}
                                    {texts && texts.length > 0 && (
                                      <div>
                                        <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Textes placés ({texts.length})</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {texts.map((text: any) => (
                                            <div 
                                              key={text.id}
                                              onClick={() => setSelectedTextId(text.id)}
                                              style={{
                                                padding: '10px 12px',
                                                backgroundColor: selectedTextId === text.id ? '#eff6ff' : '#f9fafb',
                                                border: selectedTextId === text.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                              }}
                                            >
                                              <div>
                                                <p style={{ 
                                                  fontSize: text.fontSize ? `${text.fontSize / 10}px` : '13px', 
                                                  fontWeight: '500', 
                                                  color: text.color || '#111827', 
                                                  margin: 0,
                                                  fontFamily: text.fontFamily || CONFIGURATOR_PANEL_FONT,
                                                  ...(text.strokeColor && text.strokeWidth ? {
                                                    WebkitTextStroke: `${text.strokeWidth}px ${text.strokeColor}`,
                                                    textStroke: `${text.strokeWidth}px ${text.strokeColor}`
                                                  } : {})
                                                }}>
                                                  {text.content || 'Texte vide'}
                                                  {text.locked && ' 🔒'}
                                                </p>
                                              </div>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setTexts(texts.filter((t: any) => t.id !== text.id));
                                                  if (selectedTextId === text.id) setSelectedTextId(null);
                                                }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                                              >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* État vide */}
                                    {(!texts || texts.length === 0) && (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#9ca3af' }}>
                                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Aucun texte ajouté</p>
                                        <p style={{ fontSize: '11px' }}>Cliquez sur le bouton ci-dessus pour commencer</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              
                              return <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Type de module non supporté.</p>;
                            };
                            
                            return (
                              <div
                                className="mobile-panel-slide-up"
                                style={{
                                  position: 'absolute',
                                  bottom: '0px',
                                  left: 0,
                                  right: 0,
                                  maxHeight: '70%',
                                  backgroundColor: '#ffffff',
                                  borderTopLeftRadius: '16px',
                                  borderTopRightRadius: '16px',
                                  boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                                  zIndex: 200,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  color: '#111827',
                                  // Permettre les événements pointer à travers le panneau pour le Canvas en dessous
                                  pointerEvents: 'auto'
                                }}
                              >
                                <style>{`
                                  .mobile-panel-slide-up,
                                  .mobile-panel-slide-up * {
                                    color: #111827 !important;
                                  }
                                  .mobile-panel-slide-up p,
                                  .mobile-panel-slide-up span:not([style*="color: #fff"]):not([style*="color:#fff"]):not([style*="color: '#fff'"]):not([style*="color:'#fff'"]):not([style*="color: '#ffffff'"]):not([style*="color:'#ffffff'"]):not([style*="color: white"]):not([style*="color:white"]),
                                  .mobile-panel-slide-up div:not([style*="background"]):not([style*="backgroundColor"]),
                                  .mobile-panel-slide-up h1,
                                  .mobile-panel-slide-up h2,
                                  .mobile-panel-slide-up h3,
                                  .mobile-panel-slide-up h4,
                                  .mobile-panel-slide-up h5,
                                  .mobile-panel-slide-up h6,
                                  .mobile-panel-slide-up label,
                                  .mobile-panel-slide-up button:not([style*="backgroundColor: '#000"]):not([style*="backgroundColor:'#000"]):not([style*="backgroundColor: '#000000"]):not([style*="backgroundColor:'#000000"]):not([style*="backgroundColor: black"]):not([style*="backgroundColor:black"]):not([style*="color: #fff"]):not([style*="color:#fff"]):not([style*="color: '#fff'"]):not([style*="color:'#fff'"]):not([style*="color: '#ffffff'"]):not([style*="color:'#ffffff'"]):not([style*="color: white"]):not([style*="color:white"]),
                                  .mobile-panel-slide-up input,
                                  .mobile-panel-slide-up textarea,
                                  .mobile-panel-slide-up select {
                                    color: #111827 !important;
                                  }
                                  .mobile-panel-slide-up button[style*="backgroundColor: '#000"],
                                  .mobile-panel-slide-up button[style*="backgroundColor:'#000"],
                                  .mobile-panel-slide-up button[style*="backgroundColor: '#000000"],
                                  .mobile-panel-slide-up button[style*="backgroundColor:'#000000"],
                                  .mobile-panel-slide-up button[style*="backgroundColor: black"],
                                  .mobile-panel-slide-up button[style*="backgroundColor:black"],
                                  .mobile-panel-slide-up button[style*="color: #fff"],
                                  .mobile-panel-slide-up button[style*="color:#fff"],
                                  .mobile-panel-slide-up button[style*="color: '#fff'"],
                                  .mobile-panel-slide-up button[style*="color:'#fff'"],
                                  .mobile-panel-slide-up button[style*="color: '#ffffff'"],
                                  .mobile-panel-slide-up button[style*="color:'#ffffff'"],
                                  .mobile-panel-slide-up button[style*="color: white"],
                                  .mobile-panel-slide-up button[style*="color:white"],
                                  .mobile-panel-slide-up button.mobile-action-btn[style*="backgroundColor: '#000"],
                                  .mobile-panel-slide-up button.mobile-action-btn[style*="backgroundColor:'#000"],
                                  .mobile-panel-slide-up button.mobile-action-btn[style*="backgroundColor: '#000000"],
                                  .mobile-panel-slide-up button.mobile-action-btn[style*="backgroundColor:'#000000"],
                                  .mobile-panel-slide-up button.mobile-action-btn-black,
                                  .mobile-action-btn-black {
                                    color: #ffffff !important;
                                  }
                                  /* Forcer la croix de fermeture en noir - règles très spécifiques avec !important */
                                  .mobile-panel-slide-up button.mobile-panel-close-btn,
                                  .mobile-panel-slide-up button.mobile-panel-close-btn *,
                                  .mobile-panel-slide-up button.mobile-panel-close-btn span {
                                    color: #111827 !important;
                                    background-color: transparent !important;
                                  }
                                  /* Exclure le bouton de fermeture des règles globales */
                                  .mobile-panel-slide-up button.mobile-panel-close-btn:not([style*="color: #fff"]):not([style*="color:#fff"]):not([style*="color: '#fff'"]):not([style*="color:'#fff'"]) {
                                    color: #111827 !important;
                                  }
                                `}</style>
                                {/* Header du panneau - Style stretchmx */}
                                <div 
                                  style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexShrink: 0, color: '#111827' }}
                                  onTouchStart={(e) => {
                                    console.log('👆 page.tsx - TouchStart sur header panneau mobile');
                                    const touch = e.touches[0];
                                    (e.currentTarget as any).swipeStartY = touch.clientY;
                                    (e.currentTarget as any).swipeStartTime = Date.now();
                                  }}
                                  onTouchMove={(e) => {
                                    const touch = e.touches[0];
                                    const startY = (e.currentTarget as any).swipeStartY;
                                    if (startY !== undefined) {
                                      const deltaY = touch.clientY - startY;
                                      const panel = (e.currentTarget as HTMLElement).closest('.mobile-panel-slide-up');
                                      if (panel && deltaY > 0) {
                                        (panel as HTMLElement).style.transform = `translateY(${deltaY}px)`;
                                        (panel as HTMLElement).style.transition = 'none';
                                      }
                                    }
                                  }}
                                  onTouchEnd={(e) => {
                                    console.log('👆 page.tsx - TouchEnd sur header panneau mobile');
                                    const startY = (e.currentTarget as any).swipeStartY;
                                    const startTime = (e.currentTarget as any).swipeStartTime;
                                    if (startY !== undefined && startTime !== undefined) {
                                      const touch = e.changedTouches[0];
                                      const deltaY = touch.clientY - startY;
                                      const deltaTime = Date.now() - startTime;
                                      const velocity = deltaY / deltaTime;
                                      const panel = (e.currentTarget as HTMLElement).closest('.mobile-panel-slide-up');
                                      
                                      if (panel) {
                                        (panel as HTMLElement).style.transition = 'transform 0.3s ease-out';
                                        
                                        if (deltaY > 50 || velocity > 0.3) {
                                          // Marquer qu'on ferme manuellement le panneau
                                          isManuallyClosingRef.current = true;
                                          // Nettoyer le timeout précédent
                                          if (manualCloseTimeoutRef.current) {
                                            clearTimeout(manualCloseTimeoutRef.current);
                                          }
                                          // Désélectionner le texte AVANT de fermer le panneau pour éviter qu'il se rouvre
                                          if (selectedTextId) {
                                            setSelectedTextId(null);
                                          }
                                          // Désélectionner le logo AVANT de fermer le panneau
                                          if (selectedLogoId) {
                                            setSelectedLogoId(null);
                                          }
                                          (panel as HTMLElement).style.transform = 'translateY(100%)';
                                          setTimeout(() => {
                                            setMobileActivePanel(null);
                                            setSelectedColorClass(null);
                                            // Réinitialiser le flag après un délai
                                            manualCloseTimeoutRef.current = setTimeout(() => {
                                              isManuallyClosingRef.current = false;
                                            }, 500);
                                          }, 300);
                                        } else {
                                          (panel as HTMLElement).style.transform = 'translateY(0)';
                                        }
                                      }
                                    }
                                  }}
                                >
                                  {/* Drag handle */}
                                  <div 
                                    style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', cursor: 'grab' }}
                                    onTouchStart={(e) => {
                                      console.log('👆 page.tsx - TouchStart sur drag handle');
                                      const touch = e.touches[0];
                                      (e.currentTarget as any).swipeStartY = touch.clientY;
                                      (e.currentTarget as any).swipeStartTime = Date.now();
                                    }}
                                    onTouchMove={(e) => {
                                      const touch = e.touches[0];
                                      const startY = (e.currentTarget as any).swipeStartY;
                                      if (startY !== undefined) {
                                        const deltaY = touch.clientY - startY;
                                        const panel = (e.currentTarget as HTMLElement).closest('.mobile-panel-slide-up');
                                        if (panel && deltaY > 0) {
                                          (panel as HTMLElement).style.transform = `translateY(${deltaY}px)`;
                                          (panel as HTMLElement).style.transition = 'none';
                                        }
                                      }
                                    }}
                                    onTouchEnd={(e) => {
                                      console.log('👆 page.tsx - TouchEnd sur drag handle');
                                      const startY = (e.currentTarget as any).swipeStartY;
                                      const startTime = (e.currentTarget as any).swipeStartTime;
                                      if (startY !== undefined && startTime !== undefined) {
                                        const touch = e.changedTouches[0];
                                        const deltaY = touch.clientY - startY;
                                        const deltaTime = Date.now() - startTime;
                                        const velocity = deltaY / deltaTime;
                                        const panel = (e.currentTarget as HTMLElement).closest('.mobile-panel-slide-up');
                                        
                                        if (panel) {
                                          (panel as HTMLElement).style.transition = 'transform 0.3s ease-out';
                                          
                                          if (deltaY > 50 || velocity > 0.3) {
                                            // Marquer qu'on ferme manuellement le panneau
                                            isManuallyClosingRef.current = true;
                                            // Nettoyer le timeout précédent
                                            if (manualCloseTimeoutRef.current) {
                                              clearTimeout(manualCloseTimeoutRef.current);
                                            }
                                            // Désélectionner le texte AVANT de fermer le panneau pour éviter qu'il se rouvre
                                            if (selectedTextId) {
                                              setSelectedTextId(null);
                                            }
                                            // Désélectionner le logo AVANT de fermer le panneau
                                            if (selectedLogoId) {
                                              setSelectedLogoId(null);
                                            }
                                            (panel as HTMLElement).style.transform = 'translateY(100%)';
                                            setTimeout(() => {
                                              setMobileActivePanel(null);
                                              setSelectedColorClass(null);
                                              // Réinitialiser le flag après un délai
                                              manualCloseTimeoutRef.current = setTimeout(() => {
                                                isManuallyClosingRef.current = false;
                                              }, 500);
                                            }, 300);
                                          } else {
                                            (panel as HTMLElement).style.transform = 'translateY(0)';
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    <div style={{ width: '32px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px' }} />
                                  </div>
                                  {/* Titre et bouton fermer */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
                                    {/* Si bibliothèque de logos ouverte, afficher bouton Retour */}
                                    {activeModule.contentType === 'logos' && showLogoLibrary ? (
                                      <button
                                        onClick={() => {
                                          setShowLogoLibrary(false);
                                          setSelectedLogoForVariants(null);
                                          setLogoSearchQuery('');
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '0',
                                          color: '#111827'
                                        }}
                                      >
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span style={{ fontWeight: '600', fontSize: '15px', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                          Retour
                                        </span>
                                      </button>
                                    ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '28px', height: '28px', backgroundColor: '#111827', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {activeModule.iconUrl ? (
                                          <img src={activeModule.iconUrl} alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                                        ) : (
                                          <span style={{ fontSize: '14px' }}>{activeModule.icon || '🎨'}</span>
                                        )}
                                      </div>
                                        <span style={{ fontWeight: '600', fontSize: '15px', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                        {activeModule.tabName || 'Module'}
                                      </span>
                                    </div>
                                    )}
                                    <button 
                                      onClick={() => { 
                                        // Marquer qu'on ferme manuellement le panneau IMMÉDIATEMENT
                                        isManuallyClosingRef.current = true;
                                        // Nettoyer le timeout précédent
                                        if (manualCloseTimeoutRef.current) {
                                          clearTimeout(manualCloseTimeoutRef.current);
                                        }
                                        // Stocker les IDs avant désélection pour empêcher la réouverture
                                        if (selectedTextId) {
                                          manuallyDeselectedTextIdRef.current = selectedTextId;
                                          setSelectedTextId(null);
                                        }
                                        if (selectedLogoId) {
                                          manuallyDeselectedLogoIdRef.current = selectedLogoId;
                                          setSelectedLogoId(null);
                                        }
                                        setMobileActivePanel(null); 
                                        setSelectedColorClass(null);
                                        // Garder le flag actif plus longtemps pour éviter la réouverture
                                        manualCloseTimeoutRef.current = setTimeout(() => {
                                          isManuallyClosingRef.current = false;
                                          manuallyDeselectedTextIdRef.current = null;
                                          manuallyDeselectedLogoIdRef.current = null;
                                        }, 1000);
                                      }} 
                                      className="mobile-panel-close-btn"
                                      style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        borderRadius: '6px',
                                        color: '#111827'
                                      }}
                                    >
                                      <span style={{ 
                                        fontSize: '20px', 
                                        lineHeight: '1', 
                                        color: '#111827',
                                        fontWeight: 'bold'
                                      }}>×</span>
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Contenu du panneau */}
                                <div className="mobile-content-fade" style={{ flex: 1, overflow: 'auto', padding: '16px', color: '#111827' }}>
                                  <style>{`
                                    .mobile-content-fade,
                                    .mobile-content-fade * {
                                      color: #111827 !important;
                                    }
                                    .mobile-content-fade p,
                                    .mobile-content-fade span,
                                    .mobile-content-fade div:not([style*="background"]):not([style*="backgroundColor"]),
                                    .mobile-content-fade h1,
                                    .mobile-content-fade h2,
                                    .mobile-content-fade h3,
                                    .mobile-content-fade h4,
                                    .mobile-content-fade h5,
                                    .mobile-content-fade h6,
                                    .mobile-content-fade label,
                                    .mobile-content-fade button:not([style*="backgroundColor: '#000"]):not([style*="backgroundColor:'#000"]):not([style*="backgroundColor: '#000000"]):not([style*="backgroundColor:'#000000"]):not([style*="backgroundColor: black"]):not([style*="backgroundColor:black"]):not([style*="color: #fff"]):not([style*="color:#fff"]):not([style*="color: '#fff'"]):not([style*="color:'#fff'"]):not([style*="color: '#ffffff'"]):not([style*="color:'#ffffff'"]):not([style*="color: white"]):not([style*="color:white"]) {
                                      color: #111827 !important;
                                    }
                                    .mobile-content-fade input,
                                    .mobile-content-fade textarea,
                                    .mobile-content-fade select {
                                      color: #111827 !important;
                                    }
                                    .mobile-content-fade button[style*="backgroundColor: '#000"],
                                    .mobile-content-fade button[style*="backgroundColor:'#000"],
                                    .mobile-content-fade button[style*="backgroundColor: '#000000"],
                                    .mobile-content-fade button[style*="backgroundColor:'#000000"],
                                    .mobile-content-fade button[style*="backgroundColor: black"],
                                    .mobile-content-fade button[style*="backgroundColor:black"],
                                    .mobile-content-fade button[style*="color: #fff"],
                                    .mobile-content-fade button[style*="color:#fff"],
                                    .mobile-content-fade button[style*="color: '#fff'"],
                                    .mobile-content-fade button[style*="color:'#fff'"],
                                    .mobile-content-fade button[style*="color: '#ffffff'"],
                                    .mobile-content-fade button[style*="color:'#ffffff'"],
                                    .mobile-content-fade button[style*="color: white"],
                                    .mobile-content-fade button[style*="color:white"],
                                    .mobile-content-fade button.mobile-action-btn[style*="backgroundColor: '#000"],
                                    .mobile-content-fade button.mobile-action-btn[style*="backgroundColor:'#000"],
                                    .mobile-content-fade button.mobile-action-btn[style*="backgroundColor: '#000000"],
                                    .mobile-content-fade button.mobile-action-btn[style*="backgroundColor:'#000000"] {
                                      color: #ffffff !important;
                                    }
                                  `}</style>
                                  {renderMobileModuleContent()}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Modal d'importation de logo - Version MOBILE */}
                          {viewportMode === 'mobile' && showImportModal && !showLogoZoneModal && !showBackgroundRemoverModal && (() => {
                            const activeModule = customizationModules.find(m => m.id === activeCustomizerTab) || customizationModules.find(m => m.id === mobileActivePanel);
                            if (!activeModule || activeModule.contentType !== 'logos') {
                              return null;
                            }
                            
                            const defaultTypes = ['svg', 'png', 'jpg', 'jpeg', 'eps', 'ai', 'pdf', 'heic'];
                            const allowedTypes = activeModule.allowedLogoFileTypes || defaultTypes;
                            const acceptTypes = allowedTypes.map(t => `.${t}`).join(',');
                            
                            return (
                              <div
                                className="configurator-panel-modal-overlay"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10000
                                }}
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setShowImportModal(false);
                                    setImportedFile(null);
                                    setImportedFilePreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }
                                }}
                              >
                                <div
                                  className="configurator-panel-modal"
                                  style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    width: '90%',
                                    maxWidth: '400px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Titre */}
                                  <h2
                                    style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#111827',
                                      margin: 0,
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}
                                  >
                                    Importer un logo
                                  </h2>
                                  
                                  {/* Info types de fichiers */}
                                  <div>
                                    <p
                                      style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        margin: '0 0 4px 0',
                                        fontFamily: CONFIGURATOR_PANEL_FONT
                                      }}
                                    >
                                      Fichier
                                    </p>
                                    <p
                                      style={{
                                        fontSize: '11px',
                                        color: '#9ca3af',
                                        margin: 0,
                                        fontFamily: CONFIGURATOR_PANEL_FONT
                                      }}
                                    >
                                      Types autorisés: {allowedTypes.map(t => t.toUpperCase()).join(', ')}
                                    </p>
                                  </div>
                                  
                                  {/* Input fichier */}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={acceptTypes}
                                    onChange={handleFileSelect}
                                    style={{
                                      width: '100%',
                                      padding: '10px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      backgroundColor: '#ffffff',
                                      color: '#111827'
                                    }}
                                  />
                                  
                                  {/* Aperçu si fichier sélectionné */}
                                  {importedFilePreview && (
                                    <div
                                      style={{
                                        width: '100%',
                                        maxHeight: '200px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '12px',
                                        backgroundColor: '#f9fafb'
                                      }}
                                    >
                                      <img
                                        src={importedFilePreview}
                                        alt="Aperçu"
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '180px',
                                          objectFit: 'contain'
                                        }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Boutons */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '12px',
                                      width: '100%'
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setShowImportModal(false);
                                        setImportedFile(null);
                                        setImportedFilePreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                      }}
                                      className="btn-secondary"
                                      style={{
                                        flex: 1,
                                        padding: '10px 20px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        color: '#111827',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Vérifier à la fois importedFile ET importedFilePreview car FileReader est asynchrone
                                        if (!importedFile || !importedFilePreview || isProcessingBackground) {
                                          console.log('❌ Import impossible:', { 
                                            hasFile: !!importedFile, 
                                            hasPreview: !!importedFilePreview, 
                                            isProcessing: isProcessingBackground 
                                          });
                                          return;
                                        }
                                        handleImportLogo();
                                      }}
                                      disabled={!importedFile || !importedFilePreview || isProcessingBackground}
                                      className="btn-primary"
                                      style={{
                                        flex: 1,
                                        padding: '10px 20px',
                                        backgroundColor: importedFile && importedFilePreview && !isProcessingBackground ? '#6b7280' : '#d1d5db',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        color: '#ffffff',
                                        cursor: importedFile && importedFilePreview && !isProcessingBackground ? 'pointer' : 'not-allowed',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        touchAction: 'manipulation'
                                      }}
                                    >
                                      {isProcessingBackground ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          <span>Traitement...</span>
                                        </>
                                      ) : (
                                        'Importer'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Modal de background remover - Version MOBILE */}
                          {viewportMode === 'mobile' && showBackgroundRemoverModal && (backgroundRemoverPreview || isProcessingBackground) && (
                              <div
                                className="configurator-panel-modal-overlay"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10001,
                                  padding: '12px',
                                  boxSizing: 'border-box'
                                }}
                              onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                  setShowBackgroundRemoverModal(false);
                                }
                              }}
                            >
                              <div
                                className="configurator-panel-modal"
                                style={{
                                  backgroundColor: '#ffffff',
                                  borderRadius: '12px',
                                  padding: '14px',
                                  width: '100%',
                                  maxWidth: 'calc(100% - 24px)',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  maxHeight: 'calc(100% - 24px)',
                                  overflow: 'auto',
                                  boxSizing: 'border-box'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Titre */}
                                <h2
                                  style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    margin: 0,
                                    fontFamily: CONFIGURATOR_PANEL_FONT
                                  }}
                                >
                                  Supprimer le fond ?
                                </h2>
                                
                                {/* Aperçus côte à côte */}
                                {backgroundRemoverPreview && (
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  {/* Aperçu original */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}
                                  >
                                    <p
                                      className="background-remover-label"
                                      style={{
                                        fontSize: '12px',
                                        color: '#111827',
                                        margin: 0,
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        WebkitTextFillColor: '#111827',
                                        WebkitTextStrokeColor: '#111827'
                                      } as React.CSSProperties}
                                    >
                                      Original
                                    </p>
                                    <div
                                      style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        backgroundColor: '#f9fafb'
                                      }}
                                    >
                                      <img
                                        src={backgroundRemoverPreview.original}
                                        alt="Original"
                                        style={{
                                          maxWidth: '100%',
                                          maxHeight: '100%',
                                          objectFit: 'contain'
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Aperçu traité */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px'
                                    }}
                                  >
                                    <p
                                      className="background-remover-label"
                                      style={{
                                        fontSize: '12px',
                                        color: '#111827',
                                        margin: 0,
                                        fontFamily: CONFIGURATOR_PANEL_FONT,
                                        textAlign: 'center',
                                        fontWeight: '500',
                                        WebkitTextFillColor: '#111827',
                                        WebkitTextStrokeColor: '#111827'
                                      } as React.CSSProperties}
                                    >
                                      Sans fond
                                    </p>
                                    <div
                                      style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        backgroundColor: '#f9fafb',
                                        backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                        backgroundSize: '12px 12px',
                                        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                                      }}
                                    >
                                      {isProcessingBackground ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                          <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT }}>Traitement...</span>
                                        </div>
                                      ) : (
                                        <img
                                          src={backgroundRemoverPreview.processed}
                                          alt="Sans fond"
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                )}
                                
                                {/* Boutons */}
                                {backgroundRemoverPreview && !isProcessingBackground && (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    width: '100%'
                                  }}
                                >
                                  <button
                                    onClick={() => handleBackgroundRemoverChoice(false)}
                                    className="btn-secondary"
                                    disabled={isProcessingBackground}
                                    style={{
                                      flex: 1,
                                      padding: '10px 20px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      color: '#111827',
                                      cursor: isProcessingBackground ? 'not-allowed' : 'pointer',
                                      fontWeight: '500',
                                      transition: 'all 0.2s ease',
                                      opacity: isProcessingBackground ? 0.5 : 1
                                    }}
                                  >
                                    Non
                                  </button>
                                  <button
                                    onClick={() => handleBackgroundRemoverChoice(true)}
                                    className="btn-primary"
                                    disabled={isProcessingBackground}
                                    style={{
                                      flex: 1,
                                      padding: '10px 20px',
                                      backgroundColor: '#6b7280',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      color: '#ffffff',
                                      cursor: isProcessingBackground ? 'not-allowed' : 'pointer',
                                      fontWeight: '500',
                                      transition: 'all 0.2s ease',
                                      opacity: isProcessingBackground ? 0.5 : 1
                                    }}
                                  >
                                    Oui
                                  </button>
                                </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Modal de confirmation de suppression - Version MOBILE (dans la simulation) */}
                          {viewportMode === 'mobile' && showDeleteModal && itemToDelete && (
                            <div
                              className="configurator-panel-modal-overlay"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10000
                              }}
                              onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                  setShowDeleteModal(false);
                                  setItemToDelete(null);
                                }
                              }}
                            >
                              <div
                                className="configurator-panel-modal"
                                style={{
                                  backgroundColor: '#ffffff',
                                  borderRadius: '12px',
                                  padding: '32px',
                                  width: '90%',
                                  maxWidth: '400px',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '24px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Icône de poubelle */}
                                <div
                                  style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fee2e2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px'
                                  }}
                                >
                                  🗑️
                                </div>
                                
                                {/* Titre */}
                                <h2
                                  style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#000000',
                                    margin: 0,
                                    textAlign: 'center'
                                  }}
                                >
                                  Supprimer l'élément ?
                                </h2>
                                
                                {/* Message */}
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    textAlign: 'center'
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: '14px',
                                      color: '#666666',
                                      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                                      margin: 0
                                    }}
                                  >
                                    Êtes-vous sûr de vouloir supprimer {itemToDelete.type === 'logo' ? 'le logo' : 'le texte'} "{itemToDelete.name}" ?
                                  </p>
                                  <p
                                    style={{
                                      fontSize: '14px',
                                      color: '#666666',
                                      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                                      margin: 0
                                    }}
                                  >
                                    Cette action ne peut pas être annulée.
                                  </p>
                                </div>
                                
                                {/* Boutons */}
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    width: '100%'
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setShowDeleteModal(false);
                                      setItemToDelete(null);
                                    }}
                                    className="btn-primary"
                                    style={{
                                      flex: 1,
                                      padding: '10px 20px',
                                      backgroundColor: '#3b82f6',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#2563eb';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#3b82f6';
                                    }}
                                  >
                                    Non
                                  </button>
                                  <button
                                    onClick={handleConfirmDelete}
                                    className="btn-primary"
                                    style={{
                                      flex: 1,
                                      padding: '10px 20px',
                                      backgroundColor: '#ef4444',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      fontFamily: CONFIGURATOR_PANEL_FONT,
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#dc2626';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#ef4444';
                                    }}
                                  >
                                    Oui
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Barre mobile en bas du téléphone - Style stretchmx */}
                          {viewportMode === 'mobile' && (
                            <div style={{ flexShrink: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', color: '#111827' }}>
                              <style>{`
                                [style*="backgroundColor: '#ffffff'"] [style*="flexShrink: 0"] *,
                                [style*="backgroundColor: '#ffffff'"] [style*="flexShrink: 0"] span {
                                  color: #111827 !important;
                                }
                              `}</style>
                              {/* Onglets des modules */}
                              <div style={{ display: 'flex', padding: '8px 4px', gap: '2px', color: '#111827' }}>
                                <style>{`
                                  .mobile-tab-btn,
                                  .mobile-tab-btn span {
                                    color: inherit !important;
                                  }
                                  .mobile-tab-btn[style*="color"] span {
                                    color: inherit !important;
                                  }
                                `}</style>
                                {customizationModules.length > 0 ? (
                                  customizationModules.map((module) => {
                                    const isActive = mobileActivePanel === module.id;
                                    return (
                                      <button
                                        key={module.id}
                                        className="mobile-tab-btn"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Ne pas réinitialiser la caméra quand on change d'onglet mobile
                                          const newPanel = isActive ? null : module.id;
                                          
                                          // Marquer qu'une vue a été définie pour empêcher CameraInitializer de réinitialiser
                                          viewHasBeenSetRef.current = true;
                                          
                                          // Marquer qu'on ouvre manuellement le panneau AVANT de changer l'état
                                          isManuallyOpeningRef.current = true;
                                          // Réinitialiser le flag de fermeture manuelle
                                          isManuallyClosingRef.current = false;
                                          
                                          // Réinitialiser les états des logos si on change d'onglet
                                          if (module.contentType === 'logos') {
                                            setLogoSearchQuery('');
                                            setSelectedLogoForVariants(null);
                                            setShowLogoLibrary(false);
                                            setSelectedLogoId(null); // Désélectionner le logo
                                            setLogoToReplace(null); // Réinitialiser le mode remplacement
                                          }
                                          
                                          // Si on ferme le panneau (clic sur l'onglet actif), désélectionner le logo
                                          if (isActive) {
                                            setSelectedLogoId(null);
                                            setLogoToReplace(null);
                                          }
                                          
                                          // Changer l'état du panneau
                                          setMobileActivePanel(newPanel);
                                          
                                          // Réinitialiser le flag d'ouverture manuelle après un délai plus long
                                          // pour s'assurer que tous les useEffect ont fini de s'exécuter
                                          setTimeout(() => {
                                            isManuallyOpeningRef.current = false;
                                          }, 500);
                                        }}
                                        style={{
                                          flex: 1,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '8px 4px',
                                          borderRadius: '8px',
                                          backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: isActive ? '#111827' : '#6b7280'
                                        }}
                                      >
                                        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                          {module.iconUrl ? (
                                            <img src={module.iconUrl} alt={module.tabName} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                                          ) : (
                                            <span style={{ fontSize: '18px' }}>{module.icon || '🎨'}</span>
                                          )}
                                        </div>
                                        <span style={{ fontSize: '10px', color: isActive ? '#111827' : '#6b7280', fontWeight: isActive ? '600' : '400', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                                          {module.tabName || 'Module'}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <>
                                    {['Design', 'Couleur', 'Texte', 'Logo'].map((name, i) => (
                                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', color: '#111827' }}>
                                        <span style={{ fontSize: '18px', marginBottom: '4px' }}>{['🎨', '🎨', '✏️', '🖼️'][i]}</span>
                                        <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT }}>{name}</span>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                              {/* Barre d'actions - Toujours réserver l'espace pour éviter le redimensionnement du Canvas */}
                              <div style={{ display: 'flex', padding: '8px 12px 12px', gap: '8px', visibility: mobileActivePanel ? 'hidden' : 'visible', height: mobileActivePanel ? 'auto' : 'auto', minHeight: '60px' }}>
                                <button className="mobile-action-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', fontWeight: '500', color: '#374151', cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', transition: 'all 0.2s ease' }}>
                                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                  Sauvegarder
                                </button>
                                <button className="btn-primary mobile-action-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', color: '#ffffff', cursor: 'pointer', fontFamily: CONFIGURATOR_PANEL_FONT, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease' }}>
                                  <svg width="14" height="14" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="#ffffff" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                  <span style={{ color: '#ffffff' }}>Ajouter au panier</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  <div style={{
                    width: '400px',
                    height: '400px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      color: '#999'
                    }}>
                      🎩
                    </div>
                  </div>
                  <p style={{
                    color: '#999',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}>
                    Sélectionnez un modèle 3D dans "Behind the scene"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Module/Question Settings - visible même en mode mobile */}
          {showQuestionSettings && selectedModule ? (
            <div style={{
              width: '420px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                marginBottom: '24px'
              }}>
                Module settings
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Nom de l'onglet
                </label>
                <input
                  type="text"
                  value={selectedModule.tabName}
                  onChange={(e) => {
                    const updated = { ...selectedModule, tabName: e.target.value };
                    setSelectedModule(updated);
                    setCustomizationModules(customizationModules.map(m => 
                      m.id === selectedModule.id ? updated : m
                    ));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Icon Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Icône
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  {selectedModule.iconUrl ? (
                    <img
                      src={selectedModule.iconUrl}
                      alt={selectedModule.tabName}
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        backgroundColor: '#1a1a1a',
                        padding: '4px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      padding: '4px'
                    }}>
                      {selectedModule.icon}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".svg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && selectedModule) {
                        setSelectedModuleIconFile(file);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('folder', 'module-icons');

                          const res = await fetch('/api/upload-icon', {
                            method: 'POST',
                            body: formData,
                          });

                          if (res.ok) {
                            const data = await res.json();
                            const updated = { 
                              ...selectedModule, 
                              iconUrl: data.url 
                            };
                            setSelectedModule(updated);
                            setCustomizationModules(customizationModules.map(m => 
                              m.id === selectedModule.id ? updated : m
                            ));
                            setSelectedModuleIconFile(null);
                          } else {
                            console.error('Error uploading icon');
                            alert('Erreur lors de l\'upload de l\'icône');
                          }
                        } catch (error) {
                          console.error('Error uploading icon:', error);
                          alert('Erreur lors de l\'upload de l\'icône');
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Ou entrez un emoji/texte"
                  value={selectedModule.icon}
                  onChange={(e) => {
                    const updated = { 
                      ...selectedModule, 
                      icon: e.target.value,
                      iconUrl: undefined // Supprimer l'URL si on utilise un emoji/texte
                    };
                    setSelectedModule(updated);
                    setCustomizationModules(customizationModules.map(m => 
                      m.id === selectedModule.id ? updated : m
                    ));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Content Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Type de contenu à afficher
                </label>
                <select
                  value={selectedModule.contentType || ''}
                  onChange={(e) => {
                    const updated = { 
                      ...selectedModule, 
                      contentType: e.target.value as CustomizationModule['contentType'] || null,
                      selectedItems: {} // Reset selected items when changing content type
                    };
                    setSelectedModule(updated);
                    setCustomizationModules(customizationModules.map(m => 
                      m.id === selectedModule.id ? updated : m
                    ));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Aucun</option>
                  <option value="colors">Couleurs</option>
                  <option value="logos">Logos</option>
                  <option value="fonts">Fonts</option>
                  <option value="designs-2d">Designs 2D</option>
                  <option value="sizes">Tailles</option>
                  <option value="text">Texte</option>
                </select>
              </div>

              {/* Content Selection based on contentType */}
              {selectedModule.contentType === 'colors' && (() => {
                // Détecter les classes de couleurs disponibles
                const ordinalColors = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary', 'senary', 'septenary', 'octonary', 'nonary', 'denary'];
                let availableColorClasses: string[] = [];
                let designIdToUse: string | null = null;
                
                // Trouver le design 2D sélectionné
                const designModule = customizationModules.find(m => 
                  m.contentType === 'designs-2d' && m.selectedItems?.design2DId
                );
                if (designModule?.selectedItems?.design2DId) {
                  designIdToUse = designModule.selectedItems.design2DId;
                }
                if (!designIdToUse) {
                  designIdToUse = selectedDesign2DId;
                }
                
                const selectedDesign = designs2D.find(d => d.id === designIdToUse);
                if (selectedDesign?.color_mappings) {
                  availableColorClasses = Object.keys(selectedDesign.color_mappings);
                } else {
                  availableColorClasses = ['primary', 'secondary', 'tertiary'];
                }
                
                availableColorClasses = availableColorClasses.filter(c => ordinalColors.includes(c.toLowerCase()));
                if (availableColorClasses.length === 0) {
                  availableColorClasses = ['primary', 'secondary', 'tertiary'];
                }
                
                return (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Palette de couleurs
                      </label>
                      <select
                        value={selectedModule.selectedItems?.colorPaletteId || ''}
                        onChange={(e) => {
                          const updated = { 
                            ...selectedModule, 
                            selectedItems: {
                              ...selectedModule.selectedItems,
                              colorPaletteId: e.target.value || undefined
                            }
                          };
                          setSelectedModule(updated);
                          setCustomizationModules(customizationModules.map(m => 
                            m.id === selectedModule.id ? updated : m
                          ));
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="">Sélectionner une palette</option>
                        {colorPalettes.map((palette) => (
                          <option key={palette.id} value={palette.id}>
                            {palette.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '12px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Noms des classes de couleurs
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {availableColorClasses.map((colorClass) => (
                          <div key={colorClass}>
                            <label style={{
                              display: 'block',
                              fontSize: '11px',
                              color: '#888',
                              marginBottom: '4px',
                              fontFamily: CONFIGURATOR_PANEL_FONT,
                              textTransform: 'capitalize'
                            }}>
                              {colorClass}
                            </label>
                            <input
                              type="text"
                              value={selectedModule.colorClassLabels?.[colorClass] || ''}
                              placeholder={colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedModule,
                                  colorClassLabels: {
                                    ...(selectedModule.colorClassLabels || {}),
                                    [colorClass]: e.target.value
                                  }
                                };
                                setSelectedModule(updated);
                                setCustomizationModules(customizationModules.map(m => 
                                  m.id === selectedModule.id ? updated : m
                                ));
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '4px',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                outline: 'none'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {selectedModule.contentType === 'logos' && (
                <>
                  {/* Mode de placement */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Mode de placement
                    </label>
                    <select
                      value={selectedModule.logoPlacementMode || 'free'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          logoPlacementMode: e.target.value as 'zones' | 'free'
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="free">Placement libre</option>
                      <option value="zones">Placement par zones</option>
                    </select>
                  </div>

                  {/* Groupes de zones (si mode zones) */}
                  {selectedModule.logoPlacementMode === 'zones' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Groupes de zones
                      </label>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor: '#1a1a1a'
                      }}>
                        {zoneGroups.length === 0 ? (
                          <div style={{ color: '#666', fontSize: '12px', padding: '8px' }}>
                            Aucun groupe de zones disponible
                          </div>
                        ) : (
                          zoneGroups.map((group) => (
                            <label
                              key={group.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                marginBottom: '4px',
                                backgroundColor: (selectedModule.logoZoneGroupIds || []).includes(group.id) ? '#2a2a2a' : 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={(selectedModule.logoZoneGroupIds || []).includes(group.id)}
                                onChange={(e) => {
                                  const currentIds = selectedModule.logoZoneGroupIds || [];
                                  const updatedIds = e.target.checked
                                    ? [...currentIds, group.id]
                                    : currentIds.filter(id => id !== group.id);
                                  const updated = { 
                                    ...selectedModule, 
                                    logoZoneGroupIds: updatedIds.length > 0 ? updatedIds : undefined
                                  };
                                  setSelectedModule(updated);
                                  setCustomizationModules(customizationModules.map(m => 
                                    m.id === selectedModule.id ? updated : m
                                  ));
                                }}
                                style={{
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ color: '#ffffff', fontSize: '14px' }}>{group.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Texte du bouton "Ajouter un logo" */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Texte du bouton "Ajouter un logo"
                    </label>
                    <input
                      type="text"
                      value={selectedModule.addLogoButtonLabel || 'Ajouter un logo'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          addLogoButtonLabel: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      placeholder="Ajouter un logo"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Types de fichiers autorisés pour l'importation */}
                  {selectedModule.contentType === 'logos' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Types de fichiers autorisés
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['svg', 'png', 'jpg', 'jpeg', 'eps', 'ai', 'pdf', 'heic'].map((fileType) => {
                          const defaultTypes = ['svg', 'png', 'jpg', 'jpeg', 'eps', 'ai', 'pdf', 'heic'];
                          const allowedTypes = selectedModule.allowedLogoFileTypes || defaultTypes;
                          const isChecked = allowedTypes.includes(fileType);
                          return (
                            <label
                              key={fileType}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#ffffff',
                                fontFamily: CONFIGURATOR_PANEL_FONT
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentTypes = selectedModule.allowedLogoFileTypes || defaultTypes;
                                  const newTypes = e.target.checked
                                    ? [...currentTypes, fileType]
                                    : currentTypes.filter(t => t !== fileType);
                                  
                                  // S'assurer qu'au moins un type est sélectionné
                                  if (newTypes.length === 0) return;
                                  
                                  const updated = {
                                    ...selectedModule,
                                    allowedLogoFileTypes: newTypes.length === defaultTypes.length ? undefined : newTypes
                                  };
                                  setSelectedModule(updated);
                                  setCustomizationModules(customizationModules.map(m =>
                                    m.id === selectedModule.id ? updated : m
                                  ));
                                }}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  cursor: 'pointer'
                                }}
                              />
                              {fileType.toUpperCase()}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Option Background Remover */}
                  {selectedModule.contentType === 'logos' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ffffff',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedModule.enableBackgroundRemover || false}
                          onChange={(e) => {
                            const updated = {
                              ...selectedModule,
                              enableBackgroundRemover: e.target.checked || undefined
                            };
                            setSelectedModule(updated);
                            setCustomizationModules(customizationModules.map(m =>
                              m.id === selectedModule.id ? updated : m
                            ));
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        Background remover
                      </label>
                    </div>
                  )}
                  
                  {/* Texte du bouton "Importer un logo" */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Texte du bouton "Importer un logo"
                    </label>
                    <input
                      type="text"
                      value={selectedModule.importLogoButtonLabel || 'Importer un logo'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          importLogoButtonLabel: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      placeholder="Importer un logo"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Texte de l'en-tête "Logos placés" */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Texte de l'en-tête "Logos placés"
                    </label>
                    <input
                      type="text"
                      value={selectedModule.placedLogosLabel || 'Logos placés'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          placedLogosLabel: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      placeholder="Logos placés"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Vues de caméra personnalisées (depuis modèle 3D) */}
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: '#8eff36',
                      marginBottom: '12px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      fontWeight: '600'
                    }}>
                      📷 Vues de caméra personnalisées
                    </label>
                    
                    <p style={{
                      fontSize: '11px',
                      color: '#a0a0a0',
                      marginBottom: '16px',
                      lineHeight: '1.5',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Sélectionnez les vues créées dans le modèle 3D et associez-les à des labels pour les afficher dans le builder client.
                    </p>

                    {(() => {
                      const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                      const availableViews = selectedModel?.cameraViews || [];
                      const moduleViewLabels = selectedModule.viewLabels || [];
                      
                      return (
                        <>
                          {availableViews.length === 0 ? (
                            <div style={{
                              padding: '12px',
                              backgroundColor: '#0a0a0a',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#666',
                              textAlign: 'center',
                              fontFamily: CONFIGURATOR_PANEL_FONT
                            }}>
                              Aucune vue disponible. Créez des vues dans le modèle 3D.
                            </div>
                          ) : (
                            <>
                              {/* Liste des labels de vues */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '8px'
                                }}>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#ffffff',
                                    fontWeight: '500',
                                    fontFamily: CONFIGURATOR_PANEL_FONT
                                  }}>
                                    Labels configurés ({moduleViewLabels.length})
                                  </span>
                                  <button
                                    onClick={() => {
                                      const newLabel = {
                                        id: `label-${Date.now()}`,
                                        label: 'Nouvelle vue',
                                        cameraViewId: undefined
                                      };
                                      const updated = {
                                        ...selectedModule,
                                        viewLabels: [...moduleViewLabels, newLabel]
                                      };
                                      setSelectedModule(updated);
                                      setCustomizationModules(customizationModules.map(m => 
                                        m.id === selectedModule.id ? updated : m
                                      ));
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#8eff36',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: '#000000',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      fontFamily: CONFIGURATOR_PANEL_FONT
                                    }}
                                  >
                                    + Ajouter un label
                                  </button>
                                </div>

                                {moduleViewLabels.length === 0 ? (
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#0a0a0a',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#666',
                                    textAlign: 'center',
                                    fontFamily: CONFIGURATOR_PANEL_FONT,
                                    fontStyle: 'italic'
                                  }}>
                                    Aucun label configuré
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {moduleViewLabels.map((viewLabel, index) => (
                                      <div key={viewLabel.id} style={{
                                        padding: '12px',
                                        backgroundColor: '#0a0a0a',
                                        borderRadius: '4px',
                                        border: '1px solid #2a2a2a'
                                      }}>
                                        <div style={{
                                          display: 'flex',
                                          gap: '8px',
                                          marginBottom: '8px',
                                          alignItems: 'center'
                                        }}>
                                          <input
                                            type="text"
                                            value={viewLabel.label}
                                            onChange={(e) => {
                                              const updated = {
                                                ...selectedModule,
                                                viewLabels: moduleViewLabels.map((vl, i) =>
                                                  i === index ? { ...vl, label: e.target.value } : vl
                                                )
                                              };
                                              setSelectedModule(updated);
                                              setCustomizationModules(customizationModules.map(m => 
                                                m.id === selectedModule.id ? updated : m
                                              ));
                                            }}
                                            placeholder="Nom du label (ex: Torse, Dos...)"
                                            style={{
                                              flex: 1,
                                              padding: '6px 10px',
                                              backgroundColor: '#1a1a1a',
                                              border: '1px solid #2a2a2a',
                                              borderRadius: '4px',
                                              color: '#ffffff',
                                              fontSize: '12px',
                                              fontFamily: CONFIGURATOR_PANEL_FONT,
                                              outline: 'none'
                                            }}
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = {
                                                ...selectedModule,
                                                viewLabels: moduleViewLabels.filter((_, i) => i !== index)
                                              };
                                              setSelectedModule(updated);
                                              setCustomizationModules(customizationModules.map(m => 
                                                m.id === selectedModule.id ? updated : m
                                              ));
                                            }}
                                            style={{
                                              padding: '6px 10px',
                                              backgroundColor: 'transparent',
                                              border: '1px solid #ef4444',
                                              borderRadius: '4px',
                                              color: '#ef4444',
                                              fontSize: '11px',
                                              cursor: 'pointer',
                                              fontFamily: CONFIGURATOR_PANEL_FONT
                                            }}
                                            title="Supprimer"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                        <select
                                          value={viewLabel.cameraViewId || ''}
                                          onChange={(e) => {
                                            const updated = {
                                              ...selectedModule,
                                              viewLabels: moduleViewLabels.map((vl, i) =>
                                                i === index ? { ...vl, cameraViewId: e.target.value || undefined } : vl
                                              )
                                            };
                                            setSelectedModule(updated);
                                            setCustomizationModules(customizationModules.map(m => 
                                              m.id === selectedModule.id ? updated : m
                                            ));
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '6px 10px',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '4px',
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontFamily: CONFIGURATOR_PANEL_FONT,
                                            cursor: 'pointer',
                                            outline: 'none'
                                          }}
                                        >
                                          <option value="">Sélectionner une vue</option>
                                          {availableViews.map((view) => (
                                            <option key={view.id} value={view.id}>
                                              {view.name}
                                            </option>
                                          ))}
                                        </select>
                                        {viewLabel.cameraViewId && (
                                          <div style={{
                                            marginTop: '6px',
                                            fontSize: '10px',
                                            color: '#8eff36',
                                            fontFamily: CONFIGURATOR_PANEL_FONT
                                          }}>
                                            ✓ Vue associée
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Liste des vues disponibles (pour info) */}
                              <div style={{
                                padding: '12px',
                                backgroundColor: '#0a0a0a',
                                borderRadius: '4px',
                                border: '1px solid #2a2a2a'
                              }}>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#a0a0a0',
                                  marginBottom: '8px',
                                  fontFamily: CONFIGURATOR_PANEL_FONT,
                                  fontWeight: '500'
                                }}>
                                  Vues disponibles du modèle 3D:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {availableViews.map((view) => (
                                    <span
                                      key={view.id}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        color: '#ffffff',
                                        fontFamily: CONFIGURATOR_PANEL_FONT
                                      }}
                                    >
                                      👁️ {view.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Bibliothèques de logos */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Bibliothèques de logos
                    </label>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      padding: '8px',
                      backgroundColor: '#1a1a1a'
                    }}>
                      {logoLibraries.length === 0 ? (
                        <div style={{ color: '#666', fontSize: '12px', padding: '8px' }}>
                          Aucune bibliothèque disponible
                        </div>
                      ) : (
                        logoLibraries.map((library) => (
                          <label
                            key={library.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              marginBottom: '4px',
                              backgroundColor: (selectedModule.selectedItems?.logoLibraryIds || []).includes(library.id) ? '#2a2a2a' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={(selectedModule.selectedItems?.logoLibraryIds || []).includes(library.id)}
                              onChange={(e) => {
                                const currentIds = selectedModule.selectedItems?.logoLibraryIds || [];
                                const updatedIds = e.target.checked
                                  ? [...currentIds, library.id]
                                  : currentIds.filter(id => id !== library.id);
                                const updated = { 
                                  ...selectedModule, 
                                  selectedItems: {
                                    ...selectedModule.selectedItems,
                                    logoLibraryIds: updatedIds.length > 0 ? updatedIds : undefined
                                  }
                                };
                                setSelectedModule(updated);
                                setCustomizationModules(customizationModules.map(m => 
                                  m.id === selectedModule.id ? updated : m
                                ));
                              }}
                              style={{
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{ color: '#ffffff', fontSize: '14px' }}>{library.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedModule.contentType === 'fonts' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}>
                    Groupe de fonts
                  </label>
                  <select
                    value={selectedModule.selectedItems?.fontGroupId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          fontGroupId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {fontGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'designs-2d' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}>
                    Designs 2D à proposer dans ce bloc
                  </label>
                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    border: '1px solid #2a2a2a',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {designs2D.length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#a0a0a0', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                        Aucun design 2D disponible.
                      </span>
                    ) : (
                      designs2D.map((design) => {
                        const checked = selectedModule.selectedItems?.design2DIds?.includes(design.id) ?? false;
                        return (
                          <label
                            key={design.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontFamily: CONFIGURATOR_PANEL_FONT
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = selectedModule.selectedItems?.design2DIds || [];
                                const nextIds = e.target.checked
                                  ? (current.includes(design.id) ? current : [...current, design.id])
                                  : current.filter((id: string) => id !== design.id);
                                const updated = {
                                  ...selectedModule,
                                  selectedItems: {
                                    ...selectedModule.selectedItems,
                                    design2DIds: nextIds.length > 0 ? nextIds : undefined,
                                  },
                                };
                                setSelectedModule(updated);
                                setCustomizationModules(
                                  customizationModules.map((m) =>
                                    m.id === selectedModule.id ? updated : m
                                  )
                                );
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{design.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {selectedModule.contentType === 'sizes' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}>
                    Groupe de tailles
                  </label>
                  <select
                    value={selectedModule.selectedItems?.sizePatternId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          sizePatternId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {sizePatterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'text' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Mode de placement
                    </label>
                    <select
                      value={selectedModule.textPlacementMode || 'free'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          textPlacementMode: e.target.value as 'zones' | 'free',
                          zoneGroupIds: e.target.value === 'zones' ? (selectedModule.zoneGroupIds || []) : undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="free">Placement libre (cliquer sur le 3D)</option>
                      <option value="zones">Utiliser des zones prédéfinies</option>
                    </select>
                  </div>

                  {selectedModule.textPlacementMode === 'zones' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#a0a0a0',
                        marginBottom: '8px',
                        fontFamily: CONFIGURATOR_PANEL_FONT
                      }}>
                        Groupes de zones
                      </label>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor: '#1a1a1a'
                      }}>
                        {zoneGroups.length === 0 ? (
                          <p style={{ color: '#666', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                            Aucun groupe de zones disponible. Créez-en dans My Configurations → Zones.
                          </p>
                        ) : (
                          zoneGroups.map((group) => (
                            <label
                              key={group.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                fontFamily: CONFIGURATOR_PANEL_FONT,
                                fontSize: '14px',
                                color: '#ffffff'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedModule.zoneGroupIds?.includes(group.id) || false}
                                onChange={(e) => {
                                  const currentIds = selectedModule.zoneGroupIds || [];
                                  const newIds = e.target.checked
                                    ? [...currentIds, group.id]
                                    : currentIds.filter(id => id !== group.id);
                                  const updated = { 
                                    ...selectedModule, 
                                    zoneGroupIds: newIds
                                  };
                                  setSelectedModule(updated);
                                  setCustomizationModules(customizationModules.map(m => 
                                    m.id === selectedModule.id ? updated : m
                                  ));
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span>{group.name} ({group.zones.length} zone{group.zones.length > 1 ? 's' : ''})</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Texte du bouton
                    </label>
                    <input
                      type="text"
                      value={selectedModule.addTextButtonLabel || 'Ajouter un texte'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          addTextButtonLabel: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      placeholder="Ajouter un texte"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Texte de l'en-tête "Textes ajoutés" */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Texte de l'en-tête "Textes ajoutés"
                    </label>
                    <input
                      type="text"
                      value={selectedModule.placedTextsLabel || 'Textes ajoutés'}
                      onChange={(e) => {
                        const updated = { 
                          ...selectedModule, 
                          placedTextsLabel: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m => 
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      placeholder="Textes ajoutés"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '12px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Options d'édition de texte
                    </label>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      border: '1px solid #2a2a2a'
                    }}>
                      {[
                        { key: 'enableTextContent', label: 'Modifier le contenu' },
                        { key: 'enableTextFont', label: 'Changer la police' },
                        { key: 'enableTextColor', label: 'Changer la couleur' },
                        { key: 'enableTextStroke', label: 'Modifier le contour' },
                        { key: 'enableTextDeformation', label: 'Déformer le texte' }
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            fontSize: '14px',
                            color: '#ffffff'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(selectedModule[key as keyof typeof selectedModule] as boolean) || false}
                            onChange={(e) => {
                              const updated = { 
                                ...selectedModule, 
                                [key]: e.target.checked
                              };
                              setSelectedModule(updated);
                              setCustomizationModules(customizationModules.map(m => 
                                m.id === selectedModule.id ? updated : m
                              ));
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Palette couleur du texte
                    </label>
                    <select
                      value={selectedModule.textColorPaletteId || ''}
                      onChange={(e) => {
                        const updated = {
                          ...selectedModule,
                          textColorPaletteId: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m =>
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Sélectionner une palette</option>
                      {colorPalettes.map((palette) => (
                        <option key={palette.id} value={palette.id}>
                          {palette.name}
                        </option>
                      ))}
                    </select>
                    <p style={{
                      fontSize: '11px',
                      color: '#7d7d7d',
                      marginTop: '6px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Cette palette s'affichera dans l'onglet "Couleur" du texte.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Palette couleur du contour
                    </label>
                    <select
                      value={selectedModule.textStrokePaletteId || ''}
                      onChange={(e) => {
                        const updated = {
                          ...selectedModule,
                          textStrokePaletteId: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m =>
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Sélectionner une palette</option>
                      {colorPalettes.map((palette) => (
                        <option key={palette.id} value={palette.id}>
                          {palette.name}
                        </option>
                      ))}
                    </select>
                    <p style={{
                      fontSize: '11px',
                      color: '#7d7d7d',
                      marginTop: '6px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Cette palette s'affichera dans l'onglet "Contour" du texte.
                    </p>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Tailles du texte (min / max)
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="number"
                        min="1"
                        value={selectedModule.textMinFontSize ?? ''}
                        placeholder="Min (px)"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          const sanitizedValue = value !== undefined && Number.isNaN(value) ? undefined : value;
                          const updated = {
                            ...selectedModule,
                            textMinFontSize: sanitizedValue
                          };
                          setSelectedModule(updated);
                          setCustomizationModules(customizationModules.map(m =>
                            m.id === selectedModule.id ? updated : m
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={selectedModule.textMaxFontSize ?? ''}
                        placeholder="Max (px)"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          const sanitizedValue = value !== undefined && Number.isNaN(value) ? undefined : value;
                          const updated = {
                            ...selectedModule,
                            textMaxFontSize: sanitizedValue
                          };
                          setSelectedModule(updated);
                          setCustomizationModules(customizationModules.map(m =>
                            m.id === selectedModule.id ? updated : m
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: '#7d7d7d',
                      marginTop: '6px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Ces valeurs sont utilisées pour limiter le redimensionnement des textes sur le 3D.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Épaisseur du contour (min / max / valeur par défaut)
                    </label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedModule.textStrokeMinWidth ?? ''}
                        placeholder="Min (px)"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          const sanitizedValue = value !== undefined && Number.isNaN(value) ? undefined : value;
                          const updated = {
                            ...selectedModule,
                            textStrokeMinWidth: sanitizedValue
                          };
                          setSelectedModule(updated);
                          setCustomizationModules(customizationModules.map(m =>
                            m.id === selectedModule.id ? updated : m
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={selectedModule.textStrokeMaxWidth ?? ''}
                        placeholder="Max (px)"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          const sanitizedValue = value !== undefined && Number.isNaN(value) ? undefined : value;
                          const updated = {
                            ...selectedModule,
                            textStrokeMaxWidth: sanitizedValue
                          };
                          setSelectedModule(updated);
                          setCustomizationModules(customizationModules.map(m =>
                            m.id === selectedModule.id ? updated : m
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={selectedModule.textBaseStrokeWidth ?? ''}
                      placeholder="Valeur par défaut (px)"
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                        const sanitizedValue = value !== undefined && Number.isNaN(value) ? undefined : value;
                        const updated = {
                          ...selectedModule,
                          textBaseStrokeWidth: sanitizedValue
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m =>
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Couleurs par défaut
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                          <input
                            type="color"
                            value={selectedModule.textDefaultColor || '#000000'}
                            onChange={(e) => {
                              const updated = { ...selectedModule, textDefaultColor: e.target.value };
                              setSelectedModule(updated);
                              setCustomizationModules(customizationModules.map(m =>
                                m.id === selectedModule.id ? updated : m
                              ));
                            }}
                            style={{ position: 'absolute', inset: 0, border: 'none', padding: 0, cursor: 'pointer' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedModule.textDefaultColor || ''}
                          placeholder="#000000"
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            const normalized = raw ? (raw.startsWith('#') ? raw : `#${raw}`) : undefined;
                            const updated = { ...selectedModule, textDefaultColor: normalized };
                            setSelectedModule(updated);
                            setCustomizationModules(customizationModules.map(m =>
                              m.id === selectedModule.id ? updated : m
                            ));
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            outline: 'none'
                          }}
                        />
                        <span style={{ color: '#7d7d7d', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>Texte</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                          <input
                            type="color"
                            value={selectedModule.textDefaultStrokeColor || '#000000'}
                            onChange={(e) => {
                              const updated = { ...selectedModule, textDefaultStrokeColor: e.target.value };
                              setSelectedModule(updated);
                              setCustomizationModules(customizationModules.map(m =>
                                m.id === selectedModule.id ? updated : m
                              ));
                            }}
                            style={{ position: 'absolute', inset: 0, border: 'none', padding: 0, cursor: 'pointer' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedModule.textDefaultStrokeColor || ''}
                          placeholder="#000000"
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            const normalized = raw ? (raw.startsWith('#') ? raw : `#${raw}`) : undefined;
                            const updated = { ...selectedModule, textDefaultStrokeColor: normalized };
                            setSelectedModule(updated);
                            setCustomizationModules(customizationModules.map(m =>
                              m.id === selectedModule.id ? updated : m
                            ));
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: CONFIGURATOR_PANEL_FONT,
                            outline: 'none'
                          }}
                        />
                        <span style={{ color: '#7d7d7d', fontSize: '12px', fontFamily: CONFIGURATOR_PANEL_FONT }}>Contour</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Groupes de polices disponibles
                    </label>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '8px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px'
                    }}>
                      {fontGroups.map((group) => {
                        const currentGroups = selectedModule.selectedItems?.fontGroupIds;
                        const isChecked = currentGroups ? currentGroups.includes(group.id) : true;
                        const handleToggle = () => {
                          setSelectedModule(prev => {
                            const current = prev.selectedItems?.fontGroupIds || [];
                            const currentlyChecked = current.includes(group.id);
                            const updated = currentlyChecked
                              ? current.filter(id => id !== group.id)
                              : [...current, group.id];
                            const updatedModule = { 
                              ...prev, 
                              selectedItems: {
                                ...prev.selectedItems,
                                fontGroupIds: updated.length > 0 ? updated : undefined
                              }
                            };
                            
                            // Mettre à jour les modules immédiatement
                            setCustomizationModules(prevModules =>
                              prevModules.map(m =>
                                m.id === prev.id ? updatedModule : m
                              )
                            );
                            
                            return updatedModule;
                          });
                        };
                        return (
                          <label
                            key={group.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggle();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              backgroundColor: isChecked ? '#2a2a2a' : 'transparent',
                              transition: 'background-color 0.2s',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{
                                cursor: 'pointer',
                                width: '16px',
                                height: '16px'
                              }}
                            />
                            <span style={{
                              color: '#ffffff',
                              fontSize: '13px',
                              fontFamily: CONFIGURATOR_PANEL_FONT
                            }}>
                              {group.name || group.id}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Police par défaut
                    </label>
                    <select
                      value={selectedModule.textDefaultFontId || ''}
                      onChange={(e) => {
                        const updated = {
                          ...selectedModule,
                          textDefaultFontId: e.target.value || undefined
                        };
                        setSelectedModule(updated);
                        setCustomizationModules(customizationModules.map(m =>
                          m.id === selectedModule.id ? updated : m
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Aucune (première police disponible)</option>
                      {(() => {
                        const allowedGroupIds = selectedModule.selectedItems?.fontGroupIds;
                        const availableFonts: Array<{ id: string; name: string; display_name?: string }> = [];
                        
                        fontGroups.forEach(group => {
                          if (group.fonts && (!allowedGroupIds || allowedGroupIds.length === 0 || allowedGroupIds.includes(group.id))) {
                            group.fonts.forEach((font: any) => {
                              if (font.name || font.display_name) {
                                availableFonts.push({
                                  id: font.id,
                                  name: font.name || font.display_name,
                                  display_name: font.display_name || font.name
                                });
                              }
                            });
                          }
                        });
                        
                        return availableFonts.map(font => (
                          <option key={font.id} value={font.id}>
                            {font.display_name || font.name}
                          </option>
                        ));
                      })()}
                    </select>
                    <p style={{
                      fontSize: '11px',
                      color: '#7d7d7d',
                      marginTop: '6px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      La police sélectionnée sera utilisée par défaut pour les nouveaux textes.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#a0a0a0',
                      marginBottom: '8px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Déformations disponibles
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '8px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px'
                    }}>
                      {[
                        { id: 'none', name: 'Aucune déformation' },
                        { id: 'arc', name: 'Arc' },
                        { id: 'flag', name: 'Drapeau' },
                        { id: 'wave', name: 'Vague' },
                        { id: 'bulge', name: 'Bombé' },
                        { id: 'pinch', name: 'Pinçage' },
                        { id: 'fisheye', name: 'Fisheye' },
                        { id: 'squeeze', name: 'Compression' },
                        { id: 'skew', name: 'Inclinaison' },
                        { id: 'spiral', name: 'Spirale' },
                        { id: 'rotate', name: 'Rotation progressive' },
                        { id: 'tilt', name: 'Tilt' },
                        { id: 'perspective', name: 'Perspective' },
                        { id: 'fade', name: 'Fondu' },
                        { id: 'ribbon', name: 'Ruban' },
                        { id: 'incline', name: 'Montée/descente' },
                        { id: 'staircase', name: 'Escalier' },
                        { id: 'wave-arc', name: 'Vague + Arc' },
                        { id: 'pulse', name: 'Pulse' },
                      ].map((def) => {
                        const currentDeformations = selectedModule.textEnabledDeformations;
                        const isChecked = currentDeformations ? currentDeformations.includes(def.id) : true;
                        const handleToggle = () => {
                          setSelectedModule(prev => {
                            const current = prev.textEnabledDeformations || [];
                            const currentlyChecked = current.includes(def.id);
                            const updated = currentlyChecked
                              ? current.filter(id => id !== def.id)
                              : [...current, def.id];
                            const updatedModule = { 
                              ...prev, 
                              textEnabledDeformations: updated.length > 0 ? updated : undefined 
                            };
                            console.log('🔄 Toggle déformation (local):', def.id, 'checked:', !currentlyChecked, 'updated:', updated);
                            
                            // Annuler le timeout précédent
                            if (deformationsSaveTimeoutRef.current) {
                              clearTimeout(deformationsSaveTimeoutRef.current);
                            }
                            
                            // Mettre à jour les modules après 3 secondes d'inactivité
                            deformationsSaveTimeoutRef.current = setTimeout(() => {
                              setCustomizationModules(prevModules => {
                                const newModules = prevModules.map(m =>
                                  m.id === prev.id ? updatedModule : m
                                );
                                console.log('💾 Modules mis à jour (sauvegarde différée):', newModules.find(m => m.id === prev.id)?.textEnabledDeformations);
                                return newModules;
                              });
                            }, 3000); // 3 secondes d'inactivité
                            
                            return updatedModule;
                          });
                        };
                        return (
                          <label
                            key={def.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggle();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              backgroundColor: isChecked ? '#2a2a2a' : 'transparent',
                              transition: 'background-color 0.2s',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggle();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggle();
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                                accentColor: '#111827',
                                pointerEvents: 'auto',
                                margin: 0,
                                flexShrink: 0
                              }}
                            />
                            <span style={{
                              fontSize: '12px',
                              color: '#ffffff',
                              fontFamily: CONFIGURATOR_PANEL_FONT
                            }}>
                              {def.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: '#7d7d7d',
                      marginTop: '6px',
                      fontFamily: CONFIGURATOR_PANEL_FONT
                    }}>
                      Cochez les déformations que vous souhaitez rendre disponibles dans le configurateur.
                    </p>
                  </div>

                </>
              )}

              <button
                onClick={() => deleteModule(selectedModule.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ff4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Supprimer le module
              </button>
            </div>
          ) : showQuestionSettings && selectedQuestion ? (
            <div style={{
              width: '420px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                marginBottom: '24px'
              }}>
                Question settings
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Question Label
                </label>
                <input
                  type="text"
                  value={selectedQuestion.label}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Question Type
                </label>
                <select
                  value={selectedQuestion.type}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { type: e.target.value as Question['type'] })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="color">Color</option>
                  <option value="image">Image</option>
                  <option value="select">Select</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedQuestion.required}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { required: e.target.checked })}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  Required
                </label>
              </div>

              {selectedQuestion.type === 'select' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}>
                    Options (one per line)
                  </label>
                  <textarea
                    value={selectedQuestion.options?.join('\n') || ''}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => deleteQuestion(selectedQuestion.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ff4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Delete Question
              </button>
            </div>
          ) : (
            <div style={{
              width: '420px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#a0a0a0'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  marginBottom: '8px'
                }}>
                  Module settings
                </h3>
                <p style={{
                  fontSize: '12px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  lineHeight: '1.5'
                }}>
                  Sélectionnez un module dans la sidebar de gauche pour voir ses réglages.
                </p>
              </div>
            </div>
          )}
          </div>
          </>
        )}

      {/* Create Module Modal */}
      {showCreateModuleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20000
          }}
          onClick={() => setShowCreateModuleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              width: '90%',
              maxWidth: '500px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '20px',
              fontFamily: CONFIGURATOR_PANEL_FONT
            }}>
              Créer un module de personnalisation
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tab Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Nom de l'onglet
                </label>
                <input
                  type="text"
                  value={newModule.tabName || ''}
                  onChange={(e) => setNewModule({ ...newModule, tabName: e.target.value })}
                  placeholder="Ex: Design, Couleur, Numéro..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                />
              </div>

              {/* Icon */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Icône
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  {newModuleIconFile ? (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '12px',
                      color: '#a0a0a0'
                    }}>
                      {newModuleIconFile.name}
                    </div>
                  ) : newModule.icon ? (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      padding: '4px'
                    }}>
                      {newModule.icon}
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept=".svg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewModuleIconFile(file);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: CONFIGURATOR_PANEL_FONT,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={newModule.icon || ''}
                  onChange={(e) => setNewModule({ ...newModule, icon: e.target.value })}
                  placeholder="Ou entrez un emoji/texte"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                />
              </div>

              {/* Module Type (Content Type) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}>
                  Type de module
                </label>
                <select
                  value={newModule.contentType || ''}
                  onChange={(e) => setNewModule({ ...newModule, contentType: e.target.value as CustomizationModule['contentType'] || null })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                >
                  <option value="">Sélectionner un type...</option>
                  <option value="colors">Couleurs (Color Palettes)</option>
                  <option value="logos">Logos (Logo Libraries)</option>
                  <option value="fonts">Polices (Font Groups)</option>
                  <option value="designs-2d">Designs 2D</option>
                  <option value="sizes">Tailles (Size Patterns)</option>
                  <option value="text">Texte</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowCreateModuleModal(false);
                  setNewModule({
                    tabName: '',
                    icon: '🎨',
                    inputType: 'thumbnail',
                    contentType: null
                  });
                  setNewModuleIconFile(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={createModule}
                disabled={!newModule.tabName || !newModule.icon || !newModule.contentType}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? 'not-allowed' : 'pointer',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  transition: 'all 0.2s'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection de zones - Desktop uniquement (mobile est rendu dans le conteneur mobile) */}
      {showZoneSelectionModal && viewportMode !== 'mobile' && (() => {
        // Chercher le module actif (priorité au mobile, puis desktop)
        const activeModule = customizationModules.find(m => m.id === mobileActivePanel) || customizationModules.find(m => m.id === activeCustomizerTab);
        if (!activeModule) return null;
        
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowZoneSelectionModal(false);
                setSelectedZoneId(null);
                setTextInputValue('');
              }
            }}
          >
            <div
              className="zone-selection-modal-content"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '32px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  margin: 0
                }}>
                  {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                </h2>
                <button
                  onClick={() => {
                    setShowZoneSelectionModal(false);
                    setSelectedZoneId(null);
                    setTextInputValue('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666666',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>

              {(() => {
                // Récupérer les zones des groupes sélectionnés pour les textes
                // Essayer plusieurs propriétés possibles pour les zoneGroupIds (comme sur mobile)
                const textZoneGroupIds = activeModule.config?.textZoneGroupIds || 
                                         activeModule.selectedItems?.textZoneGroupIds || 
                                         activeModule.zoneGroupIds ||
                                         activeModule.config?.zoneGroupIds ||
                                         activeModule.selectedItems?.zoneGroupIds ||
                                         [];
                
                const availableZones = zoneGroups
                  .filter(group => textZoneGroupIds.includes(group.id))
                  .flatMap(group => group.zones.map(zone => ({ ...zone, groupName: group.name })));
              
                // Debug: log des zones pour vérifier les thumbnails
              
                if (availableZones.length === 0) {
                  return (
                    <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                      Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les settings du module.
                    </p>
                  );
                }
                
                return (
                  <div>
                    {/* Section: Choisissez une position standard */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000000',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        marginBottom: '16px'
                      }}>
                        Choisissez une position standard
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px'
                      }}>
                        {availableZones.map((zone) => {
                          const isSelected = selectedZoneId === zone.id;
                          return (
                            <div
                              key={zone.id}
                              onClick={() => {
                                setSelectedZoneId(zone.id);
                                setTextInputValue('');
                                
                                // Pivoter la caméra vers la vue correspondant à la zone
                                const zoneView = (zone as any)?.view as ('front'|'back'|'left'|'right') | undefined;
                                if (zoneView) {
                                  const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                    'Face': 'front',
                                    'Dos': 'back',
                                    'Gauche': 'left',
                                    'Droite': 'right',
                                    'front': 'front',
                                    'back': 'back',
                                    'left': 'left',
                                    'right': 'right'
                                  };
                                  const view = viewMap[zoneView] || viewMap[zoneView?.toLowerCase() || ''];
                                  if (view) {
                                    console.log('📸 Desktop modal: Pivoting camera to view:', view, 'for zone:', zone.name);
                                    // Marquer que la vue a été définie pour empêcher CameraInitializer de réinitialiser
                                    viewHasBeenSetRef.current = true;
                                    // Utiliser un délai pour s'assurer que l'événement est bien traité
                                    setTimeout(() => {
                                      window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                                    }, 10);
                                  }
                                } else if ((zone as any)?.zoneCategory) {
                                  const viewMap: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                    'torse': 'front',
                                    'dos': 'back',
                                    'bras-gauche': 'left',
                                    'bras-droit': 'right'
                                  };
                                  const view = viewMap[(zone as any).zoneCategory];
                                  if (view) {
                                    console.log('📸 Desktop modal: Pivoting camera to view:', view, 'for zoneCategory:', (zone as any).zoneCategory);
                                    // Marquer que la vue a été définie pour empêcher CameraInitializer de réinitialiser
                                    viewHasBeenSetRef.current = true;
                                    // Utiliser un délai pour s'assurer que l'événement est bien traité
                                    setTimeout(() => {
                                      window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
                                    }, 10);
                                  }
                                }
                              }}
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#999999';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#e0e0e0';
                                }
                              }}
                            >
                              {/* Checkmark icon */}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: CONFIGURATOR_PANEL_PRIMARY_COLOR,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10
                                }}>
                                  <span style={{
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}>
                                    ✓
                                  </span>
                                </div>
                              )}
                              
                              {/* Zone thumbnail */}
                              <div style={{
                                width: '100%',
                                height: '140px',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                padding: '8px'
                              }}>
                                {zone.thumbnailUrl && !zone.thumbnailUrl.startsWith('blob:') ? (
                                  <img
                                    src={zone.thumbnailUrl}
                                    alt={zone.name}
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '100%',
                                      objectFit: 'contain',
                                      filter: 'grayscale(100%)',
                                      display: 'block'
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Error loading thumbnail for zone:', zone.name, zone.thumbnailUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#e0e0e0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#111827',
                                    WebkitTextFillColor: '#111827',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    padding: '8px'
                                  }}>
                                    {zone.name}
                                    {!zone.thumbnailUrl && (
                                      <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                                        (Pas de vignette)
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Zone label */}
                              <div style={{
                                padding: '12px',
                                textAlign: 'center',
                                backgroundColor: '#ffffff'
                              }}>
                                <p style={{
                                  margin: 0,
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  WebkitTextFillColor: '#111827',
                                  WebkitTextStrokeColor: '#111827',
                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                }}>
                                  {zone.name}
                                  {zone.view && ` (${zone.view})`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section: Contenu du texte */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000000',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        marginBottom: '12px'
                      }}>
                        Contenu du texte
                      </h3>
                      <input
                        type="text"
                        value={textInputValue}
                        onChange={(e) => setTextInputValue(e.target.value)}
                        placeholder="Saisir l'inscription ici..."
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && textInputValue.trim() && selectedZoneId) {
                            const selectedZone = availableZones.find(z => z.id === selectedZoneId);
                            if (selectedZone) {
                              const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                                'Face': 'torse',
                                'Dos': 'dos',
                                'Gauche': 'bras-gauche',
                                'Droite': 'bras-droit'
                              };
                              const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                              
                              // Utiliser la position de la zone directement (déjà en coordonnées UV2)
                              // IMPORTANT: Les zones sont stockées avec inversion verticale (comme dans UVMapViewer)
                              // Mais ModelViewer utilise des coordonnées directes, donc on doit inverser v
                              const zonePosition: [number, number, number] = [
                                selectedZone.position[0],
                                1 - selectedZone.position[1], // Inverser v pour correspondre à ModelViewer
                                selectedZone.position[2] || 0
                              ];
                              // Convertir la rotation de degrés à radians si nécessaire
                              // La rotation est stockée en degrés dans la base de données
                              // Vérifier si la rotation existe dans la zone (peut être undefined si pas définie)
                              const zoneRotationRaw = (selectedZone as any).rotation;
                              const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                                ? zoneRotationRaw * (Math.PI / 180) 
                                : 0; // Par défaut, pas de rotation (0 radians)
                              
                              // Calculer la taille de police en fonction des dimensions de la zone
                              // Le canvas fait 2048x2048, et le texte utilise un SCALE_FACTOR de 0.5
                              // On veut que le texte s'adapte à la largeur de la zone
                              const CANVAS_SIZE = 2048;
                              const SCALE_FACTOR = 0.5; // Même facteur que dans ModelViewer
                              const zoneWidth = (selectedZone as any).width || 0.1; // Largeur en UV space (0-1)
                              const zoneHeight = (selectedZone as any).height || 0.1; // Hauteur en UV space (0-1)
                              
                              // Convertir en pixels
                              const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                              const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                              
                              // Estimer la taille de police pour que le texte tienne dans la zone
                              // On utilise 80% de la largeur pour laisser de la marge
                              // Et on prend le minimum entre largeur et hauteur pour s'assurer que le texte tient
                              const availableWidth = zoneWidthPx * 0.8;
                              const availableHeight = zoneHeightPx * 0.8;
                              
                              // Estimation: chaque caractère fait environ 0.6 * fontSize en largeur
                              // Et la hauteur du texte est environ fontSize
                              const estimatedCharWidth = 0.6; // Ratio largeur caractère / fontSize
                              const textLength = textInputValue.length || 1;
                              
                              // Calculer fontSize basé sur la largeur disponible
                              const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                              // Calculer fontSize basé sur la hauteur disponible
                              const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                              
                              // Prendre le minimum pour s'assurer que le texte tient dans les deux dimensions
                              const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                              
                              // S'assurer que la taille est raisonnable (min 100, max 2000)
                              const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                              
                              addText(
                                textInputValue,
                                zonePosition,
                                undefined,
                                'text',
                                finalFontSize,
                                zoneCategory,
                                zoneRotation
                              );
                              
                              // Pivoter la caméra vers l'emplacement du texte (même en mobile)
                              // if (zoneCategory) {
                              //   setTargetView(zoneCategory);
                              // }
                              
                              setShowZoneSelectionModal(false);
                              setSelectedZoneId(null);
                              setTextInputValue('');
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#111827',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px'
                    }}>
                      <button
                        onClick={() => {
                          setShowZoneSelectionModal(false);
                          setSelectedZoneId(null);
                          setTextInputValue('');
                        }}
                        className="btn-secondary"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          const selectedZone = availableZones.find(z => z.id === selectedZoneId);
                          if (selectedZone && textInputValue.trim()) {
                            const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                              'Face': 'torse',
                              'Dos': 'dos',
                              'Gauche': 'bras-gauche', // Côté gauche
                              'Droite': 'bras-droit' // Côté droit
                            };
                            const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                            
                            // Utiliser la position de la zone directement (déjà en coordonnées UV2)
                            // IMPORTANT: Les zones sont stockées avec inversion verticale (comme dans UVMapViewer)
                            // Mais ModelViewer utilise des coordonnées directes, donc on doit inverser v
                            const zonePosition: [number, number, number] = [
                              selectedZone.position[0],
                              1 - selectedZone.position[1], // Inverser v pour correspondre à ModelViewer
                              selectedZone.position[2] || 0
                            ];
                            // Convertir la rotation de degrés à radians si nécessaire
                            // La rotation est stockée en degrés dans la base de données
                            // Vérifier si la rotation existe dans la zone (peut être undefined si pas définie)
                            const zoneRotationRaw = (selectedZone as any).rotation;
                            const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                              ? zoneRotationRaw * (Math.PI / 180) 
                              : 0; // Par défaut, pas de rotation (0 radians)
                            
                            // Calculer la taille de police en fonction des dimensions de la zone
                            // Le canvas fait 2048x2048, et le texte utilise un SCALE_FACTOR de 0.5
                            // On veut que le texte s'adapte à la largeur de la zone
                            const CANVAS_SIZE = 2048;
                            const SCALE_FACTOR = 0.5; // Même facteur que dans ModelViewer
                            const zoneWidth = (selectedZone as any).width || 0.1; // Largeur en UV space (0-1)
                            const zoneHeight = (selectedZone as any).height || 0.1; // Hauteur en UV space (0-1)
                            
                            // Convertir en pixels
                            const zoneWidthPx = zoneWidth * CANVAS_SIZE;
                            const zoneHeightPx = zoneHeight * CANVAS_SIZE;
                            
                            // Estimer la taille de police pour que le texte tienne dans la zone
                            // On utilise 80% de la largeur pour laisser de la marge
                            // Et on prend le minimum entre largeur et hauteur pour s'assurer que le texte tient
                            const availableWidth = zoneWidthPx * 0.8;
                            const availableHeight = zoneHeightPx * 0.8;
                            
                            // Estimation: chaque caractère fait environ 0.6 * fontSize en largeur
                            // Et la hauteur du texte est environ fontSize
                            const estimatedCharWidth = 0.6; // Ratio largeur caractère / fontSize
                            const textLength = textInputValue.length || 1;
                            
                            // Calculer fontSize basé sur la largeur disponible
                            const fontSizeFromWidth = (availableWidth / textLength) / estimatedCharWidth / SCALE_FACTOR;
                            // Calculer fontSize basé sur la hauteur disponible
                            const fontSizeFromHeight = availableHeight / SCALE_FACTOR;
                            
                            // Prendre le minimum pour s'assurer que le texte tient dans les deux dimensions
                            const calculatedFontSize = Math.min(fontSizeFromWidth, fontSizeFromHeight);
                            
                            // S'assurer que la taille est raisonnable (min 100, max 2000)
                            const finalFontSize = Math.max(100, Math.min(2000, calculatedFontSize));
                            
                            addText(
                              textInputValue,
                              zonePosition,
                              undefined,
                              'text',
                              finalFontSize,
                              zoneCategory,
                              zoneRotation
                            );
                            
                            // Ne pas réinitialiser la caméra en mode mobile - notre setCameraView s'en occupe
                            // if (zoneCategory && viewportMode !== 'mobile') {
                            //   setTargetView(zoneCategory);
                            // }
                            
                            setShowZoneSelectionModal(false);
                            setSelectedZoneId(null);
                            setTextInputValue('');
                          }
                        }}
                        disabled={!textInputValue.trim() || !selectedZoneId}
                        className="btn-primary"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: (!textInputValue.trim() || !selectedZoneId) ? '#cccccc' : '#3b82f6',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#ffffff',
                          cursor: (!textInputValue.trim() || !selectedZoneId) ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (textInputValue.trim() && selectedZoneId) {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (textInputValue.trim() && selectedZoneId) {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }
                        }}
                      >
                        {activeModule.addTextButtonLabel || 'Ajouter un texte'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Modal de sélection de zones pour les logos - DESKTOP uniquement */}
      {viewportMode === 'desktop' && showLogoZoneModal && selectedLogoForZone && (() => {
        const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
        if (!activeModule || activeModule.contentType !== 'logos') {
          return null;
        }
        
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowLogoZoneModal(false);
                setSelectedLogoForZone(null);
                setSelectedLogoZoneId('');
              }
            }}
          >
            <div
              className="zone-selection-modal-content"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '32px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  margin: 0
                }}>
                  {activeModule.addLogoButtonLabel || 'Ajouter un logo'}
                </h2>
                <button
                  onClick={() => {
                    setShowLogoZoneModal(false);
                    setSelectedLogoForZone(null);
                    setSelectedLogoZoneId('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666666',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>

              {(() => {
                // Debug: Vérifier la configuration du module
                
                // Utiliser les vraies customViews du module
                const customViews = activeModule.viewLabels || [];
                
                // Trouver la vue active
                const activeViewConfig = customViews.find(v => v.id === activeLogoView);
                const activeViewLabel = activeViewConfig?.label || activeLogoView;
                
                // Récupérer les zones des groupes sélectionnés
                const availableZones = zoneGroups
                  .filter(group => activeModule.logoZoneGroupIds?.includes(group.id))
                  .flatMap(group => group.zones.map(zone => ({ ...zone, groupName: group.name })));
              
              
                // Filtrer par vue active
                const viewLabels: Record<string, string> = {
                  'Face': 'front',
                  'Dos': 'back',
                  'Gauche': 'left', // Côté gauche
                  'Droite': 'right' // Côté droit
                };
                
                const filteredZones = availableZones.filter(zone => {
                  // Comparer avec le label de la vue active
                  if (zone.view && zone.view !== activeViewLabel) return false;
                  return true;
                });
                
              
                if (filteredZones.length === 0) {
                  return (
                    <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT, padding: '12px' }}>
                      Aucune zone disponible. Veuillez sélectionner des groupes de zones dans les settings du module.
                    </p>
                  );
                }
                
                return (
                  <div>
                    {/* Section: Choisissez une position standard */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000000',
                        fontFamily: CONFIGURATOR_PANEL_FONT,
                        marginBottom: '16px'
                      }}>
                        Choisissez une position standard
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px'
                      }}>
                        {filteredZones.map((zone) => {
                          const isSelected = selectedLogoZoneId === zone.id;
                          return (
                            <div
                              key={zone.id}
                              onClick={() => {
                                setSelectedLogoZoneId(zone.id);
                              }}
                              style={{
                                position: 'relative',
                                cursor: 'pointer',
                                border: isSelected ? '3px solid #000000' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#999999';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#e0e0e0';
                                }
                              }}
                            >
                              {/* Checkmark icon */}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: CONFIGURATOR_PANEL_PRIMARY_COLOR,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 10
                                }}>
                                  <span style={{
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}>
                                    ✓
                                  </span>
                                </div>
                              )}
                              
                              {/* Zone thumbnail */}
                              <div style={{
                                width: '100%',
                                height: '140px',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                padding: '8px'
                              }}>
                                {zone.thumbnailUrl && !zone.thumbnailUrl.startsWith('blob:') ? (
                                  <img
                                    src={zone.thumbnailUrl}
                                    alt={zone.name}
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '100%',
                                      objectFit: 'contain',
                                      filter: 'grayscale(100%)',
                                      display: 'block'
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Error loading thumbnail for zone:', zone.name, zone.thumbnailUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#e0e0e0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#111827',
                                    WebkitTextFillColor: '#111827',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    padding: '8px'
                                  }}>
                                    {zone.name}
                                    {!zone.thumbnailUrl && (
                                      <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                                        (Pas de vignette)
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Zone label */}
                              <div style={{
                                padding: '12px',
                                textAlign: 'center',
                                backgroundColor: '#ffffff'
                              }}>
                                <p style={{
                                  margin: 0,
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  color: '#111827',
                                  WebkitTextFillColor: '#111827',
                                  WebkitTextStrokeColor: '#111827',
                                  fontFamily: CONFIGURATOR_PANEL_FONT
                                }}>
                                  {zone.name}
                                  {zone.view && ` (${zone.view})`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px'
                    }}>
                      <button
                        onClick={() => {
                          setShowLogoZoneModal(false);
                          setSelectedLogoForZone(null);
                          setSelectedLogoZoneId('');
                          setLogoToReplace(null); // Réinitialiser le remplacement
                        }}
                        className="btn-secondary"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          const selectedZone = filteredZones.find(z => z.id === selectedLogoZoneId);
                          if (selectedZone && selectedLogoForZone) {
                            const viewToCategory: Record<string, 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
                              'Face': 'torse',
                              'Dos': 'dos',
                              'Gauche': 'bras-gauche', // Côté gauche
                              'Droite': 'bras-droit' // Côté droit
                            };
                            const zoneCategory = selectedZone.view ? viewToCategory[selectedZone.view] : undefined;
                            
                            // Utiliser la position de la zone directement (déjà en coordonnées UV2)
                            // IMPORTANT: Les zones sont stockées avec inversion verticale (comme dans UVMapViewer)
                            // Mais ModelViewer utilise des coordonnées directes, donc on doit inverser v
                            const zonePosition: [number, number, number] = [
                              selectedZone.position[0],
                              1 - selectedZone.position[1], // Inverser v pour correspondre à ModelViewer
                              selectedZone.position[2] || 0
                            ];
                            
                            // Convertir la rotation de degrés à radians si nécessaire
                            const zoneRotationRaw = (selectedZone as any).rotation;
                            const zoneRotation = zoneRotationRaw !== undefined && zoneRotationRaw !== null 
                              ? zoneRotationRaw * (Math.PI / 180) 
                              : 0;
                            
                            // Récupérer les dimensions de la zone
                            const zoneWidth = (selectedZone as any).width || 0.1;
                            const zoneHeight = (selectedZone as any).height || 0.1;
                            
                            // Ajouter le logo sur la zone
                            // Utiliser variantFile si disponible, sinon utiliser le file_url du logo
                            const logoFile = selectedLogoForZone.variantFile || '';
                            if (!logoFile) {
                              console.error('❌ Aucun fichier de logo disponible');
                              return;
                            }
                            
                            addLogo(
                              selectedLogoForZone.logoId,
                              selectedLogoForZone.variantId,
                              logoFile,
                              zonePosition,
                              zoneCategory || 'torse',
                              zoneWidth,
                              zoneHeight,
                              zoneRotation
                            );
                            
                            // Positionner la caméra selon la vue de la zone (comme dans le mobile)
                            const viewToCameraView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                              'Face': 'front',
                              'Dos': 'back',
                              'Gauche': 'left',
                              'Droite': 'right',
                              'front': 'front',
                              'back': 'back',
                              'left': 'left',
                              'right': 'right'
                            };
                            
                            // Déterminer la vue de la caméra
                            let cameraView: 'front' | 'back' | 'left' | 'right' | null = null;
                            
                            // Si la zone a une vue, l'utiliser directement
                            if (selectedZone.view) {
                              const zoneView = String(selectedZone.view);
                              if (viewToCameraView[zoneView]) {
                                cameraView = viewToCameraView[zoneView];
                              }
                            }
                            
                            // Sinon, mapper la catégorie à une vue
                            if (!cameraView && zoneCategory) {
                              const categoryToView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
                                'torse': 'front',
                                'dos': 'back',
                                'bras-gauche': 'left',
                                'bras-droit': 'right'
                              };
                              if (categoryToView[zoneCategory]) {
                                cameraView = categoryToView[zoneCategory];
                              }
                            }
                            
                            // Déclencher l'événement avec un délai pour éviter qu'il soit écrasé
                            if (cameraView && viewportMode !== 'mobile') {
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('setCameraView', { detail: cameraView }));
                              }, 100);
                            } else {
                            }
                            
                            // Ne pas réinitialiser la caméra - notre setCameraView s'en occupe déjà
                            // if (zoneCategory && viewportMode !== 'mobile') {
                            //   setTargetView(zoneCategory);
                            // }
                            
                            setShowLogoZoneModal(false);
                            setSelectedLogoForZone(null);
                            setSelectedLogoZoneId('');
                            setShowLogoLibrary(false);
                          }
                        }}
                        disabled={!selectedLogoZoneId}
                        className="btn-primary"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: selectedLogoZoneId ? '#3b82f6' : '#cccccc',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: CONFIGURATOR_PANEL_FONT,
                          color: '#ffffff',
                          cursor: selectedLogoZoneId ? 'pointer' : 'not-allowed',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLogoZoneId) {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLogoZoneId) {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }
                        }}
                      >
                        {activeModule.addLogoButtonLabel || 'Ajouter un logo'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}
      
      {/* Modal d'importation de logo - Version DESKTOP */}
      {viewportMode === 'desktop' && showImportModal && (() => {
        const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
        if (!activeModule || activeModule.contentType !== 'logos') return null;
        
        const allowedTypes = activeModule.allowedLogoFileTypes || ['svg', 'png', 'jpg', 'jpeg'];
        const acceptTypes = allowedTypes.map(t => `.${t}`).join(',');
        
        return (
          <div
            className="configurator-panel-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowImportModal(false);
                setImportedFile(null);
                setImportedFilePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          >
            <div
              className="configurator-panel-modal zone-selection-modal-content"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Titre */}
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  fontFamily: CONFIGURATOR_PANEL_FONT
                }}
              >
                Importer un logo
              </h2>
              
              {/* Info types de fichiers */}
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: '0 0 4px 0',
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}
                >
                  Fichier
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: 0,
                    fontFamily: CONFIGURATOR_PANEL_FONT
                  }}
                >
                  Types autorisés: {allowedTypes.map(t => t.toUpperCase()).join(', ')}
                </p>
              </div>
              
              {/* Input fichier */}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  backgroundColor: '#ffffff',
                  color: '#111827'
                }}
              />
              
              {/* Aperçu si fichier sélectionné */}
              {importedFilePreview && (
                <div
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '16px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <img
                    src={importedFilePreview}
                    alt="Aperçu"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '280px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}
              
              {/* Boutons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  width: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportedFile(null);
                    setImportedFilePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    color: '#111827',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!importedFile || isProcessingBackground) return;
                    handleImportLogo();
                  }}
                  disabled={!importedFile || isProcessingBackground}
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: importedFile && !isProcessingBackground ? '#6b7280' : '#d1d5db',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    color: '#ffffff',
                    cursor: importedFile && !isProcessingBackground ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isProcessingBackground ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    'Importer'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Modal de background remover - Version DESKTOP */}
      {viewportMode === 'desktop' && showBackgroundRemoverModal && (backgroundRemoverPreview || isProcessingBackground) && (
        <div
          className="configurator-panel-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBackgroundRemoverModal(false);
            }
          }}
        >
          <div
            className="configurator-panel-modal zone-selection-modal-content"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: 'min(600px, calc(100vw - 32px))',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxHeight: 'calc(100vh - 32px)',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Titre */}
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                fontFamily: CONFIGURATOR_PANEL_FONT
              }}
            >
              Supprimer le fond ?
            </h2>
            
            {/* Aperçus côte à côte */}
            {backgroundRemoverPreview && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}
            >
              {/* Aperçu original */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <p
                  className="background-remover-label"
                  style={{
                    fontSize: '13px',
                    color: '#111827',
                    margin: 0,
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    textAlign: 'center',
                    fontWeight: '500',
                    WebkitTextFillColor: '#111827',
                    WebkitTextStrokeColor: '#111827'
                  } as React.CSSProperties}
                >
                  Original
                </p>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <img
                    src={backgroundRemoverPreview.original}
                    alt="Original"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>
              
              {/* Aperçu traité */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <p
                  className="background-remover-label"
                  style={{
                    fontSize: '13px',
                    color: '#111827',
                    margin: 0,
                    fontFamily: CONFIGURATOR_PANEL_FONT,
                    textAlign: 'center',
                    fontWeight: '500',
                    WebkitTextFillColor: '#111827',
                    WebkitTextStrokeColor: '#111827'
                  } as React.CSSProperties}
                >
                  Sans fond
                </p>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px'
                  }}
                >
                  {isProcessingBackground ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT }}>Traitement...</span>
                    </div>
                  ) : (
                    <img
                      src={backgroundRemoverPreview.processed}
                      alt="Sans fond"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            )}
            
            {/* Boutons */}
            {backgroundRemoverPreview && !isProcessingBackground && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => handleBackgroundRemoverChoice(false)}
                className="btn-secondary"
                disabled={isProcessingBackground}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#111827',
                  cursor: isProcessingBackground ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: isProcessingBackground ? 0.5 : 1
                }}
              >
                Non
              </button>
              <button
                onClick={() => handleBackgroundRemoverChoice(true)}
                className="btn-primary"
                disabled={isProcessingBackground}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#ffffff',
                  cursor: isProcessingBackground ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: isProcessingBackground ? 0.5 : 1
                }}
              >
                Oui
              </button>
            </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de confirmation de suppression - Version DESKTOP (niveau global) */}
      {viewportMode === 'desktop' && showDeleteModal && itemToDelete && (
        <div
          className="configurator-panel-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }
          }}
        >
          <div
            className="configurator-panel-modal"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icône de poubelle */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px'
              }}
            >
              🗑️
            </div>
            
            {/* Titre */}
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                fontFamily: CONFIGURATOR_PANEL_FONT,
                margin: 0,
                textAlign: 'center'
              }}
            >
              Supprimer l'élément ?
            </h2>
            
            {/* Message */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'center'
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  margin: 0
                }}
              >
                Êtes-vous sûr de vouloir supprimer {itemToDelete.type === 'logo' ? 'le logo' : 'le texte'} "{itemToDelete.name}" ?
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  margin: 0
                }}
              >
                Cette action ne peut pas être annulée.
              </p>
            </div>
            
            {/* Boutons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                width: '100%'
              }}
            >
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Non
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: CONFIGURATOR_PANEL_FONT,
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      
    </div>
  );
}

