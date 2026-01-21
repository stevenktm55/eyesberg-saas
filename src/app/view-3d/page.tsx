"use client";

import { useEffect, useState } from "react";
import ConfiguratorViewer from "@/components/ConfiguratorViewer";
import type { Snapshot } from "@/lib/snapshot-generator";

export default function View3DPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sécuriser une variable globale snapshot pour les anciens scripts
    try {
      const w = window as any;
      if (w.snapshot === undefined) {
        w.snapshot = null;
      }
      if (w.preview === undefined) {
        w.preview = true;
      }
    } catch (e) {
      console.error("❌ Impossible d'initialiser window.snapshot:", e);
    }

    // Bridge de compatibilité pour setCameraView
    if (!(window as any).setCameraView) {
      (window as any).setCameraView = (view: 'front' | 'back' | 'left' | 'right') => {
        try {
          window.dispatchEvent(new CustomEvent('setCameraView', { detail: view }));
        } catch (e) {
          console.error('❌ Erreur dans window.setCameraView bridge:', e);
        }
      };
    }

    // === INJECTION CSS BRUTALE ===
    // On écrit le style directement dans le HTML pour que le navigateur ne puisse pas l'ignorer.
    const style = document.createElement('style');
    style.innerHTML = `
      /* 1. RESET & LAYOUT */
      html, body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: white; }
      #root-preview { display: flex; width: 100%; height: 100%; }

      /* 2. SIDEBAR GAUCHE (ICÔNES) -> BLEUE */
      /* On cible la div de largeur 80px (w-20) */
      div[class*="w-20"] {
        background-color: #2563eb !important; /* BLEU */
        border-right: none !important;
        width: 80px !important;
        min-width: 80px !important;
        display: flex !important;
        flex-direction: column !important;
        z-index: 50 !important;
      }
      /* Icônes et Textes en BLANC dans la sidebar bleue */
      div[class*="w-20"] svg, div[class*="w-20"] span, div[class*="w-20"] button {
        color: white !important;
        fill: white !important;
        border-color: white !important;
      }

      /* 3. PANEL CENTRAL (CONFIG) -> BLANC */
      div[class*="w-[420px]"] {
        width: 420px !important;
        min-width: 420px !important;
        background-color: white !important;
        border-right: 1px solid #e5e7eb !important;
        display: flex !important;
        flex-direction: column !important;
        z-index: 40 !important;
      }

      /* 4. VIEWER 3D -> GRIS */
      /* On cible le conteneur principal du viewer */
      div[class*="bg-gray-100"] {
        background-color: #f3f4f6 !important; /* GRIS CLAIR */
        flex: 1 !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      /* 5. BOUTONS (Sauvegarder / Panier) -> FIXÉS EN BAS */
      /* On cible le footer qui contient "absolute" et "bottom-0" */
      div[class*="absolute"][class*="bottom-0"] {
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        width: 100% !important;
        background: white !important;
        border-top: 1px solid #e5e7eb !important;
        padding: 16px !important;
        display: flex !important;
        justify-content: space-between !important;
        z-index: 30 !important;
        top: auto !important; /* Sécurité anti-bug */
      }

      /* UTILITAIRES DE SECOURS */
      div[class*="flex"] { display: flex !important; }
      div[class*="flex-col"] { flex-direction: column !important; }
      div[class*="items-center"] { align-items: center !important; }
      div[class*="justify-center"] { justify-content: center !important; }
    `;
    document.head.appendChild(style);

    // CHARGEMENT DONNÉES
    try {
      const storedData = localStorage.getItem("preview_snapshot_live");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Patch si URL manquante
        if (parsed.design2D && !parsed.design2D.url && parsed.design2D.svgUrl) {
           parsed.design2D.url = parsed.design2D.svgUrl;
        }
        // Patch Ultime : Si _forceDesignInfo existe, on l'applique
        if (parsed._forceDesignInfo?.url) {
           if (!parsed.design2D) parsed.design2D = {};
           parsed.design2D.url = parsed._forceDesignInfo.url;
           parsed.design2D.thumbnailUrl = parsed._forceDesignInfo.thumbnailUrl;
        }
        // Assigner aussi à window.snapshot pour les scripts legacy
        (window as any).snapshot = parsed;
        setSnapshot(parsed);
      } else {
        setError("Aucune donnée.");
      }
    } catch (e) {
      console.error("❌ Erreur lecture snapshot:", e);
      setError("Erreur lecture.");
    }
  }, []);

  if (error) {
    return <div style={{padding:20, color:'red'}}>{error}</div>;
  }
  
  if (!snapshot) {
    return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}>Chargement...</div>;
  }

  return (
    <main id="root-preview">
      {/* On encapsule ConfiguratorViewer pour isoler son layout */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', width: '100%', height: '100%' }}>
        <ConfiguratorViewer 
          mode="client" 
          preview={true} 
          initialSnapshot={snapshot}
          shopDomain={snapshot.shopDomain || "preview"}
          productId={snapshot.productId}
        />
      </div>
    </main>
  );
}
