/**
 * Script d'intégration automatique Eyesberg Configurator pour Shopify
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

  // Log immédiat pour confirmer que le script se charge
  console.log('[Eyesberg] 🚀 Script shopify-integration-auto.js chargé');
  console.log('[Eyesberg] 📍 URL actuelle:', window.location.href);
  console.log('[Eyesberg] 📍 Pathname:', window.location.pathname);

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
      const origin = url.origin; // Retourne https://www.eyesberg.app
      console.log('[Eyesberg] URL du configurateur détectée depuis le script tag:', origin);
      return origin;
    }
    
    // Sinon, utiliser une URL par défaut (à configurer)
    // Vous pouvez aussi utiliser une variable d'environnement ou un meta tag
    const metaTag = document.querySelector('meta[name="eyesberg-configurator-url"]');
    if (metaTag) {
      console.log('[Eyesberg] URL du configurateur détectée depuis meta tag:', metaTag.content);
      return metaTag.content;
    }
    
    // Fallback : utiliser une URL par défaut
    const defaultUrl = 'https://www.eyesberg.app';
    console.log('[Eyesberg] Utilisation de l\'URL par défaut du configurateur:', defaultUrl);
    return defaultUrl;
  }

  /**
   * Vérifier si le produit actuel est configurable
   */
  function isProductConfigurable() {
    console.log('[Eyesberg] 🔍 Vérification si le produit est configurable...');
    
    // Méthode 1: Vérifier les tags du produit via ShopifyAnalytics (méthode principale)
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta) {
      const productTags = window.ShopifyAnalytics.meta.product?.tags || [];
      console.log('[Eyesberg] Tags depuis ShopifyAnalytics:', productTags);
      
      // Les tags peuvent être un tableau ou une chaîne séparée par des virgules
      const tagsArray = Array.isArray(productTags) 
        ? productTags 
        : (typeof productTags === 'string' ? productTags.split(',').map(t => t.trim()) : []);
      
      if (tagsArray.some(tag => tag.toLowerCase() === CONFIG.productTag.toLowerCase())) {
        console.log('[Eyesberg] ✅ Produit configurable détecté via ShopifyAnalytics');
        return true;
      }
    } else {
      console.log('[Eyesberg] ⚠️ ShopifyAnalytics non disponible ou incomplet');
    }

    // Méthode 2: Vérifier dans le JSON-LD du produit
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        if (data['@type'] === 'Product') {
          // Vérifier dans category ou dans un champ tags
          if (data.category && data.category.includes(CONFIG.productTag)) {
            console.log('[Eyesberg] ✅ Produit configurable détecté via JSON-LD (category)');
            return true;
          }
          // Certains thèmes mettent les tags dans un autre champ
          if (data.tags && (Array.isArray(data.tags) ? data.tags : data.tags.split(',')).some((tag) => tag.trim().toLowerCase() === CONFIG.productTag.toLowerCase())) {
            console.log('[Eyesberg] ✅ Produit configurable détecté via JSON-LD (tags)');
            return true;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    // Méthode 3: Vérifier dans le HTML - chercher les éléments avec data-product-tags
    const bodyTag = document.body.getAttribute('data-product-tags');
    if (bodyTag && bodyTag.toLowerCase().includes(CONFIG.productTag.toLowerCase())) {
      console.log('[Eyesberg] ✅ Produit configurable détecté via data-product-tags (body)');
      return true;
    }

    const form = document.querySelector('form[action*="/cart/add"]');
    if (form) {
      const formTags = form.getAttribute('data-product-tags') || form.dataset.productTags;
      if (formTags && formTags.toLowerCase().includes(CONFIG.productTag.toLowerCase())) {
        console.log('[Eyesberg] ✅ Produit configurable détecté via data-product-tags (form)');
        return true;
      }
    }

    // Méthode 3b: Chercher dans tous les éléments avec des attributs data contenant "tag"
    const allDataAttributes = document.querySelectorAll('[data-product-tag], [data-tags], [data-tag]');
    for (const elem of allDataAttributes) {
      const tagValue = elem.getAttribute('data-product-tag') || 
                      elem.getAttribute('data-tags') || 
                      elem.getAttribute('data-tag') || '';
      if (tagValue.toLowerCase().includes(CONFIG.productTag.toLowerCase())) {
        console.log('[Eyesberg] ✅ Produit configurable détecté via attribut data:', tagValue);
        return true;
      }
    }

    // Méthode 4: Vérifier dans les meta tags
    const productTagsMeta = document.querySelector('meta[property="product:tag"]');
    if (productTagsMeta && productTagsMeta.content.toLowerCase().includes(CONFIG.productTag.toLowerCase())) {
      console.log('[Eyesberg] ✅ Produit configurable détecté via meta tag');
      return true;
    }

    // Méthode 5: Chercher dans tout le HTML pour le tag (dernier recours)
    const htmlContent = document.documentElement.innerHTML.toLowerCase();
    if (htmlContent.includes(`"${CONFIG.productTag}"`) || htmlContent.includes(`'${CONFIG.productTag}'`)) {
      console.log('[Eyesberg] ✅ Produit configurable détecté via recherche HTML');
      return true;
    }

    // Méthode 6: Utiliser l'API Shopify pour récupérer les tags (si disponible)
    // Certains thèmes exposent les données du produit dans window.Shopify
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
      // Essayer de récupérer les tags depuis l'API si possible
      const productHandle = window.location.pathname.match(/\/products\/([^\/\?]+)/)?.[1];
      if (productHandle) {
        console.log('[Eyesberg] 🔍 Tentative de récupération des tags via API pour:', productHandle);
        // Note: Cette méthode nécessiterait un appel API, mais on peut essayer de trouver les tags dans le DOM
      }
    }

    // Méthode 7: Chercher dans les meta tags ou data attributes du produit
    const productMetaTags = document.querySelectorAll('meta[property*="product"]');
    for (const meta of productMetaTags) {
      const content = meta.getAttribute('content') || '';
      if (content.toLowerCase().includes(CONFIG.productTag.toLowerCase())) {
        console.log('[Eyesberg] ✅ Produit configurable détecté via meta tag product');
        return true;
      }
    }

    // Méthode 8: Chercher dans les scripts inline qui contiennent les données du produit
    const inlineScripts = document.querySelectorAll('script:not([src])');
    for (const script of inlineScripts) {
      const scriptContent = script.textContent || '';
      // Chercher des patterns comme "tags":["customizer"] ou tags: "customizer" ou "customizer" dans un contexte de tags
      if (scriptContent.includes(CONFIG.productTag)) {
        // Vérifier que c'est bien dans un contexte de tags (pas juste une coïncidence)
        const tagPattern = new RegExp(`(tags|tag)[\\s:=]+["']?[^"']*${CONFIG.productTag}[^"']*["']?`, 'i');
        if (tagPattern.test(scriptContent)) {
          console.log('[Eyesberg] ✅ Produit configurable détecté via script inline');
          return true;
        }
      }
    }

    // Méthode 9: Utiliser l'API publique JSON de Shopify pour récupérer les tags
    // Cette méthode fonctionne même si ShopifyAnalytics n'est pas disponible
    const productHandle = window.location.pathname.match(/\/products\/([^\/\?]+)/)?.[1];
    if (productHandle && !window.__eyesberg_tag_check_done) {
      // Marquer pour éviter les appels multiples
      window.__eyesberg_tag_check_done = true;
      console.log('[Eyesberg] 🔍 Tentative de récupération des tags via API publique pour:', productHandle);
      
      // Utiliser l'API publique JSON (ne nécessite pas de token)
      const shopDomain = window.Shopify?.shop || window.location.hostname.replace('.myshopify.com', '');
      if (shopDomain) {
        fetch(`https://${shopDomain}.myshopify.com/products/${productHandle}.json`)
          .then(response => response.json())
          .then(data => {
            const product = data.product;
            if (product && product.tags) {
              const tags = typeof product.tags === 'string' 
                ? product.tags.split(',').map(t => t.trim())
                : product.tags;
              
              console.log('[Eyesberg] Tags récupérés via API publique:', tags);
              
              if (tags.some(tag => tag.toLowerCase() === CONFIG.productTag.toLowerCase())) {
                console.log('[Eyesberg] ✅ Produit configurable détecté via API publique');
                // Insérer le bouton maintenant
                if (!document.querySelector('.eyesberg-configurator-button')) {
                  insertConfiguratorButton();
                }
              }
            }
          })
          .catch(error => {
            console.warn('[Eyesberg] ⚠️ Impossible de récupérer les tags via API publique:', error);
          });
      }
    }

    console.log('[Eyesberg] ⚠️ Produit non configurable - tag "customizer" non trouvé');
    console.log('[Eyesberg] 💡 Astuce: Vérifiez que le tag "customizer" est bien présent sur le produit dans Shopify Admin');
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
      console.error('[Eyesberg] Impossible de déterminer l\'URL du configurateur');
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
    if (document.getElementById('eyesberg-modal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'eyesberg-modal';
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
      width: 100%;
      height: 100%;
      margin: 0;
      background: white;
      border-radius: 0;
      overflow: hidden;
      box-shadow: none;
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
    iframe.id = 'eyesberg-iframe';
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
    const iframe = document.getElementById('eyesberg-iframe');
    const configuratorUrl = buildConfiguratorUrl();

    if (!configuratorUrl) {
      alert('Erreur : Impossible de charger le configurateur. Veuillez contacter le support.');
      return;
    }

    iframe.src = configuratorUrl;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    console.log('[Eyesberg] Modal ouvert avec URL:', configuratorUrl);
  }

  /**
   * Fermer le modal
   */
  function closeModal() {
    const modal = document.getElementById('eyesberg-modal');
    if (modal) {
      modal.style.display = 'none';
      const iframe = document.getElementById('eyesberg-iframe');
      if (iframe) {
        iframe.src = '';
      }
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Copier les styles calculés d'un élément
   */
  function copyComputedStyles(source, target) {
    const computed = window.getComputedStyle(source);
    const stylesToCopy = [
      'backgroundColor', 'color', 'fontFamily', 'fontSize', 'fontWeight',
      'fontStyle', 'textTransform', 'letterSpacing', 'lineHeight',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'border', 'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
      'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
      'display', 'flexDirection', 'justifyContent', 'alignItems',
      'cursor', 'transition', 'textAlign', 'boxShadow', 'textDecoration'
    ];

    stylesToCopy.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        target.style.setProperty(prop, value);
      }
    });
  }

  /**
   * Obtenir les styles hover d'un élément en simulant le hover
   */
  function getHoverStyles(element) {
    const hoverStyles = {};
    const normalStyle = window.getComputedStyle(element);
    
    // Méthode 1: Utiliser getComputedStyle avec :hover (fonctionne si l'élément supporte les pseudo-classes)
    try {
      const hoverComputed = window.getComputedStyle(element, ':hover');
      const normalColor = normalStyle.color;
      const normalBg = normalStyle.backgroundColor;
      const normalBorder = normalStyle.borderColor;
      
      if (hoverComputed.color && hoverComputed.color !== normalColor) {
        hoverStyles.color = hoverComputed.color;
      }
      if (hoverComputed.backgroundColor && hoverComputed.backgroundColor !== normalBg) {
        hoverStyles.backgroundColor = hoverComputed.backgroundColor;
      }
      if (hoverComputed.borderColor && hoverComputed.borderColor !== normalBorder) {
        hoverStyles.borderColor = hoverComputed.borderColor;
      }
      if (hoverComputed.opacity && hoverComputed.opacity !== normalStyle.opacity) {
        hoverStyles.opacity = hoverComputed.opacity;
      }
    } catch (e) {
      // Ignorer
    }
    
    // Méthode 2: Si la méthode 1 n'a pas fonctionné, simuler le hover en ajoutant une classe
    if (!hoverStyles.color && !hoverStyles.backgroundColor) {
      // Créer un clone invisible pour tester le hover
      const clone = element.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.visibility = 'hidden';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);
      
      // Simuler le hover en déclenchant mouseenter
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true });
      clone.dispatchEvent(mouseEnterEvent);
      
      // Attendre un peu pour que les styles s'appliquent
      setTimeout(() => {
        try {
          const hoverStyle = window.getComputedStyle(clone);
          if (hoverStyle.color !== normalStyle.color) {
            hoverStyles.color = hoverStyle.color;
          }
          if (hoverStyle.backgroundColor !== normalStyle.backgroundColor) {
            hoverStyles.backgroundColor = hoverStyle.backgroundColor;
          }
          if (hoverStyle.borderColor !== normalStyle.borderColor) {
            hoverStyles.borderColor = hoverStyle.borderColor;
          }
        } catch (e) {
          // Ignorer
        } finally {
          document.body.removeChild(clone);
        }
      }, 50);
    }
    
    return hoverStyles;
  }

  /**
   * Créer le bouton de personnalisation en copiant les styles du bouton original
   */
  function createConfiguratorButton(originalButton) {
    // Vérifier si le bouton existe déjà
    if (document.querySelector('.eyesberg-configurator-button')) {
      return null;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'eyesberg-configurator-button';
    button.textContent = CONFIG.buttonText;
    
    // Si on a un bouton original, copier ses styles
    if (originalButton) {
      // Copier les classes CSS (sauf celles spécifiques au bouton original)
      const originalClasses = originalButton.className.split(' ').filter(c => c && !c.includes('add-to-cart'));
      if (originalClasses.length > 0) {
        button.className += ' ' + originalClasses.join(' ');
      }

      // Copier les styles calculés
      copyComputedStyles(originalButton, button);

      // Copier les attributs data-* et autres attributs utiles
      Array.from(originalButton.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') && !attr.name.includes('eyesberg')) {
          button.setAttribute(attr.name, attr.value);
        }
      });
    } else {
      // Fallback : utiliser les styles par défaut
      Object.assign(button.style, CONFIG.buttonStyle);
    }
    
    // S'assurer que le bouton est cliquable
    button.style.cursor = 'pointer';
    
    // Obtenir les styles hover du bouton original
    let hoverStyles = {};
    if (originalButton) {
      // Capturer les styles normaux
      const normalStyle = window.getComputedStyle(originalButton);
      const normalColor = normalStyle.color;
      const normalBg = normalStyle.backgroundColor;
      const normalBorder = normalStyle.borderColor;
      
      // Méthode la plus fiable : simuler le hover sur le bouton original AVANT de le cacher
      // On va temporairement forcer le hover en ajoutant une classe ou en utilisant getComputedStyle
      try {
        const hoverComputed = window.getComputedStyle(originalButton, ':hover');
        
        // Comparer avec les styles normaux
        if (hoverComputed.color && hoverComputed.color !== normalColor) {
          hoverStyles.color = hoverComputed.color;
        }
        if (hoverComputed.backgroundColor && hoverComputed.backgroundColor !== normalBg) {
          hoverStyles.backgroundColor = hoverComputed.backgroundColor;
        }
        if (hoverComputed.borderColor && hoverComputed.borderColor !== normalBorder) {
          hoverStyles.borderColor = hoverComputed.borderColor;
        }
        if (hoverComputed.opacity && hoverComputed.opacity !== normalStyle.opacity) {
          hoverStyles.opacity = hoverComputed.opacity;
        }
      } catch (e) {
        // Si getComputedStyle avec :hover ne fonctionne pas, utiliser une autre méthode
        console.log('[Eyesberg] ⚠️ Impossible de détecter les styles hover directement');
      }
    }
    
    // Stocker les styles normaux du nouveau bouton
    const buttonNormalStyle = window.getComputedStyle(button);
    const buttonNormalColor = button.style.color || buttonNormalStyle.color;
    const buttonNormalBg = button.style.backgroundColor || buttonNormalStyle.backgroundColor;
    const buttonNormalBorder = button.style.borderColor || buttonNormalStyle.borderColor;
    
    // Effet hover avec les styles du bouton original
    button.addEventListener('mouseenter', () => {
      // Appliquer les styles hover si disponibles
      if (hoverStyles.color) {
        button.style.color = hoverStyles.color;
      }
      if (hoverStyles.backgroundColor) {
        button.style.backgroundColor = hoverStyles.backgroundColor;
      }
      if (hoverStyles.borderColor) {
        button.style.borderColor = hoverStyles.borderColor;
      }
      if (hoverStyles.opacity) {
        button.style.opacity = hoverStyles.opacity;
      }
      
      // Si les styles hover n'ont pas été détectés, essayer de les obtenir dynamiquement
      if (!hoverStyles.color && !hoverStyles.backgroundColor && originalButton) {
        // Utiliser getComputedStyle avec :hover en temps réel
        try {
          const hoverComputed = window.getComputedStyle(originalButton, ':hover');
          const normalComputed = window.getComputedStyle(originalButton);
          
          if (hoverComputed.color !== normalComputed.color) {
            button.style.color = hoverComputed.color;
          }
          if (hoverComputed.backgroundColor !== normalComputed.backgroundColor) {
            button.style.backgroundColor = hoverComputed.backgroundColor;
          }
          if (hoverComputed.borderColor !== normalComputed.borderColor) {
            button.style.borderColor = hoverComputed.borderColor;
          }
        } catch (e) {
          // Ignorer
        }
      }
    });
    
    button.addEventListener('mouseleave', () => {
      // Restaurer les styles normaux
      button.style.color = buttonNormalColor;
      button.style.backgroundColor = buttonNormalBg;
      button.style.borderColor = buttonNormalBorder;
      if (hoverStyles.opacity) {
        button.style.opacity = '1';
      }
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
    // Méthode 1: Trouver le formulaire d'ajout au panier
    let addToCartForm = document.querySelector('form[action*="/cart/add"]');
    
    // Méthode 2: Si pas de formulaire, chercher un conteneur de produit
    if (!addToCartForm) {
      addToCartForm = document.querySelector('[data-product-form], .product-form, .product__form, #product-form');
    }

    // Méthode 3: Chercher dans les sections produit
    if (!addToCartForm) {
      const productSections = document.querySelectorAll('[class*="product"], [id*="product"]');
      for (const section of productSections) {
        const form = section.querySelector('form');
        if (form && (form.action.includes('/cart/add') || form.querySelector('button[name="add"]'))) {
          addToCartForm = form;
          break;
        }
      }
    }

    // Trouver le bouton "Add to Cart" - plusieurs méthodes
    let addToCartButton = null;
    let insertContainer = null;

    if (addToCartForm) {
      // Chercher dans le formulaire
      addToCartButton = addToCartForm.querySelector('button[name="add"], button[type="submit"], input[type="submit"]');
      
      if (!addToCartButton) {
        addToCartButton = addToCartForm.querySelector('.product-form__submit, [class*="add-to-cart"], [class*="addToCart"], [class*="add-to-cart-button"]');
      }

      if (!addToCartButton) {
        // Chercher un bouton qui contient "ajouter" ou "add"
        const buttons = Array.from(addToCartForm.querySelectorAll('button, input[type="submit"]'));
        for (const btn of buttons) {
          const text = (btn.textContent || btn.value || '').toLowerCase();
          if (text.includes('ajouter') || text.includes('add to cart') || text.includes('add') || text.includes('acheter') || text.includes('buy')) {
            addToCartButton = btn;
            break;
          }
        }
      }

      insertContainer = addToCartForm;
    }

    // Si pas trouvé dans le formulaire, chercher directement dans la page
    if (!addToCartButton) {
      // Chercher tous les boutons qui pourraient être "Add to Cart"
      const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      for (const btn of allButtons) {
        const text = (btn.textContent || btn.value || '').toLowerCase();
        const name = btn.name || '';
        const className = btn.className || '';
        
        if (
          name === 'add' ||
          text.includes('add to cart') ||
          text.includes('ajouter au panier') ||
          text.includes('acheter') ||
          className.includes('add-to-cart') ||
          className.includes('addToCart') ||
          className.includes('product-form__submit')
        ) {
          addToCartButton = btn;
          insertContainer = btn.parentElement;
          break;
        }
      }
    }

    // Si toujours pas trouvé, chercher dans les zones communes
    if (!addToCartButton) {
      // Zones communes où se trouve généralement le bouton
      const commonSelectors = [
        '.product-single__form',
        '.product-form',
        '.product__form',
        '[data-product-form]',
        '.product-actions',
        '.product__actions',
        '.product-buy',
        '.product__buy',
        '#product-form',
        '.product-form-container',
      ];

      for (const selector of commonSelectors) {
        const container = document.querySelector(selector);
        if (container) {
          const btn = container.querySelector('button, input[type="submit"]');
          if (btn) {
            addToCartButton = btn;
            insertContainer = container;
            break;
          }
        }
      }
    }

    // Si vraiment rien n'est trouvé, insérer le bouton dans le body ou un conteneur principal
    if (!addToCartButton && !insertContainer) {
      // Dernier recours : chercher un conteneur principal de produit
      const productMain = document.querySelector('main, .main-content, [role="main"], .product-main, .product-single');
      if (productMain) {
        insertContainer = productMain;
        console.log('[Eyesberg] ⚠️ Bouton Add to Cart non trouvé, insertion dans le conteneur principal');
      } else {
        console.warn('[Eyesberg] ⚠️ Impossible de trouver où insérer le bouton');
        return;
      }
    }

    // Créer le bouton en copiant les styles du bouton original
    const configuratorButton = createConfiguratorButton(addToCartButton);
    if (!configuratorButton) {
      return; // Bouton déjà présent
    }

    // Si on a trouvé le bouton Add to Cart, le cacher
    if (addToCartButton) {
      addToCartButton.style.display = 'none';
      addToCartButton.setAttribute('data-eyesberg-hidden', 'true');
      
      // Insérer le bouton personnaliser à la place exacte du bouton original
      if (addToCartButton.parentNode) {
        addToCartButton.parentNode.insertBefore(configuratorButton, addToCartButton);
      } else {
        insertContainer.appendChild(configuratorButton);
      }
    } else {
      // Sinon, insérer dans le conteneur trouvé
      if (insertContainer) {
        insertContainer.appendChild(configuratorButton);
      }
    }

    console.log('[Eyesberg] ✅ Bouton de personnalisation ajouté avec succès (styles copiés du bouton original)');
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
        console.log('[Eyesberg] ⏳ Attente du chargement complet...');
        setTimeout(checkAndInsert, 1000); // Augmenté à 1 seconde pour laisser plus de temps
      });
    } else {
      // DOM déjà chargé, attendre un peu pour que Shopify charge ses données
      console.log('[Eyesberg] ⏳ DOM déjà chargé, attente du chargement complet...');
      setTimeout(checkAndInsert, 1000); // Augmenté à 1 seconde
    }

    // Réessayer périodiquement au cas où le DOM change (thèmes dynamiques)
    let retryCount = 0;
    const maxRetries = 15; // Augmenté le nombre de tentatives
    const retryInterval = setInterval(() => {
      const isConfigurable = isProductConfigurable();
      const buttonExists = !!document.querySelector('.eyesberg-configurator-button');
      
      console.log(`[Eyesberg] 🔄 Tentative ${retryCount + 1}/${maxRetries} - Configurable: ${isConfigurable}, Bouton existe: ${buttonExists}`);
      
      if (isConfigurable && !buttonExists) {
        console.log('[Eyesberg] ✅ Insertion du bouton (tentative ' + (retryCount + 1) + ')');
        insertConfiguratorButton();
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('[Eyesberg] ⚠️ Nombre maximum de tentatives atteint');
          clearInterval(retryInterval);
        }
      } else if (buttonExists) {
        console.log('[Eyesberg] ✅ Bouton déjà présent, arrêt des tentatives');
        clearInterval(retryInterval);
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('[Eyesberg] ⚠️ Produit non configurable après ' + maxRetries + ' tentatives');
          clearInterval(retryInterval);
        }
      }
    }, 1500); // Augmenté l'intervalle à 1.5 secondes
  }

  // Démarrer l'initialisation
  console.log('[Eyesberg] 🔧 Initialisation du script...');
  setupMessageListener();
  init();
  console.log('[Eyesberg] ✅ Initialisation terminée');

  // Exposer une API publique pour personnalisation avancée
  window.EyesbergConfigurator = {
    config: CONFIG,
    isProductConfigurable,
    getProductInfo,
    buildConfiguratorUrl,
    openModal,
    closeModal,
    insertButton: insertConfiguratorButton,
    version: '2.0.0-auto'
  };

  console.log('[Eyesberg] ✅ Script auto-détection chargé - Version 2.0.0');
  console.log('[Eyesberg] ✅ API publique disponible: window.EyesbergConfigurator');

})();


