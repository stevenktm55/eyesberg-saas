"use client";

/**
 * ConfiguratorViewer - Composant réutilisable pour le viewer 3D + sidebar blanche
 * 
 * Ce composant peut être utilisé :
 * 1. Dans la page /configure (version client, sans zones noires admin)
 * 2. Dans le builder admin (version admin, avec zones noires autour)
 * 
 * Props:
 * - mode: 'client' | 'admin' - Mode d'affichage (client = plein écran, admin = dans builder)
 * - productId: ID du produit (optionnel, pour charger la config)
 * - shopDomain: Domaine Shopify (optionnel)
 * - onSave?: Callback quand l'utilisateur sauvegarde
 * - onAddToCart?: Callback quand l'utilisateur ajoute au panier
 */

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { ShopifyAddToCart } from "@/components/ShopifyAddToCart";
import { useShopifyIntegration, AddToCartSuccess } from "@/hooks/useShopifyIntegration";
import { useShopifyCustomer } from "@/hooks/useShopifyCustomer";
import { ShopifyLoginModal } from "@/components/ShopifyLoginModal";
import SizeSelectionModal from "@/components/SizeSelectionModal";
import { LinkedProductPromptModal } from "@/components/LinkedProductPromptModal";
import Image from "next/image";

// TODO: Extraire les types et hooks de ClientPage.tsx
// Pour l'instant, ce fichier est un stub qui sera complété

export default function ConfiguratorViewer({
  mode = 'client',
  productId,
  shopDomain,
  onSave,
  onAddToCart,
}: {
  mode?: 'client' | 'admin';
  productId?: string | null;
  shopDomain?: string | null;
  onSave?: () => void;
  onAddToCart?: () => void;
}) {
  // TODO: Implémenter la logique complète en extrayant le code de ClientPage.tsx
  // Pour l'instant, retourner un placeholder
  return (
    <div className="h-full flex">
      <div className="w-20 bg-gray-50 p-2 flex flex-col gap-2 flex-shrink-0">
        {/* Sidebar avec onglets */}
        <p className="text-xs text-center text-gray-500">Sidebar</p>
      </div>
      <div className="flex-1 bg-gray-100">
        {/* Viewer 3D */}
        <p className="text-center text-gray-500 mt-20">Viewer 3D</p>
      </div>
    </div>
  );
}

