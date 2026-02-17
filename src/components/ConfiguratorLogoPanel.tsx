'use client';

import React, { useRef } from 'react';

const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export type PlacedLogo = {
  id: string;
  logoId: string;
  variantId: string;
  variantFile: string;
  position: [number, number, number];
  scale: number;
  rotation: number;
  locked?: boolean;
  category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit';
  width?: number;
  height?: number;
};

export type LogoLibrary = {
  id: string;
  name?: string;
  logos?: Array<{
    id: string;
    name?: string;
    file_url?: string;
    variants?: Array<{ id: string; name?: string; file_url?: string }>;
  }>;
};

export type ViewLabel = { id: string; label: string; cameraViewId?: string };
export type CameraView = {
  id: string;
  position?: number[] | { x: number; y: number; z: number };
  target?: number[] | { x: number; y: number; z: number };
};

export type LogoModule = {
  id: string;
  contentType?: string;
  content_type?: string;
  logoPlacementMode?: 'zones' | 'free';
  viewLabels?: ViewLabel[];
  selectedItems?: { logoLibraryIds?: string[] };
  addLogoButtonLabel?: string;
  importLogoButtonLabel?: string;
  placedLogosLabel?: string;
};

export type ConfiguratorLogoPanelProps = {
  activeModule: LogoModule | null;
  placedLogos: PlacedLogo[];
  setPlacedLogos: React.Dispatch<React.SetStateAction<PlacedLogo[]>>;
  logoLibraries: LogoLibrary[];
  selectedLogoId: string | null;
  setSelectedLogoId: (id: string | null) => void;
  showLogoLibrary: boolean;
  setShowLogoLibrary: (v: boolean) => void;
  activeLogoView: string;
  setActiveLogoView: (v: 'front' | 'back' | 'left' | 'right') => void;
  logoSearchQuery: string;
  setLogoSearchQuery: (v: string) => void;
  selectedLogoForVariants: { id: string; name?: string; file_url?: string; variants?: any[] } | null;
  setSelectedLogoForVariants: (v: { id: string; name?: string; file_url?: string; variants?: any[] } | null) => void;
  logoToReplace: string | null;
  setLogoToReplace: (v: string | null) => void;
  hoveredLogoViewId: string | null;
  setHoveredLogoViewId: (v: string | null) => void;
  isAddLogoHovered: boolean;
  setIsAddLogoHovered: (v: boolean) => void;
  models3D: Array<{ id: string; cameraViews?: CameraView[] }>;
  selectedModel3DId: string | null;
  setShowLogoZoneModal: (v: boolean) => void;
  setSelectedLogoForZone: (v: { logoId: string; variantId?: string; variantFile?: string } | null) => void;
  onAddLogo: (
    logoId: string,
    variantId: string | undefined,
    variantFile: string,
    position: [number, number, number],
    category: 'torse' | 'dos' | 'bras-gauche' | 'bras-droit',
    zoneWidth?: number,
    zoneHeight?: number,
    zoneRotation?: number
  ) => Promise<void>;
  onRequestDeleteLogo: (id: string, name: string) => void;
  onOpenImportModal?: () => void;
  /** Dispatch open-logo-zone-modal event (builder iframe) - call after setSelectedLogoForZone + setShowLogoZoneModal */
  dispatchOpenLogoZoneModal?: (detail: { logoId: string; variantId?: string; variantFile: string }) => void;
};

