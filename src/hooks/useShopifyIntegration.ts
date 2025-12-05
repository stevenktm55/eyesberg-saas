// =====================================================
// HOOK SHOPIFY INTEGRATION - VERSION SUPABASE
// =====================================================
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// Fonction pour afficher une modal de chargement
function showLoadingModal() {
  // Créer la modal
  const modal = document.createElement('div');
  modal.id = 'loading-modal';
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
  `;
  
  // Contenu de la modal
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      "></div>
      <h2 style="
        margin: 0 0 10px;
        font-size: 24px;
        font-weight: 600;
        color: #333;
        font-family: inherit;
      ">Ajout au panier...</h2>
      <p style="
        margin: 0;
        color: #666;
        font-size: 16px;
        font-family: inherit;
      ">Votre produit personnalisé est en cours d'ajout</p>
    </div>
  `;
  
  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Ajouter la modal au DOM
  document.body.appendChild(modal);
  
  // Supprimer la modal après 3 secondes (au cas où)
  setTimeout(() => {
    if (modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }, 3000);
}

function hideLoadingModal() {
  const modal = document.getElementById('loading-modal');
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

interface ConfigurationData {
  modelUrl?: string;
  designId?: string;
  designUrl?: string;
  colors?: any[];
  texts?: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    category?: string;
    fillType?: 'solid' | 'gradient';
    gradientColors?: string[];
    deformation?: string;
    deformationIntensity?: number;
    gradientDirection?: 'horizontal' | 'vertical';
  }>;
  logos?: Array<{
    id: string;
    logoId: string;
    variantId: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    category: string;
  }>;
  customerEmail?: string;
  customerNote?: string;
  preview_image_url?: string;
  variantId?: string;
}

export interface AddToCartOptions {
  skipRedirect?: boolean;
  openInNewTab?: boolean;
}

export type AddToCartSuccess = {
  success: true;
  redirectUrl: string;
  configId: string;
  configNumber: string;
};

export type AddToCartError = {
  success: false;
  error: string;
};

export type AddToCartResult = AddToCartSuccess | AddToCartError;

interface ShopifyConfig {
  shopDomain: string;
  productId?: string;
  variantId?: string;
}

export function useShopifyIntegration(shopifyConfig?: ShopifyConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  /**
   * Capture une image du canvas 3D (vue de FACE pour l'aperçu client)
   */
  const captureCurrentView = async (): Promise<Blob | null> => {
    try {
      console.log('📸 Capture de la vue de FACE pour aperçu client...');
      
      // Déclencher le reset de la caméra vers la position initiale (vue de face)
      window.dispatchEvent(new CustomEvent('resetCameraToFront'));
      
      // Attendre que la caméra se positionne
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('❌ Canvas 3D non trouvé');
        throw new Error('Canvas 3D non trouvé');
      }

      console.log('📸 Canvas WebGL trouvé, dimensions:', {
        width: canvas.width,
        height: canvas.height
      });

      // Attendre que le rendu WebGL soit complètement stable
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Forcer un dernier rendu
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });
      });

      // Créer un canvas 2D temporaire 512x512 pour redimensionner
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 512;
      tempCanvas.height = 512;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte 2D');
      }

      // Dessiner le canvas WebGL sur le canvas 2D (centré et redimensionné)
      // Calculer les dimensions pour maintenir le ratio
      const sourceWidth = canvas.width;
      const sourceHeight = canvas.height;
      const targetSize = 512;
      
      // Calculer le crop pour obtenir un carré depuis le canvas source
      const minDim = Math.min(sourceWidth, sourceHeight);
      const cropX = (sourceWidth - minDim) / 2;
      const cropY = (sourceHeight - minDim) / 2;
      
      console.log('📸 Redimensionnement:', {
        source: `${sourceWidth}x${sourceHeight}`,
        crop: `${minDim}x${minDim} à (${cropX}, ${cropY})`,
        target: `${targetSize}x${targetSize}`
      });

      // Fond blanc pour le cas où le canvas est transparent
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetSize, targetSize);
      
      // Dessiner le canvas WebGL redimensionné
      ctx.drawImage(
        canvas,
        cropX, cropY, minDim, minDim,  // Source (crop carré)
        0, 0, targetSize, targetSize    // Destination 512x512
      );

      // Convertir le canvas temporaire en blob
      return new Promise((resolve, reject) => {
        tempCanvas.toBlob((blob) => {
          if (!blob) {
            console.error('❌ Blob null retourné');
            reject(new Error('Impossible de capturer l\'image'));
            return;
          }
          console.log('✅ Preview 512x512 créé:', blob.size, 'bytes');
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (err) {
      console.error('❌ Erreur lors de la capture:', err);
      return null;
    }
  };

  /**
   * Upload l'image de prévisualisation vers Supabase Storage
   */
  const uploadPreview = async (blob: Blob, configId: string): Promise<string | null> => {
    try {
      const filename = `preview-${configId}-${Date.now()}.png`;
      console.log('📤 Upload du preview vers Supabase...', {
        filename,
        blobSize: blob.size
      });
      
      const { data, error } = await supabase.storage
        .from('configurations')
        .upload(filename, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Erreur upload preview:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('configurations')
        .getPublicUrl(data.path);

      console.log('✅ Preview uploadé:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('❌ Erreur lors de l\'upload:', err);
      return null;
    }
  };

  /**
   * Obtenir le prochain numéro de commande disponible
   */
  const getNextOrderNumber = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('order_number')
        .not('order_number', 'is', null)
        .order('order_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Erreur récupération numéro:', error);
        return 1; // Fallback au numéro 1
      }

      const lastOrderNumber = data?.[0]?.order_number || 0;
      return lastOrderNumber + 1;
    } catch (err) {
      console.error('❌ Erreur génération numéro:', err);
      return 1;
    }
  };

  /**
   * Vérifier le nombre de configurations d'un client
   */
  const checkConfigurationLimit = async (customerEmail: string): Promise<{ canSave: boolean; count: number }> => {
    try {
      const { data, error, count } = await supabase
        .from('configurations')
        .select('id', { count: 'exact' })
        .eq('customer_email', customerEmail)
        .eq('status', 'saved');

      if (error) {
        console.error('❌ Erreur vérification limite:', error);
        return { canSave: true, count: 0 }; // En cas d'erreur, autoriser la sauvegarde
      }

      const configCount = count || 0;
      console.log(`📊 Client a ${configCount} configuration(s) sauvegardée(s)`);
      
      return {
        canSave: configCount < 10,
        count: configCount,
      };
    } catch (err) {
      console.error('❌ Erreur vérification limite:', err);
      return { canSave: true, count: 0 };
    }
  };

  /**
   * Sauvegarder la configuration dans Supabase
   */
  const saveConfiguration = async (
    configData: ConfigurationData
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('💾 Sauvegarde de la configuration dans Supabase...');

      // Compléter le customerEmail depuis l'URL s'il manque
      if (!configData.customerEmail && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const emailFromUrl = params.get('customer_email');
        if (emailFromUrl) {
          configData.customerEmail = emailFromUrl;
        }
      }

      // Vérifier la limite de configurations si un email est fourni
      if (configData.customerEmail) {
        const { canSave, count } = await checkConfigurationLimit(configData.customerEmail);
        
        if (!canSave) {
          throw new Error(`Limite de 10 configurations atteinte (${count}/10). Supprimez une configuration existante pour en sauvegarder une nouvelle.`);
        }
      }

      // Extraire variantId et productId
      const variantId = configData.variantId || null;
      const productId = configData.productId || null;

      // 1. Vérifier s'il existe déjà une configuration draft dans l'URL
      let existingConfig: any = null;
      let existingOrderNumber: number | null = null;
      
      try {
        const params = new URLSearchParams(window.location.search);
        const configIdParam = params.get('config');
        
        if (configIdParam) {
          console.log('🔍 Vérification configuration existante:', configIdParam);
          
          // Si c'est un numéro formaté (5 chiffres), chercher par order_number
          if (/^\d{5}$/.test(configIdParam)) {
            const orderNumber = parseInt(configIdParam, 10);
            const { data: configByOrderNumber } = await supabase
              .from('configurations')
              .select('*')
              .eq('order_number', orderNumber)
              .single();
            
            if (configByOrderNumber) {
              existingConfig = configByOrderNumber;
              existingOrderNumber = configByOrderNumber.order_number;
              console.log('✅ Configuration draft trouvée par order_number:', existingConfig.id, `#${String(existingOrderNumber).padStart(5, '0')}`);
            }
          } else {
            // Sinon, chercher par UUID
            const { data: configById } = await supabase
              .from('configurations')
              .select('*')
              .eq('id', configIdParam)
              .single();
            
            if (configById) {
              existingConfig = configById;
              existingOrderNumber = configById.order_number;
              console.log('✅ Configuration draft trouvée par UUID:', existingConfig.id, `#${String(existingOrderNumber).padStart(5, '0')}`);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Erreur lors de la recherche de configuration existante:', err);
        // Continuer avec la création d'une nouvelle configuration
      }

      // 2. Si une configuration draft existe, la mettre à jour
      if (existingConfig && existingConfig.status === 'draft') {
        console.log('📝 Mise à jour de la configuration draft existante:', existingConfig.id);
        
        const { data: updatedConfig, error: updateError } = await supabase
          .from('configurations')
          .update({
            config_data: configData,
            customer_email: configData.customerEmail,
            status: 'saved'
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erreur mise à jour config:', updateError);
          throw new Error('Erreur lors de la mise à jour de la configuration');
        }

        const savedConfigId = updatedConfig.id;
        console.log('✅ Configuration mise à jour:', savedConfigId, `#${String(existingOrderNumber).padStart(5, '0')}`);
        
        // 3. Capturer et uploader la preview
        const previewPromise = (async () => {
          try {
            console.log('📸 Début capture du preview...');
            const previewBlob = await captureCurrentView();
            
            if (previewBlob) {
              console.log('✅ Blob capturé:', previewBlob.size, 'bytes');
              const previewUrl = await uploadPreview(previewBlob, savedConfigId);
              
              if (previewUrl) {
                console.log('📤 Mise à jour de la configuration avec preview URL...');
                const { error: updateError } = await supabase
                  .from('configurations')
                  .update({ preview_image_url: previewUrl })
                  .eq('id', savedConfigId);
                
                if (updateError) {
                  console.error('❌ Erreur mise à jour preview:', updateError);
                  return null;
                } else {
                  console.log('✅ Preview uploadé et configuré');
                  (window as any).lastPreviewUrl = previewUrl;
                  return previewUrl;
                }
              } else {
                console.error('❌ previewUrl est null');
                return null;
              }
            } else {
              console.error('❌ previewBlob est null');
              return null;
            }
          } catch (err) {
            console.error('⚠️ Erreur upload preview:', err);
            return null;
          }
        })();

        (window as any).previewPromise = previewPromise;
        setConfigId(savedConfigId);
        return savedConfigId;
      }

      // 3. Sinon, créer une nouvelle configuration
      const nextOrderNumber = await getNextOrderNumber();
      console.log(`🔢 Attribution numéro de commande: #${String(nextOrderNumber).padStart(5, '0')}`);
      
      const { data: config, error: insertError } = await supabase
        .from('configurations')
        .insert({
          order_number: nextOrderNumber,
          config_data: configData,
          customer_email: configData.customerEmail,
          status: 'saved'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion config:', insertError);
        throw new Error('Erreur lors de la sauvegarde');
      }

      const savedConfigId = config.id;
      console.log('✅ Configuration créée:', savedConfigId, `#${String(nextOrderNumber).padStart(5, '0')}`);

          // 3. Capturer et uploader la preview AVANT de permettre l'ajout au panier
          // Attendre que l'aperçu soit prêt pour l'ajout au panier
          const previewPromise = (async () => {
            try {
              console.log('📸 Début capture du preview...');
              const previewBlob = await captureCurrentView();
              
              if (previewBlob) {
                console.log('✅ Blob capturé:', previewBlob.size, 'bytes');
                const previewUrl = await uploadPreview(previewBlob, savedConfigId);
                
                if (previewUrl) {
                  console.log('📤 Mise à jour de la configuration avec preview URL...');
                  // Mettre à jour la config avec l'URL du preview
                  const { error: updateError } = await supabase
                    .from('configurations')
                    .update({ preview_image_url: previewUrl })
                    .eq('id', savedConfigId);
                  
                  if (updateError) {
                    console.error('❌ Erreur mise à jour preview:', updateError);
                    return null;
                  } else {
                    console.log('✅ Preview uploadé et configuré');
                    // Stocker l'URL du preview pour l'utiliser dans addToCart
                    (window as any).lastPreviewUrl = previewUrl;
                    return previewUrl;
                  }
                } else {
                  console.error('❌ previewUrl est null');
                  return null;
                }
              } else {
                console.error('❌ previewBlob est null');
                return null;
              }
            } catch (err) {
              console.error('⚠️ Erreur upload preview:', err);
              return null;
            }
          })();

          // Stocker la promesse pour l'utiliser dans addToCart
          (window as any).previewPromise = previewPromise;

      setConfigId(savedConfigId);
      return savedConfigId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur détaillée:', err);
      setError(errorMessage);
      
      // Si c'est une erreur de limite, on throw pour afficher le modal
      if (errorMessage.includes('Limite de 10 configurations')) {
        throw err;
      }
      
      // Pour les autres erreurs, fallback: continuer le flux avec un ID local pour ne pas bloquer l'ajout au panier
      const fallbackId = crypto.randomUUID();
      console.warn('⚠️ Fallback configuration ID utilisé:', fallbackId);
      setConfigId(fallbackId);
      return fallbackId;
    } finally {
      setIsLoading(false);
    }
  };

      /**
       * Ajouter au panier Shopify
       */
      const addToCart = async (
        configData: ConfigurationData,
        quantity: number = 1,
        size?: string,
        options: AddToCartOptions = {}
      ): Promise<AddToCartResult> => {
        try {
          setIsLoading(true);
          setError(null);

          // Afficher la modal de chargement dès le début
          showLoadingModal();

          // 1. Sauvegarder d'abord la configuration
          const savedConfigId = await saveConfiguration(configData);

          if (!savedConfigId) {
            throw new Error('Impossible de sauvegarder la configuration');
          }

          // 2. Récupérer la configuration pour obtenir son order_number
          const { data: savedConfig } = await supabase
            .from('configurations')
            .select('order_number')
            .eq('id', savedConfigId)
            .single();

          const orderNumber = savedConfig?.order_number || 0;
          console.log('🔢 Order number récupéré:', orderNumber);

          // 3. Attendre que l'aperçu soit prêt (si disponible)
          let previewUrl: string | null = null;
          try {
            // Attendre la promesse avec un timeout
            previewUrl = await Promise.race([
              (window as any).previewPromise,
              new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000))
            ]);
            
            // Si la promesse n'a pas été résolue, essayer lastPreviewUrl
            if (!previewUrl && (window as any).lastPreviewUrl) {
              previewUrl = (window as any).lastPreviewUrl;
              console.log('🖼️ Aperçu récupéré depuis lastPreviewUrl:', previewUrl);
            } else if (previewUrl) {
              console.log('🖼️ Aperçu récupéré depuis previewPromise:', previewUrl);
            }
          } catch (err) {
            console.warn('⚠️ Aperçu non disponible:', err);
            // Essayer lastPreviewUrl en fallback
            if ((window as any).lastPreviewUrl) {
              previewUrl = (window as any).lastPreviewUrl;
              console.log('🖼️ Aperçu récupéré depuis lastPreviewUrl (fallback):', previewUrl);
            }
          }

          // 4. Vérifier que Shopify config est fourni
          if (!shopifyConfig?.productId) {
            throw new Error('Configuration Shopify manquante');
          }

          // 4.5. Déterminer le variantId final (avant de construire l'URL)
          // Essayer plusieurs sources: shopifyConfig, configData, ou URL
          let finalVariantId = shopifyConfig.variantId;
          
          if (!finalVariantId && configData.variantId) {
            console.log('⚠️ Variant ID non trouvé dans shopifyConfig, utilisation depuis configData');
            finalVariantId = String(configData.variantId);
          }
          
          if (!finalVariantId) {
            // Essayer depuis l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const urlVariantId = urlParams.get('variantId');
            if (urlVariantId) {
              console.log('⚠️ Variant ID non trouvé dans shopifyConfig/configData, utilisation depuis URL');
              finalVariantId = urlVariantId;
            }
          }
          
          if (!finalVariantId) {
            throw new Error('Variant ID manquant. Veuillez rouvrir cette configuration depuis "Mon compte".');
          }

          console.log('🔍 Variant ID utilisé:', finalVariantId);

          // 5. Préparer les propriétés du line item
          // Utiliser le numéro formaté comme identifiant principal
          const configNumber = String(orderNumber).padStart(5, '0');
          
          // Construire l'URL de configuration avec tous les paramètres nécessaires
          const configUrl = new URL(`${window.location.origin}/configure`);
          configUrl.searchParams.set('config', configNumber);
          if (shopifyConfig.shopDomain) {
            configUrl.searchParams.set('shop', shopifyConfig.shopDomain);
          }
          if (shopifyConfig.productId) {
            configUrl.searchParams.set('productId', String(shopifyConfig.productId));
          }
          if (finalVariantId) {
            configUrl.searchParams.set('variantId', String(finalVariantId));
          }
          
          const properties: Record<string, string> = {
            // Propriétés techniques cachées (commençant par _)
            '_configuration_id': configNumber, // Utiliser le numéro formaté comme ID principal
            '_configuration_uuid': savedConfigId, // Garder l'UUID pour compatibilité
            '_order_number': String(orderNumber),
            '_configuration_url': configUrl.toString(), // URL complète avec tous les paramètres
          };
          
          // Ajouter la preview image URL si disponible
          if (previewUrl) {
            properties['_preview_url'] = previewUrl;
            properties['_aperçu_url'] = previewUrl; // Pour compatibilité avec le code Liquid existant
          }

          // PROPRIÉTÉS VISIBLES AU CLIENT (seulement Taille, Nom, Numéro)
          // Taille (toujours affichée en premier si présente)
          if (size) {
            properties['Taille'] = size;
            properties['_size'] = size; // Aussi en propriété cachée pour traitement interne
          }

          // Nom et Numéro
          if (configData.texts && configData.texts.length > 0) {
            const nomText = configData.texts.find(t => t.category === 'nom');
            const numeroText = configData.texts.find(t => t.category === 'numero');
            
            if (nomText) properties['Nom'] = nomText.content;
            if (numeroText) properties['Numéro'] = numeroText.content;
          }

          // PROPRIÉTÉS SUPPRIMÉES (couleurs et aperçu non visibles au client)
          // Les couleurs et l'aperçu ne sont plus affichés dans les propriétés visibles

      // 6. Ajouter au panier Shopify via Storefront API ou redirection
      console.log('🛒 Ajout au panier Shopify...', {
        productId: shopifyConfig.productId,
        variantId: finalVariantId,
        quantity,
        properties
      });

      // Utilisons le format /cart/add avec POST via formulaire pour aller au panier
      const cartUrl = `https://${shopifyConfig.shopDomain}/cart/add`;
      
      console.log('🛒 URL finale du panier:', cartUrl);
      console.log('📦 Configuration sauvegardée avec ID:', savedConfigId);
      console.log('🔧 Propriétés:', properties);
      
      // Workaround : Stocker les propriétés dans Supabase et rediriger vers Shopify
      // On ne peut pas ajouter au panier avec propriétés à cause de CORS
      // Solution : Enregistrer un "cart_token" dans Supabase et créer un script Shopify
      // qui récupère les propriétés depuis Supabase après redirection
      
      console.log('🛒 Méthode alternative : redirection avec cart token');
      console.log('📝 Variant ID:', finalVariantId);
      console.log('📝 Configuration ID:', savedConfigId);
      
      // Stocker un "cart token" dans Supabase et mettre le statut à "ordered"
      try {
        const updateData: any = {
          cart_token: savedConfigId,
          cart_created_at: new Date().toISOString(),
          status: 'ordered' // Marquer comme commandé
        };
        
        // Ajouter la taille si fournie
        if (size) {
          updateData.size = size;
        }
        
        const { error: updateError } = await supabase
          .from('configurations')
          .update(updateData)
          .eq('id', savedConfigId);
        
        if (updateError) {
          console.error('⚠️ Erreur mise à jour cart token:', updateError);
        } else {
          console.log('✅ Cart token enregistré et statut mis à jour: ordered');
        }
      } catch (err) {
        console.warn('⚠️ Impossible d\'enregistrer le cart token:', err);
      }
      
      // Rediriger vers une page "bridge" sur Shopify qui fera le POST localement
      // Cette page évite les problèmes CORS car elle est sur le même domaine que Shopify
      // Sanitize IDs (Shopify attend des entiers décimaux)
      const safeVariantId = String(finalVariantId ?? '').replace(/[^0-9]/g, '');
      const safeProductId = String(shopifyConfig.productId ?? '').replace(/[^0-9]/g, '');
      const safeQuantity = String(quantity ?? 1).replace(/[^0-9]/g, '') || '1';

      // Utiliser le numéro formaté (configNumber) au lieu de l'UUID (savedConfigId) dans l'URL
      let redirectUrl = `https://${shopifyConfig.shopDomain}/pages/cart-add-bridge?variant_id=${encodeURIComponent(safeVariantId)}&quantity=${encodeURIComponent(safeQuantity)}&config_id=${encodeURIComponent(configNumber)}&product_id=${encodeURIComponent(safeProductId)}`;
      
      // Ajouter l'URL de preview si disponible
      if (previewUrl) {
        redirectUrl += `&preview_url=${encodeURIComponent(previewUrl)}`;
      }
      
      // Ajouter les propriétés personnalisées à l'URL avec le préfixe prop_
      // Seulement les propriétés visibles (pas celles commençant par _)
      for (const [key, value] of Object.entries(properties)) {
        if (value && typeof value === 'string' && !key.startsWith('_')) {
          const encodedKey = encodeURIComponent(`prop_${key}`);
          const encodedValue = encodeURIComponent(value);
          redirectUrl += `&${encodedKey}=${encodedValue}`;
        }
      }
      
      console.log('📤 Redirection vers bridge Shopify:', redirectUrl);
      console.log('💡 Configuration ID:', savedConfigId);
      console.log('💡 Product ID:', safeProductId);
      console.log('💡 Variant ID (final):', safeVariantId);
      console.log('💡 Variant ID sources:', {
        shopifyConfig: shopifyConfig.variantId,
        configData: configData.variantId,
        final: finalVariantId,
        safe: safeVariantId
      });
      console.log('💡 Propriétés ajoutées à l\'URL:', properties);
      console.log('💡 La page bridge fera le POST local pour ajouter au panier');

      const successPayload: AddToCartSuccess = {
        success: true,
        redirectUrl,
        configId: savedConfigId,
        configNumber,
      };

      if (options?.skipRedirect) {
        hideLoadingModal();
        return successPayload;
      }
      
      // Envoyer un message au parent pour fermer le modal (si dans un iframe)
      if (typeof window !== 'undefined' && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'closeCustomizer',
            action: 'close',
            redirectToCart: true
          }, '*'); // Utiliser '*' pour permettre la communication avec n'importe quel parent
          console.log('📤 Message envoyé au parent pour fermer le modal');
        } catch (err) {
          console.warn('⚠️ Impossible d\'envoyer le message au parent:', err);
        }
      }

      // Attendre un peu pour que l'utilisateur voie le message de chargement
      setTimeout(() => {
        if (options?.openInNewTab) {
          const newWindow = window.open(redirectUrl, '_blank', 'noopener,noreferrer');
          if (!newWindow) {
            const anchor = document.createElement('a');
            anchor.href = redirectUrl;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.click();
          }
        } else {
        // Rediriger vers la page bridge Shopify
        window.location.href = redirectUrl;
        }
      }, 2000);
      
      return successPayload;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur:', err);
      alert('❌ Erreur : ' + errorMessage);
      hideLoadingModal();
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Récupérer une configuration existante
   */
  const loadConfiguration = async (
    configId: string
  ): Promise<ConfigurationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Chargement configuration avec ID:', configId);
      
      // Utiliser l'API route au lieu de la requête directe Supabase pour éviter les problèmes RLS
      // L'API route utilise le service role key côté serveur
      const response = await fetch(`/api/configurations/${encodeURIComponent(configId)}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Configuration non trouvée avec l'ID: ${configId}`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      
      if (!config) {
        console.error('❌ Configuration non trouvée dans les résultats');
        throw new Error(`Configuration non trouvée avec l'ID: ${configId}`);
      }
      
      console.log('✅ Configuration trouvée:', config.id, 'Status:', config.status);

      // Retourner config_data avec preview_image_url et variantId
      // Le variantId peut être au niveau racine de config OU dans config_data
      const variantIdFromConfig = config.variantId || config.config_data?.variantId;
      const configData: ConfigurationData = {
        ...config.config_data,
        preview_image_url: config.preview_image_url,
        variantId: variantIdFromConfig
      };
      
      console.log('🔍 loadConfiguration - variantId sources:', {
        config_variantId: config.variantId,
        config_data_variantId: config.config_data?.variantId,
        final: variantIdFromConfig
      });

      return configData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Charger toutes les configurations d'un client
   */
  const loadCustomerConfigurations = async (customerEmail: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📥 Chargement des configurations du client:', customerEmail);

      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('customer_email', customerEmail)
        .eq('status', 'saved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement configurations:', error);
        throw new Error('Impossible de charger les configurations');
      }

      console.log(`✅ ${data.length} configuration(s) chargée(s)`);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprimer une configuration
   */
  const deleteConfiguration = async (configId: string, customerEmail: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗑️ Suppression de la configuration:', configId);

      // Vérifier que la configuration appartient bien au client
      const { error } = await supabase
        .from('configurations')
        .delete()
        .eq('id', configId)
        .eq('customer_email', customerEmail);

      if (error) {
        console.error('❌ Erreur suppression config:', error);
        throw new Error('Impossible de supprimer la configuration');
      }

      console.log('✅ Configuration supprimée');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Capturer un aperçu du viewer 3D (vue de face, comme dans le panier)
   */
  const capturePreview = async (): Promise<string | null> => {
    try {
      console.log('📸 Début capture du preview (vue de face)...');
      
      // Déclencher le reset de la caméra vers la position initiale (vue de face)
      window.dispatchEvent(new CustomEvent('resetCameraToFront'));
      
      // Attendre que la caméra se positionne
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trouver le canvas du viewer 3D
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('❌ Canvas du viewer 3D non trouvé');
        return null;
      }

      console.log('📏 Taille du canvas:', canvas.width, 'x', canvas.height);

      // Créer un nouveau canvas avec fond blanc
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Impossible de créer le contexte 2D');
        return null;
      }

      // Remplir avec un fond blanc
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Dessiner le canvas 3D par-dessus
      ctx.drawImage(canvas, 0, 0);

      // Capturer l'image du canvas temporaire
      const dataURL = tempCanvas.toDataURL('image/png', 0.95);
      console.log('✅ Aperçu capturé avec fond blanc (vue de face):', dataURL.substring(0, 50) + '...', 'Taille:', Math.round(dataURL.length / 1024), 'KB');
      
      return dataURL;
    } catch (error) {
      console.error('❌ Erreur lors de la capture:', error);
      return null;
    }
  };

  return {
    isLoading,
    error,
    configId,
    saveConfiguration,
    addToCart,
    loadConfiguration,
    loadCustomerConfigurations,
    deleteConfiguration,
    checkConfigurationLimit,
    capturePreview,
  };
}

