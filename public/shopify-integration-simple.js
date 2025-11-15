/**
 * Script d'intégration StretchMX Configurator pour Shopify
 * Version SIMPLE - Fonctionne sur tous les produits
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // URL de votre configurateur (URL PERMANENTE)
    configuratorUrl: 'https://stretchmx-configurator.vercel.app',
    
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
    
    // Ouvrir dans une nouvelle fenêtre
    openInNewWindow: true,
  };

  /**
   * Récupérer les informations du produit
   */
  function getProductInfo() {
    let productId = null;
    let variantId = null;
    let shopDomain = window.Shopify?.shop || window.location.hostname;

    // Essayer de récupérer depuis le formulaire
    const form = document.querySelector('form[action*="/cart/add"]');
    if (form) {
      const variantInput = form.querySelector('input[name="id"], select[name="id"]');
      if (variantInput) {
        variantId = variantInput.value || variantInput.options?.[variantInput.selectedIndex]?.value;
      }
      
      // Essayer de récupérer le product ID depuis un attribut data
      productId = form.dataset.productId || form.querySelector('[data-product-id]')?.dataset.productId;
    }

    // Alternative : essayer depuis l'URL
    if (!productId) {
      const urlMatch = window.location.pathname.match(/\/products\/([^\/\?]+)/);
      if (urlMatch) {
        // On a le handle du produit, mais pas l'ID
        // On va quand même l'envoyer
        productId = urlMatch[1];
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
      
      console.log('🎨 Opening configurator:', configuratorUrl);
      
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
    // Vérifier si le bouton existe déjà
    if (document.querySelector('.stretchmx-configurator-button')) {
      console.log('[StretchMX] Bouton déjà présent');
      return;
    }

    // NOUVELLE APPROCHE : Trouver le bouton d'abord, puis son conteneur parent
    let addToCartButton = document.querySelector('.product-form__submit');
    
    if (!addToCartButton) {
      addToCartButton = document.querySelector('button[name="add"]');
    }
    
    if (!addToCartButton) {
      addToCartButton = document.querySelector('button[type="submit"][id*="Product"]');
    }
    
    if (!addToCartButton) {
      // Dernier recours : chercher un bouton qui contient "ajouter" ou "add"
      const buttons = document.querySelectorAll('button');
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

    // Insérer le bouton AVANT le bouton Add to Cart
    addToCartButton.parentNode.insertBefore(configuratorButton, addToCartButton);

    console.log('[StretchMX] ✅ Bouton de personnalisation ajouté avec succès');
  }

  /**
   * Initialiser le script
   */
  function init() {
    // Vérifier si on est sur une page produit
    const isProductPage = window.location.pathname.includes('/products/');
    
    if (!isProductPage) {
      console.log('[StretchMX] Pas sur une page produit');
      return;
    }

    console.log('[StretchMX] Initialisation sur page produit');

    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', insertConfiguratorButton);
    } else {
      // DOM déjà chargé, attendre un peu pour que le thème se charge
      setTimeout(insertConfiguratorButton, 500);
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
        console.log('[StretchMX] Variante changée');
      }
    });
  }

  // Démarrer l'initialisation
  init();
  watchVariantChanges();

  // Exposer une API publique
  window.StretchMXConfigurator = {
    config: CONFIG,
    getProductInfo,
    buildConfiguratorUrl,
    insertButton: insertConfiguratorButton,
    version: 'simple-1.0.0'
  };

  console.log('[StretchMX] Script chargé - Version simple');

})();

