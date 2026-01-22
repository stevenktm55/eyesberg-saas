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
      className="configurator-viewer-isolated flex flex-col h-full w-full min-h-[500px]" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#1a1a1a',
        width: '100%',
        height: '100%',
        flex: 1,
        backgroundColor: '#ffffff'
      }}
    >
      {/* Panel central avec onglets horizontaux */}
      <section 
        className="flex flex-col"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRight: '1px solid #e8e8e8',
          width: '420px',
          minWidth: '420px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Onglets horizontaux en haut */}
        <div 
          style={{ 
            display: 'flex',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#ffffff',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style>{`
            .configurator-viewer-isolated div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {modules.map((module) => {
            const isActive =
              module.id === activeTab || (!activeTab && module.id === activeModule?.id);
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => onTabChange(module.id)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  backgroundColor: 'transparent',
                  color: isActive ? '#000000' : '#666666',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #000000' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#666666';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
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
                      fontSize: '16px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {module.name[0]}
                  </span>
                )}
                <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {module.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* En-tête avec titre */}
        <div 
          style={{ 
            padding: '20px 24px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#ffffff'
          }}
        >
          <h2 
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#1a1a1a',
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '4px',
              letterSpacing: '-0.02em'
            }}
          >
            {activeModule ? activeModule.name : "Aucun module"}
          </h2>
          {activeModule && (
            <p 
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: '#666666',
                fontSize: '13px',
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
            color: '#1a1a1a',
            padding: '20px 24px'
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
            borderTop: '1px solid #e8e8e8',
            padding: '16px 24px',
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
              height: '44px',
              padding: '0 20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#1a1a1a',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.borderColor = '#999999';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
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
              height: '44px',
              padding: '0 24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
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

