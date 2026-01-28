"use client";

import React, { useState, useEffect } from "react";
import ConfiguratorViewer, {
  ConfiguratorViewerProps,
} from "@/components/ConfiguratorViewer";

type Module = ConfiguratorViewerProps["modules"][number];

export default function TestViewerPage() {
  const [activeTab, setActiveTab] = useState<string>("design");
  const [isMobileView, setIsMobileView] = useState(false);
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

  const addModule = (id: string, name: string) => {
    setModules((prev) => {
      if (prev.some((m) => m.id === id)) return prev;
      return [...prev, { id, name }];
    });
    setActiveTab(id);
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
      case "shape":
        return (
          <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-lg text-center">
            <h3 className="text-emerald-700 font-bold text-lg mb-2">Module Forme</h3>
            <p className="text-emerald-600">Options de forme.</p>
          </div>
        );
      case "logo":
        return (
          <div className="p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-lg text-center">
            <h3 className="text-amber-700 font-bold text-lg mb-2">Module Logo</h3>
            <p className="text-amber-600">Choisir ou téléverser un logo.</p>
          </div>
        );
      case "numero":
        return (
          <div className="p-6 bg-violet-50 border-2 border-dashed border-violet-200 rounded-lg text-center">
            <h3 className="text-violet-700 font-bold text-lg mb-2">Module Numéro</h3>
            <p className="text-violet-600">Saisir un numéro.</p>
          </div>
        );
      case "nom":
        return (
          <div className="p-6 bg-cyan-50 border-2 border-dashed border-cyan-200 rounded-lg text-center">
            <h3 className="text-cyan-700 font-bold text-lg mb-2">Module Nom</h3>
            <p className="text-cyan-600">Saisir un nom ou texte.</p>
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

          <p className="text-xs font-medium text-gray-500 mt-1 mb-0.5">Ajouter un module :</p>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => addModule("shape", "Forme")} className="px-2 py-1.5 text-xs font-medium rounded bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "shape")}>Forme</button>
            <button type="button" onClick={() => addModule("logo", "Logo")} className="px-2 py-1.5 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "logo")}>Logo</button>
            <button type="button" onClick={() => addModule("numero", "Numéro")} className="px-2 py-1.5 text-xs font-medium rounded bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "numero")}>Numéro</button>
            <button type="button" onClick={() => addModule("nom", "Nom")} className="px-2 py-1.5 text-xs font-medium rounded bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50" disabled={modules.some((m) => m.id === "nom")}>Nom</button>
          </div>

          <button
            type="button"
            onClick={handleRemoveLast}
            className="w-full px-3 py-2 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            [-] Supprimer dernier
          </button>

          <button
            type="button"
            onClick={() => setIsMobileView((v) => !v)}
            className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
              isMobileView
                ? "bg-slate-600 text-white hover:bg-slate-700"
                : "bg-sky-500 text-white hover:bg-sky-600"
            }`}
            title={isMobileView ? "Revenir en vue desktop" : "Passer en vue mobile"}
          >
            {isMobileView ? "🖥️ Vue desktop" : "📱 Vue mobile"}
          </button>
          {isMobileView && (
            <span className="text-xs text-gray-500">
              Affichage type téléphone (375×667)
            </span>
          )}

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
          <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${
              isMobileView
                ? "w-[375px] h-[667px] ring-4 ring-slate-300 rounded-[2rem] border-8 border-slate-800"
                : "w-full max-w-5xl h-[600px]"
            }`}
            style={
              isMobileView
                ? { boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }
                : undefined
            }
          >
            <ConfiguratorViewer
              modules={modules}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              mobile={isMobileView}
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

