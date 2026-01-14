"use client";

import { useState, useEffect } from 'react';
import { useShopifyIntegration } from '@/hooks/useShopifyIntegration';
import { useShopifyCustomer } from '@/hooks/useShopifyCustomer';
import { ShopifyLoginModal } from '@/components/ShopifyLoginModal';

interface ShopifyAddToCartProps {
  // Configuration
  modelUrl?: string;
  designId?: string;
  designUrl?: string;
  colors?: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  texts?: Array<any>;
  logos?: Array<any>;
  fonts?: Array<any>;
  
  // Configuration Shopify (peut être passée via URL ou props)
  shopDomain?: string;
  productId?: string;
  variantId?: string;
  
  // Options
  showPreview?: boolean;
  className?: string;
}

export function ShopifyAddToCart({
  modelUrl,
  designId,
  designUrl,
  colors,
  texts,
  logos,
  fonts,
  shopDomain,
  productId,
  variantId,
  showPreview = true,
  className = '',
}: ShopifyAddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const shopifyConfig = shopDomain && productId ? {
    shopDomain,
    productId,
    variantId,
  } : undefined;

  const {
    isLoading,
    error,
    configId,
    addToCart,
    saveConfiguration,
    capturePreview,
  } = useShopifyIntegration(shopifyConfig);

  // Détection du client Shopify connecté
  const { customer: hookCustomer, isLoggedIn: hookIsLoggedIn } = useShopifyCustomer(shopDomain);

  // Vérifier aussi si l'email est dans les paramètres URL
  const [urlCustomerEmail, setUrlCustomerEmail] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get('customer_email');
      
      console.log('🔍 DEBUG useEffect - Vérification paramètres URL:', {
        fullUrl: window.location.href,
        search: window.location.search,
        allParams: Array.from(params.entries()),
        customer_email: emailFromUrl
      });
      
      if (emailFromUrl) {
        console.log('✅ Email client trouvé dans URL:', emailFromUrl);
        setUrlCustomerEmail(emailFromUrl);
      } else {
        console.log('❌ Paramètre customer_email NON trouvé dans l\'URL');
      }
    }
  }, []);

  // Combiner les deux sources de détection
  const customer = urlCustomerEmail ? { email: urlCustomerEmail } : hookCustomer;
  const finalIsLoggedIn = !!urlCustomerEmail || hookIsLoggedIn;

  // Debug détaillé
  console.log('🔍 DEBUG ShopifyAddToCart - État de connexion:', {
    shopDomain,
    hookIsLoggedIn,
    urlCustomerEmail,
    finalIsLoggedIn,
    customer
  });

  // État pour la modal de connexion
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(false); // Indique qu'une sauvegarde est en attente

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Ce useEffect n'est plus nécessaire car la sauvegarde se fait maintenant dans la page Mon compte

  const handleSaveConfiguration = async () => {
    // Afficher le modal de chargement
    const modal = document.createElement('div');
    modal.id = 'save-loading-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: inherit;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px;">
        <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 600; color: #333; font-family: inherit;">Préparation...</h2>
        <p style="margin: 0; color: #666; font-size: 16px; font-family: inherit;">Capture de votre configuration en cours</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(modal);
    
    // 1. D'abord capturer l'aperçu
    console.log('📸 Capture de l\'aperçu...');
    const preview = await capturePreview();
    
    // Fermer le modal
    document.body.removeChild(modal);
    
    if (!preview) {
      console.error('❌ Impossible de capturer l\'aperçu');
      alert('Erreur lors de la capture de l\'aperçu');
      return;
    }
    
    console.log('✅ Aperçu capturé:', preview);
    
    const configData: any = {
      modelUrl,
      design: designId && designUrl ? { id: designId, svgUrl: designUrl } : undefined,
      colors,
      texts,
      logos,
      fonts,
      previewUrl: preview, // Ajouter l'URL de l'aperçu
    };

    // Ajouter l'email du client si connecté
    if (finalIsLoggedIn && customer?.email) {
      configData.customerEmail = customer.email;
    }

    // DEBUG: Afficher l'état de connexion au moment de la sauvegarde
    console.log('🔍 DEBUG handleSaveConfiguration - État de connexion:', {
      finalIsLoggedIn,
      hasCustomer: !!customer,
      customerEmail: customer?.email,
      urlCustomerEmail,
      willShowLoginModal: !finalIsLoggedIn
    });

    // Si pas connecté, sauvegarder temporairement et afficher la modal
    if (!finalIsLoggedIn) {
      console.log('🔍 DEBUG ShopifyAddToCart - Utilisateur non connecté, sauvegarde temporaire');
      
      try {
        // Log pour vérifier que previewUrl est présent
        console.log('📦 Données à sauvegarder:', {
          hasPreviewUrl: !!configData.previewUrl,
          previewUrlLength: configData.previewUrl?.length,
          previewUrlPrefix: configData.previewUrl?.substring(0, 50)
        });
        
        // Sauvegarder temporairement dans Supabase
        const response = await fetch('https://configurator.stretchmx.com/api/temp-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configData),
        });
        
        if (!response.ok) {
          throw new Error('Erreur sauvegarde temporaire');
        }
        
        const { id: tempConfigId } = await response.json();
        console.log('✅ Configuration temporaire sauvegardée:', tempConfigId);
        
        // Stocker seulement l'ID dans localStorage
        localStorage.setItem('pending_config_id', tempConfigId);
        
        setPendingSave(true);
        setShowLoginModal(true);
        return;
      } catch (error) {
        console.error('❌ Erreur sauvegarde temporaire:', error);
        alert('Erreur lors de la sauvegarde temporaire');
        return;
      }
    }

    // Si connecté, sauvegarder directement
    try {
      const savedConfigId = await saveConfiguration(configData);
      
      if (savedConfigId) {
        console.log('✅ Configuration sauvegardée pour utilisateur connecté:', savedConfigId);
        
        // Afficher un modal de succès élégant
        const successModal = document.createElement('div');
        successModal.id = 'save-success-modal';
        successModal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: inherit;
          animation: fadeIn 0.3s ease-in-out;
        `;
        successModal.innerHTML = `
          <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px; animation: scaleIn 0.3s ease-in-out;">
            <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: checkmark 0.5s ease-in-out;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 600; color: #1f2937; font-family: inherit;">Configuration enregistrée !</h2>
            <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; font-family: inherit;">
              Votre configuration a été sauvegardée avec succès.<br>
              Retrouvez-la dans votre espace "Mon compte".
            </p>
            <a href="https://${shopDomain}/account" 
               style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; transition: background 0.2s;"
               onmouseover="this.style.background='#2563eb'"
               onmouseout="this.style.background='#3b82f6'">
              Voir mes configurations
            </a>
            <button onclick="document.getElementById('save-success-modal').remove()" 
                    style="display: block; width: 100%; margin-top: 12px; padding: 12px; background: transparent; color: #6b7280; border: none; cursor: pointer; font-size: 14px; font-family: inherit;">
              Continuer à personnaliser
            </button>
          </div>
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes checkmark {
              0% { transform: scale(0); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
          </style>
        `;
        document.body.appendChild(successModal);
        
        // Fermer automatiquement après 10 secondes
        setTimeout(() => {
          const modal = document.getElementById('save-success-modal');
          if (modal) modal.remove();
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      
      // Afficher un modal d'erreur élégant
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde';
      const isLimitError = errorMessage.includes('Limite de 10 configurations');
      
      const errorModal = document.createElement('div');
      errorModal.id = 'save-error-modal';
      errorModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: inherit;
        animation: fadeIn 0.3s ease-in-out;
      `;
      errorModal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; text-align: center; max-width: 500px; animation: scaleIn 0.3s ease-in-out;">
          <div style="width: 60px; height: 60px; background: ${isLimitError ? '#f59e0b' : '#ef4444'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: errorShake 0.5s ease-in-out;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              ${isLimitError 
                ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
                : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
              }
            </svg>
          </div>
          <h2 style="margin: 0 0 10px; font-size: 24px; font-weight: 600; color: #1f2937; font-family: inherit;">
            ${isLimitError ? 'Limite atteinte' : 'Erreur de sauvegarde'}
          </h2>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.5; font-family: inherit;">
            ${errorMessage}
          </p>
          ${isLimitError 
            ? `<a href="https://${shopDomain}/account" 
                 style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; transition: background 0.2s; margin-bottom: 12px;"
                 onmouseover="this.style.background='#d97706'"
                 onmouseout="this.style.background='#f59e0b'">
                Gérer mes configurations
              </a>`
            : ''
          }
          <button onclick="document.getElementById('save-error-modal').remove()" 
                  style="display: block; width: 100%; padding: 12px; background: #e5e7eb; color: #1f2937; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; font-family: inherit; ${isLimitError ? 'margin-top: 0;' : ''}"
                  onmouseover="this.style.background='#d1d5db'"
                  onmouseout="this.style.background='#e5e7eb'">
            Fermer
          </button>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
        </style>
      `;
      document.body.appendChild(errorModal);
      
      // Fermer automatiquement après 15 secondes
      setTimeout(() => {
        const modal = document.getElementById('save-error-modal');
        if (modal) modal.remove();
      }, 15000);
    }
  };

  // Fonction appelée après connexion réussie
  const handleLoginSuccess = async (email: string) => {
    console.log('🔍 DEBUG - Connexion réussie avec email:', email);
    setShowLoginModal(false);
    
    // Sauvegarder la configuration avec l'email du client
    const configData: any = {
      modelUrl,
      design: designId && designUrl ? { id: designId, svgUrl: designUrl } : undefined,
      colors,
      texts,
      logos,
      fonts,
      customerEmail: email,
    };
    
    console.log('🔍 DEBUG - Sauvegarde après connexion avec data:', configData);
    
    try {
      const savedConfigId = await saveConfiguration(configData);
      console.log('🔍 DEBUG - Configuration sauvegardée avec ID:', savedConfigId);
      
      if (savedConfigId) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }
    } catch (error) {
      console.error('🔍 DEBUG - Erreur lors de la sauvegarde après connexion:', error);
    }
  };

  const handleAddToCart = async () => {
    const configData: any = {
      modelUrl,
      design: designId && designUrl ? { id: designId, svgUrl: designUrl } : undefined,
      colors,
      texts,
      logos,
      fonts,
    };

    await addToCart(configData, quantity);
  };

  const handleCapturePreview = async () => {
    const preview = await capturePreview();
    if (preview) {
      setPreviewImage(preview);
    }
  };

  // Vérifier si la configuration est valide
  const isConfigurationValid = () => {
    // Au minimum, on doit avoir un modèle ou un design
    return !!(modelUrl || designUrl);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-3 ${className}`}>
      {/* Messages - Supprimés car on utilise des modals maintenant */}

      {/* Aperçu de la configuration masqué */}

      {/* Quantité (seulement si Shopify configuré) */}
      {shopifyConfig && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="w-full flex flex-row gap-3">
        {/* Bouton Sauvegarder */}
        <button
          onClick={handleSaveConfiguration}
          disabled={isLoading || !isConfigurationValid()}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center justify-center gap-2"
        >
          {isLoading ? 'Sauvegarde...' : (
            <>
              <span>💾</span>
              <span>Sauvegarder</span>
            </>
          )}
        </button>

        {/* Bouton Ajouter au panier (seulement si Shopify configuré) */}
        {shopifyConfig && (
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !isConfigurationValid()}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Ajout en cours...</span>
              </>
            ) : (
              <>
                <span>🛒</span>
                <span>Ajouter au panier</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Informations de configuration */}
      {configId && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-medium text-blue-900 mb-1">
            Configuration sauvegardée
          </div>
          <div className="text-xs text-blue-700 font-mono break-all">
            {configId}
          </div>
        </div>
      )}

      {/* Info si pas de Shopify configuré */}
      {!shopifyConfig && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs text-yellow-800">
            <strong>ℹ️ Mode démo</strong> - Pour activer l'ajout au panier, configurez votre domaine Shopify.
          </div>
        </div>
      )}

      {/* Modal de connexion Shopify */}
      {showLoginModal && shopDomain && (
        <ShopifyLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          shopDomain={shopDomain}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}




