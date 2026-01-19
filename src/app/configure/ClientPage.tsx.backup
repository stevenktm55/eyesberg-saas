"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelViewer } from "@/components/ModelViewer";
import { useSearchParams } from "next/navigation";

// Constante pour la font du configurator-panel
const CONFIGURATOR_PANEL_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CONFIGURATOR_PANEL_PRIMARY_COLOR = '#3b82f6';

interface CustomizationModule {
  id: string;
  tabName: string;
  icon?: string;
  iconUrl?: string;
  contentType?: 'designs-2d' | 'colors' | 'texts' | 'logos' | 'numbers' | 'names';
  selectedItems?: {
    design2DId?: string;
    colorPaletteId?: string;
    logoLibraryId?: string;
  };
  colorClassLabels?: Record<string, string>;
}

interface ProductData {
  id: string;
  name: string;
  builder_data?: {
    model3DId?: string;
    design2DId?: string;
    customizationModules?: CustomizationModule[];
    settings?: any;
  };
}

export default function ConfigurePage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const shop = searchParams.get('shop');
  const variantId = searchParams.get('variantId') || '1';

  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customizationModules, setCustomizationModules] = useState<CustomizationModule[]>([]);
  const [activeCustomizerTab, setActiveCustomizerTab] = useState<string | null>(null);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDesign2DId, setSelectedDesign2DId] = useState<string | null>(null);
  const [models3D, setModels3D] = useState<any[]>([]);
  const [designs2D, setDesigns2D] = useState<any[]>([]);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [designColors, setDesignColors] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<any[]>([]);
  const [placedLogos, setPlacedLogos] = useState<any[]>([]);
  const [modelMaterialMaps, setModelMaterialMaps] = useState<Record<string, any>>({});

  // Charger le produit et sa configuration
  useEffect(() => {
    async function loadProduct() {
      if (!productId || !shop) {
        setIsLoading(false);
        return;
      }

      try {
        // Charger le produit depuis l'API
        const res = await fetch(`/api/product-builder?id=${encodeURIComponent(productId)}&shop=${encodeURIComponent(shop)}&for=admin`);
        if (res.ok) {
          const productData = await res.json();
          setProduct(productData);
          
          // Charger les customizationModules
          const modules = productData.builder_data?.customizationModules || [];
          setCustomizationModules(modules);
          
          // Activer le premier module si disponible
          if (modules.length > 0) {
            setActiveCustomizerTab(modules[0].id);
          }
          
          // Charger le modèle 3D et le design
          setSelectedModel3DId(productData.builder_data?.model3DId || null);
          setSelectedDesign2DId(productData.builder_data?.design2DId || null);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId, shop]);

  // Charger les modèles 3D, designs, palettes de couleurs
  useEffect(() => {
    async function loadResources() {

      try {
        // Charger les modèles 3D
        const modelsRes = await fetch('/api/models-3d');
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setModels3D(Array.isArray(modelsData) ? modelsData : []);
        }

        // Charger les designs 2D
        const designsRes = await fetch('/api/designs-2d');
        if (designsRes.ok) {
          const designsData = await designsRes.json();
          setDesigns2D(Array.isArray(designsData) ? designsData : []);
        }

        // Charger les palettes de couleurs
        const colorsRes = await fetch('/api/color-palettes');
        if (colorsRes.ok) {
          const colorsData = await colorsRes.json();
          setColorPalettes(Array.isArray(colorsData) ? colorsData : (colorsData.palettes || []));
        }
      } catch (error) {
        console.error('Error loading resources:', error);
      }
    }

    loadResources();
  }, []);

  // Calculer les valeurs pour le viewer 3D
  const viewerConfig = useMemo(() => {
    if (!selectedModel3DId) return null;

    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
    const modelUrl = selectedModel?.glb_url || selectedModel?.glbUrl || '';
    
    // Chercher le design sélectionné
    let designIdToUse: string | null = null;
    customizationModules.forEach(module => {
      if (module.contentType === 'designs-2d' && module.selectedItems?.design2DId) {
        designIdToUse = module.selectedItems.design2DId;
      }
    });
    if (!designIdToUse) {
      designIdToUse = selectedDesign2DId;
    }
    
    const selectedDesign = designs2D.find(d => d.id === designIdToUse);
    const designUrl = selectedDesign?.svg_url || selectedDesign?.svgUrl || null;
    
    // Calculer les couleurs
    const designColorMappings = selectedDesign?.color_mappings || null;
    const allColors = colorPalettes.flatMap(p => p.colors || []);
    const colorsForViewer: Record<string, string> = {};
    
    if (designColorMappings) {
      Object.entries(designColorMappings).forEach(([colorClass, mappedColorId]) => {
        const overrideColor = designColors[colorClass];
        const colorIdToUse = overrideColor || mappedColorId;
        const color = allColors.find(c => c.id === colorIdToUse);
        if (color?.hex) {
          colorsForViewer[colorClass] = color.hex;
        }
      });
    }
    
    // Material maps
    const materialMapsForModel: Record<string, any> = {};
    if (selectedModel?.parts) {
      selectedModel.parts.forEach((part: any) => {
        if (part.material_map_id && modelMaterialMaps[part.material_map_id]) {
          const materialMap = modelMaterialMaps[part.material_map_id];
          const materialMapFiles = materialMap.material_map_files || [];
          materialMapsForModel[part.name] = {
            diffuse: materialMapFiles.find((f: any) => f.type === 'diffuse')?.file_url,
            normal: materialMapFiles.find((f: any) => f.type === 'normal')?.file_url,
            roughness: materialMapFiles.find((f: any) => f.type === 'roughness')?.file_url,
          };
        }
      });
    }
    
    return {
      modelUrl,
      designUrl,
      colors: colorsForViewer,
      materialMaps: materialMapsForModel,
      selectedDesign: selectedDesign ? { id: selectedDesign.id, svgUrl: designUrl } : undefined,
    };
  }, [selectedModel3DId, models3D, customizationModules, selectedDesign2DId, designs2D, colorPalettes, designColors, modelMaterialMaps]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: CONFIGURATOR_PANEL_FONT
      }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Chargement...</div>
      </div>
    );
  }

  if (!product || !selectedModel3DId) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: CONFIGURATOR_PANEL_FONT
      }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Produit non trouvé ou non configuré</div>
      </div>
    );
  }

  const activeModule = customizationModules.find(m => m.id === activeCustomizerTab);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: '#f8f8f8'
    }}>
      {/* Sidebar - Customizer Tabs */}
      {customizationModules.length > 0 && (
        <div style={{
          width: '80px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px',
          gap: '8px'
        }}>
          {customizationModules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveCustomizerTab(module.id)}
              style={{
                width: '64px',
                height: '64px',
                padding: '0',
                backgroundColor: activeCustomizerTab === module.id ? CONFIGURATOR_PANEL_PRIMARY_COLOR : '#ffffff',
                border: 'none',
                borderRadius: activeCustomizerTab === module.id ? '12px' : '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '4px'
              }}
              title={module.tabName}
            >
              {module.iconUrl ? (
                <img
                  src={module.iconUrl}
                  alt={module.tabName}
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain',
                    filter: activeCustomizerTab === module.id ? 'invert(1)' : 'invert(0)'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: '14px',
                  color: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
                }}>
                  {module.icon || '📦'}
                </span>
              )}
              <span style={{
                fontSize: '10px',
                fontWeight: '400',
                textAlign: 'center',
                color: activeCustomizerTab === module.id ? '#ffffff' : '#000000'
              }}>
                {module.tabName}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Customizer Tab Panel */}
      {activeModule && (
        <div style={{
          width: '420px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {activeModule.iconUrl ? (
              <img
                src={activeModule.iconUrl}
                alt={activeModule.tabName}
                style={{ width: '28px', height: '28px' }}
              />
            ) : (
              <span style={{ fontSize: '20px' }}>{activeModule.icon || '📦'}</span>
            )}
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: CONFIGURATOR_PANEL_FONT
            }}>
              {activeModule.tabName}
            </span>
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px'
          }}>
            <p style={{ color: '#666', fontSize: '14px', fontFamily: CONFIGURATOR_PANEL_FONT }}>
              Module de personnalisation: {activeModule.contentType || 'Non configuré'}
            </p>
          </div>
        </div>
      )}

      {/* Viewer 3D */}
      <div style={{
        flex: 1,
        backgroundColor: '#f8f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {viewerConfig && viewerConfig.modelUrl ? (
          <Canvas
            camera={{ position: [0, 0, 15], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.4} color="#f5f5f5" />
            <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" />
            <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
            <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
            <Suspense fallback={null}>
              <ModelViewer
                url={viewerConfig.modelUrl}
                color="#ffffff"
                designTexture={viewerConfig.designUrl || undefined}
                materialMaps={Object.keys(viewerConfig.materialMaps).length > 0 ? viewerConfig.materialMaps : undefined}
                colors={Object.keys(viewerConfig.colors).length > 0 ? viewerConfig.colors : undefined}
                selectedDesign={viewerConfig.selectedDesign}
                texts={texts}
                fonts={[]}
                placedLogos={placedLogos}
                updateTextPosition={() => {}}
                updateTextRotation={() => {}}
                updateTextSize={() => {}}
                toggleTextLock={() => {}}
                removeText={() => {}}
                selectedTextId={null}
                selectText={() => {}}
                isDraggingText={false}
                setIsDraggingText={() => {}}
                isRotatingText={false}
                setIsRotatingText={() => {}}
                isResizingText={false}
                setIsResizingText={() => {}}
                updateLogoPosition={() => {}}
                updateLogoScale={() => {}}
                updateLogoRotation={() => {}}
                selectedLogoId={null}
                selectLogo={() => {}}
                toggleLogoLock={() => {}}
                setIsDraggingLogo={() => {}}
              />
            </Suspense>
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={25}
            />
          </Canvas>
        ) : (
          <div style={{
            fontSize: '16px',
            color: '#666',
            fontFamily: CONFIGURATOR_PANEL_FONT
          }}>
            Modèle 3D non disponible
          </div>
        )}
      </div>
    </div>
  );
}
