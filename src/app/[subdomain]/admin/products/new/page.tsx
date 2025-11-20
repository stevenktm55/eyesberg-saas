'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Model3DPreviewStatic } from '@/components/Model3DPreviewStatic';

type Tab = 'build' | 'pricing' | 'variants' | 'connect';

type CustomizationModule = {
  id: string;
  tabName: string; // Nom de l'onglet dans la sidebar
  icon: string; // Icône (emoji ou texte) - fallback si iconUrl n'existe pas
  iconUrl?: string; // URL de l'icône image (.svg ou .png)
  inputType: 'thumbnail' | 'dropdown' | 'radio' | 'label' | 'file-upload' | 'text-input' | 'checkbox';
  required?: boolean;
  options?: string[]; // Pour dropdown et radio
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
    inputType: 'thumbnail'
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
            settings: {}
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
  }, [productId, productName, questions, customizationModules, activeTab, selectedModel3DId, selectedDesign2DId]);

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
  }, [productName, questions, customizationModules, activeTab, productId, selectedModel3DId, selectedDesign2DId, autoSave]);

  function addQuestion() {
    // Ouvrir le modal de création de module
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail'
    });
    setShowCreateModuleModal(true);
  }

  async function createModule() {
    if (!newModule.tabName || !newModule.icon || !newModule.inputType) {
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
      tabName: newModule.tabName,
      icon: newModule.icon,
      iconUrl: iconUrl,
      inputType: newModule.inputType as CustomizationModule['inputType'],
      required: newModule.required || false,
      options: (newModule.inputType === 'dropdown' || newModule.inputType === 'radio') ? [] : undefined
    };

    setCustomizationModules([...customizationModules, module]);
    setNewModule({
      tabName: '',
      icon: '🎨',
      inputType: 'thumbnail'
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
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>☰</span>
              <span style={{ color: '#a0a0a0', fontSize: '12px' }}>⚙</span>
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
              padding: '16px'
            }}>
              {customizationModules.length === 0 && questions.length === 0 ? (
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
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#ffffff',
                        marginBottom: '4px'
                      }}>
                        {module.tabName}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        color: '#a0a0a0'
                      }}>
                        {module.inputType}
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
                      backgroundColor: activeCustomizerTab === module.id ? '#000000' : 'transparent',
                      border: activeCustomizerTab === module.id ? '1px solid #000000' : '1px solid #e0e0e0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: activeCustomizerTab === module.id ? '#ffffff' : '#666666',
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
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '4px'
                        }}
                      />
                    ) : (
                      module.icon
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
                    backgroundColor: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ color: '#ffffff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeModule.iconUrl ? (
                        <img
                          src={activeModule.iconUrl}
                          alt={activeModule.tabName}
                          style={{
                            width: '20px',
                            height: '20px',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        activeModule.icon
                      )}
                    </span>
                    <span style={{ color: '#ffffff', fontSize: '14px', fontFamily: 'var(--stepn-font-body)', fontWeight: '500' }}>
                      {activeModule.tabName}
                    </span>
                  </div>

                  {/* Tab Content */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px'
                  }}>
                    {activeModule.inputType === 'thumbnail' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Sélection par miniatures
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'dropdown' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Menu déroulant
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'radio' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Boutons radio
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'label' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Label
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'file-upload' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Upload de fichier
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'text-input' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Champ texte
                        </p>
                      </div>
                    )}
                    {activeModule.inputType === 'checkbox' && (
                      <div>
                        <p style={{ color: '#666', fontSize: '14px', fontFamily: 'var(--stepn-font-body)' }}>
                          Case à cocher
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
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '600px'
                        }}>
                          <Model3DPreviewStatic
                            url={modelUrl}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Type d'input
                </label>
                <select
                  value={selectedModule.inputType}
                  onChange={(e) => {
                    const updated = { ...selectedModule, inputType: e.target.value as CustomizationModule['inputType'] };
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
                  <option value="thumbnail">Thumbnail (Miniatures)</option>
                  <option value="dropdown">Dropdown (Menu déroulant)</option>
                  <option value="radio">Radio Button (Boutons radio)</option>
                  <option value="label">Label (Étiquette)</option>
                  <option value="file-upload">File Upload (Upload fichier)</option>
                  <option value="text-input">Text Input (Champ texte)</option>
                  <option value="checkbox">Checkbox (Case à cocher)</option>
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
                    checked={selectedModule.required || false}
                    onChange={(e) => {
                      const updated = { ...selectedModule, required: e.target.checked };
                      setSelectedModule(updated);
                      setCustomizationModules(customizationModules.map(m => 
                        m.id === selectedModule.id ? updated : m
                      ));
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  Requis
                </label>
              </div>

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

              {/* Input Type */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#a0a0a0',
                  marginBottom: '8px',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  Type d'input
                </label>
                <select
                  value={newModule.inputType || 'thumbnail'}
                  onChange={(e) => setNewModule({ ...newModule, inputType: e.target.value as CustomizationModule['inputType'] })}
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
                  <option value="thumbnail">Thumbnail (Miniatures)</option>
                  <option value="dropdown">Dropdown (Menu déroulant)</option>
                  <option value="radio">Radio Button (Boutons radio)</option>
                  <option value="label">Label (Étiquette)</option>
                  <option value="file-upload">File Upload (Upload fichier)</option>
                  <option value="text-input">Text Input (Champ texte)</option>
                  <option value="checkbox">Checkbox (Case à cocher)</option>
                </select>
              </div>

              {/* Required */}
              <div>
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
                    checked={newModule.required || false}
                    onChange={(e) => setNewModule({ ...newModule, required: e.target.checked })}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  Requis
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowCreateModuleModal(false);
                  setNewModule({
                    tabName: '',
                    icon: '🎨',
                    inputType: 'thumbnail'
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
                disabled={!newModule.tabName || !newModule.icon || !newModule.inputType}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!newModule.tabName || !newModule.icon || !newModule.inputType) ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '6px',
                  color: (!newModule.tabName || !newModule.icon || !newModule.inputType) ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!newModule.tabName || !newModule.icon || !newModule.inputType) ? 'not-allowed' : 'pointer',
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

