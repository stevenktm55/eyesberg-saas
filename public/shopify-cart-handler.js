/**
 * Script Shopify pour gérer l'ajout au panier après configuration
 * À ajouter dans theme.liquid
 */

(function() {
  'use strict';

  /**
   * Vérifier si on revient du configurateur avec des données
   */
  function checkForConfigurationData() {
    const params = new URLSearchParams(window.location.search);
    
    if (!params.has('stretchmx_config_id')) {
      return; // Pas de configuration, rien à faire
    }

    console.log('[StretchMX Cart] Configuration détectée dans l\'URL');

    // Récupérer toutes les données
    const configId = params.get('stretchmx_config_id');
    const variantId = params.get('stretchmx_variant_id');
    const quantity = parseInt(params.get('stretchmx_quantity') || '1');
    
    const colorPrimary = params.get('stretchmx_color_primary');
    const colorSecondary = params.get('stretchmx_color_secondary');
    const colorTertiary = params.get('stretchmx_color_tertiary');

    // Récupérer tous les textes
    const texts = [];
    let textIndex = 1;
    while (params.has(`stretchmx_text_${textIndex}`)) {
      texts.push(params.get(`stretchmx_text_${textIndex}`));
      textIndex++;
    }

    // Préparer les propriétés pour Shopify
    const properties = {
      '_configuration_id': configId,
      '_configuration_url': `${window.location.origin.replace(window.location.hostname, window.location.hostname)}/configure?config=${configId}`,
    };

    if (colorPrimary) properties['Couleur Primaire'] = colorPrimary;
    if (colorSecondary) properties['Couleur Secondaire'] = colorSecondary;
    if (colorTertiary) properties['Couleur Tertiaire'] = colorTertiary;

    texts.forEach((text, index) => {
      properties[`Texte ${index + 1}`] = text;
    });

    console.log('[StretchMX Cart] Ajout au panier avec propriétés:', properties);

    // Ajouter au panier via l'API Shopify Ajax
    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', quantity.toString());
    
    Object.entries(properties).forEach(([key, value]) => {
      formData.append(`properties[${key}]`, value);
    });

    fetch('/cart/add.js', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      console.log('[StretchMX Cart] ✅ Produit ajouté au panier:', data);
      
      // Nettoyer l'URL (enlever les paramètres stretchmx)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Afficher une notification ou rediriger vers le panier
      if (confirm('✅ Produit personnalisé ajouté au panier !\n\nVoulez-vous voir votre panier ?')) {
        window.location.href = '/cart';
      }
    })
    .catch(error => {
      console.error('[StretchMX Cart] ❌ Erreur lors de l\'ajout au panier:', error);
      alert('Erreur lors de l\'ajout au panier. Veuillez réessayer.');
    });
  }

  // Attendre que la page soit chargée
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForConfigurationData);
  } else {
    checkForConfigurationData();
  }

})();












