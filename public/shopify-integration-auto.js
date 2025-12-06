/**
 * Script d'intégration automatique StretchMX Configurator pour Shopify
 * Version: 2.0.0 - Auto-détection avec modal
 * 
 * Ce script s'injecte automatiquement et détecte les produits avec le tag "customizer"
 * Aucune modification de code Shopify nécessaire !
 * 
 * Installation : Ajouter ce script dans theme.liquid avant </body>
 * <script src="https://VOTRE_URL/shopify-integration-auto.js" defer></script>
 */

(function() {
  'use strict';

  // Configuration - L'URL sera détectée automatiquement
  const CONFIG = {
    // Tag pour identifier les produits configurables
    productTag: 'customizer',
    
    // Style du bouton
    buttonStyle: {
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '15px 30px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      transition: 'all 0.2s ease',
    },
    
    // Texte du bouton
    buttonText: 'PERSONNALISER',
  };

  /**
   * Détecter l'URL du configurateur automatiquement
   * Le script essaie de détecter depuis où il est chargé
   */
  function getConfiguratorUrl() {
    // Si le script est chargé depuis le configurateur lui-même, utiliser cette URL
    const scriptTag = document.querySelector('script[src*="shopify-integration-auto"]');
    if (scriptTag) {
      const scriptSrc = scriptTag.src;
      const url = new URL(scriptSrc);
      return url.origin; // Retourne https://votre-domaine.vercel.app
    }
    
    // Sinon, utiliser une URL par défaut (à configurer)
    // Vous pouvez aussi utiliser une variable d'environnement ou un meta tag
    const metaTag = document.querySelector('meta[name="stretchmx-configurator-url"]');
    if (metaTag) {
      return metaTag.content;
    }
    
    // Fallback : utiliser window.location si on est sur le configurateur
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('eyesberg')) {
      return window.location.origin;
    }
    
    console.warn('[StretchMX] URL du configurateur non détectée. Veuillez ajouter un meta tag: <meta name="stretchmx-configurator-url" content="https://votre-url.vercel.app">');
    return null;
  }

  /**
   * Vérifier si le produit actuel est configurable
   */
  function isProductConfigurable() {
    // Méthode 1: Vérifier les tags du produit via ShopifyAnalytics
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      const productTags = window.ShopifyAnalytics.meta.product?.tags || [];
      if (productTags.includes(CONFIG.productTag)) {
        return true;
      }
    }

    // Méthode 2: Vérifier dans le JSON-LD du produit
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        if (data['@type'] === 'Product' && data.category && data.category.includes(CONFIG.productTag)) {
          return true;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Méthode 3: Vérifier un attribut data sur le body ou le formulaire
    const bodyTag = document.body.getAttribute('data-product-tags');
    if (bodyTag && bodyTag.includes(CONFIG.productTag)) {
      return true;
    }

    const form = document.querySelector('form[action*="/cart/add"]');
    if (form && form.dataset.productTags && form.dataset.productTags.includes(CONFIG.productTag)) {
      return true;
    }

    // Méthode 4: Vérifier dans les meta tags
    const productTagsMeta = document.querySelector('meta[property="product:tag"]');
    if (productTagsMeta && productTagsMeta.content.includes(CONFIG.productTag)) {
      return true;
    }

    return false;
  }

  /**
   * Récupérer les informations du produit
   */
  function getProductInfo() {
    let productId = null;
    let variantId = null;
    let shopDomain = window.Shopify?.shop || window.location.hostname.replace('.myshopify.com', '');

    // Récupérer depuis ShopifyAnalytics
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      productId = window.ShopifyAnalytics.meta.product?.id;
      variantId = window.ShopifyAnalytics.meta.product?.variants?.[0]?.id || 
                  window.ShopifyAnalytics.meta.product?.selected_or_first_available_variant?.id;
    }

    // Alternative: depuis le formulaire
    if (!variantId) {
      const form = document.querySelector('form[action*="/cart/add"]');
      if (form) {
        const variantInput = form.querySelector('input[name="id"], select[name="id"]');
        if (variantInput) {
          variantId = variantInput.value || variantInput.options?.[variantInput.selectedIndex]?.value;
        }
        
        // Récupérer productId depuis data attributes
        productId = form.dataset.productId || 
                   form.querySelector('[data-product-id]')?.dataset.productId ||
                   form.querySelector('[data-productid]')?.dataset.productid;
      }
    }

    // Alternative: depuis l'URL
    if (!productId) {
      const urlMatch = window.location.pathname.match(/\/products\/([^\/\?]+)/);
      if (urlMatch) {
        // On a le handle, mais on va essayer de récupérer l'ID depuis le JSON-LD
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent);
            if (data['@type'] === 'Product' && data.productID) {
              productId = data.productID;
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    return {
      productId,
      variantId,
      shopDomain,
    };
  }

  /**
   * Construire l'URL du configurateur
   */
  function buildConfiguratorUrl() {
    const configuratorBaseUrl = getConfiguratorUrl();
    if (!configuratorBaseUrl) {
      console.error('[StretchMX] Impossible de déterminer l\'URL du configurateur');
      return null;
    }

    const productInfo = getProductInfo();
    const params = new URLSearchParams({
      shop: productInfo.shopDomain,
    });

    if (productInfo.productId) {
      params.append('productId', productInfo.productId);
    }

    if (productInfo.variantId) {
      params.append('variantId', productInfo.variantId);
    }

    // Ajouter l'email du client si connecté
    if (window.Shopify && window.Shopify.customer && window.Shopify.customer.email) {
      params.append('customer_email', window.Shopify.customer.email);
    }

    return `${configuratorBaseUrl}/configure?${params.toString()}`;
  }

  /**
   * Créer le modal pour le configurateur
   */
  function createModal() {
    // Vérifier si le modal existe déjà
    if (document.getElementById('stretchmx-modal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'stretchmx-modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 99999;
      overflow: auto;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: relative;
      width: 95%;
      max-width: 1400px;
      height: 95%;
      max-height: 900px;
      margin: 2.5% auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
    `;

    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      flex-shrink: 0;
    `;

    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'Personnalisez votre produit';
    modalTitle.style.cssText = 'margin: 0; color: #333; font-size: 18px; font-weight: 600;';

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.onclick = closeModal;

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    const iframe = document.createElement('iframe');
    iframe.id = 'stretchmx-iframe';
    iframe.style.cssText = `
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    `;
    iframe.setAttribute('allow', 'camera; microphone; fullscreen');

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);

    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });

    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Ouvrir le modal avec le configurateur
   */
  function openModal() {
    const modal = createModal();
    const iframe = document.getElementById('stretchmx-iframe');
    const configuratorUrl = buildConfiguratorUrl();

    if (!configuratorUrl) {
      alert('Erreur : Impossible de charger le configurateur. Veuillez contacter le support.');
      return;
    }

    iframe.src = configuratorUrl;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    console.log('[StretchMX] Modal ouvert avec URL:', configuratorUrl);
  }

  /**
   * Fermer le modal
   */
  function closeModal() {
    const modal = document.getElementById('stretchmx-modal');
    if (modal) {
      modal.style.display = 'none';
      const iframe = document.getElementById('stretchmx-iframe');
      if (iframe) {
        iframe.src = '';
      }
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Créer le bouton de personnalisation
   */
  function createConfiguratorButton() {
    // Vérifier si le bouton existe déjà
    if (document.querySelector('.stretchmx-configurator-button')) {
      return null;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stretchmx-configurator-button';
    button.textContent = CONFIG.buttonText;
    
    // Appliquer les styles
    Object.assign(button.style, CONFIG.buttonStyle);
    
    // Effet hover
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#333333';
      button.style.transform = 'scale(1.02)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = CONFIG.buttonStyle.backgroundColor;
      button.style.transform = 'scale(1)';
    });

    // Action au clic
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });

    return button;
  }

  /**
   * Remplacer ou insérer le bouton
   */
  function insertConfiguratorButton() {
    // Trouver le formulaire d'ajout au panier
    const addToCartForm = document.querySelector('form[action*="/cart/add"]');
    
    if (!addToCartForm) {
      console.warn('[StretchMX] Formulaire d\'ajout au panier non trouvé');
      return;
    }

    // Trouver le bouton "Add to Cart"
    let addToCartButton = addToCartForm.querySelector('button[name="add"], button[type="submit"], input[type="submit"]');
    
    // Si pas trouvé, chercher plus largement
    if (!addToCartButton) {
      addToCartButton = addToCartForm.querySelector('.product-form__submit, [class*="add-to-cart"], [class*="addToCart"]');
    }

    if (!addToCartButton) {
      // Dernier recours : chercher un bouton qui contient "ajouter" ou "add"
      const buttons = Array.from(addToCartForm.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('ajouter') || text.includes('add to cart') || text.includes('add')) {
          addToCartButton = btn;
          break;
        }
      }
    }

    if (!addToCartButton) {
      console.warn('[StretchMX] Bouton d\'ajout au panier non trouvé');
      return;
    }

    // Créer le bouton
    const configuratorButton = createConfiguratorButton();
    if (!configuratorButton) {
      return; // Bouton déjà présent
    }

    // Remplacer le bouton "Add to Cart" par le bouton "Personnaliser"
    // On cache le bouton Add to Cart au lieu de le supprimer
    addToCartButton.style.display = 'none';
    addToCartButton.setAttribute('data-stretchmx-hidden', 'true');

    // Insérer le bouton personnaliser à la place
    addToCartButton.parentNode.insertBefore(configuratorButton, addToCartButton);

    console.log('[StretchMX] ✅ Bouton de personnalisation ajouté avec succès');
  }

  /**
   * Écouter les messages du configurateur pour fermer le modal
   */
  function setupMessageListener() {
    window.addEventListener('message', (event) => {
      const configuratorUrl = getConfiguratorUrl();
      if (!configuratorUrl) return;

      // Vérifier l'origine pour la sécurité
      try {
        const eventOrigin = new URL(event.origin);
        const configuratorOrigin = new URL(configuratorUrl);
        
        if (eventOrigin.origin !== configuratorOrigin.origin) {
          return; // Ignorer les messages d'autres origines
        }
      } catch (e) {
        return;
      }

      // Écouter les messages de fermeture
      if (event.data === 'closeCustomizer' || 
          event.data?.type === 'closeCustomizer' ||
          event.data?.action === 'close') {
        closeModal();
        
        // Rediriger vers le panier si demandé
        if (event.data?.redirectToCart) {
          window.location.href = '/cart';
        }
      }
    });
  }

  /**
   * Initialiser le script
   */
  function init() {
    // Vérifier si on est sur une page produit
    const isProductPage = window.location.pathname.includes('/products/');
    
    if (!isProductPage) {
      return;
    }

    // Attendre que le DOM soit chargé
    const checkAndInsert = () => {
      // Vérifier si le produit est configurable
      if (!isProductConfigurable()) {
        return;
      }

      // Insérer le bouton
      insertConfiguratorButton();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Attendre un peu pour que Shopify charge ses données
        setTimeout(checkAndInsert, 500);
      });
    } else {
      // DOM déjà chargé, attendre un peu pour que Shopify charge ses données
      setTimeout(checkAndInsert, 500);
    }

    // Réessayer périodiquement au cas où le DOM change (thèmes dynamiques)
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
      if (isProductConfigurable() && !document.querySelector('.stretchmx-configurator-button')) {
        insertConfiguratorButton();
        retryCount++;
        if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
        }
      } else {
        clearInterval(retryInterval);
      }
    }, 1000);
  }

  // Démarrer l'initialisation
  setupMessageListener();
  init();

  // Exposer une API publique pour personnalisation avancée
  window.StretchMXConfigurator = {
    config: CONFIG,
    isProductConfigurable,
    getProductInfo,
    buildConfiguratorUrl,
    openModal,
    closeModal,
    insertButton: insertConfiguratorButton,
    version: '2.0.0-auto'
  };

  console.log('[StretchMX] Script auto-détection chargé - Version 2.0.0');

})();


