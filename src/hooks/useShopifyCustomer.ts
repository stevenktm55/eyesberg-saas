import { useState, useEffect } from 'react';

interface ShopifyCustomer {
  email: string;
  firstName?: string;
  lastName?: string;
  id?: string;
}

export function useShopifyCustomer(shopDomain?: string) {
  const [customer, setCustomer] = useState<ShopifyCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkCustomerStatus = async () => {
      if (!shopDomain) {
        setIsLoading(false);
        return;
      }

      try {
        // Désactiver la vérification CORS directe vers /account
        // Cette méthode cause des erreurs CORS car configurator.stretchmx.com 
        // ne peut pas accéder à stretchmx.com/account
        
        console.log('🔍 Vérification client Shopify désactivée (CORS)');
        
        // Essayer de récupérer les infos du client depuis les métadonnées de la page
        const customerData = await getCustomerDataFromShopify(shopDomain);
        
        if (customerData) {
          setCustomer(customerData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkCustomerStatus();
  }, [shopDomain]);

  return {
    customer,
    isLoggedIn,
    isLoading,
  };
}

/**
 * Récupère les données du client depuis Shopify
 * Cette fonction peut être appelée depuis une page Shopify qui expose window.ShopifyAnalytics
 */
async function getCustomerDataFromShopify(shopDomain: string): Promise<ShopifyCustomer | null> {
  try {
    // Méthode 1: Vérifier si on est dans un iframe ou embed Shopify
    if (typeof window !== 'undefined' && (window as any).ShopifyAnalytics) {
      const analytics = (window as any).ShopifyAnalytics;
      if (analytics.meta?.page?.customerId) {
        return {
          id: analytics.meta.page.customerId,
          email: analytics.meta.page.customerEmail || '',
        };
      }
    }

    // Méthode 2: Vérifier les URL params (si on redirige depuis Shopify)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const customerEmail = params.get('customer_email');
      
      if (customerEmail) {
        return {
          email: customerEmail,
        };
      }
    }

    // Méthode 3: Appeler une API route qui vérifie le cookie Shopify
    const response = await fetch('/api/shopify/customer', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.customer) {
        return data.customer;
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des données client:', error);
    return null;
  }
}

