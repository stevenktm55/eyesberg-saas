/**
 * Fonctions pour gérer les Script Tags Shopify automatiquement
 * Permet d'injecter du JavaScript dans toutes les pages de la boutique
 * sans modification manuelle du thème
 */

const SCRIPT_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/shopify-integration-auto.js`
  : process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/shopify-integration-auto.js`
  : 'https://www.eyesberg.app/shopify-integration-auto.js';

/**
 * Crée le script tag pour injecter automatiquement le configurateur
 */
export async function createScriptTag(shop: string, accessToken: string) {
  try {
    // Vérifier si le script tag existe déjà
    const existing = await checkScriptTagExists(shop, accessToken);
    if (existing) {
      console.log('✅ Script tag existe déjà, pas besoin de le recréer');
      return { success: true, message: 'Script tag already exists' };
    }

    // Créer le script tag via l'API REST Admin
    const response = await fetch(`https://${shop}/admin/api/2025-01/script_tags.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload', // Le script se charge quand la page est chargée
          src: SCRIPT_URL,
          display_scope: 'online_store', // Seulement sur le storefront, pas dans l'admin
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur lors de la création du script tag:', errorText);
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Script tag créé avec succès:', data.script_tag?.id);
    
    return { 
      success: true, 
      scriptTag: data.script_tag,
      message: 'Script tag created successfully' 
    };
  } catch (error) {
    console.error('❌ Erreur lors de la création du script tag:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Vérifie si un script tag existe déjà pour cette URL
 */
export async function checkScriptTagExists(shop: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/script_tags.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const scriptTags = data.script_tags || [];

    // Vérifier si un script tag avec cette URL existe déjà
    return scriptTags.some((tag: any) => tag.src === SCRIPT_URL);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des script tags:', error);
    return false;
  }
}

/**
 * Supprime le script tag (lors de la désinstallation)
 */
export async function deleteScriptTag(shop: string, accessToken: string) {
  try {
    // Récupérer tous les script tags
    const response = await fetch(`https://${shop}/admin/api/2025-01/script_tags.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    const scriptTags = data.script_tags || [];

    // Trouver et supprimer le script tag correspondant
    const scriptTag = scriptTags.find((tag: any) => tag.src === SCRIPT_URL);
    
    if (!scriptTag) {
      console.log('ℹ️ Script tag non trouvé, rien à supprimer');
      return { success: true, message: 'Script tag not found' };
    }

    // Supprimer le script tag
    const deleteResponse = await fetch(
      `https://${shop}/admin/api/2025-01/script_tags/${scriptTag.id}.json`,
      {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Erreur HTTP: ${deleteResponse.status} - ${errorText}`);
    }

    console.log('✅ Script tag supprimé avec succès');
    return { success: true, message: 'Script tag deleted successfully' };
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du script tag:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

