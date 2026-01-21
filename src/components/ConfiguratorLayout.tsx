import React from "react";

export interface ConfiguratorLayoutModule {
  id: string;
  name: string;
  icon?: string;
}

export interface ConfiguratorLayoutProps {
  // Données
  modules: ConfiguratorLayoutModule[];
  activeTab: string;

  // Actions
  onTabChange: (id: string) => void;
  onSave?: () => void;
  onAddToCart?: () => void;

  // Slots de contenu
  panelSlot: React.ReactNode;
  canvasSlot: React.ReactNode;
}

/**
 * ConfiguratorLayout
 *
 * Squelette pur de la colonne centrale du configurateur :
 * - Sidebar blanche gauche (icônes modules)
 * - Panel blanc central (420px) avec header, contenu scrollable, boutons en bas
 * - Zone 3D grise à droite
 *
 * Aucune logique métier : tout est injecté via les props.
 */
export function ConfiguratorLayout({
  modules,
  activeTab,
  onTabChange,
  onSave,
  onAddToCart,
  panelSlot,
  canvasSlot,
}: ConfiguratorLayoutProps) {
  const activeModule = modules.find((m) => m.id === activeTab);

  return (
    // CONTENEUR PRINCIPAL (Gris)
    <div className="flex w-full h-full bg-gray-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR GAUCHE (Icônes) - BLANCHE */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20 shrink-0">
        {modules.map((module) => {
          const isActive = activeTab === module.id;
          return (
            <button
              key={module.id}
              onClick={() => onTabChange(module.id)}
              className={`w-12 h-12 mb-4 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={module.name}
            >
              {module.icon ? (
                <img
                  src={module.icon}
                  alt={module.name}
                  className="w-6 h-6 object-contain"
                  style={{
                    filter: isActive ? "brightness(0) invert(1)" : "none",
                  }}
                />
              ) : (
                <span className="text-xs font-bold">
                  {module.name.substring(0, 2)}
                </span>
              )}
              <span
                className={`mt-1 text-[10px] font-medium ${
                  isActive ? "text-white" : "text-gray-700"
                }`}
              >
                {module.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. PANEL CONFIGURATION (Options) - BLANC */}
      <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col h-full z-10 relative shrink-0">
        {/* A. Header du Panel */}
        <div className="p-5 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-900 truncate">
            {activeModule?.name || "Configuration"}
          </h2>
        </div>

        {/* B. Contenu Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
          <div className="space-y-4">{panelSlot}</div>
          {/* Padding bas pour que le dernier élément ne soit pas collé aux boutons */}
          <div className="pb-4" />
        </div>

        {/* C. Footer Boutons (FIXE EN BAS) */}
        {(onSave || onAddToCart) && (
          <div className="p-4 border-t border-gray-200 bg-white shrink-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex gap-3">
              {onSave && (
                <button
                  onClick={onSave}
                  className="flex-1 h-11 flex items-center justify-center px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Sauvegarder
                </button>
              )}
              {onAddToCart && (
                <button
                  onClick={onAddToCart}
                  className="flex-1 h-11 flex items-center justify-center px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Ajouter au panier
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. ZONE 3D (Reste de l'espace) - GRIS */}
      <div className="flex-1 relative bg-[#F3F4F6] h-full overflow-hidden flex flex-col">
        <div className="w-full h-full">{canvasSlot}</div>
      </div>
    </div>
  );
}

