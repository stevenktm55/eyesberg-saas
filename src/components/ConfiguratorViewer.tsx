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
        color: #000000 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  // Couleur bleue StretchMX (bleu vif)
  const stretchBlue = '#3b82f6'; // ou un bleu plus vif comme #2563eb ou #1d4ed8

  return (
    <div 
      className="configurator-viewer-isolated"
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#000000',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#ffffff'
      }}
    >
      {/* Sidebar gauche - Fond BLEU avec boutons bleus */}
      <aside 
        style={{ 
          backgroundColor: stretchBlue,
          width: '140px',
          minWidth: '140px',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderRight: 'none'
        }}
      >
        {modules.map((module) => {
          const isActive =
            module.id === activeTab || (!activeTab && module.id === activeModule?.id);
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onTabChange(module.id)}
              style={{
                width: '100%',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                backgroundColor: stretchBlue,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 500,
                fontSize: '14px',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = stretchBlue;
                e.currentTarget.style.boxShadow = isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none';
              }}
            >
              {module.icon ? (
                <span
                  style={{ 
                    fontSize: '20px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  {module.icon}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    width: '24px',
                    height: '24px'
                  }}
                >
                  {module.name[0]}
                </span>
              )}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
                {module.name}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Panel central */}
      <section 
        style={{ 
          backgroundColor: '#ffffff',
          width: '420px',
          minWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e5e5'
        }}
      >
        {/* Header avec titre */}
        <div 
          style={{ 
            padding: '24px 28px',
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#ffffff'
          }}
        >
          <h2 
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#000000',
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '6px',
              letterSpacing: '-0.02em'
            }}
          >
            {activeModule ? activeModule.name : "Aucun module"}
          </h2>
          {activeModule && (
            <p 
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: '#000000',
                fontSize: '14px',
                margin: 0,
                fontStyle: 'italic',
                fontWeight: 400
              }}
            >
              {activeModule.name === "Couleur"
                ? "Sélectionnez les couleurs de votre équipement"
                : `Personnalisez ${activeModule.name.toLowerCase()}`}
            </p>
          )}
        </div>

        {/* Contenu défilant */}
        <div 
          className="flex-1 overflow-auto"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#000000',
            padding: '24px 28px'
          }}
        >
          {panelContent || (
            <div 
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999999',
                fontSize: '14px'
              }}
            >
              Aucune option disponible.
            </div>
          )}
        </div>

        {/* Actions fixes en bas */}
        <div 
          className="shrink-0"
          style={{ 
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e5e5',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onSave}
            style={{
              height: '48px',
              padding: '0 24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: stretchBlue,
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = stretchBlue;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M4 3a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V7.83a2 2 0 0 0-.59-1.41l-2.83-2.83A2 2 0 0 0 13.17 3H4zm3 2h4v3H7V5zm2 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
                fill="currentColor"
              />
            </svg>
            <span>Sauvegarder</span>
          </button>
          <button
            type="button"
            onClick={onAddToCart}
            style={{
              height: '48px',
              padding: '0 24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: stretchBlue,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = stretchBlue;
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M3 3h2l1 9h9l1.5-6H7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="8.5" cy="16" r="1.25" fill="currentColor" />
              <circle cx="14.5" cy="16" r="1.25" fill="currentColor" />
            </svg>
            <span>Ajouter au panier</span>
          </button>
        </div>
      </section>

      {/* Zone 3D */}
      <section 
        className="flex-1"
        style={{ 
          backgroundColor: '#f5f5f5',
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
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999999',
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
