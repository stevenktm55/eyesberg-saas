"use client";

import React, { useEffect } from "react";

export interface ConfiguratorViewerProps {
  modules: { id: string; name: string; icon?: string; iconUrl?: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  panelContent?: React.ReactNode;
  canvasContent?: React.ReactNode;
  onSave?: () => void;
  onAddToCart?: () => void;
  /** true = layout mobile avec barre du bas (onglets + actions) */
  mobile?: boolean;
  /** Styles optionnels pour cv-mobile-sheet-content (ex: étape typographie texte) */
  mobileSheetContentStyle?: React.CSSProperties;
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
  mobileSheetContentStyle,
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
      /* Signe validé zone (cercle noir, coche blanche) - ne pas hériter le noir */
      .configurator-viewer-isolated [data-zone-checkmark] {
        background-color: #000000 !important;
      }
      .configurator-viewer-isolated [data-zone-checkmark] span,
      .configurator-viewer-isolated [data-zone-checkmark] * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      /* Bouton Retour (module texte, bibliothèque logos, etc.) : texte noir, pas de fond */
      .configurator-viewer-isolated .typography-back-button,
      .configurator-viewer-isolated .typography-back-button * {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
        background-color: transparent !important;
        background: transparent !important;
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
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab.cv-sidebar-tab-active *,
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab.cv-sidebar-tab-active span {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab.cv-sidebar-tab-active path,
      .configurator-viewer-isolated .cv-mobile-bottom-bar .cv-sidebar-tab.cv-sidebar-tab-active svg {
        stroke: #ffffff !important;
        fill: #ffffff !important;
      }
      /* Masquer la scrollbar horizontale des onglets mobile */
      .configurator-viewer-isolated .cv-mobile-tabs-scroll::-webkit-scrollbar {
        display: none !important;
      }
      /* Jauge épaisseur contour : piste et curseur jusqu'aux extrémités, sans contour focus (override configurator-panel-theme) */
      .configurator-viewer-isolated .cv-outline-thickness-slider,
      .configurator-viewer-isolated .cv-outline-thickness-slider:focus,
      .configurator-viewer-isolated .cv-outline-thickness-slider:focus-visible,
      .configurator-viewer-isolated .cv-outline-thickness-slider:active {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 18px;
        background: transparent;
        padding: 0;
        margin: 0;
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        border-color: transparent !important;
      }
      .configurator-viewer-isolated .cv-outline-thickness-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        background: linear-gradient(to right, #000000 calc(var(--slider-progress, 0) * 1%), #e5e7eb calc(var(--slider-progress, 0) * 1%));
        border-radius: 3px;
      }
      .configurator-viewer-isolated .cv-outline-thickness-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        margin-top: -5px;
      }
      .configurator-viewer-isolated .cv-outline-thickness-slider::-moz-range-track {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
      }
      .configurator-viewer-isolated .cv-outline-thickness-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        border: none;
      }
      /* Jauge intensité déformation : -100 à +100, piste et curseur jusqu'aux extrémités, noir, sans contour focus */
      .configurator-viewer-isolated .cv-deformation-intensity-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 18px;
        background: transparent;
        padding: 0;
        margin: 0;
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        border-color: transparent !important;
      }
      .configurator-viewer-isolated .cv-deformation-intensity-slider:focus,
      .configurator-viewer-isolated .cv-deformation-intensity-slider:focus-visible,
      .configurator-viewer-isolated .cv-deformation-intensity-slider:active {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        border-color: transparent !important;
      }
      .configurator-viewer-isolated .cv-deformation-intensity-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        background: linear-gradient(to right, #000000 calc(var(--deformation-progress, 50) * 1%), #e5e7eb calc(var(--deformation-progress, 50) * 1%));
        border-radius: 3px;
      }
      .configurator-viewer-isolated .cv-deformation-intensity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        margin-top: -5px;
      }
      .configurator-viewer-isolated .cv-deformation-intensity-slider::-moz-range-track {
        width: 100%;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
      }
      .configurator-viewer-isolated .cv-deformation-intensity-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #000000;
        cursor: pointer;
        border: none;
      }
      /* Onglets module texte mobile : une seule ligne, scroll horizontal sans scrollbar */
      .configurator-viewer-isolated .cv-text-tabs-mobile::-webkit-scrollbar {
        display: none !important;
      }
      /* Bouton type de déformation : bordure visible, angles arrondis */
      .configurator-viewer-isolated .cv-deformation-type-btn {
        border: 1px solid #d1d5db !important;
        border-radius: 12px !important;
      }
      /* Boutons mode couleur (Couleur unie, Dégradé, Couleur 1/2, direction) : angles arrondis, contour visible inactif, noir actif */
      .configurator-viewer-isolated .cv-couleur-mode-btn {
        border-radius: 12px !important;
        border: 1px solid #d1d5db !important;
        background-color: #f9fafb !important;
        color: #111827 !important;
        -webkit-text-fill-color: #111827 !important;
      }
      .configurator-viewer-isolated .cv-couleur-mode-btn.cv-couleur-mode-btn-active {
        border: 2px solid #111827 !important;
        background-color: #e5e7eb !important;
      }
      /* Bouton de fermeture du sheet mobile */
      .configurator-viewer-isolated .cv-mobile-sheet .cv-mobile-close {
        background-color: transparent !important;
        border-radius: 8px !important;
        border: 1px solid #d1d5db !important;
      }
      .configurator-viewer-isolated .cv-mobile-sheet .cv-mobile-close svg {
        stroke: #000000 !important;
      }
      /* Bouton "Ajouter un logo" / "Importer un logo" dans le panneau Logo : texte toujours blanc */
      .configurator-viewer-isolated .cv-panel-add-logo-btn,
      .configurator-viewer-isolated .cv-panel-add-logo-btn * {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        font-weight: 600 !important;
      }
      /* Bibliothèque de logos : conteneur en flex, contenu scrollable */
      .configurator-viewer-isolated .logo-library-container {
        height: 100% !important;
        max-height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .configurator-viewer-isolated .logo-library-content {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        flex: 1 1 0% !important;
        min-height: 0 !important;
        max-height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .configurator-viewer-isolated .logo-library-grid {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        flex: 1 1 0% !important;
        min-height: 0 !important;
      }
      /* Forcer la hauteur maximale quand la bibliothèque est active */
      .configurator-viewer-isolated .logo-library-active .logo-library-grid {
        max-height: 100% !important;
        overflow-y: auto !important;
      }
      /* S'assurer que le conteneur de scroll ne s'agrandit pas */
      .configurator-viewer-isolated .cv-panel-scroll-container {
        flex: 1 1 0% !important;
        min-height: 0 !important;
      }
      /* Quand la bibliothèque est ouverte, forcer la hauteur */
      .configurator-viewer-isolated .cv-panel-scroll-container.logo-library-active {
        overflow: hidden !important;
        overflow-y: hidden !important;
        flex: none !important;
      }
      /* En contexte admin (product/new), hauteur fixe pour le scroll interne dans la bibliothèque (éviter que la page défile) */
      .configurator-viewer-isolated .cv-panel-scroll-container:has(.logo-library-container) {
        height: 70vh !important;
        min-height: 70vh !important;
        max-height: 70vh !important;
        overflow: hidden !important;
      }
      /* Empêcher le viewer de grandir au-delà du parent quand la bibliothèque est ouverte */
      .configurator-viewer-isolated.has-logo-library {
        max-height: 100% !important;
        overflow: hidden !important;
      }
      /* Forcer la hauteur du bloc gauche quand la bibliothèque est active */
      .configurator-viewer-isolated.has-logo-library .cv-left-block {
        height: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }
      .configurator-viewer-isolated.has-logo-library .cv-left-block > div:first-of-type {
        height: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }
      .configurator-viewer-isolated.has-logo-library .cv-left-block > section {
        height: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }
      /* S'assurer que le footer reste en bas */
      .configurator-viewer-isolated .cv-left-block {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      .configurator-viewer-isolated .cv-left-block > div:first-of-type {
        flex: 1 1 0% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .configurator-viewer-isolated .cv-actions-bar {
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
      }
      /* Mobile sheet : 8px de padding quand la bibliothèque de logos est affichée */
      .configurator-viewer-isolated .cv-mobile-sheet-content:has(.logo-library-container) {
        padding: 8px !important;
      }
      /* Inputs : bordure noire au focus (remplace le bleu par défaut) */
      .configurator-viewer-isolated input[type="text"]:focus,
      .configurator-viewer-isolated input[type="search"]:focus,
      .configurator-viewer-isolated input[type="email"]:focus,
      .configurator-viewer-isolated textarea:focus {
        outline: none !important;
        border-color: #000000 !important;
        box-shadow: 0 0 0 1px #000000 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, []);

  // Détecter la bibliothèque de logos et ajuster le comportement du scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (mobile) return; // Pas besoin sur mobile
    
    const updateScrollContainer = () => {
      if (!scrollContainerRef.current) return;
      
      const scrollContainer = scrollContainerRef.current;
      const root = document.getElementById('configurator-viewer-isolated-root');
      if (!root) return;
      
      const logoLibraryContainer = root.querySelector('.logo-library-container');
      const panelSection = scrollContainer.closest('section');
      const leftBlock = root.querySelector('.cv-left-block');
      const actionsBar = root.querySelector('.cv-actions-bar');
      const header = root.querySelector('.cv-panel-header') as HTMLElement;
      
      if (!panelSection || !leftBlock || !actionsBar) return;
      
      // Calculer la hauteur disponible (header ciblé via .cv-panel-header)
      const leftBlockRect = leftBlock.getBoundingClientRect();
      
      if (!header) return;
      
      const headerRect = header.getBoundingClientRect();
      const actionsRect = actionsBar.getBoundingClientRect();
      
      // Hauteur totale du bloc gauche
      const leftBlockHeight = leftBlockRect.height;
      // Hauteur du header
      const headerHeight = headerRect.height;
      // Hauteur du footer
      const actionsHeight = actionsRect.height;
      
      // Hauteur disponible pour le contenu scrollable
      let availableHeight = leftBlockHeight - headerHeight - actionsHeight;
      // En contexte admin (product/new), le bloc gauche peut ne pas être encore contraint : plafonner à 70vh pour éviter que la page pousse
      const maxLibraryHeight = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.7) : availableHeight;
      if (logoLibraryContainer && availableHeight > maxLibraryHeight) {
        availableHeight = maxLibraryHeight;
      }
      
      if (logoLibraryContainer) {
        // Ajouter une classe au root pour le ciblage CSS
        root.classList.add('has-logo-library');
        
        // Bibliothèque ouverte : forcer la hauteur sur le bloc gauche et le section parent
        const rootRect = root.getBoundingClientRect();
        const rootHeight = rootRect.height;
        
        leftBlock.style.height = `${rootHeight}px`;
        leftBlock.style.maxHeight = `${rootHeight}px`;
        leftBlock.style.overflow = 'hidden';
        
        panelSection.style.height = `${rootHeight}px`;
        panelSection.style.maxHeight = `${rootHeight}px`;
        panelSection.style.overflow = 'hidden';
        
        // Bibliothèque ouverte : désactiver le scroll du conteneur parent
        scrollContainer.classList.add('logo-library-active');
        scrollContainer.style.overflow = 'hidden';
        scrollContainer.style.overflowY = 'hidden';
        scrollContainer.style.padding = '0';
        scrollContainer.style.height = `${availableHeight}px`;
        scrollContainer.style.maxHeight = `${availableHeight}px`;
        scrollContainer.style.minHeight = `${availableHeight}px`;
        scrollContainer.style.flex = 'none';
        scrollContainer.style.boxSizing = 'border-box';
        scrollContainer.style.position = 'relative';
        
        // Forcer aussi la hauteur sur le conteneur de la bibliothèque
        const libraryContent = logoLibraryContainer.querySelector('.logo-library-content') as HTMLElement;
        const libraryGrid = logoLibraryContainer.querySelector('.logo-library-grid') as HTMLElement;
        
        if (libraryContent && libraryGrid) {
          // Utiliser getBoundingClientRect pour des mesures précises
          const headerEl = logoLibraryContainer.querySelector('div[style*="padding"]:first-of-type') as HTMLElement;
          const importButton = logoLibraryContainer.querySelector('.cv-panel-add-logo-btn') as HTMLElement;
          const searchInput = libraryContent.querySelector('input') as HTMLElement;
          
          if (headerEl && importButton && searchInput) {
            const headerRect = headerEl.getBoundingClientRect();
            const buttonRect = importButton.getBoundingClientRect();
            const searchRect = searchInput.getBoundingClientRect();
            
            // Calculer la hauteur disponible pour la grille
            const usedHeight = headerRect.height + buttonRect.height + searchRect.height;
            const contentPadding = parseFloat(getComputedStyle(libraryContent).paddingTop) + parseFloat(getComputedStyle(libraryContent).paddingBottom);
            const gaps = 8 + 8; // gap du container + gap du content
            
            const gridAvailableHeight = availableHeight - usedHeight - contentPadding - gaps;
            
            if (gridAvailableHeight > 0) {
              libraryGrid.style.height = `${gridAvailableHeight}px`;
              libraryGrid.style.maxHeight = `${gridAvailableHeight}px`;
              libraryGrid.style.minHeight = '0';
              libraryGrid.style.overflowY = 'auto';
              libraryGrid.style.overflowX = 'hidden';
            }
          }
        }
      } else {
        // Retirer la classe du root
        root.classList.remove('has-logo-library');
        
        // Bibliothèque fermée : remettre les styles normaux
        leftBlock.style.height = '';
        leftBlock.style.maxHeight = '';
        leftBlock.style.overflow = '';
        
        panelSection.style.height = '';
        panelSection.style.maxHeight = '';
        panelSection.style.overflow = '';
        
        // Bibliothèque fermée : scroll normal
        scrollContainer.classList.remove('logo-library-active');
        scrollContainer.style.overflow = 'auto';
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.padding = '0 4px 24px';
        scrollContainer.style.height = '';
        scrollContainer.style.maxHeight = '';
        scrollContainer.style.minHeight = '';
        scrollContainer.style.flex = '1 1 0%';
        scrollContainer.style.boxSizing = '';
        scrollContainer.style.position = '';
      }
    };
    
    // Vérifier immédiatement et après plusieurs délais pour s'assurer que le DOM est prêt
    updateScrollContainer();
    const timeoutId = setTimeout(updateScrollContainer, 50);
    const timeoutId2 = setTimeout(updateScrollContainer, 150);
    const timeoutId3 = setTimeout(updateScrollContainer, 300);
    const timeoutId4 = setTimeout(updateScrollContainer, 500);
    const timeoutId5 = setTimeout(updateScrollContainer, 800);
    const timeoutId6 = setTimeout(updateScrollContainer, 1200);
    
    // Observer les changements de taille et de contenu
    const resizeObserver = new ResizeObserver(() => {
      updateScrollContainer();
    });
    
    const mutationObserver = new MutationObserver(() => {
      updateScrollContainer();
    });
    
    if (scrollContainerRef.current) {
      const root = document.getElementById('configurator-viewer-isolated-root');
      const leftBlock = root?.querySelector('.cv-left-block');
      const actionsBar = root?.querySelector('.cv-actions-bar');
      
      if (leftBlock) resizeObserver.observe(leftBlock);
      if (actionsBar) resizeObserver.observe(actionsBar);
      
      mutationObserver.observe(scrollContainerRef.current, {
        childList: true,
        subtree: true
      });
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      clearTimeout(timeoutId5);
      clearTimeout(timeoutId6);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (scrollContainerRef.current) {
        const root = document.getElementById('configurator-viewer-isolated-root');
        const leftBlock = root?.querySelector('.cv-left-block') as HTMLElement;
        const panelSection = scrollContainerRef.current.closest('section');
        
        if (root) {
          root.classList.remove('has-logo-library');
        }
        
        if (leftBlock) {
          leftBlock.style.height = '';
          leftBlock.style.maxHeight = '';
          leftBlock.style.overflow = '';
        }
        
        if (panelSection) {
          panelSection.style.height = '';
          panelSection.style.maxHeight = '';
          panelSection.style.overflow = '';
        }
        
        scrollContainerRef.current.classList.remove('logo-library-active');
        scrollContainerRef.current.style.overflow = 'auto';
        scrollContainerRef.current.style.overflowY = 'auto';
        scrollContainerRef.current.style.padding = '0 4px 24px';
        scrollContainerRef.current.style.height = '';
        scrollContainerRef.current.style.maxHeight = '';
        scrollContainerRef.current.style.minHeight = '';
        scrollContainerRef.current.style.flex = '1 1 0%';
        scrollContainerRef.current.style.boxSizing = '';
        scrollContainerRef.current.style.position = '';
        
        // Restaurer les styles de la grille si elle existe
        if (root) {
          const libraryGrid = root.querySelector('.logo-library-grid') as HTMLElement;
          if (libraryGrid) {
            libraryGrid.style.height = '';
            libraryGrid.style.maxHeight = '';
            libraryGrid.style.minHeight = '';
            libraryGrid.style.overflowY = '';
            libraryGrid.style.overflowX = '';
          }
        }
      }
    };
  }, [panelContent, mobile]);

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
        {/* Zone 3D en haut, prend tout l'espace au-dessus de la barre */}
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
                      {module.iconUrl ? (
                        <img src={module.iconUrl} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
                      ) : module.icon ? (
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
                  className="cv-mobile-close"
                  onClick={() => setMobileSheetOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#e5e7eb',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div
                className="cv-mobile-sheet-content"
                style={
                  mobileSheetContentStyle ?? {
                    flex: 1,
                    minHeight: 0,
                    overflow: "auto",
                    padding: "16px",
                  }
                }
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
          minWidth: '400px',
          maxWidth: '600px',
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
              {module.iconUrl ? (
                <img src={module.iconUrl} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', display: 'flex', filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
              ) : module.icon ? (
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
          width: '100%',
          minWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e5e5',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header avec titre — cv-panel-header pour le ciblage du layout logo */}
        <div 
          className="cv-panel-header"
          data-cv="panel-header"
          style={{ 
            padding: '28px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
            flexShrink: 0
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
          ref={scrollContainerRef}
          className="flex-1 overflow-auto cv-panel-scroll-container"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: '0 4px 24px',
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 0%',
            overflow: 'auto',
            minHeight: 0
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
