/**
 * Script d'intégration StretchMX Configurator pour Shopify
 * Version: 1.0.0
 * 
 * Ce script permet d'intégrer le configurateur 3D StretchMX
 * dans vos pages produits Shopify.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // URL de votre configurateur (à remplacer par votre domaine)
    configuratorUrl: 'https://stretchmx-configurator-1flaco22n-steevys-projects.vercel.app',
    
    // Tag pour identifier les produits configurables
    // Ajoutez ce tag aux produits Shopify qui doivent avoir le configurateur
    productTag: 'configurable',
    
    // Position du bouton (avant ou après le bouton "Add to Cart")
    buttonPosition: 'before', // 'before' ou 'after'
    
    // Style du bouton
    buttonStyle: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      padding: '16px 32px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      marginBottom: '16px',
      transition: 'all 0.2s ease',
    },
    
    // Texte du bouton
    buttonText: '🎨 Personnaliser ce produit',
    
    // Ouvrir dans une nouvelle fenêtre ou modal
    openInNewWindow: true,
  };

  /**
   * Vérifier si le produit actuel est configurable
   */
  function isProductConfigurable() {
    // Méthode 1: Vérifier les tags du produit
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      const productTags = window.ShopifyAnalytics.meta.product?.tags || [];
      if (productTags.includes(CONFIG.productTag)) {
        return true;
      }
    }

    // Méthode 2: Vérifier un metafield spécifique
    const metafield = document.querySelector('[data-stretchmx-configurable]');
    if (metafield) {
      return metafield.dataset.stretchmxConfigurable === 'true';
    }

    // Méthode 3: Vérifier un attribut data sur le formulaire
    const form = document.querySelector('form[action*="/cart/add"]');
    if (form && form.dataset.configurable === 'true') {
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
    let shopDomain = window.Shopify?.shop || window.location.hostname;

    // Récupérer l'ID du produit
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      productId = window.ShopifyAnalytics.meta.product?.id;
      variantId = window.ShopifyAnalytics.meta.product?.variants?.[0]?.id;
    }

    // Alternative: depuis le formulaire
    if (!productId) {
      const form = document.querySelector('form[action*="/cart/add"]');
      if (form) {
        const productIdInput = form.querySelector('input[name="id"]');
        if (productIdInput) {
          variantId = productIdInput.value;
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

    return `${CONFIG.configuratorUrl}/configure?${params.toString()}`;
  }

  /**
   * Créer le bouton de personnalisation
   */
  function createConfiguratorButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stretchmx-configurator-button';
    button.textContent = CONFIG.buttonText;
    
    // Appliquer les styles
    Object.assign(button.style, CONFIG.buttonStyle);
    
    // Effet hover
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#2563eb';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = CONFIG.buttonStyle.backgroundColor;
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    // Action au clic
    button.addEventListener('click', () => {
      const configuratorUrl = buildConfiguratorUrl();
      
      if (CONFIG.openInNewWindow) {
        // Ouvrir dans une nouvelle fenêtre
        const width = Math.min(1400, window.screen.width * 0.9);
        const height = Math.min(900, window.screen.height * 0.9);
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        window.open(
          configuratorUrl,
          'StretchMX Configurator',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
      } else {
        // Naviguer vers le configurateur
        window.location.href = configuratorUrl;
      }
    });

    return button;
  }

  /**
   * Insérer le bouton dans la page
   */
  function insertConfiguratorButton() {
    // Trouver le formulaire d'ajout au panier
    const addToCartForm = document.querySelector('form[action*="/cart/add"]');
    
    if (!addToCartForm) {
      console.warn('[StretchMX] Formulaire d\'ajout au panier non trouvé');
      return;
    }

    // Trouver le bouton "Add to Cart"
    const addToCartButton = addToCartForm.querySelector('[name="add"], button[type="submit"], input[type="submit"]');
    
    if (!addToCartButton) {
      console.warn('[StretchMX] Bouton d\'ajout au panier non trouvé');
      return;
    }

    // Créer le bouton
    const configuratorButton = createConfiguratorButton();

    // Insérer le bouton
    if (CONFIG.buttonPosition === 'before') {
      addToCartButton.parentNode.insertBefore(configuratorButton, addToCartButton);
    } else {
      addToCartButton.parentNode.insertBefore(configuratorButton, addToCartButton.nextSibling);
    }

    console.log('[StretchMX] Bouton de personnalisation ajouté avec succès');
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

    // Vérifier si le produit est configurable
    if (!isProductConfigurable()) {
      console.log('[StretchMX] Produit non configurable');
      return;
    }

    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', insertConfiguratorButton);
    } else {
      insertConfiguratorButton();
    }
  }

  /**
   * Écouter les changements de variante Shopify
   */
  function watchVariantChanges() {
    // Écouter les événements de changement de variante
    document.addEventListener('change', (event) => {
      const target = event.target;
      
      // Si c'est un sélecteur de variante
      if (target.name && (target.name.includes('id') || target.name.includes('variant'))) {
        // Mettre à jour l'URL du configurateur si le bouton existe déjà
        const button = document.querySelector('.stretchmx-configurator-button');
        if (button) {
          // Le bouton est déjà là, on met juste à jour son comportement
          console.log('[StretchMX] Variante changée, mise à jour du bouton');
        }
      }
    });
  }

  // Démarrer l'initialisation
  init();
  watchVariantChanges();

  // Exposer une API publique pour personnalisation avancée
  window.StretchMXConfigurator = {
    config: CONFIG,
    isProductConfigurable,
    getProductInfo,
    buildConfiguratorUrl,
    insertButton: insertConfiguratorButton,
  };

})();

