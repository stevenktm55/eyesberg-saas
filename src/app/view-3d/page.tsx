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
      (window as any).setCameraView = (view: "front" | "back" | "left" | "right") => {
        try {
          window.dispatchEvent(new CustomEvent("setCameraView", { detail: view }));
        } catch (e) {
          console.error("❌ Erreur dans window.setCameraView bridge:", e);
        }
      };
    }

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
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Chargement...
      </div>
    );
  }

  return (
    <main
      id="root-preview"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
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
