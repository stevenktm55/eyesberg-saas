'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Model3DPreviewWithControls } from '@/components/Model3DPreviewWithControls';

// Style global pour forcer le texte en noir dans le Tab Header
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .customizer-tab-name {
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
    }
  `;
  if (!document.getElementById('customizer-tab-style')) {
    style.id = 'customizer-tab-style';
    document.head.appendChild(style);
  }
}

type Tab = 'build' | 'pricing' | 'variants' | 'connect';

type CustomizationModule = {
  id: string;
  tabName: string; // Nom de l'onglet dans la sidebar
  icon: string; // Icône (emoji ou texte) - fallback si iconUrl n'existe pas
  iconUrl?: string; // URL de l'icône image (.svg ou .png)
  inputType: 'thumbnail' | 'dropdown' | 'radio' | 'label' | 'file-upload' | 'text-input' | 'checkbox';
  required?: boolean;
  options?: string[]; // Pour dropdown et radio
  contentType?: 'colors' | 'logos' | 'fonts' | 'designs-2d' | 'sizes' | null; // Type de contenu à afficher
  selectedItems?: {
    colorPaletteId?: string;
    logoLibraryId?: string;
    fontGroupId?: string;
    design2DId?: string;
    sizePatternId?: string;
  };
};

// Garder Question pour compatibilité avec l'ancien système
type Question = {
  id: string;
  type: 'text' | 'number' | 'color' | 'image' | 'select';
  label: string;
  required: boolean;
  options?: string[];
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
};

type Design2D = {
  id: string;
  name: string;
  svg_url?: string;
  svgUrl?: string;
  preview_url?: string | null;
};

export default function ProductBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('Untitled Product');
  const [activeTab, setActiveTab] = useState<Tab>('build');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customizationModules, setCustomizationModules] = useState<CustomizationModule[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionSettings, setShowQuestionSettings] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [newModule, setNewModule] = useState<Partial<CustomizationModule>>({
    tabName: '',
    icon: '🎨',
    inputType: 'thumbnail', // Par défaut, sera toujours 'thumbnail' pour la V1
    contentType: null
  });
  const [newModuleIconFile, setNewModuleIconFile] = useState<File | null>(null);
  const [selectedModule, setSelectedModule] = useState<CustomizationModule | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [designs2D, setDesigns2D] = useState<Design2D[]>([]);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<string | null>(null);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [logoLibraries, setLogoLibraries] = useState<any[]>([]);
  const [fontGroups, setFontGroups] = useState<any[]>([]);
  const [sizePatterns, setSizePatterns] = useState<any[]>([]);
  const [materialMaps, setMaterialMaps] = useState<any[]>([]);
  const [modelMaterialMaps, setModelMaterialMaps] = useState<Record<string, any>>({}); // material_map_id -> material map avec fichiers
  const [show3DSettings, setShow3DSettings] = useState(false);
  const [zoomSpeed, setZoomSpeed] = useState(1);
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(10);
  const [initialZoom, setInitialZoom] = useState(5);
  const [initialRotation, setInitialRotation] = useState(0);

  useEffect(() => {
    // Récupérer le shop depuis l'URL
    const shop = searchParams.get('shop');
    const id = searchParams.get('id');
    
    if (!shop && !id) {
      router.push('/admin');
      return;
    }

    // Charger le produit existant ou créer un nouveau
    async function loadProduct() {
      try {
        if (id) {
          // Charger un produit existant
          const res = await fetch(`/api/product-builder?id=${encodeURIComponent(id)}`);
          if (res.ok) {
            const product = await res.json();
            setProductId(product.id);
            setProductName(product.name || 'Untitled Product');
            setQuestions(product.builder_data?.questions || []);
            setCustomizationModules(product.builder_data?.customizationModules || []);
            setSelectedModel3DId(product.builder_data?.model3DId || null);
            setSelectedDesign2DId(product.builder_data?.design2DId || null);
            // Charger les réglages 3D
            const settings = product.builder_data?.settings || {};
            if (settings.zoomSpeed !== undefined) setZoomSpeed(settings.zoomSpeed);
            if (settings.rotateSpeed !== undefined) setRotateSpeed(settings.rotateSpeed);
            if (settings.minZoom !== undefined) setMinZoom(settings.minZoom);
            if (settings.maxZoom !== undefined) setMaxZoom(settings.maxZoom);
            if (settings.initialZoom !== undefined) setInitialZoom(settings.initialZoom);
            if (settings.initialRotation !== undefined) setInitialRotation(settings.initialRotation);
          }
        } else if (shop) {
          // Créer un nouveau produit
          const res = await fetch(`/api/product-builder?shop=${encodeURIComponent(shop)}`);
          if (res.ok) {
            const product = await res.json();
            setProductId(product.id);
            // Mettre à jour l'URL avec l'ID pour permettre le rechargement
            router.replace(`/admin/products/new?shop=${encodeURIComponent(shop)}&id=${product.id}`);
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      }
    }

    loadProduct();
    fetchModels3D();
    fetchDesigns2D();
    fetchColorPalettes();
    fetchLogoLibraries();
    fetchFontGroups();
    fetchSizePatterns();
    fetchMaterialMaps();
  }, [searchParams, router]);

  async function fetchModels3D() {
    try {
      const res = await fetch('/api/models-3d');
      if (res.ok) {
        const data = await res.json();
        setModels3D(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching 3D models:', error);
    }
  }

  async function fetchDesigns2D() {
    try {
      const res = await fetch('/api/designs-2d');
      if (res.ok) {
        const data = await res.json();
        setDesigns2D(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching 2D designs:', error);
    }
  }

  async function fetchColorPalettes() {
    try {
      const res = await fetch('/api/color-palettes');
      if (res.ok) {
        const data = await res.json();
        setColorPalettes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching color palettes:', error);
    }
  }

  async function fetchLogoLibraries() {
    try {
      const res = await fetch('/api/logo-libraries');
      if (res.ok) {
        const data = await res.json();
        setLogoLibraries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching logo libraries:', error);
    }
  }

  async function fetchFontGroups() {
    try {
      const res = await fetch('/api/font-groups');
      if (res.ok) {
        const data = await res.json();
        setFontGroups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching font groups:', error);
    }
  }

  async function fetchSizePatterns() {
    try {
      const res = await fetch('/api/size-patterns');
      if (res.ok) {
        const data = await res.json();
        setSizePatterns(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching size patterns:', error);
    }
  }

  async function fetchMaterialMaps() {
    try {
      const res = await fetch('/api/material-maps');
      if (res.ok) {
        const data = await res.json();
        setMaterialMaps(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching material maps:', error);
    }
  }

  // Récupérer les material maps assignés au modèle 3D sélectionné
  useEffect(() => {
    if (!selectedModel3DId || models3D.length === 0) {
      setModelMaterialMaps({});
      return;
    }

    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
    if (!selectedModel || !(selectedModel as any).model_parts) {
      setModelMaterialMaps({});
      return;
    }

    // Créer un map des material_map_id vers les material maps avec leurs fichiers
    const materialMapMap: Record<string, any> = {};
    const parts = (selectedModel as any).model_parts || [];
    
    parts.forEach((part: any) => {
      if (part.material_map_id && !materialMapMap[part.material_map_id]) {
        const materialMap = materialMaps.find(m => m.id === part.material_map_id);
        if (materialMap) {
          materialMapMap[part.material_map_id] = materialMap;
        }
      }
    });

    setModelMaterialMaps(materialMapMap);
  }, [selectedModel3DId, models3D, materialMaps]);

  // Fonction de sauvegarde automatique avec debounce
  const autoSave = useCallback(async () => {
    if (!productId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          name: productName,
          builderData: {
            questions: questions,
            customizationModules: customizationModules,
            activeTab: activeTab,
            model3DId: selectedModel3DId,
            design2DId: selectedDesign2DId,
            settings: {
              zoomSpeed,
              rotateSpeed,
              minZoom,
              maxZoom,
              initialZoom,
              initialRotation
            }
          },
        }),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    } finally {
      setSaving(false);
    }
  }, [productId, productName, questions, customizationModules, activeTab, selectedModel3DId, selectedDesign2DId, zoomSpeed, rotateSpeed, minZoom, maxZoom, initialZoom, initialRotation]);

  // Debounce pour la sauvegarde automatique
  useEffect(() => {
    if (!productId) return;

    // Nettoyer le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Créer un nouveau timeout
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000); // Sauvegarder 1 seconde après la dernière modification

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [productName, questions, customizationModules, activeTab, productId, selectedModel3DId, selectedDesign2DId, zoomSpeed, rotateSpeed, minZoom, maxZoom, initialZoom, initialRotation, autoSave]);

  function addQuestion() {
    // Ouvrir le modal de création de module
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail', // Toujours 'thumbnail' pour la V1
      contentType: null
    });
    setShowCreateModuleModal(true);
  }

  async function createModule() {
    if (!newModule.tabName || !newModule.icon || !newModule.contentType) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    let iconUrl: string | undefined = undefined;

    // Upload de l'icône si un fichier est fourni
    if (newModuleIconFile) {
      try {
        const formData = new FormData();
        formData.append('file', newModuleIconFile);
        formData.append('folder', 'module-icons');

        const res = await fetch('/api/upload-icon', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          iconUrl = data.url;
        } else {
          console.error('Error uploading icon');
        }
      } catch (error) {
        console.error('Error uploading icon:', error);
      }
    }

    const module: CustomizationModule = {
      id: `module-${Date.now()}`,
      tabName: newModule.tabName!,
      icon: newModule.icon!,
      iconUrl: iconUrl,
      inputType: 'thumbnail', // Toujours 'thumbnail' pour la V1
      required: newModule.required || false,
      contentType: newModule.contentType as CustomizationModule['contentType']
    };

    setCustomizationModules([...customizationModules, module]);
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail',
      contentType: null
    });
    setNewModuleIconFile(null);
    setShowCreateModuleModal(false);
  }

  function deleteModule(moduleId: string) {
    setCustomizationModules(customizationModules.filter(m => m.id !== moduleId));
    // Si le module supprimé était sélectionné, réinitialiser la sélection
    if (selectedModule?.id === moduleId) {
      setSelectedModule(null);
      setShowQuestionSettings(false);
    }
    // Si le module supprimé était actif dans le customizer, fermer l'onglet
    if (activeCustomizerTab === moduleId) {
      setActiveCustomizerTab(null);
    }
  }

  function updateQuestion(questionId: string, updates: Partial<Question>) {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion({ ...selectedQuestion, ...updates });
    }
  }

  function deleteQuestion(questionId: string) {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(null);
      setShowQuestionSettings(false);
    }
    // La sauvegarde automatique sera déclenchée par le useEffect
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      display: 'flex',
      fontFamily: 'var(--stepn-font-body), sans-serif'
    }}>
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Product Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <img
                src="/eyesberg.svg"
                alt="Eyesberg"
                style={{
                  height: '32px',
                  width: 'auto'
                }}
              />
            </button>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: 'var(--stepn-font-body)',
                outline: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                minWidth: '200px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
            <span style={{ color: '#a0a0a0', fontSize: '14px' }}>▼</span>
            {/* Auto-save indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              {saving ? (
                <span style={{ color: '#8eff36', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>

          {/* Center: Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('build')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'build' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'build' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                fontWeight: activeTab === 'build' ? '600' : '400'
              }}
            >
              Build
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'pricing' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'pricing' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                fontWeight: activeTab === 'pricing' ? '600' : '400'
              }}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'variants' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'variants' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                fontWeight: activeTab === 'variants' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Variants
              <span style={{ fontSize: '12px' }}>🔒</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'connect' ? '#1a1a1a' : 'transparent',
                color: activeTab === 'connect' ? '#8eff36' : '#a0a0a0',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                fontWeight: activeTab === 'connect' ? '600' : '400'
              }}
            >
              Connect
            </button>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              border: '1px solid #2a2a2a'
            }}>
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>⌕</span>
              <input
                type="text"
                placeholder="Search..."
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'var(--stepn-font-body)',
                  outline: 'none',
                  width: '120px'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              border: '1px solid #2a2a2a',
              cursor: 'pointer'
            }}>
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>?</span>
              <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>Logic</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              border: '1px solid #2a2a2a',
              cursor: 'pointer'
            }}>
              <span style={{ color: '#8eff36', fontSize: '12px' }}>👁</span>
              <span style={{ color: '#8eff36', fontSize: '12px', fontFamily: 'var(--stepn-font-body)' }}>Published</span>
            </div>
            <span style={{ color: '#a0a0a0', fontSize: '12px', cursor: 'pointer' }}>▼</span>
          </div>
        </div>


        {/* Main Builder Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Left Sidebar - Questions */}
          <div style={{
            width: '320px',
            backgroundColor: '#0a0a0a',
            borderRight: '1px solid #1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Sidebar Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setShow3DSettings(!show3DSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: show3DSettings ? '#8eff36' : '#a0a0a0',
                  fontSize: '22px',
                  transition: 'color 0.2s'
                }}
                title="3D Viewer Settings"
              >
                ⚙
              </button>
              <button
                onClick={addQuestion}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#8eff36',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#000000',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--stepn-font-body)',
                  fontWeight: '600'
                }}
              >
                +
              </button>
            </div>

            {/* Modules/Questions List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              position: 'relative'
            }}>
              {/* 3D Viewer Settings Overlay */}
              {show3DSettings && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#0a0a0a',
                  zIndex: 10,
                  padding: '16px',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    color: '#ffffff',
                    marginBottom: '20px',
                    fontWeight: '600'
                  }}>
                    3D Viewer Settings
                  </div>
                  
                  {/* Zoom Speed */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Zoom Speed
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {zoomSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={zoomSpeed}
                      onChange={(e) => setZoomSpeed(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(zoomSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a ${(zoomSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Rotate Speed */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Rotate Speed
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {rotateSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={rotateSpeed}
                      onChange={(e) => setRotateSpeed(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(rotateSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a ${(rotateSpeed - 0.1) / (3 - 0.1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>Slow</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Min Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Min Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {minZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={minZoom}
                      onChange={(e) => setMinZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(minZoom - 0.5) / (5 - 0.5) * 100}%, #1a1a1a ${(minZoom - 0.5) / (5 - 0.5) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>0.5</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  {/* Max Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Max Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {maxZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={maxZoom}
                      onChange={(e) => setMaxZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(maxZoom - 1) / (20 - 1) * 100}%, #1a1a1a ${(maxZoom - 1) / (20 - 1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>1.0</span>
                      <span>20.0</span>
                    </div>
                  </div>

                  {/* Initial Zoom */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Initial Zoom Distance
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {initialZoom.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.1"
                      value={initialZoom}
                      onChange={(e) => setInitialZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(initialZoom - 1) / (15 - 1) * 100}%, #1a1a1a ${(initialZoom - 1) / (15 - 1) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>1.0</span>
                      <span>15.0</span>
                    </div>
                  </div>

                  {/* Initial Rotation */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        Initial Rotation Angle
                      </label>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#8eff36',
                        fontWeight: '600'
                      }}>
                        {initialRotation}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={initialRotation}
                      onChange={(e) => setInitialRotation(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '3px',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #8eff36 0%, #8eff36 ${(initialRotation / 360) * 100}%, #1a1a1a ${(initialRotation / 360) * 100}%, #1a1a1a 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>0°</span>
                      <span>360°</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Questions/Modules Content (hidden when settings are open) */}
              {!show3DSettings && (
                customizationModules.length === 0 && questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#a0a0a0'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    marginBottom: '8px',
                    color: '#ffffff'
                  }}>
                    There are no questions, yet
                  </p>
                  <p style={{
                    fontSize: '12px',
                    fontFamily: 'var(--stepn-font-body)',
                    marginBottom: '24px',
                    color: '#a0a0a0'
                  }}>
                    Create your first question to start building your customizer.
                  </p>
                  <button
                    onClick={addQuestion}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#8eff36',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'var(--stepn-font-body)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto'
                    }}
                  >
                    <span>+</span>
                    Create question
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Customization Modules */}
                  {customizationModules.map((module) => (
                    <div
                      key={module.id}
                      onClick={() => {
                        setSelectedModule(module);
                        setSelectedQuestion(null);
                        setShowQuestionSettings(true);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedModule?.id === module.id ? '#1a1a1a' : '#0a0a0a',
                        border: selectedModule?.id === module.id ? '1px solid #8eff36' : '1px solid #1a1a1a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '20px'
                      }}>
                        {module.iconUrl ? (
                          <img
                            src={module.iconUrl}
                            alt={module.tabName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          module.icon
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#ffffff',
                        flex: 1
                      }}>
                        {module.tabName}
                      </div>
                    </div>
                  ))}
                  {/* Legacy Questions */}
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        setSelectedQuestion(question);
                        setSelectedModule(null);
                        setShowQuestionSettings(true);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedQuestion?.id === question.id ? '#1a1a1a' : '#0a0a0a',
                        border: selectedQuestion?.id === question.id ? '1px solid #8eff36' : '1px solid #1a1a1a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        {question.label}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        {question.type}
                      </div>
                    </div>
                  ))}
                </div>
                )
              )}
            </div>

            {/* Behind the scene */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #1a1a1a',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: '#ffffff',
                  marginBottom: '4px'
                }}>
                  Behind the scene
                </div>
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: '#a0a0a0'
                }}>
                  Not shown in question panel
                </div>
              </div>
              
              {/* 3D Model Selector */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: '#a0a0a0',
                  marginBottom: '6px'
                }}>
                  Modèle 3D
                </label>
                <select
                  value={selectedModel3DId || ''}
                  onChange={(e) => setSelectedModel3DId(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Sélectionner un modèle 3D</option>
                  {models3D.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2D Design Selector */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--stepn-font-body)',
                  color: '#a0a0a0',
                  marginBottom: '6px'
                }}>
                  Design 2D
                </label>
                <select
                  value={selectedDesign2DId || ''}
                  onChange={(e) => setSelectedDesign2DId(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Sélectionner un design 2D</option>
                  {designs2D.map((design) => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add to cart */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '14px',
                fontFamily: 'var(--stepn-font-body)',
                color: '#ffffff'
              }}>
                Add to cart
              </span>
              <span style={{ color: '#a0a0a0', fontSize: '12px', cursor: 'pointer' }}>▶</span>
            </div>
          </div>

          {/* Center: Customizer Preview Area */}
          <div style={{
            flex: 1,
            backgroundColor: '#ffffff',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Left Sidebar - Customizer Tabs (only visible when model is selected) */}
            {selectedModel3DId && (
              <div style={{
                width: '80px',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 0',
                gap: '8px'
              }}>
                {customizationModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setActiveCustomizerTab(activeCustomizerTab === module.id ? null : module.id)}
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: activeCustomizerTab === module.id ? '#f5f5f5' : 'transparent',
                      border: activeCustomizerTab === module.id ? '1px solid #e0e0e0' : '1px solid #e0e0e0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: activeCustomizerTab === module.id ? '#000000' : '#666666',
                      fontSize: '20px',
                      transition: 'all 0.2s',
                      overflow: 'hidden'
                    }}
                    title={module.tabName}
                  >
                    {module.iconUrl ? (
                      <img
                        src={module.iconUrl}
                        alt={module.tabName}
                        style={{
                          width: '32px',
                          height: '32px',
                          maxWidth: '32px',
                          maxHeight: '32px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '24px', lineHeight: '1' }}>
                        {module.icon}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Customizer Tab Panel (slides in from left) */}
            {selectedModel3DId && activeCustomizerTab && (() => {
              const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
              if (!activeModule) return null;
              
              return (
                <div style={{
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  {/* Tab Header */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#000000' // Force la couleur noire sur le conteneur parent
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '28px', 
                      height: '28px',
                      flexShrink: 0,
                      minWidth: '28px',
                      minHeight: '28px',
                      color: '#000000'
                    }}>
                      {activeModule.iconUrl ? (
                        <img
                          src={activeModule.iconUrl}
                          alt={activeModule.tabName}
                          style={{
                            width: '28px',
                            height: '28px',
                            maxWidth: '28px',
                            maxHeight: '28px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <span style={{ color: '#000000', fontSize: '20px', lineHeight: '1' }}>
                          {activeModule.icon}
                        </span>
                      )}
                    </div>
                    <span 
                      style={{ 
                        color: '#000000',
                        fontSize: '14px', 
                        fontFamily: 'var(--stepn-font-body)', 
                        fontWeight: '500',
                        display: 'block',
                        lineHeight: '1.2'
                      }}
                      className="customizer-tab-name"
                    >
                      {activeModule.tabName}
                    </span>
                  </div>

                  {/* Tab Content */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px'
                  }}>
                    {!activeModule.contentType ? (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Configurez le module dans les settings pour afficher du contenu.
                        </p>
                      </div>
                    ) : activeModule.contentType === 'colors' && activeModule.selectedItems?.colorPaletteId ? (() => {
                      const palette = colorPalettes.find(p => p.id === activeModule.selectedItems?.colorPaletteId);
                      if (!palette) return <p style={{ color: '#666', fontSize: '14px' }}>Palette non trouvée</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'thumbnail' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                              {palette.colors?.map((color: any, idx: number) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      backgroundColor: color.hex || color,
                                      borderRadius: '4px',
                                      border: '1px solid #e0e0e0'
                                    }}
                                  />
                                  <span style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                                    {typeof color === 'string' ? color : color.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: 'var(--stepn-font-body)',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner une couleur</option>
                              {palette.colors?.map((color: any, idx: number) => (
                                <option key={idx} value={typeof color === 'string' ? color : color.hex}>
                                  {typeof color === 'string' ? color : color.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {activeModule.inputType === 'radio' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {palette.colors?.map((color: any, idx: number) => (
                                <label
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <input type="radio" name={`color-${activeModule.id}`} value={typeof color === 'string' ? color : color.hex} />
                                  <div
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      backgroundColor: color.hex || color,
                                      borderRadius: '4px',
                                      border: '1px solid #e0e0e0'
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#333' }}>
                                    {typeof color === 'string' ? color : color.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'logos' && activeModule.selectedItems?.logoLibraryId ? (() => {
                      const library = logoLibraries.find(l => l.id === activeModule.selectedItems?.logoLibraryId);
                      if (!library) return <p style={{ color: '#666', fontSize: '14px' }}>Bibliothèque non trouvée</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'thumbnail' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                              {library.logos?.map((logo: any) => (
                                <div
                                  key={logo.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #e0e0e0',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      backgroundColor: '#f0f0f0',
                                      borderRadius: '4px',
                                      border: '1px solid #e0e0e0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '8px'
                                    }}
                                  >
                                    <img
                                      src={logo.file_url}
                                      alt={logo.name}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                                    {logo.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: 'var(--stepn-font-body)',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner un logo</option>
                              {library.logos?.map((logo: any) => (
                                <option key={logo.id} value={logo.id}>
                                  {logo.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'fonts' && activeModule.selectedItems?.fontGroupId ? (() => {
                      const group = fontGroups.find(g => g.id === activeModule.selectedItems?.fontGroupId);
                      if (!group) return <p style={{ color: '#666', fontSize: '14px' }}>Groupe non trouvé</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: 'var(--stepn-font-body)',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner une font</option>
                              {group.fonts?.map((font: any) => (
                                <option key={font.id} value={font.id}>
                                  {font.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'designs-2d' ? (() => {
                      // Afficher tous les designs disponibles dans une grille de 2 colonnes
                      const selectedDesignId = activeModule.selectedItems?.design2DId;
                      
                      return (
                        <div>
                          {designs2D.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                              Aucun design disponible. Sélectionnez un design dans les settings.
                            </p>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '12px'
                            }}>
                              {designs2D.map((design) => {
                                const isSelected = design.id === selectedDesignId;
                                return (
                                  <div
                                    key={design.id}
                                    onClick={() => {
                                      const updated = {
                                        ...activeModule,
                                        selectedItems: {
                                          ...activeModule.selectedItems,
                                          design2DId: design.id
                                        }
                                      };
                                      setCustomizationModules(customizationModules.map(m =>
                                        m.id === activeModule.id ? updated : m
                                      ));
                                      if (selectedModule?.id === activeModule.id) {
                                        setSelectedModule(updated);
                                      }
                                    }}
                                    style={{
                                      padding: '12px',
                                      backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                                      borderRadius: '4px',
                                      border: isSelected ? '2px solid #333333' : '1px solid #e0e0e0',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <div style={{
                                      width: '100%',
                                      padding: '8px',
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minHeight: '120px',
                                      maxHeight: '120px',
                                      overflow: 'hidden'
                                    }}>
                                      {(design.preview_url && design.preview_url.trim() !== '') ? (
                                        <img
                                          key={design.preview_url}
                                          src={design.preview_url}
                                          alt={design.name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                          onError={(e) => {
                                            // Fallback to SVG if preview fails to load
                                            const svgUrl = design.svg_url || design.svgUrl;
                                            if (svgUrl) {
                                              e.currentTarget.src = svgUrl;
                                            }
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={design.svg_url || design.svgUrl}
                                          alt={design.name}
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      )}
                                    </div>
                                    <p 
                                      className="customizer-tab-name"
                                      style={{
                                        color: '#000000',
                                        fontSize: '12px',
                                        fontFamily: 'var(--stepn-font-body)',
                                        fontWeight: isSelected ? '600' : '400',
                                        textAlign: 'center',
                                        margin: 0,
                                        WebkitTextFillColor: '#000000'
                                      } as React.CSSProperties}
                                    >
                                      {design.name}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })() : activeModule.contentType === 'sizes' && activeModule.selectedItems?.sizePatternId ? (() => {
                      const pattern = sizePatterns.find(p => p.id === activeModule.selectedItems?.sizePatternId);
                      if (!pattern) return <p style={{ color: '#666', fontSize: '14px' }}>Groupe non trouvé</p>;
                      
                      return (
                        <div>
                          {activeModule.inputType === 'dropdown' && (
                            <select style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontFamily: 'var(--stepn-font-body)',
                              cursor: 'pointer'
                            }}>
                              <option value="">Sélectionner une taille</option>
                              {pattern.sizes?.map((size: any) => (
                                <option key={size.id} value={size.id}>
                                  {size.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })() : (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Sélectionnez un élément dans les settings du module.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Center: 3D Model Display */}
            <div style={{
              flex: 1,
              backgroundColor: '#f8f8f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'auto'
            }}>
              {selectedModel3DId ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(() => {
                    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                    if (selectedModel) {
                      const modelUrl = selectedModel.glb_url || selectedModel.glbUrl || '';
                      
                      // Prioriser le design sélectionné dans l'onglet actif, sinon utiliser le design de base
                      let designIdToUse: string | null = null;
                      if (activeCustomizerTab) {
                        const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);
                        if (activeModule?.contentType === 'designs-2d' && activeModule.selectedItems?.design2DId) {
                          designIdToUse = activeModule.selectedItems.design2DId;
                        }
                      }
                      // Si aucun design dans l'onglet, utiliser le design de base
                      if (!designIdToUse) {
                        designIdToUse = selectedDesign2DId;
                      }
                      
                      const selectedDesign = designs2D.find(d => d.id === designIdToUse);
                      const designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || null;
                      
                      // Préparer les material maps pour chaque partie du modèle
                      const parts = (selectedModel as any).model_parts || [];
                      const materialMapsForModel: Record<string, any> = {};
                      parts.forEach((part: any) => {
                        if (part.material_map_id && modelMaterialMaps[part.material_map_id]) {
                          // Utiliser material_map_id comme clé
                          materialMapsForModel[part.material_map_id] = modelMaterialMaps[part.material_map_id];
                        }
                      });
                      
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '600px'
                        }}>
                          <Model3DPreviewWithControls
                            url={modelUrl}
                            materialMaps={materialMapsForModel}
                            design2DUrl={designUrl}
                            modelParts={parts}
                            zoomSpeed={zoomSpeed}
                            rotateSpeed={rotateSpeed}
                            minZoom={minZoom}
                            maxZoom={maxZoom}
                            initialZoom={initialZoom}
                            initialRotation={initialRotation}
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: '600px',
                              backgroundColor: '#e8e8e8'
                            }}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  <div style={{
                    width: '400px',
                    height: '400px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      color: '#999'
                    }}>
                      🎩
                    </div>
                  </div>
                  <p style={{
                    color: '#999',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Sélectionnez un modèle 3D dans "Behind the scene"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Module/Question Settings */}
          {showQuestionSettings && selectedModule ? (
            <div style={{
              width: '320px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '24px'
              }}>
                Module settings
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Nom de l'onglet
                </label>
                <input
                  type="text"
                  value={selectedModule.tabName}
                  onChange={(e) => {
                    const updated = { ...selectedModule, tabName: e.target.value };
                    setSelectedModule(updated);
                    setCustomizationModules(customizationModules.map(m => 
                      m.id === selectedModule.id ? updated : m
                    ));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Content Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Type de contenu à afficher
                </label>
                <select
                  value={selectedModule.contentType || ''}
                  onChange={(e) => {
                    const updated = { 
                      ...selectedModule, 
                      contentType: e.target.value as CustomizationModule['contentType'] || null,
                      selectedItems: {} // Reset selected items when changing content type
                    };
                    setSelectedModule(updated);
                    setCustomizationModules(customizationModules.map(m => 
                      m.id === selectedModule.id ? updated : m
                    ));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">Aucun</option>
                  <option value="colors">Couleurs</option>
                  <option value="logos">Logos</option>
                  <option value="fonts">Fonts</option>
                  <option value="designs-2d">Designs 2D</option>
                  <option value="sizes">Tailles</option>
                </select>
              </div>

              {/* Content Selection based on contentType */}
              {selectedModule.contentType === 'colors' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Palette de couleurs
                  </label>
                  <select
                    value={selectedModule.selectedItems?.colorPaletteId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          colorPaletteId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner une palette</option>
                    {colorPalettes.map((palette) => (
                      <option key={palette.id} value={palette.id}>
                        {palette.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'logos' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Bibliothèque de logos
                  </label>
                  <select
                    value={selectedModule.selectedItems?.logoLibraryId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          logoLibraryId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner une bibliothèque</option>
                    {logoLibraries.map((library) => (
                      <option key={library.id} value={library.id}>
                        {library.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'fonts' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Groupe de fonts
                  </label>
                  <select
                    value={selectedModule.selectedItems?.fontGroupId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          fontGroupId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {fontGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'designs-2d' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Design 2D
                  </label>
                  <select
                    value={selectedModule.selectedItems?.design2DId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          design2DId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un design</option>
                    {designs2D.map((design) => (
                      <option key={design.id} value={design.id}>
                        {design.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedModule.contentType === 'sizes' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Groupe de tailles
                  </label>
                  <select
                    value={selectedModule.selectedItems?.sizePatternId || ''}
                    onChange={(e) => {
                      const updated = { 
                        ...selectedModule, 
                        selectedItems: {
                          ...selectedModule.selectedItems,
                          sizePatternId: e.target.value || undefined
                        }
                      };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="">Sélectionner un groupe</option>
                    {sizePatterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => deleteModule(selectedModule.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ff4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Supprimer le module
              </button>
            </div>
          ) : showQuestionSettings && selectedQuestion ? (
            <div style={{
              width: '320px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '24px'
              }}>
                Question settings
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Question Label
                </label>
                <input
                  type="text"
                  value={selectedQuestion.label}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Question Type
                </label>
                <select
                  value={selectedQuestion.type}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { type: e.target.value as Question['type'] })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="color">Color</option>
                  <option value="image">Image</option>
                  <option value="select">Select</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedQuestion.required}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { required: e.target.checked })}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  Required
                </label>
              </div>

              {selectedQuestion.type === 'select' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#a0a0a0',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Options (one per line)
                  </label>
                  <textarea
                    value={selectedQuestion.options?.join('\n') || ''}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => deleteQuestion(selectedQuestion.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ff4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Delete Question
              </button>
            </div>
          ) : (
            <div style={{
              width: '320px',
              backgroundColor: '#0a0a0a',
              borderLeft: '1px solid #1a1a1a',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#a0a0a0'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  marginBottom: '8px'
                }}>
                  Module settings
                </h3>
                <p style={{
                  fontSize: '12px',
                  fontFamily: 'var(--stepn-font-body)',
                  lineHeight: '1.5'
                }}>
                  Sélectionnez un module dans la sidebar de gauche pour voir ses réglages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Module Modal */}
      {showCreateModuleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20000
          }}
          onClick={() => setShowCreateModuleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              width: '90%',
              maxWidth: '500px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '20px',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              Créer un module de personnalisation
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tab Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Nom de l'onglet
                </label>
                <input
                  type="text"
                  value={newModule.tabName || ''}
                  onChange={(e) => setNewModule({ ...newModule, tabName: e.target.value })}
                  placeholder="Ex: Design, Couleur, Numéro..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                />
              </div>

              {/* Icon */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Icône (image .svg ou .png, ou emoji/texte)
                </label>
                <input
                  type="file"
                  accept=".svg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewModuleIconFile(file);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                />
                {newModuleIconFile && (
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#8eff36',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Fichier sélectionné: {newModuleIconFile.name}
                  </div>
                )}
                <input
                  type="text"
                  value={newModule.icon || ''}
                  onChange={(e) => setNewModule({ ...newModule, icon: e.target.value })}
                  placeholder="🎨 (si pas d'image)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginTop: '8px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                />
                <p style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Ou utilisez un emoji/texte si vous n'upload pas d'image
                </p>
              </div>

              {/* Module Type (Content Type) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Type de module
                </label>
                <select
                  value={newModule.contentType || ''}
                  onChange={(e) => setNewModule({ ...newModule, contentType: e.target.value as CustomizationModule['contentType'] || null })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'var(--stepn-font-body)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8eff36';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                >
                  <option value="">Sélectionner un type...</option>
                  <option value="colors">Couleurs (Color Palettes)</option>
                  <option value="logos">Logos (Logo Libraries)</option>
                  <option value="fonts">Polices (Font Groups)</option>
                  <option value="designs-2d">Designs 2D</option>
                  <option value="sizes">Tailles (Size Patterns)</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowCreateModuleModal(false);
                  setNewModule({
                    tabName: '',
                    icon: '🎨',
                    inputType: 'thumbnail',
                    contentType: null
                  });
                  setNewModuleIconFile(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={createModule}
                disabled={!newModule.tabName || !newModule.icon || !newModule.contentType}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!newModule.tabName || !newModule.icon || !newModule.contentType) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