export function ConfiguratorLogoPanel(props: ConfiguratorLogoPanelProps) {
  const {
    activeModule,
    placedLogos,
    setPlacedLogos,
    logoLibraries,
    selectedLogoId,
    setSelectedLogoId,
    showLogoLibrary,
    setShowLogoLibrary,
    activeLogoView,
    setActiveLogoView,
    logoSearchQuery,
    setLogoSearchQuery,
    selectedLogoForVariants,
    setSelectedLogoForVariants,
    logoToReplace,
    setLogoToReplace,
    hoveredLogoViewId,
    setHoveredLogoViewId,
    isAddLogoHovered,
    setIsAddLogoHovered,
    models3D,
    selectedModel3DId,
    setShowLogoZoneModal,
    setSelectedLogoForZone,
    onAddLogo,
    onRequestDeleteLogo,
    onOpenImportModal,
    dispatchOpenLogoZoneModal,
  } = props;

  const logoScrollRef = useRef<HTMLDivElement>(null);

  if (!activeModule) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
        Configurez le module Logo dans l&apos;onglet <strong>Paramètres</strong> du produit (réglages du module Logo, bibliothèques, zones, etc.).
      </div>
    );
  }

  const customViews = activeModule.viewLabels || [];
  const selectedModel = selectedModel3DId ? models3D.find(m => m.id === selectedModel3DId) : null;
  const modelCameraViews = selectedModel?.cameraViews || [];

  const categoryToView: Record<'torse' | 'dos' | 'bras-gauche' | 'bras-droit', 'front' | 'back' | 'left' | 'right'> = {
    torse: 'front',
    dos: 'back',
    'bras-gauche': 'left',
    'bras-droit': 'right',
  };

  let modulePlacedLogos = placedLogos.filter(l => l.category);

  let currentViewForFilter: 'front' | 'back' | 'left' | 'right' | null = null;
  if (activeModule.logoPlacementMode === 'zones') {
    const activeViewConfig = customViews.find(v => v.id === activeLogoView);
    if (activeViewConfig) {
      if (['front', 'back', 'left', 'right'].includes(activeViewConfig.id)) {
        currentViewForFilter = activeViewConfig.id as 'front' | 'back' | 'left' | 'right';
      } else {
        const labelToView: Record<string, 'front' | 'back' | 'left' | 'right'> = {
          Face: 'front',
          DOS: 'back',
          Dos: 'back',
          Gauche: 'left',
          Left: 'left',
          Droite: 'right',
          Right: 'right',
        };
        currentViewForFilter = labelToView[activeViewConfig.label] || null;
      }
    } else if (['front', 'back', 'left', 'right'].includes(activeLogoView)) {
      currentViewForFilter = activeLogoView as 'front' | 'back' | 'left' | 'right';
    }

    if (currentViewForFilter) {
      modulePlacedLogos = modulePlacedLogos.filter(logo => {
        const logoView = categoryToView[logo.category as keyof typeof categoryToView];
        return logoView === currentViewForFilter;
      });
    }
  }

  const libIds = activeModule.selectedItems?.logoLibraryIds;
  const selectedLibraries = libIds?.length ? logoLibraries.filter(l => libIds.includes(l.id)) : logoLibraries;

  const allLogos: any[] = [];
  selectedLibraries.forEach(library => {
    if (library.logos && Array.isArray(library.logos)) {
      allLogos.push(...library.logos);
    }
  });

  const filteredLogos = logoSearchQuery.trim()
    ? allLogos.filter(logo => logo.name?.toLowerCase().includes(logoSearchQuery.toLowerCase()))
    : allLogos;

  const handleBackFromLibrary = () => {
    setShowLogoLibrary(false);
    setSelectedLogoForVariants(null);
    setLogoToReplace(null);
  };

  const handleOpenZoneModal = (logoId: string, variantId: string | undefined, variantFile: string) => {
    setSelectedLogoForZone({ logoId, variantId, variantFile });
    setShowLogoZoneModal(true);
    dispatchOpenLogoZoneModal?.({ logoId, variantId, variantFile });
  };

  const handleReplaceWithVariant = async (
    logoToUpdate: PlacedLogo,
    newLogoId: string,
    newVariantId: string | undefined,
    fileToUse: string
  ) => {
    let logoWidth: number | undefined;
    let logoHeight: number | undefined;
    try {
      const response = await fetch(fileToUse);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      if (svgElement) {
        const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
        const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
        const viewBox = svgElement.getAttribute('viewBox');
        let actualWidth = svgWidth;
        let actualHeight = svgHeight;
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
          if (vbWidth && vbHeight) {
            actualWidth = vbWidth;
            actualHeight = vbHeight;
          }
        }
        if (actualWidth > 0 && actualHeight > 0) {
          logoWidth = actualWidth;
          logoHeight = actualHeight;
        }
      }
    } catch (error) {
      console.error('Erreur lors du calcul des dimensions du logo:', error);
    }
    let newScale = logoToUpdate.scale;
    if (logoWidth && logoHeight && logoToUpdate.width && logoToUpdate.height) {
      const SCALE_FACTOR = 0.5;
      const currentVisualWidth = logoToUpdate.width * logoToUpdate.scale * SCALE_FACTOR;
      const currentVisualHeight = logoToUpdate.height * logoToUpdate.scale * SCALE_FACTOR;
      const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
      const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
      newScale = Math.min(scaleX, scaleY);
    }
    setPlacedLogos(prev =>
      prev.map(l =>
        l.id === logoToUpdate.id
          ? { ...l, logoId: newLogoId, variantId: newVariantId ?? '', variantFile: fileToUse, width: logoWidth, height: logoHeight, scale: newScale }
          : l
      )
    );
    setLogoToReplace(null);
    setShowLogoLibrary(false);
    setSelectedLogoForVariants(null);
  };

  const handleReplaceFromLibrary = async (logo: any) => {
    const logoToUpdate = placedLogos.find(l => l.id === logoToReplace);
    if (!logoToUpdate) return;
    const fileToUse = logo.file_url;
    let logoWidth: number | undefined;
    let logoHeight: number | undefined;
    try {
      const response = await fetch(fileToUse);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      if (svgElement) {
        const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
        const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
        const viewBox = svgElement.getAttribute('viewBox');
        let actualWidth = svgWidth;
        let actualHeight = svgHeight;
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
          if (vbWidth && vbHeight) {
            actualWidth = vbWidth;
            actualHeight = vbHeight;
          }
        }
        if (actualWidth > 0 && actualHeight > 0) {
          logoWidth = actualWidth;
          logoHeight = actualHeight;
        }
      }
    } catch (error) {
      console.error('Erreur lors du calcul des dimensions du logo:', error);
    }
    let newScale = logoToUpdate.scale;
    if (logoWidth && logoHeight && logoToUpdate.width && logoToUpdate.height) {
      const SCALE_FACTOR = 0.5;
      const currentVisualWidth = logoToUpdate.width * logoToUpdate.scale * SCALE_FACTOR;
      const currentVisualHeight = logoToUpdate.height * logoToUpdate.scale * SCALE_FACTOR;
      const scaleX = currentVisualWidth / (logoWidth * SCALE_FACTOR);
      const scaleY = currentVisualHeight / (logoHeight * SCALE_FACTOR);
      newScale = Math.min(scaleX, scaleY);
    }
    setPlacedLogos(prev =>
      prev.map(l =>
        l.id === logoToReplace ? { ...l, logoId: logo.id, variantId: '', variantFile: fileToUse, width: logoWidth, height: logoHeight, scale: newScale } : l
      )
    );
    setLogoToReplace(null);
    setShowLogoLibrary(false);
  };

  const categoryToViewReverse: Record<'front' | 'back' | 'left' | 'right', 'torse' | 'dos' | 'bras-gauche' | 'bras-droit'> = {
    front: 'torse',
    back: 'dos',
    left: 'bras-gauche',
    right: 'bras-droit',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: showLogoLibrary ? '0 4px' : '16px 4px',
        ...(showLogoLibrary ? { height: '70vh', maxHeight: '70vh', minHeight: 0, overflow: 'hidden' } : { height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden' }),
      }}
    >
      {/* Tabs de vue */}
      {activeModule.logoPlacementMode === 'zones' && !selectedLogoForVariants && !showLogoLibrary && customViews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
          {customViews.map(viewConfig => {
            const isActive = activeLogoView === viewConfig.id;
            const isHovered = hoveredLogoViewId === viewConfig.id;
            return (
              <div
                key={viewConfig.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveLogoView(viewConfig.id as 'front' | 'back' | 'left' | 'right');
                  if (viewConfig.cameraViewId) {
                    const cameraView = modelCameraViews.find((cv: any) => cv.id === viewConfig.cameraViewId);
                    if (cameraView) {
                      window.dispatchEvent(new CustomEvent('goToCameraView', {
                        detail: { position: cameraView.position, target: cameraView.target },
                      }));
                    } else {
                      window.dispatchEvent(new CustomEvent('setCameraView', { detail: viewConfig.id }));
                    }
                  } else {
                    window.dispatchEvent(new CustomEvent('setCameraView', { detail: viewConfig.id }));
                  }
                }}
                onMouseEnter={() => setHoveredLogoViewId(viewConfig.id)}
                onMouseLeave={() => setHoveredLogoViewId(prev => (prev === viewConfig.id ? null : prev))}
                style={{
                  padding: '8px 16px',
                  height: '38px',
                  boxSizing: 'border-box',
                  borderRadius: '10px',
                  border: isActive ? '2px solid #111827' : isHovered ? '1px solid #6b7280' : '1px solid #e5e7eb',
                  backgroundColor: isActive ? '#e5e7eb' : isHovered ? '#f3f4f6' : '#f9fafb',
                  color: '#111827',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: isActive ? '0 0 0 1px rgba(0,0,0,0.15)' : isHovered ? '0 0 0 1px rgba(148,163,184,0.35)' : 'none',
                  width: '100%',
                }}
              >
                {viewConfig.label}
              </div>
            );
          })}
        </div>
      )}

      {showLogoLibrary ? (
        <div
          className="logo-library-container"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px', flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <div
            className="logo-library-header"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px 8px', flexShrink: 0 }}
          >
            <button
              type="button"
              className="typography-back-button"
              onClick={handleBackFromLibrary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#000000',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#000000' }}>Retour</span>
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginLeft: 'auto' }}>Bibliothèque de logos</span>
          </div>

          {!selectedLogoForVariants && (
            <>
              {onOpenImportModal && (
                <div
                  className="cv-panel-add-logo-btn"
                  role="button"
                  tabIndex={0}
                  onClick={onOpenImportModal}
                  style={{
                    height: '44px',
                    padding: '0 40px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isAddLogoHovered ? '#374151' : '#000000',
                    color: '#ffffff',
                    WebkitTextFillColor: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={() => setIsAddLogoHovered(true)}
                  onMouseLeave={() => setIsAddLogoHovered(false)}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '-1px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>＋</span>
                  <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>{activeModule.importLogoButtonLabel || 'Importer un logo'}</span>
                </div>
              )}
              <input
                type="text"
                placeholder="Rechercher un logo..."
                value={logoSearchQuery}
                onChange={e => setLogoSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '9999px',
                  border: '1px solid #e5e7eb',
                  padding: '10px 14px',
                  fontSize: '13px',
                  backgroundColor: '#f9fafb',
                  flexShrink: 0,
                }}
              />
            </>
          )}

          <div
            className="logo-library-content"
            style={{
              backgroundColor: '#ffffff',
              padding: '14px 0px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {selectedLogoForVariants ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, fontFamily: CONFIGURATOR_PANEL_FONT, textAlign: 'center' }}>
                    {selectedLogoForVariants.name}
                  </h3>
                </div>
                {(() => {
                  const baseVariant = {
                    id: 'base',
                    file_url: selectedLogoForVariants.file_url || '',
                    name: selectedLogoForVariants.name || 'Logo de base',
                  };
                  const allVariants = [baseVariant, ...(selectedLogoForVariants.variants || [])];
                  return (
                    <div style={{ position: 'relative' }}>
                      <div
                        ref={logoScrollRef}
                        className="logo-variants-scroll"
                        onWheel={e => {
                          if (logoScrollRef.current) {
                            e.preventDefault();
                            logoScrollRef.current.scrollLeft += e.deltaY;
                          }
                        }}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          padding: '8px 0',
                          scrollBehavior: 'smooth',
                          WebkitOverflowScrolling: 'touch',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        <style>{`.logo-variants-scroll::-webkit-scrollbar { display: none; }`}</style>
                        {allVariants.map((variant: any, index: number) => {
                          const fileToUse =
                            variant.id === 'base' ? selectedLogoForVariants.file_url : variant.file_url || selectedLogoForVariants.file_url;
                          return (
                            <div
                              key={variant.id || `base-${index}`}
                              onClick={async () => {
                                if (logoToReplace) {
                                  const logoToUpdate = placedLogos.find(l => l.id === logoToReplace);
                                  if (logoToUpdate) {
                                    await handleReplaceWithVariant(
                                      logoToUpdate,
                                      selectedLogoForVariants.id,
                                      variant.id === 'base' ? undefined : variant.id,
                                      fileToUse || ''
                                    );
                                  }
                                  return;
                                }
                                if (activeModule.logoPlacementMode === 'zones') {
                                  handleOpenZoneModal(selectedLogoForVariants.id, variant.id === 'base' ? undefined : variant.id, fileToUse || '');
                                  setSelectedLogoForVariants(null);
                                } else {
                                  const category = categoryToViewReverse[activeLogoView as keyof typeof categoryToViewReverse] || 'torse';
                                  await onAddLogo(
                                    selectedLogoForVariants.id,
                                    variant.id === 'base' ? undefined : variant.id,
                                    fileToUse || '',
                                    [0.5, 0.5, 0],
                                    category
                                  );
                                  setSelectedLogoForVariants(null);
                                }
                              }}
                              style={{
                                minWidth: '100px',
                                width: '100px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s',
                              }}
                            >
                              <div
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  backgroundColor: '#f5f5f5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  borderRadius: '6px',
                                  padding: '4px',
                                }}
                              >
                                <img
                                  src={fileToUse}
                                  alt={variant.name || selectedLogoForVariants.name}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>
                              <p style={{ margin: 0, fontSize: '10px', fontWeight: '500', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT, textAlign: 'center' }}>
                                {variant.id === 'base' ? 'Logo de base' : variant.name || 'Variante'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                {allLogos.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                    Aucun logo disponible. Veuillez sélectionner des bibliothèques de logos dans les settings du module.
                  </p>
                ) : filteredLogos.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
                    Aucun logo trouvé pour &quot;{logoSearchQuery}&quot;
                  </p>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div
                      ref={logoScrollRef}
                      className="logo-library-scroll"
                      onWheel={e => {
                        if (logoScrollRef.current) {
                          e.preventDefault();
                          logoScrollRef.current.scrollLeft += e.deltaY;
                        }
                      }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        padding: '8px 0',
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      <style>{`.logo-library-scroll::-webkit-scrollbar { display: none; }`}</style>
                      {filteredLogos.map((logo: any) => {
                        const hasVariants = logo.variants && Array.isArray(logo.variants) && logo.variants.length > 0;
                        return (
                          <button
                            key={logo.id}
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!logoToReplace) {
                                if (activeModule?.logoPlacementMode === 'zones') {
                                  if (hasVariants) {
                                    setSelectedLogoForVariants(logo);
                                  } else {
                                    handleOpenZoneModal(logo.id, undefined, logo.file_url || '');
                                  }
                                } else {
                                  setSelectedLogoForVariants(logo);
                                }
                                return;
                              }
                              if (hasVariants) {
                                setSelectedLogoForVariants(logo);
                                return;
                              }
                              handleReplaceFromLibrary(logo).catch(err => console.error('Logo click error:', err));
                            }}
                            style={{
                              minWidth: '100px',
                              width: '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff',
                              transition: 'all 0.2s',
                              fontFamily: 'inherit',
                              textAlign: 'left',
                            }}
                          >
                            <div
                              style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: '6px',
                                padding: '4px',
                              }}
                            >
                              {logo.file_url ? (
                                <img src={logo.file_url} alt={logo.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#e0e0e0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    color: '#666',
                                    textAlign: 'center',
                                    padding: '4px',
                                  }}
                                >
                                  {logo.name}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ margin: 0, fontSize: '10px', fontWeight: '500', color: '#111827', fontFamily: CONFIGURATOR_PANEL_FONT, textAlign: 'center' }}>
                                {logo.name}
                              </p>
                              {hasVariants && (
                                <p style={{ margin: '2px 0 0', fontSize: '9px', fontWeight: 400, color: '#6b7280', fontFamily: CONFIGURATOR_PANEL_FONT, textAlign: 'center' }}>
                                  variantes
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '12px 0 8px' }} />
          <div style={{ width: '100%', marginBottom: '8px' }}>
            <div
              className="cv-panel-add-logo-btn"
              role="button"
              tabIndex={0}
              onClick={() => setShowLogoLibrary(true)}
              style={{
                height: '44px',
                padding: '0 40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isAddLogoHovered ? '#374151' : '#000000',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s ease',
                width: '100%',
              }}
              onMouseEnter={() => setIsAddLogoHovered(true)}
              onMouseLeave={() => setIsAddLogoHovered(false)}
            >
              <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>＋</span>
              <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>{activeModule.addLogoButtonLabel || 'Ajouter un logo'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
              {activeModule.placedLogosLabel || 'Logos placés'} ({modulePlacedLogos.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {modulePlacedLogos.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Aucun logo placé sur cette vue</span>
            ) : (
              modulePlacedLogos.map(logo => {
                let logoLabel = 'Logo';
                for (const library of logoLibraries) {
                  const found = library.logos?.find((l: any) => l.id === logo.logoId);
                  if (found) {
                    logoLabel = found.name || 'Logo';
                    break;
                  }
                }
                return (
                  <div
                    key={logo.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const categoryToViewId: Record<string, string> = {
                        torse: 'front',
                        dos: 'back',
                        'bras-gauche': 'left',
                        'bras-droit': 'right',
                      };
                      const logoViewId = categoryToViewId[logo.category];
                      if (logoViewId) {
                        setActiveLogoView(logoViewId as 'front' | 'back' | 'left' | 'right');
                        const viewConfig = customViews.find((v: any) => v.id === logoViewId);
                        if (viewConfig?.cameraViewId) {
                          const cameraView = modelCameraViews.find((cv: any) => cv.id === viewConfig.cameraViewId);
                          if (cameraView) {
                            window.dispatchEvent(
                              new CustomEvent('goToCameraView', { detail: { position: cameraView.position, target: cameraView.target } })
                            );
                          }
                        } else {
                          window.dispatchEvent(new CustomEvent('setCameraView', { detail: logoViewId }));
                        }
                      }
                      setSelectedLogoId(logo.id);
                      setLogoToReplace(logo.id);
                      setShowLogoLibrary(true);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLogoId(logo.id);
                        setLogoToReplace(logo.id);
                        setShowLogoLibrary(true);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#ffffff',
                      border: selectedLogoId === logo.id ? '1px solid #111827' : '1px solid #e0e0e0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        borderRadius: '8px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {logo.variantFile ? (
                        <img src={logo.variantFile} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Aperçu</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{logoLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onRequestDeleteLogo(logo.id, logoLabel);
                      }}
                      aria-label="Supprimer le logo"
                      style={{
                        flexShrink: 0,
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#dc2626',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
