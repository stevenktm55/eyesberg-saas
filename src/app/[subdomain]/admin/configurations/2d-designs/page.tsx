"use client";

import { useEffect, useState, useRef } from "react";
import { Design2DPreviewStatic } from "@/components/Design2DPreviewStatic";
import { Model3DPreviewStatic } from "@/components/Model3DPreviewStatic";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

type Design2D = {
  id: string;
  name: string;
  svg_url?: string;
  svgUrl?: string; // Fallback pour compatibilité
  format?: string;
  createdAt?: string;
  created_at?: string;
  model3d_id?: string | null;
  color_mappings?: Record<string, string>; // class -> color_id
  preview_url?: string | null;
};

type Model3D = {
  id: string;
  name: string;
  glb_url?: string;
  glbUrl?: string;
  model_parts?: Array<{ name: string; material_map_id?: string | null }>;
};

type ColorPalette = {
  id: string;
  name: string;
  colors?: Array<{ id: string; name: string; hex: string }>;
};

export default function Designs2DConfigPage() {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design2D | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDesignName, setNewDesignName] = useState("");
  const [newDesignFile, setNewDesignFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Nouvelles states pour les fonctionnalités
  const [models3D, setModels3D] = useState<Model3D[]>([]);
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [detectedColorClasses, setDetectedColorClasses] = useState<string[]>([]);
  const [colorMappings, setColorMappings] = useState<Record<string, string>>({}); // class -> color_id
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchDesigns();
    fetchModels3D();
    fetchColorPalettes();
  }, []);
  
  useEffect(() => {
    if (selectedDesign) {
      console.log('Selected design changed:', selectedDesign);
      setSelectedModel3DId(selectedDesign.model3d_id || null);
      setColorMappings(selectedDesign.color_mappings || {});
      setPreviewUrl(selectedDesign.preview_url || null);
      // Détecter les classes de couleurs dans le SVG
      if (selectedDesign.svg_url || selectedDesign.svgUrl) {
        detectColorClasses(selectedDesign.svg_url || selectedDesign.svgUrl || '');
      }
    } else {
      // Reset when no design is selected
      setSelectedModel3DId(null);
      setColorMappings({});
      setPreviewUrl(null);
      setDetectedColorClasses([]);
    }
  }, [selectedDesign]);

  async function fetchDesigns() {
    try {
      const res = await fetch("/api/designs-2d");
      if (!res.ok) throw new Error("Failed to fetch designs");
      const data = await res.json();
      const designsArray = Array.isArray(data) ? data : [];
      console.log('Fetched designs:', designsArray.map(d => ({ id: d.id, name: d.name, preview_url: d.preview_url })));
      setDesigns(designsArray);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  }
  
  async function fetchModels3D() {
    try {
      const res = await fetch("/api/models-3d");
      if (res.ok) {
        const data = await res.json();
        setModels3D(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching models 3D:", error);
    }
  }
  
  async function fetchColorPalettes() {
    try {
      const res = await fetch("/api/color-palettes");
      if (res.ok) {
        const data = await res.json();
        setColorPalettes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching color palettes:", error);
    }
  }
  
  // Détecter les classes de couleurs dans le SVG
  async function detectColorClasses(svgUrl: string) {
    try {
      console.log('Detecting color classes from SVG:', svgUrl);
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Trouver toutes les classes CSS dans le SVG
      const classes = new Set<string>();
      
      // 1. Chercher dans les attributs class de tous les éléments
      const allElements = svgDoc.querySelectorAll('*');
      allElements.forEach((element) => {
        const classAttr = element.getAttribute('class');
        if (classAttr) {
          classAttr.split(/\s+/).forEach((cls) => {
            const trimmedClass = cls.trim();
            if (trimmedClass) {
              // Extraire le nom de base (sans -light, -dark, etc.)
              const baseClass = trimmedClass.replace(/-light|-dark|-lighten|-darken$/i, '').toLowerCase();
              classes.add(baseClass);
            }
          });
        }
      });
      
      // 2. Chercher toutes les variables CSS (--variable-name) dans les balises <style>
      const styleElements = svgDoc.querySelectorAll('style');
      styleElements.forEach((style) => {
        const styleText = style.textContent || '';
        
        // Chercher toutes les variables CSS --variable-name
        const varMatches = styleText.match(/--([a-zA-Z][a-zA-Z0-9_-]*)/g);
        if (varMatches) {
          varMatches.forEach((match) => {
            const varName = match.replace('--', '').toLowerCase();
            // Extraire le nom de base (sans -light, -dark, etc.)
            const baseClass = varName.replace(/-light|-dark|-lighten|-darken$/i, '');
            classes.add(baseClass);
          });
        }
        
        // Chercher toutes les classes CSS définies (.class-name)
        const classMatches = styleText.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
        if (classMatches) {
          classMatches.forEach((match) => {
            const className = match.replace('.', '').toLowerCase();
            // Extraire le nom de base (sans -light, -dark, etc.)
            const baseClass = className.replace(/-light|-dark|-lighten|-darken$/i, '');
            classes.add(baseClass);
          });
        }
        
        // Chercher les références à var(--variable-name) pour trouver les variables utilisées
        const varUsageMatches = styleText.match(/var\(--([a-zA-Z][a-zA-Z0-9_-]*)\)/g);
        if (varUsageMatches) {
          varUsageMatches.forEach((match) => {
            const varName = match.replace(/var\(--/, '').replace(/\)/, '').toLowerCase();
            const baseClass = varName.replace(/-light|-dark|-lighten|-darken$/i, '');
            classes.add(baseClass);
          });
        }
      });
      
      // 3. Chercher dans les attributs fill et stroke qui utilisent var()
      allElements.forEach((element) => {
        const fill = element.getAttribute('fill');
        const stroke = element.getAttribute('stroke');
        
        [fill, stroke].forEach((attr) => {
          if (attr && attr.includes('var(--')) {
            const varMatches = attr.match(/var\(--([a-zA-Z][a-zA-Z0-9_-]*)\)/g);
            if (varMatches) {
              varMatches.forEach((match) => {
                const varName = match.replace(/var\(--/, '').replace(/\)/, '').toLowerCase();
                const baseClass = varName.replace(/-light|-dark|-lighten|-darken$/i, '');
                classes.add(baseClass);
              });
            }
          }
        });
      });
      
      // Filtrer les classes pour ne garder que celles qui semblent être des couleurs
      // On garde toutes les classes trouvées, mais on peut filtrer celles qui sont trop génériques
      const detectedClasses = Array.from(classes).filter(cls => {
        // Exclure les classes trop courtes ou trop génériques
        if (cls.length < 2) return false;
        // Exclure les classes qui sont clairement des classes de layout/structure
        const excludePatterns = ['svg', 'path', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'use', 'mask', 'clip', 'pattern', 'linear', 'radial', 'stop', 'filter', 'fe'];
        if (excludePatterns.includes(cls)) return false;
        return true;
      }).sort(); // Trier par ordre alphabétique
      
      console.log('All classes found:', Array.from(classes));
      console.log('Detected color classes (filtered):', detectedClasses);
      setDetectedColorClasses(detectedClasses);
    } catch (error) {
      console.error("Error detecting color classes:", error);
      setDetectedColorClasses([]);
    }
  }

  function openModal(design: Design2D) {
    console.log('Opening modal for design:', design);
    setSelectedDesign(design);
    setIsCreating(false);
  }

  function openCreateModal() {
    setSelectedDesign(null);
    setIsCreating(true);
    setNewDesignName("");
    setNewDesignFile(null);
  }

  function closeModal() {
    setSelectedDesign(null);
    setIsCreating(false);
    setNewDesignName("");
    setNewDesignFile(null);
    setSelectedModel3DId(null);
    setDetectedColorClasses([]);
    setColorMappings({});
    setPreviewUrl(null);
    previewCanvasRef.current = null; // Reset canvas ref
  }
  
  async function saveDesignSettings() {
    if (!selectedDesign) return;
    
    setLoading(true);
    try {
      let finalPreviewUrl = previewUrl;
      
      // Si un modèle 3D est sélectionné, capturer et uploader le preview
      if (selectedModel3DId) {
        // Attendre un peu pour s'assurer que le canvas est prêt
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Chercher le canvas dans le DOM si le ref n'est pas encore défini
        let canvas = previewCanvasRef.current;
        if (!canvas) {
          // Essayer de trouver le canvas dans le DOM
          const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
          if (canvasElement) {
            canvas = canvasElement;
            previewCanvasRef.current = canvas;
          }
        }
        
        if (canvas) {
          try {
            console.log('Capturing canvas for preview, size:', canvas.width, 'x', canvas.height);
            
            // Convertir le canvas en blob
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  console.log('Canvas converted to blob, size:', blob.size);
                  resolve(blob);
                } else {
                  reject(new Error('Failed to convert canvas to blob'));
                }
              }, 'image/png', 0.95);
            });
            
            // Uploader vers Supabase Storage
            const fileName = `preview-${selectedDesign.id}-${Date.now()}.png`;
            const formData = new FormData();
            formData.append('file', blob, fileName);
            
            console.log('Uploading preview to Supabase...');
            const uploadRes = await fetch('/api/designs-2d/upload-preview', {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error('Upload failed:', errorText);
              throw new Error('Failed to upload preview');
            }
            
            const uploadData = await uploadRes.json();
            finalPreviewUrl = uploadData.url;
            console.log('Preview uploaded successfully:', finalPreviewUrl);
          } catch (uploadError: any) {
            console.error('Error uploading preview:', uploadError);
            // Continuer même si l'upload échoue
          }
        } else {
          console.warn('No canvas found for preview capture');
        }
      }
      
      // Sauvegarder les settings
      const res = await fetch(`/api/designs-2d?id=${encodeURIComponent(selectedDesign.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model3d_id: selectedModel3DId,
          color_mappings: colorMappings,
          preview_url: finalPreviewUrl
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save design settings');
      }
      
      const updatedDesign = await res.json();
      console.log('Design updated with preview_url:', updatedDesign.preview_url);
      await fetchDesigns();
      closeModal(); // Fermer le modal sans alerte
    } catch (error: any) {
      console.error('Error saving design settings:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  async function createDesign() {
    if (!newDesignName || !newDesignFile) {
      alert("Veuillez remplir le nom et sélectionner un fichier");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newDesignName);
      formData.append('file', newDesignFile);
      formData.append('format', newDesignFile.name.split('.').pop() || 'svg');

      const res = await fetch("/api/designs-2d", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || "Failed to create design");
      }

      await fetchDesigns();
      closeModal();
    } catch (error: any) {
      console.error("Error creating design:", error);
      alert(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal() {
    if (!selectedDesign) return;
    setShowDeleteModal(true);
  }

  async function deleteDesign() {
    if (!selectedDesign) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/designs-2d?id=${encodeURIComponent(selectedDesign.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchDesigns();
      closeModal();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting design:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  const filteredDesigns = designs.filter((design) =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showModal = selectedDesign || isCreating;

  return (
    <div style={{ fontFamily: 'var(--stepn-font-body)' }}>
      {/* Search and Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        gap: '16px'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: 1,
          maxWidth: '400px'
        }}>
          <input
            type="text"
            placeholder="Rechercher un design 2D..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'var(--stepn-font-body)'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0a0a0',
            fontSize: '16px'
          }}>
            ⌕
          </span>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8eff36',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'var(--stepn-font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span className="green-button-icon">+</span>
          Nouveau design 2D
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '24px'
      }}>
        {/* Rectangle "Ajouter un design 2D" */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            border: '2px dashed #2a2a2a',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '280px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8eff36';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a2a';
          }}
          onClick={openCreateModal}
        >
          <div style={{
            fontSize: '48px',
            color: '#a0a0a0',
            marginBottom: '12px'
          }}>
            +
          </div>
          <p style={{
            fontSize: '14px',
            color: '#a0a0a0',
            fontFamily: 'var(--stepn-font-body)'
          }}>
            Ajouter un design 2D
          </p>
        </div>

        {/* Existing Designs */}
        {filteredDesigns.map((design) => {
          const hasPreview = design.preview_url && design.preview_url.trim() !== '';
          console.log(`Design ${design.name}: preview_url = ${design.preview_url}, hasPreview = ${hasPreview}`);
          
          return (
            <div
              key={design.id}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8eff36';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => openModal(design)}
            >
              {/* Preview: 3D Static si disponible, sinon 2D SVG */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: '#0a0a0a',
                borderBottom: '1px solid #2a2a2a',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {hasPreview ? (
                  <img
                    key={design.preview_url || undefined} // Force re-render when preview_url changes
                    src={design.preview_url || undefined}
                    alt={design.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#0a0a0a'
                    }}
                    onError={(e) => {
                      console.error('Error loading preview image:', design.preview_url);
                      // Fallback to SVG if preview fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Design2DPreviewStatic 
                    url={(design as any).svg_url || (design as any).svgUrl} 
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
          
            {/* Info */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {design.name}
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#a0a0a0',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                <div>Format: {(design.format || 'SVG').toUpperCase()}</div>
                <div style={{ marginTop: '4px' }}>
                  Design 2D
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
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
            zIndex: 1000,
            padding: '32px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #2a2a2a',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)'
              }}>
                {isCreating ? 'Nouveau design 2D' : selectedDesign?.name}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#a0a0a0',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0a0a0';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {isCreating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Nom du design
                    </label>
                    <input
                      type="text"
                      value={newDesignName}
                      onChange={(e) => setNewDesignName(e.target.value)}
                      placeholder="Ex: Design Floral"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Fichier SVG
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewDesignFile(file);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    />
                    {newDesignFile && (
                      <p style={{ color: '#8eff36', fontSize: '12px', marginTop: '4px' }}>
                        Fichier sélectionné: {newDesignFile.name}
                      </p>
                    )}
                  </div>
                </div>
              ) : selectedDesign ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Sélection du modèle 3D */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Modèle 3D pour le preview
                    </label>
                    <select
                      value={selectedModel3DId || ''}
                      onChange={(e) => setSelectedModel3DId(e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
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
                  
                  {/* Preview 3D Static (remplace le preview SVG) */}
                  {selectedModel3DId ? (() => {
                    const selectedModel = models3D.find(m => m.id === selectedModel3DId);
                    if (!selectedModel) return null;
                    const modelUrl = selectedModel.glb_url || selectedModel.glbUrl || '';
                    const designUrl = (selectedDesign as any).svg_url || (selectedDesign as any).svgUrl || null;
                    const parts = (selectedModel as any).model_parts || [];
                    
                    // Préparer les material maps si nécessaire
                    const materialMapsForModel: Record<string, any> = {};
                    
                    // Préparer l'objet colors indexé par color_id
                    const colorsMap: Record<string, { hex: string; name: string }> = {};
                    colorPalettes.forEach((palette) => {
                      if (palette.colors) {
                        palette.colors.forEach((color) => {
                          colorsMap[color.id] = {
                            hex: color.hex,
                            name: color.name
                          };
                        });
                      }
                    });
                    
                    return (
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        minHeight: '400px'
                      }}>
                        <Model3DPreviewStatic
                          url={modelUrl}
                          design2DUrl={designUrl}
                          modelParts={parts}
                          materialMaps={materialMapsForModel}
                          style={{ width: '100%', height: '100%' }}
                          onCanvasReady={(canvas) => {
                            previewCanvasRef.current = canvas;
                          }}
                          colorMappings={colorMappings}
                          colors={colorsMap}
                        />
                      </div>
                    );
                  })() : (
                    // Si pas de modèle sélectionné, afficher le preview 2D
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <Design2DPreviewStatic 
                        url={(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl} 
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  )}
                  
                  {/* Sélection des couleurs pour les classes détectées */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        Couleurs du design
                        {detectedColorClasses.length > 0 && (
                          <span style={{ fontSize: '12px', color: '#a0a0a0', marginLeft: '8px' }}>
                            ({detectedColorClasses.length} détectée{detectedColorClasses.length > 1 ? 's' : ''})
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newClass = prompt('Entrez le nom de la classe de couleur (ex: primary, secondary):');
                          if (newClass && newClass.trim()) {
                            const trimmedClass = newClass.trim().toLowerCase();
                            if (!detectedColorClasses.includes(trimmedClass)) {
                              setDetectedColorClasses([...detectedColorClasses, trimmedClass]);
                            }
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontFamily: 'var(--stepn-font-body)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                      >
                        + Ajouter une classe
                      </button>
                    </div>
                    {(detectedColorClasses.length > 0 || Object.keys(colorMappings).length > 0) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Afficher les classes détectées */}
                        {detectedColorClasses.map((colorClass) => {
                          const allColors: Array<{ id: string; name: string; hex: string; paletteName: string }> = [];
                          colorPalettes.forEach((palette) => {
                            if (palette.colors) {
                              palette.colors.forEach((color) => {
                                allColors.push({
                                  ...color,
                                  paletteName: palette.name
                                });
                              });
                            }
                          });
                          
                          return (
                            <div key={colorClass} style={{
                              padding: '12px',
                              backgroundColor: '#0a0a0a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '8px'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: '#ffffff',
                                  fontFamily: 'var(--stepn-font-body)',
                                  fontWeight: '500',
                                  textTransform: 'capitalize'
                                }}>
                                  {colorClass}
                                </span>
                                {colorMappings[colorClass] && (() => {
                                  const selectedColor = allColors.find(c => c.id === colorMappings[colorClass]);
                                  return selectedColor ? (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <div style={{
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: selectedColor.hex,
                                        borderRadius: '4px',
                                        border: '1px solid #2a2a2a'
                                      }} />
                                      <span style={{
                                        fontSize: '11px',
                                        color: '#a0a0a0',
                                        fontFamily: 'var(--stepn-font-body)'
                                      }}>
                                        {selectedColor.name}
                                      </span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                              <select
                                value={colorMappings[colorClass] || ''}
                                onChange={(e) => {
                                  const newMappings = { ...colorMappings };
                                  if (e.target.value) {
                                    newMappings[colorClass] = e.target.value;
                                  } else {
                                    delete newMappings[colorClass];
                                  }
                                  setColorMappings(newMappings);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
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
                                <option value="">Sélectionner une couleur</option>
                                {allColors.map((color) => (
                                  <option key={color.id} value={color.id}>
                                    {color.paletteName} - {color.name} ({color.hex})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                        {/* Afficher aussi les classes dans colorMappings qui ne sont pas dans detectedColorClasses */}
                        {Object.keys(colorMappings).filter(cls => !detectedColorClasses.includes(cls)).map((colorClass) => {
                          const allColors: Array<{ id: string; name: string; hex: string; paletteName: string }> = [];
                          colorPalettes.forEach((palette) => {
                            if (palette.colors) {
                              palette.colors.forEach((color) => {
                                allColors.push({
                                  ...color,
                                  paletteName: palette.name
                                });
                              });
                            }
                          });
                          
                          return (
                            <div key={colorClass} style={{
                              padding: '12px',
                              backgroundColor: '#0a0a0a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '8px'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: '#ffffff',
                                  fontFamily: 'var(--stepn-font-body)',
                                  fontWeight: '500',
                                  textTransform: 'capitalize'
                                }}>
                                  {colorClass}
                                </span>
                                {colorMappings[colorClass] && (() => {
                                  const selectedColor = allColors.find(c => c.id === colorMappings[colorClass]);
                                  return selectedColor ? (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}>
                                      <div style={{
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: selectedColor.hex,
                                        borderRadius: '4px',
                                        border: '1px solid #2a2a2a'
                                      }} />
                                      <span style={{
                                        fontSize: '11px',
                                        color: '#a0a0a0',
                                        fontFamily: 'var(--stepn-font-body)'
                                      }}>
                                        {selectedColor.name}
                                      </span>
                                    </div>
                                  ) : null;
                                })()}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newMappings = { ...colorMappings };
                                    delete newMappings[colorClass];
                                    setColorMappings(newMappings);
                                    setDetectedColorClasses(detectedColorClasses.filter(c => c !== colorClass));
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#ff4444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>
                              <select
                                value={colorMappings[colorClass] || ''}
                                onChange={(e) => {
                                  const newMappings = { ...colorMappings };
                                  if (e.target.value) {
                                    newMappings[colorClass] = e.target.value;
                                  } else {
                                    delete newMappings[colorClass];
                                  }
                                  setColorMappings(newMappings);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
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
                                <option value="">Sélectionner une couleur</option>
                                {allColors.map((color) => (
                                  <option key={color.id} value={color.id}>
                                    {color.paletteName} - {color.name} ({color.hex})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        fontSize: '12px',
                        fontFamily: 'var(--stepn-font-body)',
                        textAlign: 'center'
                      }}>
                        Aucune classe de couleur détectée. Cliquez sur "Ajouter une classe" pour en ajouter manuellement.
                      </div>
                    )}
                  </div>
                  
                  {/* Informations du design */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={selectedDesign.name}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      Format
                    </label>
                    <input
                      type="text"
                      value={(selectedDesign.format || 'SVG').toUpperCase()}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                        color: '#a0a0a0',
                        fontSize: '14px',
                        fontFamily: 'var(--stepn-font-body)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  {(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl ? (
                    <div>
                      <a
                        href={(selectedDesign as any).svg_url || (selectedDesign as any).svgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#8eff36',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          fontFamily: 'var(--stepn-font-body)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                      >
                        Voir le fichier SVG
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ color: '#ffffff', padding: '20px' }}>
                  <p>Aucun design sélectionné</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              {selectedDesign && (
                <button
                  onClick={openDeleteModal}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#4a4a4a' : '#ff4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  Supprimer
                </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                >
                  Annuler
                </button>
                {selectedDesign && (
                  <button
                    onClick={saveDesignSettings}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading ? '#4a4a4a' : '#8eff36',
                      border: 'none',
                      borderRadius: '8px',
                      color: loading ? '#a0a0a0' : '#000000',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                )}
                {isCreating && (
                  <button
                    onClick={createDesign}
                    disabled={loading || !newDesignName.trim() || !newDesignFile}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading || !newDesignName.trim() || !newDesignFile ? '#4a4a4a' : '#8eff36',
                      border: 'none',
                      borderRadius: '8px',
                      color: loading || !newDesignName.trim() || !newDesignFile ? '#a0a0a0' : '#000000',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading || !newDesignName.trim() || !newDesignFile ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--stepn-font-body)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && newDesignName.trim() && newDesignFile) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && newDesignName.trim() && newDesignFile) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteDesign}
        title={selectedDesign ? `Êtes-vous sûr de vouloir supprimer "${selectedDesign.name}" ?` : ""}
        message="Cette action est irréversible."
      />
    </div>
  );
}
