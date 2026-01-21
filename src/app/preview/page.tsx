"use client";

import { useEffect, useState } from "react";
import ConfiguratorViewer from "@/components/ConfiguratorViewer";
import type { Snapshot } from "@/lib/snapshot-generator";
// On garde l'import, si jamais Tailwind décide de se réveiller
import "../globals.css";

export default function PreviewPage() {
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

    try {
      // 1. On lit les données qui s'affichaient sur l'écran rouge
      const storedData = localStorage.getItem("preview_snapshot_live");
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        
        // 2. PATCH IMAGE : On s'assure que l'URL est bien là pour le "No Preview"
        // Si design2D.url est vide mais qu'on a un svgUrl, on le copie.
        if (parsed.design2D && !parsed.design2D.url && parsed.design2D.svgUrl) {
            parsed.design2D.url = parsed.design2D.svgUrl;
        }

        // Assigner aussi à window.snapshot pour les scripts legacy
        (window as any).snapshot = parsed;
        console.log("Données chargées pour le viewer:", parsed);
        setSnapshot(parsed);
      } else {
        setError("Aucune donnée trouvée. Relancez la preview depuis le builder.");
      }
    } catch (e) {
      console.error("❌ Erreur lecture snapshot:", e);
      setError("Erreur de lecture des données.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>
        {error}
      </div>
    );
  }
  
  if (!snapshot) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Chargement de la 3D...
      </div>
    );
  }

  // --- LA SOLUTION FORCE BRUTE ---
  // On n'utilise PAS de classes Tailwind pour le conteneur principal.
  // On utilise du CSS pur via l'attribut style. Ça marche TOUT LE TEMPS.
  return (
    <main 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        backgroundColor: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column',
        zIndex: 9999
      }}
    >
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
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
