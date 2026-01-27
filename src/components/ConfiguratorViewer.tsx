"use client";

import React, { useEffect } from "react";
import { ConfiguratorLayout } from "./ConfiguratorLayout";

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
      {/* Sidebar gauche - Navigation verticale */}
      <aside 
        style={{ 
          backgroundColor: '#ffffff',
          width: '140px',
          minWidth: '140px',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderRight: '1px solid #e5e5e5'
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 500,
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
              }}
            >
              {module.icon ? (
                <span
                  style={{ 
                    fontSize: '24px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    lineHeight: 1,
                    filter: isActive ? 'none' : 'none'
                  }}
                >
                  {module.icon}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '20px',
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
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
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
              backgroundColor: '#3b82f6',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
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
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
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
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
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
