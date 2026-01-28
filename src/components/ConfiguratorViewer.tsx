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
  /** true = layout mobile avec barre du bas (onglets + actions) */
  mobile?: boolean;
}

export function ConfiguratorViewer({
  modules,
  activeTab,
  onTabChange,
  panelContent,
  canvasContent,
  onSave,
  onAddToCart,
  mobile = false,
}: ConfiguratorViewerProps) {
  const activeModule = modules.find((m) => m.id === activeTab) ?? modules[0];
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const mobileTabsScrollRef = React.useRef<HTMLDivElement>(null);
  const MOBILE_TABS_VISIBLE = 5;
  const showMobileTabsArrows = modules.length > MOBILE_TABS_VISIBLE;

  useEffect(() => {
    const styleId = "configurator-viewer-reset";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /* Tout le viewer : police système, jamais italic (stepn-theme reste hors zone) */
      .configurator-viewer-isolated,
      .configurator-viewer-isolated * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-style: normal !important;
      }
      .configurator-viewer-isolated {
        color: #000000 !important;
      }
      /* Sidebar tabs - noir/blanc, bords arrondis toujours visibles, hover gris clair sur inactifs */
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #d1d5db !important;
        border-radius: 12px !important;
        -webkit-text-fill-color: #000000 !important;
      }
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab * {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
      }
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab.cv-sidebar-tab-active {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 12px !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab.cv-sidebar-tab-active * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab:not(.cv-sidebar-tab-active):hover {
        background-color: #e5e7eb !important;
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
      }
      .configurator-viewer-isolated .cv-sidebar .cv-sidebar-tab:not(.cv-sidebar-tab-active):hover * {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
      }
      /* Barre d'actions : Sauvegarder blanc + contour gris, hover gris clair (comme onglets) ; Ajouter au panier noir, hover gris foncé */
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save,
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart {
        font-style: normal !important;
        font-weight: 600 !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save {
        background-color: #ffffff !important;
        border: 1px solid #d1d5db !important;
        color: #374151 !important;
        border-radius: 12px !important;
        padding: 0 40px !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save:hover {
        background-color: #e5e7eb !important;
        border-color: #d1d5db !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save:hover,
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save:hover * {
        color: #374151 !important;
        -webkit-text-fill-color: #374151 !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save:hover path {
        stroke: #374151 !important;
      }
      .configurator-viewer-isolated .cv-actions-bar button {
        transition: background-color 0.2s ease, border-color 0.2s ease !important;
      }
      .configurator-viewer-isolated .cv-actions-bar button * {
        transition: none !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart,
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart {
        background-color: #000000 !important;
        border-radius: 12px !important;
        padding: 0 40px !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart:hover {
        background-color: #374151 !important;
      }
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart:hover,
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart:hover * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      /* Enfants des boutons barre d'actions : forcer romain + gras (priorité max) */
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-save *,
      .configurator-viewer-isolated .cv-actions-bar .cv-btn-add-cart * {
        font-style: normal !important;
        font-weight: 600 !important;
      }
      /* Barre du bas mobile : boutons Sauvegarder / Ajouter au panier — padding, police et angles arrondis (rectangles) */
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-btn-save,
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-btn-add-cart {
        padding: 0 4px !important;
        font-size: 11px !important;
        height: 40px !important;
        gap: 3px !important;
        border-radius: 10px !important;
      }
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-btn-save *,
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-btn-add-cart * {
        font-size: 11px !important;
      }
      /* Barre du bas mobile : onglets (même style que sidebar desktop) */
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #d1d5db !important;
        border-radius: 12px !important;
      }
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab.cv-sidebar-tab-active {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: none !important;
      }
      /* Masquer la scrollbar horizontale des onglets mobile */
      .configurator-viewer-isolated .cv-mobile-tabs-scroll::-webkit-scrollbar {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  // Layout mobile : barre du bas (onglets + Sauvegarder / Ajouter au panier)
  if (mobile) {
    return (
      <div
        id="configurator-viewer-isolated-root"
        className="configurator-viewer-isolated"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontStyle: 'normal',
          color: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Zone 3D en haut, prend tout l’espace au-dessus de la barre */}
        <section
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
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
              }}
            >
              Zone 3D (placeholder)
            </div>
          )}
        </section>

        {/* Barre du bas mobile : onglets + actions */}
        <footer
          className="cv-actions-bar cv-mobile-bottom-bar"
          style={{
            flexShrink: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e5e5',
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Grille de 5 onglets visibles ; si > 5, slide + flèches semi‑transparentes */}
          <div style={{ position: 'relative', width: '100%' }}>
            {showMobileTabsArrows && (
              <button
                type="button"
                aria-label="Onglets précédents"
                onClick={() => {
                  const el = mobileTabsScrollRef.current;
                  if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  width: '28px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            )}
            {showMobileTabsArrows && (
              <button
                type="button"
                aria-label="Onglets suivants"
                onClick={() => {
                  const el = mobileTabsScrollRef.current;
                  if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  width: '28px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to left, rgba(255,255,255,0.9), transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: modules.length <= MOBILE_TABS_VISIBLE ? 'center' : 'flex-start',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                ref={mobileTabsScrollRef}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: '6px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  paddingLeft: showMobileTabsArrows ? 4 : 0,
                  paddingRight: showMobileTabsArrows ? 4 : 0,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
                className="cv-mobile-tabs-scroll"
              >
                {modules.map((module) => {
                  const isActive =
                    module.id === activeTab || (!activeTab && module.id === activeModule?.id);
                  // Pour que onglets + gaps tiennent exactement : chaque onglet = (100% - (N-1)*6px) / N
                  const gapTotal = (modules.length - 1) * 6;
                  const tabWidthValue =
                    modules.length <= MOBILE_TABS_VISIBLE
                      ? `calc((100% - ${gapTotal}px) / ${modules.length})`
                      : `calc((100% - ${(MOBILE_TABS_VISIBLE - 1) * 6}px) / ${MOBILE_TABS_VISIBLE})`;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      className={`cv-sidebar-tab ${isActive ? 'cv-sidebar-tab-active' : ''}`}
                      onClick={() => {
                        onTabChange(module.id);
                        setMobileSheetOpen(true);
                      }}
                      title={module.name}
                      style={{
                        flex: `0 0 ${tabWidthValue}`,
                        minWidth: tabWidthValue,
                      height: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      backgroundColor: isActive ? '#000000' : '#ffffff',
                      color: isActive ? '#ffffff' : '#000000',
                      border: isActive ? 'none' : '1px solid #d1d5db',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '11px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {module.icon ? (
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{module.icon}</span>
                    ) : (
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: isActive ? '#ffffff' : '#000000',
                        }}
                      >
                        {module.name[0]}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: isActive ? '#ffffff' : '#000000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {module.name}
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          {/* Sauvegarder | Ajouter au panier : côte à côte, police et padding adaptés pour mobile */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              gap: 6,
            }}
          >
            <button
              type="button"
              className="cv-btn-save"
              onClick={onSave}
              style={{
                flex: 1,
                minWidth: 0,
                height: '40px',
                padding: '0 4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                fontSize: '11px',
                fontStyle: 'normal',
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRight: 'none',
                borderTopLeftRadius: '10px',
                borderBottomLeftRadius: '10px',
                color: '#374151',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span style={{ color: '#374151', fontStyle: 'normal', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Sauvegarder</span>
            </button>
            <button
              type="button"
              className="cv-btn-add-cart"
              onClick={onAddToCart}
              style={{
                flex: 1,
                minWidth: 0,
                height: '40px',
                padding: '0 4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                fontSize: '11px',
                fontStyle: 'normal',
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '1px solid #000000',
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span style={{ color: '#ffffff', fontStyle: 'normal', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ajouter au panier</span>
            </button>
          </div>
        </footer>

        {/* Bottom sheet : contenu du panneau quand un onglet est sélectionné */}
        {mobileSheetOpen && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label="Fermer"
              onClick={() => setMobileSheetOpen(false)}
              onKeyDown={(e) => e.key === 'Escape' && setMobileSheetOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 10,
              }}
            />
            <div
              className="cv-mobile-sheet"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '70%',
                backgroundColor: '#ffffff',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                zIndex: 11,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  {activeModule ? activeModule.name : ''}
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  padding: '16px',
                }}
              >
                {panelContent || (
                  <div style={{ color: '#999999', fontSize: '14px' }}>
                    Aucune option disponible.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Layout desktop
  return (
    <div 
      id="configurator-viewer-isolated-root"
      className="configurator-viewer-isolated"
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontStyle: 'normal',
        color: '#000000',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* Bloc gauche : sidebar + panel + barre d'actions (sans le viewer 3D) */}
      <div
        className="cv-left-block"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '500px',
          minWidth: '500px',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}
      >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
      {/* Sidebar gauche - Fond gris clair, onglets carrés w-16 h-16, bords arrondis */}
      <aside
        className="cv-sidebar"
        style={{ 
          backgroundColor: '#f9fafb',
          width: '80px',
          minWidth: '80px',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          borderRight: '1px solid #d1d5db'
        }}
      >
        {modules.map((module) => {
          const isActive =
            module.id === activeTab || (!activeTab && module.id === activeModule?.id);
          return (
            <button
              key={module.id}
              type="button"
              className={`cv-sidebar-tab ${isActive ? 'cv-sidebar-tab-active' : ''}`}
              onClick={() => onTabChange(module.id)}
              title={module.name}
              style={{
                width: '64px',
                height: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                backgroundColor: isActive ? '#000000' : '#ffffff',
                color: isActive ? '#ffffff' : '#000000',
                border: isActive ? 'none' : '1px solid #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                fontWeight: 500,
                fontSize: '11px',
                lineHeight: 1.2,
                textAlign: 'center'
              }}
            >
              {module.icon ? (
                <span
                  style={{ 
                    fontSize: '22px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    lineHeight: 1,
                    color: isActive ? '#ffffff' : '#000000'
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
                    letterSpacing: '0.5px',
                    width: '28px',
                    height: '28px',
                    color: isActive ? '#ffffff' : '#000000'
                  }}
                >
                  {module.name[0]}
                </span>
              )}
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 500,
                color: isActive ? '#ffffff' : '#000000',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
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
            padding: '28px 32px',
            backgroundColor: '#ffffff',
            borderBottom: 'none'
          }}
        >
          <h2 
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#000000',
              fontSize: '24px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}
          >
            {activeModule ? `Sélectionner le ${activeModule.name.toLowerCase()}` : "Aucun module"}
          </h2>
        </div>

        {/* Contenu défilant */}
        <div 
          className="flex-1 overflow-auto"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#000000',
            padding: '0 32px 24px 32px'
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
      </section>
      </div>

      {/* Barre d'actions en bas : largeur = sidebar + panel uniquement (pas au-dessus du viewer 3D) */}
      <footer
        className="cv-actions-bar"
        style={{
          width: '100%',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e5e5',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px'
        }}
      >
        <button
          type="button"
          className="cv-btn-save"
          onClick={onSave}
          style={{
            height: '48px',
            padding: '0 40px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            color: '#374151',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
        >
          {/* Icône identique à StretchMX : document/boîte avec flèche vers le bas (sauvegarder) */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span style={{ color: '#374151', fontStyle: 'normal', fontWeight: 600 }}>Sauvegarder</span>
        </button>
        <button
          type="button"
          className="cv-btn-add-cart"
          onClick={onAddToCart}
          style={{
            height: '48px',
            padding: '0 40px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Icône identique à StretchMX : panier shopping */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a1 1 0 100-2 1 1 0 000 2zm-8 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span style={{ color: '#ffffff', fontStyle: 'normal', fontWeight: 600 }}>Ajouter au panier</span>
        </button>
      </footer>
      </div>

      {/* Zone 3D - à droite, prend le reste de la largeur */}
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
