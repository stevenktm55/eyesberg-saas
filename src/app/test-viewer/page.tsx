"use client";

import React, { useState, useEffect } from "react";
import ConfiguratorViewer, {
  ConfiguratorViewerProps,
} from "@/components/ConfiguratorViewer";

type Module = ConfiguratorViewerProps["modules"][number];

export default function TestViewerPage() {
  const [activeTab, setActiveTab] = useState<string>("design");
  const [modules, setModules] = useState<Module[]>([
    { id: "design", name: "Design" },
    { id: "colors", name: "Couleur" },
    { id: "text", name: "Texte" },
  ]);

  // Garde activeTab cohérent avec la liste de modules
  useEffect(() => {
    if (!modules.length) {
      setActiveTab("");
      return;
    }
    if (!modules.some((m) => m.id === activeTab)) {
      setActiveTab(modules[0].id);
    }
  }, [modules, activeTab]);

  const handleAddShape = () => {
    // N'ajoute le module "Forme" qu'une seule fois
    setModules((prev) => {
      if (prev.some((m) => m.id === "shape")) {
        return prev;
      }
      return [...prev, { id: "shape", name: "Forme" }];
    });
    setActiveTab("shape");
  };

  const handleRemoveLast = () => {
    setModules((prev) => {
      if (!prev.length) return prev;
      const newModules = prev.slice(0, -1);
      const removed = prev[prev.length - 1];
      if (removed.id === activeTab) {
        setActiveTab(newModules[0]?.id ?? "");
      }
      return newModules;
    });
  };

  // FONCTION QUI GÉNÈRE LE CONTENU (Simulation de l'Admin)
  const renderPanelContent = () => {
    switch (activeTab) {
      case "design":
        return (
          <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg text-center">
            <h3 className="text-blue-700 font-bold text-lg mb-2">
              🎨 Module Design
            </h3>
            <p className="text-blue-600">
              Ici s&apos;affichera la grille des maillots.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full" />
              <div className="w-10 h-10 bg-red-500 rounded-full" />
            </div>
          </div>
        );
      case "colors":
        return (
          <div className="p-6 bg-green-50 border-2 border-dashed border-green-200 rounded-lg text-center">
            <h3 className="text-green-700 font-bold text-lg mb-2">
              🌈 Module Couleur
            </h3>
            <p className="text-green-600">
              Ici s&apos;affichera le sélecteur de couleurs.
            </p>
          </div>
        );
      default:
        return (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center">
            Contenu pour le module : <strong>{activeTab}</strong>
          </div>
        );
    }
  };

  return (
    <div className="configurator-panel min-h-screen bg-gray-100 text-gray-900">
      <div className="flex min-h-screen">
        {/* Sidebar de test (hors viewer) */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
          <div>
            <div className="text-lg font-semibold mb-1">Test ConfiguratorViewer</div>
            <p className="text-xs text-gray-500">
              Cette sidebar simule l&apos;Admin pour tester le viewer sans back-end.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddShape}
            className="w-full px-3 py-2 text-sm font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
          >
            [+] Ajouter Question Forme
          </button>

          <button
            type="button"
            onClick={handleRemoveLast}
            className="w-full px-3 py-2 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            [-] Supprimer dernier
          </button>

          <div className="mt-4 border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500 mb-1">Modules actuels :</p>
            <ul className="text-xs space-y-1 text-gray-700">
              {modules.map((m) => {
                const isActive = m.id === activeTab;
                return (
                  <li
                    key={m.id}
                    className={isActive ? "text-emerald-600 font-medium" : ""}
                  >
                    - {m.name} ({m.id})
                  </li>
                );
              })}
              {!modules.length && <li className="text-gray-400">Aucun module</li>}
            </ul>
          </div>
        </aside>

        {/* Zone centrale avec le viewer */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-5xl h-[600px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <ConfiguratorViewer
              modules={modules}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              // C'EST ICI QUE LA MAGIE OPÈRE :
              panelContent={renderPanelContent()}
              canvasContent={
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-sm">
                  🌍 Moteur 3D Simulé
                </div>
              }
            />
          </div>
        </main>
      </div>
    </div>
  );
}

