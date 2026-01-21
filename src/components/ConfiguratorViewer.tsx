"use client";

import React, { useEffect } from "react";

export interface ConfiguratorViewerProps {
  modules: { id: string; name: string; icon?: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  panelContent?: React.ReactNode;
  canvasContent?: React.ReactNode;
  onSave?: () => void;
  onAddToCart?: () => void;
}

export function ConfiguratorViewer({
  modules,
  activeTab,
  onTabChange,
  panelContent,
  canvasContent,
  onSave,
  onAddToCart,
}: ConfiguratorViewerProps) {
  const activeModule = modules.find((m) => m.id === activeTab) ?? modules[0];

  useEffect(() => {
    const styleId = "configurator-viewer-reset";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .configurator-viewer-isolated,
      .configurator-viewer-isolated * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      .configurator-viewer-isolated {
        color: #111827 !important;
      }
      .configurator-viewer-isolated h1,
      .configurator-viewer-isolated h2,
      .configurator-viewer-isolated h3,
      .configurator-viewer-isolated h4,
      .configurator-viewer-isolated h5,
      .configurator-viewer-isolated h6,
      .configurator-viewer-isolated p,
      .configurator-viewer-isolated span,
      .configurator-viewer-isolated div,
      .configurator-viewer-isolated button,
      .configurator-viewer-isolated aside,
      .configurator-viewer-isolated section {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div 
      className="configurator-viewer-isolated flex h-full w-full min-h-[500px] bg-gray-100" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#111827',
        width: '100%',
        height: '100%',
        flex: 1
      }}
    >
      {/* Sidebar gauche - modules */}
      <aside 
        className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-3"
        style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}
      >
        {modules.map((module) => {
          const isActive =
            module.id === activeTab || (!activeTab && module.id === activeModule?.id);
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onTabChange(module.id)}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: isActive ? '#ffffff' : '#4b5563',
                backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
              }}
              title={module.name}
            >
              {module.icon ? (
                <span
                  className="text-lg"
                  aria-hidden="true"
                  style={{ color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {module.icon}
                </span>
              ) : (
                <span
                  className="text-sm font-bold"
                  style={{
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {module.name[0]}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Panel central */}
      <section 
        className="w-[420px] bg-white border-r border-gray-200 flex flex-col"
        style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}
      >
        {/* En-tête */}
        <div className="px-4 py-3 border-b border-gray-200" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <h2 
            className="text-lg font-semibold text-gray-900"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#111827',
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0
            }}
          >
            {activeModule ? activeModule.name : "Aucun module"}
          </h2>
          <p 
            className="mt-1 text-xs text-slate-500"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#6b7280',
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              margin: '0.25rem 0 0 0'
            }}
          >
            {activeModule
              ? activeModule.name === "Couleur"
                ? "Personnalisez les couleurs de votre équipement."
                : `Personnalisez les options pour "${activeModule.name}".`
              : "Sélectionnez un module pour commencer la configuration."}
          </p>
        </div>

        {/* Contenu défilant */}
        <div 
          className="flex-1 overflow-auto px-4 py-4 text-sm text-slate-700 space-y-3"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#334155'
          }}
        >
          {panelContent || (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-xs text-gray-400 text-center">
              Aucune option disponible.
            </div>
          )}
        </div>

        {/* Actions fixes en bas */}
        <div 
          className="shrink-0 border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-3 bg-white"
          style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}
        >
          <button
            type="button"
            className="h-11 px-3 inline-flex items-center gap-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
            }}
          >
            {/* Icône disquette */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="w-4 h-4 text-gray-500"
              style={{ color: '#6b7280' }}
            >
              <path
                fill="currentColor"
                d="M4 3a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V7.83a2 2 0 0 0-.59-1.41l-2.83-2.83A2 2 0 0 0 13.17 3H4zm3 2h4v3H7V5zm2 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
              />
            </svg>
            <span>Sauvegarder</span>
          </button>
          <button
            type="button"
            onClick={onAddToCart}
            className="h-11 px-6 inline-flex items-center gap-2 text-sm font-medium rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
            }}
            >
            {/* Icône caddie */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="w-4 h-4 text-white"
              style={{ color: '#ffffff' }}
            >
              <path
                fill="currentColor"
                d="M3 3h2l1 9h9l1.5-6H7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8.5" cy="16" r="1.25" fill="currentColor" />
              <circle cx="14.5" cy="16" r="1.25" fill="currentColor" />
            </svg>
            <span className="whitespace-nowrap">Ajouter au panier</span>
          </button>
        </div>
      </section>

      {/* Zone 3D */}
      <section 
        className="flex-1 bg-gray-100"
        style={{ 
          backgroundColor: '#f3f4f6',
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {canvasContent || (
          <div 
            className="w-64 h-64 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-sm font-medium text-gray-400"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: '#ffffff',
              border: '1px dashed #d1d5db',
              borderRadius: '0.75rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Zone 3D (placeholder)
          </div>
        )}
      </section>
    </div>
  );
}

 export default ConfiguratorViewer;

