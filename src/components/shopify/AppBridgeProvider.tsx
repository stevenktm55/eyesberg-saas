'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { AppBridge } from '@shopify/app-bridge';

/**
 * Context pour partager App Bridge entre les composants
 */
const AppBridgeContext = createContext<AppBridge | null>(null);

/**
 * Hook pour accéder à App Bridge
 */
export function useAppBridge() {
  return useContext(AppBridgeContext);
}

/**
 * Provider pour App Bridge Shopify
 * Permet d'intégrer l'app dans l'admin Shopify (embedded app)
 * 
 * En mode embedded app, Shopify fournit automatiquement :
 * - 'host' : Token de session (ex: "abc123.ngrok.io/admin")
 * - 'shop' : Domaine de la boutique (ex: "boutique.myshopify.com")
 * 
 * Ces paramètres sont ajoutés automatiquement par Shopify dans l'URL de l'iframe.
 */
export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const [appBridge, setAppBridge] = useState<AppBridge | null>(null);

  useEffect(() => {
    // Récupérer les paramètres de l'URL (fournis par Shopify en mode embedded)
    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get('host') || '';
    const shop = urlParams.get('shop') || '';

    // L'API key est le Client ID (doit être accessible côté client)
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID || '';

    if (host && apiKey) {
      // Mode embedded app - App Bridge initialisé
      try {
        const bridge = new AppBridge({
          host,
          apiKey,
        });
        setAppBridge(bridge);
        console.log('✅ App Bridge initialisé pour l\'embedded app', { shop, host: host.substring(0, 20) + '...' });
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation d\'App Bridge:', error);
      }
    } else {
      // Mode standalone (développement local ou app non embarquée)
      if (shop) {
        console.warn('⚠️  App Bridge non initialisé : host manquant dans l\'URL. Mode standalone activé.');
        console.info('💡 Pour tester en mode embedded app, configure l\'app dans Shopify Partner Dashboard');
      }
    }
  }, []);

  return (
    <AppBridgeContext.Provider value={appBridge}>
      {children}
    </AppBridgeContext.Provider>
  );
}

