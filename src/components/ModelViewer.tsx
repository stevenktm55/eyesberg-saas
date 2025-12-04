import { useGLTF } from "@react-three/drei";
import { useThree, ThreeElements } from "@react-three/fiber";
import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import * as THREE from "three";
import { detectZone, loadZoneMap, type ZoneName } from '../utils/uvZoneDetector';

// Simple viewer logic copied from analyze-model
function SimpleViewer({ 
  url, 
  designSrc,
  colors, 
  onSvgProcessed,
  placedLogos = [], 
  updateLogoPosition, 
  updateLogoScale, 
  updateLogoRotation, 
  selectedLogoId, 
  selectLogo, 
  onRequestLogoDelete, 
  toggleLogoLock, 
  setIsDraggingLogo, 
  isPlacingText, 
  textZones, 
  onTextPlaced,
  texts = [],
  updateTextPosition,
  updateTextRotation,
  updateTextSize,
  selectedTextId,
  selectText,
  removeText,
  toggleTextLock,
  setIsDraggingText,
  fonts = [],
  selectedDesign,
  materialMaps,
  onCanvasReady,
  textSizeLimits
}: { 
  url: string, 
  designSrc?: string, 
  colors?: Record<string, string>, 
  onSvgProcessed?: (svgUrl: string | null) => void,
  placedLogos?: Array<{
    id: string;
    variantFile: string;
    position: [number, number, number];
    scale: number;
    rotation: number;
    locked?: boolean;
    width?: number;
    height?: number;
  }>;
  updateLogoPosition?: (id: string, position: [number, number, number]) => void;
  updateLogoScale?: (id: string, scale: number) => void;
  updateLogoRotation?: (id: string, rotation: number) => void;
  selectedLogoId?: string | null;
  selectLogo?: (id: string | null) => void;
  onRequestLogoDelete?: (id: string) => void;
  toggleLogoLock?: (id: string) => void;
  setIsDraggingLogo?: (dragging: boolean) => void;
  isPlacingText?: 'nom' | 'numero' | null;
  textZones?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    color: string;
    image?: string;
    categories?: string[];
    zoneCategory?: string;
    view?: 'front' | 'back' | 'left' | 'right';
    designId?: string | null;
  }>;
  onTextPlaced?: (category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => void;
  texts?: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    rotation: number;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeWidthUnit?: 'px';
    deformation?: string;
    deformationIntensity?: number;
    fillType?: 'solid' | 'gradient';
    gradientColors?: string[];
    gradientDirection?: 'horizontal' | 'vertical';
  }>;
  updateTextPosition?: (id: string, position: [number, number, number]) => void;
  updateTextRotation?: (id: string, rotation: number) => void;
  updateTextSize?: (id: string, fontSize: number) => void;
  selectedTextId?: string | null;
  selectText?: (id: string | null, autoOpenTypography?: boolean) => void;
  removeText?: (id: string) => void;
  toggleTextLock?: (id: string) => void;
  setIsDraggingText?: (dragging: boolean) => void;
  fonts?: Array<{
    id: string;
    name: string;
    display_name: string;
    font_url: string;
    format: string;
    category?: string;
    active: boolean;
    letter_spacing?: number;
    created_at: string;
    updated_at: string;
  }>;
  selectedDesign?: { id: string | null; svgUrl: string | null };
  materialMaps?: Record<string, {
    materialName: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
    aoMap?: string;
    opacityMap?: string;
    repeatX?: number;
    repeatY?: number;
    normalIntensity?: number;
    roughnessValue?: number;
    metalnessValue?: number;
    aoIntensity?: number;
    useUV2?: boolean;
  }>;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  textSizeLimits?: { min: number; max: number };
}) {
  const textSizeLimitsRef = useRef<{ min: number; max: number } | undefined>(textSizeLimits);
  useEffect(() => {
    textSizeLimitsRef.current = textSizeLimits;
  }, [textSizeLimits?.min, textSizeLimits?.max]);
  const gltf = useGLTF(url) as any;
  const { scene, gl, camera } = useThree();
  
  const logoImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayTexRef = useRef<THREE.CanvasTexture | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const placedLogosRef = useRef(placedLogos);
  const selectedLogoIdRef = useRef<string | null | undefined>(selectedLogoId);
  const isDraggingRef = useRef(false);
  const overlayMeshesRef = useRef<THREE.Mesh[]>([]); // Persist overlay meshes across renders
  const redrawAllLogosRef = useRef<(() => void) | null>(null); // Shared redraw function
  const iconImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const safeSelectLogoRef = useRef<((id: string | null) => void) | null>(null);
  const draggingLogoIdRef = useRef<string | null>(null); // Track currently dragging logo ID
  const deselectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track deselection timeout
  const isResizingLogoIdRef = useRef<string | null>(null); // Track currently resizing logo ID
  const initialResizeDistanceRef = useRef<number>(0); // Distance from logo center at resize start
  const initialScaleRef = useRef<number>(1); // Initial scale at resize start
  const isRotatingLogoIdRef = useRef<string | null>(null); // Track currently rotating logo ID
  const initialRotationAngleRef = useRef<number>(0); // Initial angle at rotation start
  
  // Text management refs
  const textsRef = useRef(texts);
  const selectedTextIdRef = useRef<string | null | undefined>(selectedTextId);
  const draggingTextIdRef = useRef<string | null>(null);
  const deselectTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isResizingTextIdRef = useRef<string | null>(null);
  const initialTextResizeDistanceRef = useRef<number>(0);
  const initialTextScaleRef = useRef<number>(1);
  const isRotatingTextIdRef = useRef<string | null>(null);
  const initialTextRotationAngleRef = useRef<number>(0);
  const redrawAllTextsRef = useRef<(() => void) | null>(null);
  const redrawAllRef = useRef<(() => void) | null>(null);
  const fontCacheRef = useRef<Map<string, string>>(new Map());
  const loadingFontsRef = useRef<Set<string>>(new Set());
  const guideLinesRef = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const showGuidesRef = useRef(false);
  const snapLinesUVRef = useRef<Array<{ type: 'vertical'|'horizontal'; u?: number; v?: number }>>([]);
  const snapLinesReadyRef = useRef(false);
  const hexColorMappingRef = useRef<Map<string, string>>(new Map()); // Maps hex → color key (e.g., "#0080FF" → "tertiary")
  const previousColorsRef = useRef<Record<string, string>>({}); // Persist last applied colors to map old hex → key
  const appliedSvgRef = useRef<string | null>(null); // Track last applied SVG payload to avoid redundant reapply
  // Cache to avoid reloading the same design on color clicks
  const lastLoadedDesignSrcRef = useRef<string | null>(null);
  const originalSvgRef = useRef<string | null>(null);
  const isRecoloringRef = useRef<boolean>(false);
  // Track per-class previous HEX to enable old→new replacement
  const classHexRef = useRef<Record<string, string>>({});
  // Load sequencing: ignore late results if a newer load started
  const loadSeqRef = useRef<number>(0);
  // Ref for isPlacingText to ensure closure has latest value
  const isPlacingTextRef = useRef<'nom' | 'numero' | null | undefined>(isPlacingText);
  
  // Update ref when isPlacingText changes
  useEffect(() => {
    isPlacingTextRef.current = isPlacingText;
    console.log('🔄 isPlacingTextRef updated to:', isPlacingText);
  }, [isPlacingText]);
  
  // Signal that a fresh original SVG is available
  const [svgBaseVersion, setSvgBaseVersion] = useState(0);

  // Load admin-defined snap lines for current design
  const overlaysByBaseUuidRef = useRef(new Map<string, THREE.Mesh>());

  useEffect(() => {
    const designId = (selectedDesign as any)?.id;
    if (!designId) {
      snapLinesUVRef.current = [];
      snapLinesReadyRef.current = false;
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/snap-lines?designId=${encodeURIComponent(designId)}`);
        if (!res.ok) return;
        const data = await res.json();
        // Expect items like { position: [u,v], type: 'vertical'|'horizontal' }
        snapLinesUVRef.current = (data || []).map((ln: any) => {
          let pos: any = ln.position;
          if (Array.isArray(pos)) {
            // [u, v]
          } else if (pos && typeof pos === 'object') {
            pos = [Number(pos.u ?? pos.x ?? 0.5), Number(pos.v ?? pos.y ?? 0.5)];
          } else {
            pos = [0.5, 0.5];
          }
          const type = (ln.type === 'horizontal') ? 'horizontal' : 'vertical';
          return type === 'vertical' ? { type, u: Number(pos[0]) } : { type, v: Number(pos[1]) };
        });
        snapLinesReadyRef.current = true;
        // Trigger redraw to show lines immediately
        setTimeout(() => { if (redrawAllRef.current) redrawAllRef.current(); }, 50);
      } catch {}
    })();
  }, [selectedDesign?.id]);
  
  // Debug: log fonts received
  // console.log('🎨 SimpleViewer: Received fonts:', fonts?.length, fonts);
  
  // Load bounding box icons
  useEffect(() => {
    const icons = ['delete', 'lock', 'delock', 'rotation', 'size'];
    icons.forEach(iconName => {
      if (!iconImagesRef.current.has(iconName)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log('✅ Icon loaded:', iconName);
          if (redrawAllLogosRef.current) {
            setTimeout(() => redrawAllLogosRef.current?.(), 100);
          }
        };
        img.src = `/icons/${iconName}.svg`;
        iconImagesRef.current.set(iconName, img);
      }
    });
  }, []);
  
  // Keep placedLogosRef updated with the incoming placedLogos prop and load logo images
  useEffect(() => {
    console.log('🔄 placedLogos changed, new count:', placedLogos.length);
    placedLogosRef.current = placedLogos;
    
    // Load images for all logos
    placedLogos.forEach(logo => {
      const cachedImg = logoImagesRef.current.get(logo.id);
      // Load if not cached or if variantFile changed
      if (!cachedImg || cachedImg.src !== logo.variantFile) {
        console.log('📥 Loading logo image:', logo.id, logo.variantFile, 'cached:', !!cachedImg);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log('✅ Logo image loaded:', logo.id);
          if (redrawAllLogosRef.current) {
            setTimeout(() => redrawAllLogosRef.current?.(), 100);
          }
        };
        img.src = logo.variantFile;
        logoImagesRef.current.set(logo.id, img);
      }
    });
    
    // ALWAYS redraw after placedLogos changes, even if logos are already loaded
    if (redrawAllLogosRef.current && ctxRef.current && overlayTexRef.current) {
      // console.log('🎨 Calling redrawAll after placedLogos changed');
      setTimeout(() => {
        if (redrawAllRef.current) {
          redrawAllRef.current();
        }
      }, 200);
    }
  }, [placedLogos]);
  
  // Update selectedLogoIdRef when it changes
  useEffect(() => {
    console.log('🔄 selectedLogoId changed:', selectedLogoId);
    selectedLogoIdRef.current = selectedLogoId;
    if (redrawAllRef.current) {
      redrawAllRef.current();
    }
  }, [selectedLogoId]);
  
  // Keep textsRef updated
  useEffect(() => {
    console.log('📝 texts changed, new count:', texts.length);
    textsRef.current = texts;
    
    // Redraw texts if redraw function exists
    if (redrawAllTextsRef.current && ctxRef.current && overlayTexRef.current) {
      // console.log('📝 Calling redrawAllTexts after texts changed');
      setTimeout(() => {
        if (redrawAllRef.current) {
          redrawAllRef.current();
        }
      }, 200);
    }
  }, [texts]);
  
  // Update selectedTextIdRef when it changes
  useEffect(() => {
    console.log('📝 selectedTextId changed:', selectedTextId);
    selectedTextIdRef.current = selectedTextId;
    if (redrawAllRef.current) {
      redrawAllRef.current();
    }
  }, [selectedTextId]);
  
  // Load fonts into cache
  useEffect(() => {
    // console.log('📝 Fonts useEffect triggered, fonts:', fonts?.length, fonts);
    if (!fonts || fonts.length === 0) {
      // console.log('⚠️ No fonts provided or empty array');
      return;
    }
    
    const loadFont = async (font: typeof fonts[0]) => {
      try {
        // Mark font as loading
        loadingFontsRef.current.add(font.id);
        
        // console.log('📝 Loading font:', font.display_name, 'URL:', font.font_url);
        
        // Load font file as blob
        const response = await fetch(font.font_url);
        if (!response.ok) {
          console.error('❌ Failed to load font:', font.display_name, 'Status:', response.status);
          loadingFontsRef.current.delete(font.id);
          return;
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        fontCacheRef.current.set(font.id, blobUrl);
        // console.log('✅ Font loaded and cached:', font.display_name, 'BlobURL length:', blobUrl.length);
        
        // Use display_name as font-family to match page.tsx
        const fontFamily = font.display_name;
        
        // Create @font-face rule
        const style = document.createElement('style');
        style.textContent = `@font-face { font-family: '${fontFamily}'; src: url('${blobUrl}'); }`;
        document.head.appendChild(style);
        
        // Create FontFace and wait for it to be loaded
        const fontFace = new FontFace(fontFamily, `url('${blobUrl}')`);
        
        try {
          await fontFace.load();
          document.fonts.add(fontFace);
          // console.log('✅ Font face loaded and added to document.fonts:', font.display_name);
        } catch (err) {
          console.error('⚠️ Failed to load FontFace for:', font.display_name, err);
        }
        
        // Mark as loaded
        loadingFontsRef.current.delete(font.id);
        
        // console.log('✅ Font @font-face rule created for:', font.display_name);
        
        // Redraw all after font loads
        setTimeout(() => {
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
        }, 200);
      } catch (error) {
        console.error('❌ Error loading font:', font.display_name, error);
        loadingFontsRef.current.delete(font.id);
      }
    };
    
    fonts.forEach((font) => {
      if (!fontCacheRef.current.has(font.id)) {
        // console.log('📝 Loading font for first time:', font.id, font.display_name);
        loadFont(font);
      } else {
        // console.log('✅ Font already cached:', font.id, font.display_name);
      }
    });
  }, [fonts]);
  
  // Create a stable colors hash for dependency tracking
  const colorsHash = useMemo(() => {
    if (!colors || Object.keys(colors).length === 0) return '';
    return Object.keys(colors).sort().map(key => `${key}:${colors[key]}`).join('|');
  }, [colors]);
  
  // Setup meshes and load design texture (UV0) - runs when designSrc changes
  useEffect(() => {
    if (!gltf?.scene) return;
    if (!designSrc) return; // aucun design à charger
    
    if (lastLoadedDesignSrcRef.current !== designSrc) {
      appliedSvgRef.current = null;
      lastLoadedDesignSrcRef.current = designSrc;
    }
    
    console.log('🎨 SimpleViewer: designSrc =', designSrc);
    console.log('🎨 SimpleViewer: Loading design texture from:', designSrc);

    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((o: any) => { if (o.isMesh) meshes.push(o as THREE.Mesh); });
    if (meshes.length === 0) return;
    
    console.log('🎨 SimpleViewer: Found', meshes.length, 'meshes');

    // Log all mesh/material names for debug
    const materialNamesSet = new Set<string>();
    meshes.forEach((m) => {
      const matName = ((m.material as any)?.name) || '';
      materialNamesSet.add(matName || '(no name)');
      console.log('🧱 Mesh:', m.name || '(unnamed)', '| Material:', matName || '(no name)');
    });
    console.log('🧾 Unique material names:', Array.from(materialNamesSet));

    // Split meshes into back/front; prepare backs immediately
    const frontMeshes: THREE.Mesh[] = [];
    const backMeshes: THREE.Mesh[] = [];
    meshes.forEach((m) => {
      const materialNameInit = ((m.material as any)?.name) || (m as any)?.userData?.materialName || '';
      const isBackInit = /back/i.test(materialNameInit) || /back/i.test(m.name || '');
      if (isBackInit) {
        try {
          const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
          (whiteMat as any).map = null;
          (whiteMat as any).normalMap = null;
          (whiteMat as any).roughnessMap = null;
          (whiteMat as any).metalnessMap = null;
          (whiteMat as any).aoMap = null;
          (whiteMat as any).alphaMap = null;
          (whiteMat as any).name = materialNameInit || (m.name ? `${m.name}_BACK_WHITE` : 'BACK_WHITE');
          m.material = whiteMat as any;
          (m as any).castShadow = true;
          (m as any).receiveShadow = true;
          console.log('⬜ Back mesh forced white:', m.name || '(unnamed)', '| Material:', (whiteMat as any).name);
        } catch {}
        backMeshes.push(m);
      } else {
        // Ensure existing map is clamped (avoid tiling) and create placeholder material if needed
        const oldTexture = (m.material as any)?.map;
        if (oldTexture) {
          oldTexture.wrapS = THREE.ClampToEdgeWrapping;
          oldTexture.wrapT = THREE.ClampToEdgeWrapping;
          oldTexture.repeat.set(1, 1);
          oldTexture.offset.set(0, 0);
          oldTexture.needsUpdate = true;
        }
        if (!m.material) {
          const ph = new THREE.MeshStandardMaterial({ color: 0xdddddd });
          (ph as any).name = materialNameInit || (m.name ? `${m.name}_FRONT_PLACEHOLDER` : 'FRONT_PLACEHOLDER');
          m.material = ph as any;
        }
        frontMeshes.push(m);
      }
      const g = m.geometry as THREE.BufferGeometry;
      if (!g.getAttribute('uv2')) { const uv = g.getAttribute('uv'); if (uv) g.setAttribute('uv2', uv); }
    });

    // Load and process SVG ONCE and apply single texture to all front meshes
    const loadAndProcessSVGOnce = async () => {
      try {
        const seq = ++loadSeqRef.current;
          console.log('🔄 Loading SVG:', designSrc, 'colors:', colors);
        // Use cached original SVG if available for this designSrc to avoid refetch on re-mounts
        let svgText = originalSvgRef.current;
        if (!svgText) {
          const srcToFetch = designSrc ? `${designSrc}${designSrc.includes('?') ? '&' : '?'}v=${Date.now()}` : '';
          const response = await fetch(srcToFetch || '');
          if (!response.ok) {
            console.error('❌ SVG fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
          }
          svgText = await response.text();
          originalSvgRef.current = svgText;
          setSvgBaseVersion(v => v + 1);
          // Extract original HEX per known classes from <style> blocks
          try {
              const styleBlocks = Array.from(svgText.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
            const classHex: Record<string, string> = {};
            const normalizedKeys = new Set<string>();
            Object.keys(colors || {}).forEach((key) => {
              normalizedKeys.add(key.replace(/^--/, '').toLowerCase());
            });
            [
              'primary',
              'secondary',
              'tertiary',
              'quaternary',
              'quinary',
              'accent',
              'background',
              'foreground',
              'text',
              'border',
              'clip',
              'stripe',
              'logo',
            ].forEach((key) => normalizedKeys.add(key));

            if (styleBlocks.length > 0 && normalizedKeys.size > 0) {
              for (const [, css] of styleBlocks) {
                const lowerCss = css.toLowerCase();
                normalizedKeys.forEach((key) => {
                  if (classHex[key]) return;
                  const re = new RegExp(`\\.${key}[^}]*?#([0-9a-f]{3,6})`, 'i');
                  const m = lowerCss.match(re);
                  if (m && m[1]) {
                    classHex[key] = `#${m[1]}`;
                  }
                });
              }
            }
            classHexRef.current = classHex;
            previousColorsRef.current = { ...classHex };
            Object.entries(classHex).forEach(([k, v]) => console.log('🔎 Detected original class HEX:', k, v));
                } catch {}
              }
        if (!svgText || svgText.trim().length === 0) {
          console.error('❌ SVG is empty');
          throw new Error('SVG content is empty');
        }
        hexColorMappingRef.current.clear();
        let finalSvg = svgText;
        // Ne pas appliquer la texture originale; la texture recolorée sera appliquée par l'effet dédié
 
          const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
          const svgBlobUrl = URL.createObjectURL(blob);
          console.log('📦 Created blob URL for processed SVG, size:', blob.size, 'bytes');
        try {
          const svgDataUrlLocal = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
          if (typeof onSvgProcessed === 'function') onSvgProcessed(svgDataUrlLocal);
        } catch {}

        // On s'arrête ici: l'application de texture se fait dans l'effet de recolor uniquement
          return;
      } catch (error) {
        console.error('❌ Error loading SVG:', error);
      }
    };

    loadAndProcessSVGOnce();
     
    // If there is no design texture to load, still apply admin material maps to existing materials
    if (!designSrc) {
      const loader = new THREE.TextureLoader();
      meshes.forEach((m: any) => {
        const oldMaterial = m.material as THREE.Material | undefined;
        const materialName = (oldMaterial as any)?.name || m.name || '';
        const isBack = materialName ? /(^|[^a-z])back([^a-z]|$)/i.test(materialName) : false;
        // For back, force plain white and skip maps as per spec
        let newMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        if (!isBack) {
          // Try to resolve admin maps
              const resolveMaterialConfig = (matName: string, meshName?: string) => {
                const maps: any = materialMaps as any;
                if (!maps) return null;
                const normalize = (name?: string) => (name || '').trim();
                const mirrorFrontBack = (name: string) => {
                  if (/\bback\b/i.test(name)) return name.replace(/back/i, 'FRONT');
                  return name;
                };
                const stripSuffixes = (name: string) => {
                  let n = name.replace(/_[0-9]+(?:\.[0-9]+)?$/i, '');
                  n = n.replace(/(\.|_)[0-9]{2,}$/i, '');
                  return n;
                };
                const candidates = Array.from(new Set([
                  normalize(matName),
                  normalize(matName).toLowerCase(),
                  normalize(matName).toUpperCase(),
                  stripSuffixes(normalize(matName)),
                  stripSuffixes(normalize(matName)).toLowerCase(),
                  stripSuffixes(normalize(matName)).toUpperCase(),
                  mirrorFrontBack(normalize(matName)),
                  mirrorFrontBack(stripSuffixes(normalize(matName))),
                  normalize(meshName || ''),
                  stripSuffixes(normalize(meshName || ''))
                ].filter(Boolean)));
                for (const key of candidates) {
                  if (maps[key]) return maps[key];
                }
                const values: any[] = Object.values(maps);
                for (const c of candidates) {
                  const hit = values.find((v: any) => (v?.materialName || '').toLowerCase() === c.toLowerCase());
                  if (hit) return hit;
                }
                return null;
              };
              const mm = resolveMaterialConfig(materialName, m.name || '');
          if (mm) {
            const maxAniso = gl.capabilities.getMaxAnisotropy?.() || 8;
            const applyTransform = (tex: THREE.Texture) => {
              const getNum = (v: any, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
              // Support various naming conventions from admin
              const rep = (mm.repeat && Array.isArray(mm.repeat)) ? mm.repeat : undefined;
              const repStr = (typeof mm.repeat === 'string') ? mm.repeat.split(',') : undefined;
              const repeatX = getNum(mm.repeatX ?? mm.scaleX ?? mm.tilingX ?? (rep?.[0]) ?? (repStr ? parseFloat(repStr[0]) : undefined), 1);
              const repeatY = getNum(mm.repeatY ?? mm.scaleY ?? mm.tilingY ?? (rep?.[1]) ?? (repStr ? parseFloat(repStr[1]) : undefined), 1);
              const off = (mm.offset && Array.isArray(mm.offset)) ? mm.offset : undefined;
              const offStr = (typeof mm.offset === 'string') ? mm.offset.split(',') : undefined;
              const offsetX = getNum(mm.offsetX ?? (off?.[0]) ?? (offStr ? parseFloat(offStr[0]) : undefined), 0);
              const offsetY = getNum(mm.offsetY ?? (off?.[1]) ?? (offStr ? parseFloat(offStr[1]) : undefined), 0);
              if (repeatX !== 1 || repeatY !== 1) {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
              } else {
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
              }
              tex.repeat.set(repeatX, repeatY);
              tex.offset.set(offsetX, offsetY);
              // Admin maps are non-color data; ensure linear space and correct orientation for glTF
              (tex as any).colorSpace = THREE.NoColorSpace as any;
              tex.flipY = false;
              (tex as any).anisotropy = maxAniso;
              tex.needsUpdate = true;
            };
            const setMap = (mat: any, prop: string, url?: string) => {
              if (!url) return;
              const loader = new THREE.TextureLoader();
              loader.load(url, (tex2) => { applyTransform(tex2); mat[prop] = tex2; mat.needsUpdate = true; }, undefined, () => {});
            };
            // Keep color map as plain white (no design in this branch), but apply admin maps
            newMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });
            setMap(newMaterial as any, 'normalMap', mm.normalMap || mm.normal || mm.normalTexture);
            setMap(newMaterial as any, 'roughnessMap', mm.roughnessMap || mm.roughness || mm.roughnessTexture);
            setMap(newMaterial as any, 'metalnessMap', mm.metalnessMap || mm.metallicMap || mm.metalness || mm.metalnessTexture);
            setMap(newMaterial as any, 'aoMap', mm.aoMap || mm.ambientOcclusionMap || mm.occlusionMap);
            // Intensities/scalars
            const _rough = (typeof mm.roughness === 'number' ? mm.roughness : (typeof mm.roughnessFactor === 'number' ? mm.roughnessFactor : undefined));
            const _metal = (typeof mm.metalness === 'number' ? mm.metalness : (typeof mm.metalnessFactor === 'number' ? mm.metalnessFactor : (typeof mm.metallic === 'number' ? mm.metallic : undefined)));
            const _aoInt = (typeof mm.aoIntensity === 'number' ? mm.aoIntensity : (typeof mm.occlusionIntensity === 'number' ? mm.occlusionIntensity : undefined));
            const _nScaleX = (typeof mm.normalScaleX === 'number' ? mm.normalScaleX : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
            const _nScaleY = (typeof mm.normalScaleY === 'number' ? mm.normalScaleY : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
            (newMaterial as any).normalScale = new THREE.Vector2(_nScaleX, _nScaleY);
            if ((newMaterial as any).metalnessMap) (newMaterial as any).metalness = (typeof _metal === 'number' ? _metal : 1.0);
            if (typeof _metal === 'number') (newMaterial as any).metalness = _metal;
            if (typeof _rough === 'number') (newMaterial as any).roughness = _rough;
            if (typeof _aoInt === 'number') (newMaterial as any).aoMapIntensity = _aoInt;
          } else {
              console.log('ℹ️ No admin maps matched for material:', materialName);
            }
        }
            (m as any).castShadow = true;
            (m as any).receiveShadow = true;
        m.material = newMaterial as any;
      });
    }
  }, [gltf?.scene, designSrc, colorsHash, materialMaps]);

  // Recolor pass: rebuild texture from cached original SVG on base SVG ready and on color changes
  useEffect(() => {
    if (!gltf?.scene) return;
    if (!originalSvgRef.current) return;
    // Normalize color keys (strip leading --)
    const normalizedColors: Record<string, string> = {};
    Object.entries(colors || {}).forEach(([k, v]) => {
      const key = k.replace(/^--/, '');
      if (typeof v === 'string') normalizedColors[key] = v as string;
    });
    // Build final SVG by global HEX replacement
    let finalSvg = originalSvgRef.current;
    let anyChange = false;
    for (const [key, newHex] of Object.entries(normalizedColors)) {
      const fromHex = classHexRef.current[key] || previousColorsRef.current[key];
      if (!fromHex || !newHex || fromHex.toLowerCase() === newHex.toLowerCase()) continue;
      const safe = fromHex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'gi');
      const before = finalSvg;
      finalSvg = finalSvg.replace(re, (m) => newHex);
      const count = (before.match(re) || []).length;
      console.log(`🟢 HEX replace for key: ${key} ${fromHex} → ${newHex}, count=${count}`);
      if (count > 0) anyChange = true;
      previousColorsRef.current[key] = newHex;
    }
    const alreadyApplied = appliedSvgRef.current === finalSvg;
    if (alreadyApplied) {
      console.log('ℹ️ Recolor: SVG identical to last applied, skipping reapply');
      return;
    }
    if (!anyChange) {
      console.log('ℹ️ Recolor: No color change detected; applying base SVG texture.');
    }
    // Apply to front meshes only using a data URL Image
              const img = new Image();
    img.crossOrigin = 'anonymous';
              img.onload = () => {
              const size = 4096;
              const c = document.createElement('canvas');
              c.width = c.height = size;
              const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace as any;
      tex.anisotropy = gl.capabilities.getMaxAnisotropy?.() || 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.flipY = false;
      tex.center.set(0.5, 0.5);
      tex.rotation = 0;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.offset.set(0, 0);
      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((o: any) => { if (o.isMesh) meshes.push(o as THREE.Mesh); });
      const isBack = (m: THREE.Mesh) => {
        const matName = ((m.material as any)?.name) || (m as any)?.userData?.materialName || '';
        return /back/i.test(matName) || /back/i.test(m.name || '');
      };
      const maxAniso = gl.capabilities.getMaxAnisotropy?.() || 8;
      const applyTransform = (tex: THREE.Texture, mm?: any) => {
        const getNum = (v: any, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
        // Support various naming conventions from admin (mm optional)
        const rep = (mm && mm.repeat && Array.isArray(mm.repeat)) ? mm.repeat : undefined;
        const repStr = (mm && typeof mm.repeat === 'string') ? (mm.repeat as string).split(',') : undefined;
        const repeatX = getNum(mm?.repeatX ?? mm?.scaleX ?? mm?.tilingX ?? (rep?.[0]) ?? (repStr ? parseFloat(repStr[0]) : undefined), 1);
        const repeatY = getNum(mm?.repeatY ?? mm?.scaleY ?? mm?.tilingY ?? (rep?.[1]) ?? (repStr ? parseFloat(repStr[1]) : undefined), 1);
        const off = (mm && mm.offset && Array.isArray(mm.offset)) ? mm.offset : undefined;
        const offStr = (mm && typeof mm.offset === 'string') ? (mm.offset as string).split(',') : undefined;
        const offsetX = getNum(mm?.offsetX ?? (off?.[0]) ?? (offStr ? parseFloat(offStr[0]) : undefined), 0);
        const offsetY = getNum(mm?.offsetY ?? (off?.[1]) ?? (offStr ? parseFloat(offStr[1]) : undefined), 0);
        if (repeatX !== 1 || repeatY !== 1) {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
        } else {
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
        }
        tex.repeat.set(repeatX, repeatY);
        tex.offset.set(offsetX, offsetY);
        // Non-color data maps
        (tex as any).colorSpace = THREE.NoColorSpace as any;
        tex.flipY = false;
        (tex as any).anisotropy = maxAniso;
        tex.needsUpdate = true;
      };
      const setMap = (mat: any, prop: string, url?: string, mm?: any) => {
        if (!url) return;
        const loader = new THREE.TextureLoader();
        loader.load(url, (tex2) => { applyTransform(tex2, mm); mat[prop] = tex2; mat.needsUpdate = true; }, undefined, () => {});
      };
            const resolveMaterialConfig = (matName: string, meshName?: string) => {
              const maps: any = materialMaps as any;
              if (!maps) return null;
              const normalize = (name?: string) => (name || '').trim();
        const mirrorFrontBack = (name: string) => (/back/i.test(name) ? name.replace(/back/i, 'FRONT') : name);
        const stripSuffixes = (name: string) => { let n = name.replace(/_[0-9]+(?:\.[0-9]+)?$/i, ''); n = n.replace(/(\.|_)[0-9]{2,}$/i, ''); return n; };
              const candidates = Array.from(new Set([
                normalize(matName),
                normalize(matName).toLowerCase(),
                normalize(matName).toUpperCase(),
                stripSuffixes(normalize(matName)),
                stripSuffixes(normalize(matName)).toLowerCase(),
                stripSuffixes(normalize(matName)).toUpperCase(),
                mirrorFrontBack(normalize(matName)),
                mirrorFrontBack(stripSuffixes(normalize(matName))),
                normalize(meshName || ''),
                stripSuffixes(normalize(meshName || ''))
              ].filter(Boolean)));
        for (const key of candidates) { if ((maps as any)[key]) return (maps as any)[key]; }
              const values: any[] = Object.values(maps);
        for (const c2 of candidates) {
          const hit = values.find((v: any) => (v?.materialName || '').toLowerCase() === c2.toLowerCase());
                if (hit) return hit;
              }
              return null;
            };
      meshes.forEach((m) => {
        if (isBack(m)) {
          const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
          (whiteMat as any).map = null;
          (whiteMat as any).normalMap = null;
          (whiteMat as any).roughnessMap = null;
          (whiteMat as any).metalnessMap = null;
          (whiteMat as any).aoMap = null;
          (whiteMat as any).alphaMap = null;
          (whiteMat as any).name = ((m.material as any)?.name) || (m as any)?.userData?.materialName || (m.name ? `${m.name}_BACK_WHITE` : 'BACK_WHITE');
          m.material = whiteMat as any;
          console.log('⬜ Back mesh forced white (recolor):', m.name || '(unnamed)', '| Material:', (whiteMat as any).name);
        } else {
          // Ensure uv2 exists for AO
          const g = m.geometry as THREE.BufferGeometry;
          if (!g.getAttribute('uv2')) { const uv = g.getAttribute('uv'); if (uv) g.setAttribute('uv2', uv); }
          const newMaterial = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.6, metalness: 0.0, transparent: false });
          (newMaterial as any).name = ((m.material as any)?.name) || (m as any)?.userData?.materialName || (m.name ? `${m.name}_FRONT` : 'FRONT');
          // Apply admin maps if any
          const mm = resolveMaterialConfig(((m.material as any)?.name) || (m as any)?.userData?.materialName || '', m.name || '');
          if (mm) {
            // Always use UV2 for PBR maps if available: remap uv <- uv2 to guarantee alignment
            const g2 = m.geometry as THREE.BufferGeometry;
            const uv2Attr = g2.getAttribute('uv2');
            if (uv2Attr) {
              g2.setAttribute('uv', uv2Attr);
            }
            const orm = mm.ormMap || mm.occlusionRoughnessMetalnessMap || mm.occlusionRoughnessMetallicMap || mm.occlusion_roughness_metalness;
            const n = mm.normalMap || mm.normal || mm.normalTexture;
            const r = mm.roughnessMap || mm.roughness || mm.roughnessTexture || (orm ? orm : undefined);
            const me = mm.metalnessMap || mm.metallicMap || mm.metalness || mm.metalnessTexture || (orm ? orm : undefined);
            const ao = mm.aoMap || mm.ambientOcclusionMap || mm.occlusionMap || (orm ? orm : undefined);
            setMap(newMaterial as any, 'normalMap', n, mm);
            setMap(newMaterial as any, 'roughnessMap', r, mm);
            setMap(newMaterial as any, 'metalnessMap', me, mm);
            setMap(newMaterial as any, 'aoMap', ao, mm);
            // Shader unchanged; we already remap uv <- uv2 at geometry level above.
            // Intensities/scalars
            const _rough = (typeof mm.roughness === 'number' ? mm.roughness : (typeof mm.roughnessFactor === 'number' ? mm.roughnessFactor : undefined));
            const _metal = (typeof mm.metalness === 'number' ? mm.metalness : (typeof mm.metalnessFactor === 'number' ? mm.metalnessFactor : (typeof mm.metallic === 'number' ? mm.metallic : undefined)));
            const _aoInt = (typeof mm.aoIntensity === 'number' ? mm.aoIntensity : (typeof mm.occlusionIntensity === 'number' ? mm.occlusionIntensity : undefined));
            const _nScaleX = (typeof mm.normalScaleX === 'number' ? mm.normalScaleX : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
            const _nScaleY = (typeof mm.normalScaleY === 'number' ? mm.normalScaleY : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
            const _envInt = (typeof mm.envMapIntensity === 'number' ? mm.envMapIntensity : (typeof mm.environmentIntensity === 'number' ? mm.environmentIntensity : undefined));
            (newMaterial as any).normalScale = new THREE.Vector2(_nScaleX, _nScaleY);
            if (typeof _metal === 'number') {
              (newMaterial as any).metalness = _metal;
            } else if (me) {
              (newMaterial as any).metalness = 0.3;
            }
            if (r) (newMaterial as any).roughness = (typeof _rough === 'number' ? _rough : 1.0);
            if (typeof _aoInt === 'number') (newMaterial as any).aoMapIntensity = _aoInt;
            if (typeof _envInt === 'number') {
              (newMaterial as any).envMapIntensity = _envInt;
            } else {
              (newMaterial as any).envMapIntensity = 0.3;
            }
            console.log('🗺️ Admin maps applied for', (newMaterial as any).name, { normal: !!n, roughness: !!r, metalness: !!me, ao: !!ao });
            // Post-apply debug after a tick to ensure textures loaded
            setTimeout(() => {
              const nm: any = (newMaterial as any).normalMap;
              const rm: any = (newMaterial as any).roughnessMap;
              const mmtex: any = (newMaterial as any).metalnessMap;
              const aom: any = (newMaterial as any).aoMap;
              console.log('🔎 Maps state for', (newMaterial as any).name, {
                normal: !!nm && !!nm.image, normalSize: nm?.image ? { w: nm.image.width, h: nm.image.height } : null,
                roughness: !!rm && !!rm.image, roughnessSize: rm?.image ? { w: rm.image.width, h: rm.image.height } : null,
                metalness: !!mmtex && !!mmtex.image, metalnessSize: mmtex?.image ? { w: mmtex.image.width, h: mmtex.image.height } : null,
                ao: !!aom && !!aom.image, aoSize: aom?.image ? { w: aom.image.width, h: aom.image.height } : null,
                roughnessScalar: (newMaterial as any).roughness,
                metalnessScalar: (newMaterial as any).metalness,
                aoIntensity: (newMaterial as any).aoMapIntensity,
                normalScale: (newMaterial as any).normalScale?.toArray?.() || null,
              });
            }, 200);
          } else {
            console.log('ℹ️ No admin maps matched for material:', (newMaterial as any).name);
            (newMaterial as any).envMapIntensity = 0.3;
            (newMaterial as any).roughness = 0.9;
            (newMaterial as any).metalness = 0.0;
          }
          newMaterial.needsUpdate = true;
          m.material = newMaterial as any;
        }
        (m as any).castShadow = true;
        (m as any).receiveShadow = true;
        console.log('🎯 Applied material to mesh:', m.name || '(unnamed)', '→', ((m.material as any)?.name) || '(no name)');
      });
      tex.needsUpdate = true;
      appliedSvgRef.current = finalSvg;
      try {
        const svgDataUrlLocal = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
        if (typeof onSvgProcessed === 'function') onSvgProcessed(svgDataUrlLocal);
      } catch {}
    };
    img.onerror = (error) => {
      console.error('❌ Failed to load recolored SVG image', error);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
  }, [gltf?.scene, svgBaseVersion, colorsHash]);

  // Studio lighting setup (shadows)
  useEffect(() => {
    if (!scene || !gl) return;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap as any;
    // Global tone mapping to reduce brightness
    (gl as any).toneMapping = THREE.ACESFilmicToneMapping as any;
    (gl as any).toneMappingExposure = 0.4;

    (async () => {
      try {
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        const pmrem = new THREE.PMREMGenerator(gl);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.005).texture;
        scene.environment = envTex;
      } catch (e) {
        console.warn('⚠️ Could not set RoomEnvironment:', e);
      }
    })();

    const group = new THREE.Group();
    group.name = 'studio_lights';

    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    group.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(5, 8, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    group.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-8, 6, 2);
    group.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-6, 6, -10);
    rim.castShadow = false;
    group.add(rim);

    const sideL = new THREE.DirectionalLight(0xffffff, 0.25);
    sideL.position.set(20, 2, 0);
    group.add(sideL);
    const sideR = new THREE.DirectionalLight(0xffffff, 0.25);
    sideR.position.set(-20, 2, 0);
    group.add(sideR);

    const top = new THREE.DirectionalLight(0xffffff, 0.25);
    top.position.set(0, 25, 0);
    group.add(top);

    const p1 = new THREE.PointLight(0xffffff, 0.5, 40, 1.8);
    p1.position.set(5, 15, 8);
    group.add(p1);
    const p2 = new THREE.PointLight(0xffffff, 0.4, 40, 1.8);
    p2.position.set(-5, 12, 8);
    group.add(p2);

    const kicker = new THREE.SpotLight(0xffffff, 0.3, undefined, Math.PI / 4, 0.5);
    kicker.position.set(0, -5, 10);
    group.add(kicker);

    scene.add(group);
    return () => { scene.remove(group); };
  }, [scene, gl]); // Don't depend on designSrc - only setup once

  // Wrapper for selectLogo to prevent deselection during drag
  const safeSelectLogo = useCallback((id: string | null) => {
    // If trying to deselect during drag, ignore
    if (id === null && (isDraggingRef.current || draggingLogoIdRef.current)) {
      console.log('⚠️ Blocked deselection during drag');
      return;
    }
    
    console.log('✅ Safe selectLogo called:', id);
    if (selectLogo) {
      selectLogo(id);
    }
  }, [selectLogo]);
  
  // Store safeSelectLogo in ref for use in event handlers
  safeSelectLogoRef.current = safeSelectLogo;
  
  // Setup overlay canvas and event listeners (UV2) - runs only once
  useEffect(() => {
    if (!gltf?.scene) return;
    
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((o: any) => { if (o.isMesh) meshes.push(o as THREE.Mesh); });
    if (meshes.length === 0) return;

    console.log('🔄 Setting up overlay canvas in useEffect');
    
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2048; // Higher quality
    canvasRef.current = canvas;
    // Expose canvas to parent component
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
    const ctx = canvas.getContext('2d'); if (!ctx) {
      console.error('❌ Failed to get 2d context for overlay canvas');
      return;
    }
    ctxRef.current = ctx;
    
    // No background - transparent canvas to see logos
    console.log('✅ Overlay canvas created (no background)');
    const overlayTex = new THREE.CanvasTexture(canvas); 
    // Use mipmaps and anisotropy for higher quality at distance/angles
    overlayTex.minFilter = THREE.LinearMipmapLinearFilter; 
    overlayTex.magFilter = THREE.LinearFilter;
    overlayTex.generateMipmaps = true;
    (overlayTex as any).anisotropy = gl.capabilities.getMaxAnisotropy?.() || 8;
    overlayTex.flipY = false;
    overlayTex.colorSpace = THREE.SRGBColorSpace as any;
    (overlayTex as any).premultiplyAlpha = true;
    overlayTex.needsUpdate = true; // Force initial update
    overlayTexRef.current = overlayTex;
    
    console.log('🎨 Created CanvasTexture for overlay, canvas size:', canvas.width, 'x', canvas.height);
    console.log('🔍 overlayTexRef.current set to:', overlayTex);
    console.log('🔍 Canvas URI:', canvas.toDataURL().substring(0, 100)); // First 100 chars of data URL
    
    // Helper function to apply material maps to overlay material
    const resolveMaterialConfig = (matName: string, meshName?: string) => {
      const maps: any = materialMaps as any;
      if (!maps) return null;
      const normalize = (name?: string) => (name || '').trim();
      const mirrorFrontBack = (name: string) => (/back/i.test(name) ? name.replace(/back/i, 'FRONT') : name);
      const stripSuffixes = (name: string) => { let n = name.replace(/_[0-9]+(?:\.[0-9]+)?$/i, ''); n = n.replace(/(\.|_)[0-9]{2,}$/i, ''); return n; };
      const candidates = Array.from(new Set([
        normalize(matName),
        normalize(matName).toLowerCase(),
        normalize(matName).toUpperCase(),
        stripSuffixes(normalize(matName)),
        stripSuffixes(normalize(matName)).toLowerCase(),
        stripSuffixes(normalize(matName)).toUpperCase(),
        mirrorFrontBack(normalize(matName)),
        mirrorFrontBack(stripSuffixes(normalize(matName))),
        normalize(meshName || ''),
        stripSuffixes(normalize(meshName || ''))
      ].filter(Boolean)));
      for (const key of candidates) { if ((maps as any)[key]) return (maps as any)[key]; }
      const values: any[] = Object.values(maps);
      for (const c2 of candidates) {
        const hit = values.find((v: any) => (v?.materialName || '').toLowerCase() === c2.toLowerCase());
        if (hit) return hit;
      }
      return null;
    };

    const maxAniso = gl.capabilities.getMaxAnisotropy?.() || 8;
    const applyTransform = (tex: THREE.Texture, mm?: any) => {
      const getNum = (v: any, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
      const rep = (mm && mm.repeat && Array.isArray(mm.repeat)) ? mm.repeat : undefined;
      const repStr = (mm && typeof mm.repeat === 'string') ? (mm.repeat as string).split(',') : undefined;
      const repeatX = getNum(mm?.repeatX ?? mm?.scaleX ?? mm?.tilingX ?? (rep?.[0]) ?? (repStr ? parseFloat(repStr[0]) : undefined), 1);
      const repeatY = getNum(mm?.repeatY ?? mm?.scaleY ?? mm?.tilingY ?? (rep?.[1]) ?? (repStr ? parseFloat(repStr[1]) : undefined), 1);
      const off = (mm && mm.offset && Array.isArray(mm.offset)) ? mm.offset : undefined;
      const offStr = (mm && typeof mm.offset === 'string') ? (mm.offset as string).split(',') : undefined;
      const offsetX = getNum(mm?.offsetX ?? (off?.[0]) ?? (offStr ? parseFloat(offStr[0]) : undefined), 0);
      const offsetY = getNum(mm?.offsetY ?? (off?.[1]) ?? (offStr ? parseFloat(offStr[1]) : undefined), 0);
      if (repeatX !== 1 || repeatY !== 1) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
      } else {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
      }
      tex.repeat.set(repeatX, repeatY);
      tex.offset.set(offsetX, offsetY);
      (tex as any).colorSpace = THREE.NoColorSpace as any;
      tex.flipY = false;
      (tex as any).anisotropy = maxAniso;
      tex.needsUpdate = true;
    };
    const setMap = (mat: any, prop: string, url?: string, mm?: any) => {
      if (!url) return;
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex2) => { applyTransform(tex2, mm); mat[prop] = tex2; mat.needsUpdate = true; }, undefined, () => {});
    };

    const overlayMeshes: THREE.Mesh[] = [];
    overlaysByBaseUuidRef.current.clear();
    console.log('🎨 Creating overlay meshes for', meshes.length, 'base meshes');
    meshes.forEach((m) => {
      const matName = (((m as any)?.material as any)?.name || (m.name as any) || '').toString();
      const meshName = (m.name || '').toString();
      // Skip overlay if material or mesh name contains "back" (case-insensitive)
      const isBackMesh = /back/i.test(matName) || /back/i.test(meshName);
      if (isBackMesh) {
        console.log('⏭️ Skipping overlay for BACK material/mesh:', matName, '(', m.name || 'unnamed', ')');
        return; // Do NOT place overlay on back parts
      }
      const overlayGeo = (m.geometry as THREE.BufferGeometry).clone();
      // Ensure both base and overlay geometries have uv2; create from uv if missing
      try {
        const baseGeo = m.geometry as THREE.BufferGeometry;
        let baseUv2 = baseGeo.getAttribute('uv2');
        const baseUv = baseGeo.getAttribute('uv');
        if (!baseUv2 && baseUv) {
          const dup = new THREE.BufferAttribute(new Float32Array((baseUv as any).array), 2);
          baseGeo.setAttribute('uv2', dup);
          baseUv2 = dup;
          console.log('✨ Created UV2 on base geometry from UV for', m.name || 'unnamed', 'count:', dup.count);
        }
      } catch {}

      let uv2 = overlayGeo.getAttribute('uv2');
      const uv = overlayGeo.getAttribute('uv');
      if (!uv2 && uv) {
        const dup = new THREE.BufferAttribute(new Float32Array((uv as any).array), 2);
        overlayGeo.setAttribute('uv2', dup);
        uv2 = dup;
        console.log('✨ Created UV2 on overlay geometry from UV for', m.name || 'unnamed', 'count:', dup.count);
      }
      
      console.log('🎨 Mesh', m.name || 'unnamed', 'UV attributes:', {
        hasUV: !!overlayGeo.getAttribute('uv'),
        hasUV2: !!uv2,
        uv2Count: uv2?.count || 0
      });
      
      // Use UV2 if available, otherwise use UV
      if (uv2) {
        overlayGeo.setAttribute('uv', uv2);
        console.log('✅ Using UV2 for overlay');
          } else {
        if (uv) {
          console.log('✅ Using UV for overlay (UV2 not available)');
            } else {
          console.error('❌ No UV attributes found!');
        }
      }
      
      // Create overlay material matching base material lighting (no boost, same exposure)
      const overlayMat = new THREE.MeshStandardMaterial({
        map: overlayTex,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        opacity: 1.0,
        emissive: new THREE.Color(0x000000), // No emissive boost
        emissiveIntensity: 0.0, // No intensity boost
        roughness: 0.6,
        metalness: 0.0
      });
      (overlayMat as any).toneMapped = true; // Match base material tone mapping
      
      // Overlay is MeshStandardMaterial - can copy PBR maps from base
      const isStandardOverlay = true;
      const baseMat = m.material as any;
      let mapsCopied = false;
      
      console.log('🔍 Checking base material for maps:', matName, {
        hasMaterial: !!baseMat,
        hasNormalMap: !!(baseMat?.normalMap),
        normalMapLoaded: !!(baseMat?.normalMap?.image),
        hasRoughnessMap: !!(baseMat?.roughnessMap),
        roughnessMapLoaded: !!(baseMat?.roughnessMap?.image),
        hasMetalnessMap: !!(baseMat?.metalnessMap),
        metalnessMapLoaded: !!(baseMat?.metalnessMap?.image),
        hasAoMap: !!(baseMat?.aoMap),
        aoMapLoaded: !!(baseMat?.aoMap?.image)
      });
      
      if (isStandardOverlay && baseMat && (baseMat.normalMap?.image || baseMat.roughnessMap?.image || baseMat.metalnessMap?.image || baseMat.aoMap?.image)) {
        // Copy maps directly from base material (they're already loaded with images)
        if (baseMat.normalMap?.image) {
          const clonedTex = baseMat.normalMap.clone();
          clonedTex.repeat.copy(baseMat.normalMap.repeat);
          clonedTex.offset.copy(baseMat.normalMap.offset);
          clonedTex.wrapS = baseMat.normalMap.wrapS;
          clonedTex.wrapT = baseMat.normalMap.wrapT;
          clonedTex.rotation = baseMat.normalMap.rotation;
          clonedTex.center.copy(baseMat.normalMap.center);
          (overlayMat as any).normalMap = clonedTex;
          (overlayMat as any).normalScale = baseMat.normalScale ? baseMat.normalScale.clone() : new THREE.Vector2(1, 1);
          console.log('✅ Copied normalMap from base material to overlay');
        }
        if (baseMat.roughnessMap?.image) {
          const clonedTex = baseMat.roughnessMap.clone();
          clonedTex.repeat.copy(baseMat.roughnessMap.repeat);
          clonedTex.offset.copy(baseMat.roughnessMap.offset);
          clonedTex.wrapS = baseMat.roughnessMap.wrapS;
          clonedTex.wrapT = baseMat.roughnessMap.wrapT;
          clonedTex.rotation = baseMat.roughnessMap.rotation;
          clonedTex.center.copy(baseMat.roughnessMap.center);
          (overlayMat as any).roughnessMap = clonedTex;
          (overlayMat as any).roughness = baseMat.roughness ?? 1.0;
          console.log('✅ Copied roughnessMap from base material to overlay');
        }
        if (baseMat.metalnessMap?.image) {
          const clonedTex = baseMat.metalnessMap.clone();
          clonedTex.repeat.copy(baseMat.metalnessMap.repeat);
          clonedTex.offset.copy(baseMat.metalnessMap.offset);
          clonedTex.wrapS = baseMat.metalnessMap.wrapS;
          clonedTex.wrapT = baseMat.metalnessMap.wrapT;
          clonedTex.rotation = baseMat.metalnessMap.rotation;
          clonedTex.center.copy(baseMat.metalnessMap.center);
          (overlayMat as any).metalnessMap = clonedTex;
          (overlayMat as any).metalness = baseMat.metalness ?? 0.3;
          console.log('✅ Copied metalnessMap from base material to overlay');
        }
        if (baseMat.aoMap?.image) {
          const clonedTex = baseMat.aoMap.clone();
          clonedTex.repeat.copy(baseMat.aoMap.repeat);
          clonedTex.offset.copy(baseMat.aoMap.offset);
          clonedTex.wrapS = baseMat.aoMap.wrapS;
          clonedTex.wrapT = baseMat.aoMap.wrapT;
          clonedTex.rotation = baseMat.aoMap.rotation;
          clonedTex.center.copy(baseMat.aoMap.center);
          (overlayMat as any).aoMap = clonedTex;
          (overlayMat as any).aoMapIntensity = baseMat.aoMapIntensity ?? 1.0;
          console.log('✅ Copied aoMap from base material to overlay');
        }
        
        // Copy envMapIntensity from base material to match lighting and exposure
        if (typeof baseMat.envMapIntensity === 'number') {
          (overlayMat as any).envMapIntensity = baseMat.envMapIntensity;
          console.log('✅ Copied envMapIntensity from base material to overlay:', baseMat.envMapIntensity);
        } else {
          // Use default envMapIntensity if base doesn't have it set
          (overlayMat as any).envMapIntensity = 0.3;
          console.log('✅ Set default envMapIntensity for overlay: 0.3');
        }
        
        mapsCopied = true;
      } else if (isStandardOverlay) {
        console.log('⚠️ Base material maps not yet loaded, will load from admin config');
      }
      
      // Also apply material maps from admin config (in case base material doesn't have them yet)
      const mm = resolveMaterialConfig(matName, m.name || '');
      if (mm) {
        const orm = mm.ormMap || mm.occlusionRoughnessMetalnessMap || mm.occlusionRoughnessMetallicMap || mm.occlusion_roughness_metalness;
        const n = mm.normalMap || mm.normal || mm.normalTexture;
        const r = mm.roughnessMap || mm.roughness || mm.roughnessTexture || (orm ? orm : undefined);
        const me = mm.metalnessMap || mm.metallicMap || mm.metalness || mm.metalnessTexture || (orm ? orm : undefined);
        const ao = mm.aoMap || mm.ambientOcclusionMap || mm.occlusionMap || (orm ? orm : undefined);
        
        // Only apply maps from admin if we didn't copy from base material, or if base material doesn't have the map
        if (!mapsCopied || !(overlayMat as any).normalMap) {
          setMap(overlayMat as any, 'normalMap', n, mm);
        }
        if (!mapsCopied || !(overlayMat as any).roughnessMap) {
          setMap(overlayMat as any, 'roughnessMap', r, mm);
        }
        if (!mapsCopied || !(overlayMat as any).metalnessMap) {
          setMap(overlayMat as any, 'metalnessMap', me, mm);
        }
        if (!mapsCopied || !(overlayMat as any).aoMap) {
          setMap(overlayMat as any, 'aoMap', ao, mm);
        }
        
        // Apply intensities/scalars (override if not already set from base material)
        const _rough = (typeof mm.roughness === 'number' ? mm.roughness : (typeof mm.roughnessFactor === 'number' ? mm.roughnessFactor : undefined));
        const _metal = (typeof mm.metalness === 'number' ? mm.metalness : (typeof mm.metalnessFactor === 'number' ? mm.metalnessFactor : (typeof mm.metallic === 'number' ? mm.metallic : undefined)));
        const _aoInt = (typeof mm.aoIntensity === 'number' ? mm.aoIntensity : (typeof mm.occlusionIntensity === 'number' ? mm.occlusionIntensity : undefined));
        const _envInt = (typeof mm.envMapIntensity === 'number' ? mm.envMapIntensity : (typeof mm.environmentIntensity === 'number' ? mm.environmentIntensity : undefined));
        const _nScaleX = (typeof mm.normalScaleX === 'number' ? mm.normalScaleX : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
        const _nScaleY = (typeof mm.normalScaleY === 'number' ? mm.normalScaleY : (typeof mm.normalScale === 'number' ? mm.normalScale : 1));
        
        if (!(overlayMat as any).normalScale) {
          (overlayMat as any).normalScale = new THREE.Vector2(_nScaleX, _nScaleY);
        }
        if (typeof _metal === 'number' && !(overlayMat as any).metalness) {
          (overlayMat as any).metalness = _metal;
        } else if (me && !(overlayMat as any).metalness) {
          (overlayMat as any).metalness = 0.3;
        }
        if (r && typeof _rough === 'number' && !(overlayMat as any).roughness) {
          (overlayMat as any).roughness = _rough;
        }
        if (typeof _aoInt === 'number' && !(overlayMat as any).aoMapIntensity) {
          (overlayMat as any).aoMapIntensity = _aoInt;
        }
        if (typeof _envInt === 'number' && !(overlayMat as any).envMapIntensity) {
          (overlayMat as any).envMapIntensity = _envInt;
        } else if (!(overlayMat as any).envMapIntensity) {
          // Set default envMapIntensity if not set from base material or admin config
          (overlayMat as any).envMapIntensity = 0.3;
        }
        
        console.log('🗺️ Material maps applied to overlay for', matName, { 
          copiedFromBase: mapsCopied,
          normal: !!n || !!(overlayMat as any).normalMap, 
          roughness: !!r || !!(overlayMat as any).roughnessMap, 
          metalness: !!me || !!(overlayMat as any).metalnessMap, 
          ao: !!ao || !!(overlayMat as any).aoMap
        });
      } else {
        // Default values if no maps
        if (isStandardOverlay && !(overlayMat as any).roughness) {
          (overlayMat as any).roughness = 0.9;
        }
        if (isStandardOverlay && !(overlayMat as any).metalness) {
          (overlayMat as any).metalness = 0.0;
        }
        if (isStandardOverlay && !(overlayMat as any).envMapIntensity) {
          (overlayMat as any).envMapIntensity = 0.3;
        }
        console.log('ℹ️ No material maps found for overlay material:', matName);
      }
      
      // Force update to ensure maps are properly recognized
      (overlayMat as any).needsUpdate = true;
      
      // Update overlay material when base material maps are loaded (async callback)
      // Store reference to overlay material for later update
      const updateOverlayMaps = () => {
        if (!isStandardOverlay) return; // Do not touch uniforms/textures on MeshBasic overlay
        const updatedBaseMat = m.material as any;
        console.log(`🔄 Checking for late-loaded maps for overlay: ${matName}`, {
          hasBaseMat: !!updatedBaseMat,
          baseHasNormal: !!(updatedBaseMat?.normalMap?.image),
          baseHasRoughness: !!(updatedBaseMat?.roughnessMap?.image),
          baseHasMetalness: !!(updatedBaseMat?.metalnessMap?.image),
          baseHasAo: !!(updatedBaseMat?.aoMap?.image),
          overlayHasNormal: !!(overlayMat as any).normalMap?.image,
          overlayHasRoughness: !!(overlayMat as any).roughnessMap?.image,
          overlayHasMetalness: !!(overlayMat as any).metalnessMap?.image,
          overlayHasAo: !!(overlayMat as any).aoMap?.image
        });
        
        if (updatedBaseMat) {
          let updated = false;
          // Always try to copy from base material if it has loaded images, even if we already have maps
          // This ensures we use the same texture instances with correct UV mapping
          if (updatedBaseMat.normalMap?.image) {
            const baseTex = updatedBaseMat.normalMap;
            const overlayTex = (overlayMat as any).normalMap;
            // Copy if overlay doesn't have it, or if base texture is different (newly loaded)
            if (!overlayTex?.image || overlayTex !== baseTex) {
              const clonedTex = baseTex.clone();
              // Copy texture properties (repeat, offset, wrap, etc.)
              clonedTex.repeat.copy(baseTex.repeat);
              clonedTex.offset.copy(baseTex.offset);
              clonedTex.wrapS = baseTex.wrapS;
              clonedTex.wrapT = baseTex.wrapT;
              clonedTex.rotation = baseTex.rotation;
              clonedTex.center.copy(baseTex.center);
              (overlayMat as any).normalMap = clonedTex;
              (overlayMat as any).normalScale = updatedBaseMat.normalScale ? updatedBaseMat.normalScale.clone() : new THREE.Vector2(1, 1);
              updated = true;
              console.log('✅ Updated overlay normalMap from base material (late load)');
            }
          }
          if (updatedBaseMat.roughnessMap?.image) {
            const baseTex = updatedBaseMat.roughnessMap;
            const overlayTex = (overlayMat as any).roughnessMap;
            if (!overlayTex?.image || overlayTex !== baseTex) {
              const clonedTex = baseTex.clone();
              clonedTex.repeat.copy(baseTex.repeat);
              clonedTex.offset.copy(baseTex.offset);
              clonedTex.wrapS = baseTex.wrapS;
              clonedTex.wrapT = baseTex.wrapT;
              clonedTex.rotation = baseTex.rotation;
              clonedTex.center.copy(baseTex.center);
              (overlayMat as any).roughnessMap = clonedTex;
              (overlayMat as any).roughness = updatedBaseMat.roughness ?? 1.0;
              updated = true;
              console.log('✅ Updated overlay roughnessMap from base material (late load)');
            }
          }
          if (updatedBaseMat.metalnessMap?.image) {
            const baseTex = updatedBaseMat.metalnessMap;
            const overlayTex = (overlayMat as any).metalnessMap;
            if (!overlayTex?.image || overlayTex !== baseTex) {
              const clonedTex = baseTex.clone();
              clonedTex.repeat.copy(baseTex.repeat);
              clonedTex.offset.copy(baseTex.offset);
              clonedTex.wrapS = baseTex.wrapS;
              clonedTex.wrapT = baseTex.wrapT;
              clonedTex.rotation = baseTex.rotation;
              clonedTex.center.copy(baseTex.center);
              (overlayMat as any).metalnessMap = clonedTex;
              (overlayMat as any).metalness = updatedBaseMat.metalness ?? 0.3;
              updated = true;
              console.log('✅ Updated overlay metalnessMap from base material (late load)');
            }
          }
          if (updatedBaseMat.aoMap?.image) {
            const baseTex = updatedBaseMat.aoMap;
            const overlayTex = (overlayMat as any).aoMap;
            if (!overlayTex?.image || overlayTex !== baseTex) {
              const clonedTex = baseTex.clone();
              clonedTex.repeat.copy(baseTex.repeat);
              clonedTex.offset.copy(baseTex.offset);
              clonedTex.wrapS = baseTex.wrapS;
              clonedTex.wrapT = baseTex.wrapT;
              clonedTex.rotation = baseTex.rotation;
              clonedTex.center.copy(baseTex.center);
              (overlayMat as any).aoMap = clonedTex;
              (overlayMat as any).aoMapIntensity = updatedBaseMat.aoMapIntensity ?? 1.0;
              updated = true;
              console.log('✅ Updated overlay aoMap from base material (late load)');
            }
          }
          
          // Always update envMapIntensity from base material to match lighting and exposure
          if (typeof updatedBaseMat.envMapIntensity === 'number') {
            (overlayMat as any).envMapIntensity = updatedBaseMat.envMapIntensity;
            updated = true;
            console.log('✅ Updated overlay envMapIntensity from base material (late load):', updatedBaseMat.envMapIntensity);
          } else if (!(overlayMat as any).envMapIntensity) {
            // Set default if base doesn't have it and overlay doesn't have it either
            (overlayMat as any).envMapIntensity = 0.3;
            updated = true;
            console.log('✅ Set default envMapIntensity for overlay (late load): 0.3');
          }
          
          if (updated) {
            (overlayMat as any).needsUpdate = true;
            console.log(`✅ Overlay material updated with maps for ${matName}`);
          }
        }
      };
      
      // Try to update maps after delays (when they might be loaded)
      if (isStandardOverlay) {
        setTimeout(updateOverlayMaps, 500);
        setTimeout(updateOverlayMaps, 1000);
        setTimeout(updateOverlayMaps, 2000);
        setTimeout(updateOverlayMaps, 3000); // Extra delay for slow connections
      }
      
      let om: THREE.Mesh;
      if ((m as any).isSkinnedMesh) {
        const skinned = m as unknown as THREE.SkinnedMesh;
        om = new THREE.SkinnedMesh(overlayGeo, overlayMat);
        (om as THREE.SkinnedMesh).bind(skinned.skeleton);
        console.log('✅ Created SkinnedMesh overlay for', m.name || 'unnamed');
                } else {
        om = new THREE.Mesh(overlayGeo, overlayMat);
        console.log('✅ Created Mesh overlay for', m.name || 'unnamed');
      }
      // Copy transformations from base mesh
      om.position.copy(m.position); 
      om.quaternion.copy(m.quaternion); 
      om.scale.copy(m.scale);
      om.matrix.copy(m.matrixWorld); // Use WORLD matrix to include parent transforms
      om.matrixAutoUpdate = false; // Use manual matrix updates
      
      om.renderOrder = 9999; // Highest render order to render on top
      
      // Force visibility
      om.visible = true;
      om.frustumCulled = false; // Don't cull if outside view
      
      // Always add to scene root for visibility
      scene.add(om);
      // Link overlay to its base mesh for later control (e.g., hide on BACK)
      try { (om as any).overlayOf = (m as any).uuid; overlaysByBaseUuidRef.current.set((m as any).uuid, om); } catch {}
      
      // Log mesh position to debug positioning
      console.log('✅ Overlay mesh positioned at:', om.position, 'scale:', om.scale, 'matrix:', om.matrix.elements, 'visible:', om.visible); 
      overlayMeshes.push(om);
      console.log('✅ Overlay mesh added to scene root');
    });
    console.log('🎨 Total overlay meshes created:', overlayMeshes.length);
    
    // Draw RED background now that meshes are created
    redrawAllLogos();
    // console.log('✅ RED background drawn after meshes created');
    
    // Force texture update after meshes are created
    if (overlayTexRef.current) {
      overlayTexRef.current.needsUpdate = true;
      console.log('✅ Forced texture update after mesh creation');
    }
    
    // Log scene contents after adding overlays
    setTimeout(() => {
      const allMeshes: THREE.Mesh[] = [];
      scene.traverse((o: any) => {
        if (o.isMesh) allMeshes.push(o as THREE.Mesh);
      });
      console.log('🎨 Total meshes in scene after adding overlays:', allMeshes.length);
      console.log('🎨 Overlay meshes visible:', overlayMeshes.filter(om => om.visible && om.parent).length);
      
      // Check if UV2 attribute exists
      overlayMeshes.forEach((om, idx) => {
        const geo = om.geometry as THREE.BufferGeometry;
        const uv = geo.getAttribute('uv');
        console.log(`🎨 Overlay mesh ${idx} UV attribute:`, uv ? 'exists' : 'missing', 'count:', uv?.count);
      });
    }, 500);

    const raycaster = new THREE.Raycaster();
    // Use the global draggingLogoIdRef instead of local one
    const dragOffsetRef = { u: 0, v: 0 };
    const THROTTLE_MS = 16; // ~60fps for smooth drag
    let lastDrawTime = 0;

    function redrawAllLogos() {
      const ctx = ctxRef.current;
      const overlayTex = overlayTexRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !overlayTex || !canvas) {
        // console.warn('⚠️ redrawAllLogos: missing refs', { ctx: !!ctx, overlayTex: !!overlayTex, canvas: !!canvas });
      return;
    }

      const isDrawable = (img: HTMLImageElement | undefined | null): img is HTMLImageElement => !!(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);

      // Don't clear here - redrawAll handles that

      // console.log('🔄 redrawAllLogos called with', placedLogosRef.current.length, 'logos:', placedLogosRef.current.map(l => l.id));
          
      // Group logos by position to calculate visual offsets for overlapping logos
      const logosByPosition = new Map<string, Array<{id: string; index: number}>>();
      placedLogosRef.current.forEach((logo, index) => {
        const [u, v] = logo.position;
        const posKey = `${u.toFixed(6)},${v.toFixed(6)}`;
        if (!logosByPosition.has(posKey)) {
          logosByPosition.set(posKey, []);
        }
        logosByPosition.get(posKey)!.push({ id: logo.id, index });
      });
      
      let drawnCount = 0;
      placedLogosRef.current.forEach((logo, index) => {
        const img = logoImagesRef.current.get(logo.id);
        if (!isDrawable(img)) {
          const isComplete = img ? (img as any).complete === true : false;
          console.warn('⚠️ Skipping logo (image not loaded):', logo.id, { hasImg: !!img, isComplete });
      return;
    }
        const safeImg = img;

        console.log('🎨 Logo image details:', logo.id, {
          width: safeImg.width,
          height: safeImg.height,
          naturalWidth: safeImg.naturalWidth,
          naturalHeight: safeImg.naturalHeight,
          src: safeImg.src.substring(0, 100)
        });
        
        // Use actual logo dimensions from zone, with scaling factor for better fit
        // IMPORTANT: Preserve aspect ratio using the actual image dimensions
        const SCALE_FACTOR = 0.50; // Reduce size by 50%
        
        // Get the natural aspect ratio from the actual image
        const imageAspectRatio = safeImg.naturalWidth / safeImg.naturalHeight;
        
        // Calculate base dimensions (use saved width/height or image dimensions)
        const baseWidth = logo.width || safeImg.naturalWidth;
        const baseHeight = logo.height || safeImg.naturalHeight;
        
        // Calculate scaled dimensions preserving aspect ratio
        // Use width as reference and calculate height proportionally
        const scaledWidth = baseWidth * (logo.scale || 1) * SCALE_FACTOR;
        const scaledHeight = scaledWidth / imageAspectRatio; // Preserve aspect ratio
        
        // Use scaled dimensions
        const logoWidth = scaledWidth;
        const logoHeight = scaledHeight;
        
        const [u, v] = logo.position;
        
        // Calculate visual offset if multiple logos share the same position
        // The first logo (index 0) stays at original position, others are offset
        const posKey = `${u.toFixed(6)},${v.toFixed(6)}`;
        const logosAtSamePos = logosByPosition.get(posKey) || [];
        const logoIndexInGroup = logosAtSamePos.findIndex(l => l.id === logo.id);
        const hasOverlap = logosAtSamePos.length > 1;
        // Spread logos diagonally (small offset in both X and Y)
        // First logo (index 0) has no offset, others are offset around it
        const offsetAmount = 15; // pixels
        const visualOffsetX = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
        const visualOffsetY = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
        
        const x = u * canvas.width - logoWidth / 2 + visualOffsetX;
        const y = v * canvas.height - logoHeight / 2 + visualOffsetY; // NO inversion, like UVMapsDebug
        
        console.log('✅ Drawing logo:', logo.id, 'at position', logo.position, 'size:', logoWidth, 'x', logoHeight, 'aspect ratio:', imageAspectRatio.toFixed(2), 'canvas coords:', x, y);
        
        ctx.save();
        ctx.translate(x + logoWidth / 2, y + logoHeight / 2);
        ctx.rotate(logo.rotation);
        ctx.globalAlpha = 1.0;
        try {
          // Ensure per-draw reset of filter before drawing logo image
          (ctx as any).filter = 'none';
          ctx.drawImage(safeImg, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
        } catch (e) {
          console.warn('⚠️ drawImage failed for logo:', logo.id, e);
        }
        ctx.restore();
        
        console.log('✅ Drew logo:', logo.id);
        
        drawnCount++;
      });
      
      // Draw bounding box for selected logo
      if (selectedLogoIdRef.current) {
        const selectedLogo = placedLogosRef.current.find(l => l.id === selectedLogoIdRef.current);
        if (selectedLogo) {
            const img = logoImagesRef.current.get(selectedLogo.id);
            if (isDrawable(img)) {
              const safeImg = img;
              const SCALE_FACTOR = 0.50;
              
              // Preserve aspect ratio using the actual image dimensions
              const imageAspectRatio = safeImg.naturalWidth / safeImg.naturalHeight;
              const baseWidth = selectedLogo.width || safeImg.naturalWidth;
              const scaledWidth = baseWidth * (selectedLogo.scale || 1) * SCALE_FACTOR;
              const scaledHeight = scaledWidth / imageAspectRatio; // Preserve aspect ratio
              
              const logoWidth = scaledWidth;
              const logoHeight = scaledHeight;
            const [u, v] = selectedLogo.position;
            
            // Apply same visual offset as the logo rendering (for overlapping logos)
            // The first logo (index 0) stays at original position, others are offset
            const posKey = `${u.toFixed(6)},${v.toFixed(6)}`;
            const logosAtSamePos = logosByPosition.get(posKey) || [];
            const logoIndexInGroup = logosAtSamePos.findIndex(l => l.id === selectedLogo.id);
            const hasOverlap = logosAtSamePos.length > 1;
            const offsetAmount = 15;
            const visualOffsetX = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
            const visualOffsetY = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
            
            const x = u * canvas.width - logoWidth / 2 + visualOffsetX;
            const y = v * canvas.height - logoHeight / 2 + visualOffsetY;
            
            ctx.save();
            ctx.translate(x + logoWidth / 2, y + logoHeight / 2);
            ctx.rotate(selectedLogo.rotation);
            
            // Draw bounding box - black border with white dashes (alternating dashes)
            const bboxW = logoWidth + 8;
            const bboxH = logoHeight + 8;
            const halfW = bboxW / 2;
            const halfH = bboxH / 2;
            
            // Draw black dashes (with gaps)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.setLineDash([25, 25]); // 25px black dash, 25px gap
            ctx.strokeRect(-halfW, -halfH, bboxW, bboxH);
            
            // Draw white dashes on top (offset by 25px to fill the gaps)
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.lineDashOffset = 25; // Offset to fill gaps between black dashes
            ctx.setLineDash([25, 25]); // 25px white dash, 25px gap
            ctx.strokeRect(-halfW, -halfH, bboxW, bboxH);
            
            // Reset line dash
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
            
            // Check if logo is locked
            const isLocked = selectedLogo.locked || false;
            
            // Draw corner handles (white circles with icons on top)
            const handleSize = 16; // Increased from 12
            const iconSize = 32; // Increased from 28
            
            // Top-left corner - circle then lock icon (always visible)
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-halfW, -halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const lockIcon = iconImagesRef.current.get(isLocked ? 'lock' : 'delock');
            if (lockIcon && (lockIcon as any).complete) {
              try {
                ctx.save();
                (ctx as any).filter = 'none';
                ctx.drawImage(lockIcon as any, -halfW - iconSize/2, -halfH - iconSize/2, iconSize, iconSize);
                ctx.restore();
              } catch {}
            }
            
            // Only show other icons if not locked
            if (!isLocked) {
            // Top-right corner - circle then delete icon
            ctx.beginPath();
            ctx.arc(halfW, -halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            const deleteIcon = iconImagesRef.current.get('delete');
            if (deleteIcon && (deleteIcon as any).complete) {
              try {
                ctx.save();
                (ctx as any).filter = 'none';
                ctx.drawImage(deleteIcon as any, halfW - iconSize/2, -halfH - iconSize/2, iconSize, iconSize);
                ctx.restore();
              } catch {}
            }
            
            // Bottom-right corner - circle then size icon
            ctx.beginPath();
            ctx.arc(halfW, halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const sizeIcon = iconImagesRef.current.get('size');
            if (sizeIcon && (sizeIcon as any).complete) {
              try {
                ctx.save();
                (ctx as any).filter = 'none';
                ctx.drawImage(sizeIcon as any, halfW - iconSize/2, halfH - iconSize/2, iconSize, iconSize);
                ctx.restore();
              } catch {}
            }
            
            // Bottom-left corner - circle then rotation icon
            ctx.beginPath();
            ctx.arc(-halfW, halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const rotationIcon = iconImagesRef.current.get('rotation');
            if (rotationIcon && (rotationIcon as any).complete) {
              try {
                ctx.save();
                (ctx as any).filter = 'none';
                ctx.drawImage(rotationIcon as any, -halfW - iconSize/2, halfH - iconSize/2, iconSize, iconSize);
                ctx.restore();
              } catch {}
              }
            }
            
            ctx.restore();
            
            console.log('✅ Drew bounding box for selected logo:', selectedLogoIdRef.current, 'locked:', isLocked);
          }
        }
      }
      
      // console.log(`✅ redrawAllLogos complete: drew ${drawnCount} logos`);
      
      overlayTex.needsUpdate = true;
      (overlayTex as any).version++;
      
      // Force GPU upload by marking the texture source
      if ((overlayTex as any).source && (overlayTex as any).source.data) {
        (overlayTex as any).source.data.version = Date.now();
      }
    }
    
    function redrawAllTexts() {
      const ctx = ctxRef.current;
      const overlayTex = overlayTexRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !overlayTex || !canvas) {
        // console.warn('⚠️ redrawAllTexts: missing refs');
        return;
      }

      // console.log('📝 redrawAllTexts called with', textsRef.current.length, 'texts');

      // (no always-on lines)

      // Draw active snap guides (when snapping) - dashed black/white
      if (showGuidesRef.current && guideLinesRef.current.length > 0) {
        ctx.save();
        ctx.lineWidth = 2;
        const dash = 16;
        // Black dashes
        ctx.strokeStyle = '#000000';
        ctx.setLineDash([dash, dash]);
        ctx.lineDashOffset = 0;
        guideLinesRef.current.forEach((ln) => {
          ctx.beginPath(); ctx.moveTo(ln.x1, ln.y1); ctx.lineTo(ln.x2, ln.y2); ctx.stroke();
        });
        // White dashes offset
        ctx.strokeStyle = '#ffffff';
        ctx.lineDashOffset = dash;
        guideLinesRef.current.forEach((ln) => {
          ctx.beginPath(); ctx.moveTo(ln.x1, ln.y1); ctx.lineTo(ln.x2, ln.y2); ctx.stroke();
        });
        // Reset dash
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        ctx.restore();
      }
      
      let drawnCount = 0;
      let pendingFonts = false;
      
      textsRef.current.forEach(text => {
        // Get font info
        const font = fonts.find(f => f.id === text.fontFamily);
        const baseFontSize = text.fontSize || 700;
        
        // Apply scale factor like logos (0.5 to match zone sizes)
        const SCALE_FACTOR = 0.5;
        const fontSize = baseFontSize * SCALE_FACTOR;
        
        // Set font BEFORE measuring; if not ready, mark pending and skip drawing this text
        let measureFontFamily = 'Arial';
        let fontIsReady = false;
        if (fonts.length > 0) {
          if (text.fontFamily) {
            const fm = fonts.find(f => f.id === text.fontFamily);
            if (fm) {
            fontIsReady = document.fonts.check(`12px "${fm.display_name}"`);
              if (fontIsReady) measureFontFamily = fm.display_name;
            }
          } else {
            // No font set on text yet: prefer the first library font if ready
            const first = fonts[0];
            if (first) {
              const firstReady = document.fonts.check(`12px "${first.display_name}"`);
              if (firstReady) {
                fontIsReady = true;
                measureFontFamily = first.display_name;
              }
            }
          }
        }
        if (!fontIsReady) {
          // Proactively request load for this specific font, then redraw
          const target = text.fontFamily ? fonts.find(f => f.id === text.fontFamily) : (fonts && fonts[0]);
          if (target) {
            try { document.fonts.load(`12px "${target.display_name}"`); } catch {}
          }
          pendingFonts = true;
          // Use Arial as fallback if font is not ready - don't skip drawing
          measureFontFamily = 'Arial';
          fontIsReady = true; // Allow drawing with fallback
        }
        ctx.font = `${fontSize}px ${measureFontFamily}`;
        
        // Measure text with current font
        const textWidth = ctx.measureText(text.content || '').width;
        const textHeight = fontSize;
        
        // Render text with custom font
        const [u, v] = text.position || [0.5, 0.5, 0];
        const x = u * canvas.width;
        const y = v * canvas.height;
        
        // Ensure text is visible - use black if no color specified
        if (!text.color) {
          text.color = '#000000';
        }
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(text.rotation);
        
        // Set font again in saved context (using scaled size)
        // At this point, fontIsReady is true when we reach here for this text
        ctx.font = `${fontSize}px ${measureFontFamily}`;
        
        // Set text color and baseline
        const fillMode: 'solid' | 'gradient' = (text as any).fillType === 'gradient' ? 'gradient' : 'solid';
        const gradientSource: string[] | undefined = Array.isArray((text as any).gradientColors)
          ? (text as any).gradientColors
          : undefined;
        const gradientDirection: 'horizontal' | 'vertical' = (text as any).gradientDirection === 'vertical' ? 'vertical' : 'horizontal';
        let fillStyle: CanvasGradient | string = text.color || '#000000';
        const canCreateGradient = gradientDirection === 'vertical'
          ? fontSize > 0
          : textWidth > 0;
        if (fillMode === 'gradient' && gradientSource && gradientSource.length >= 2 && canCreateGradient) {
          try {
            const gradientStops = gradientSource.slice(0, 2);
            const gradient = gradientDirection === 'vertical'
              ? ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2)
              : ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
            const denominator = Math.max(1, gradientStops.length - 1);
            gradientStops.forEach((col, idx) => {
              const safeColor = col || text.color || '#000000';
              gradient.addColorStop(denominator === 0 ? 0 : idx / denominator, safeColor);
            });
            fillStyle = gradient;
          } catch {
            fillStyle = text.color || '#000000';
          }
        }
        ctx.fillStyle = fillStyle;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Prepare stroke width in px
        let strokePx = 0;
        if (text.strokeColor != null && text.strokeWidth != null) {
          if ((text as any).strokeWidthUnit === 'px') {
            strokePx = Math.min(150, Math.max(0, Number(text.strokeWidth) || 0));
          } else {
            let lw = Number(text.strokeWidth) || 0;
            if (lw <= 1) lw = lw * 150;
            else if (lw <= 2) lw = (lw / 2) * 150;
            else if (lw <= 100) lw = (lw / 100) * 150;
            strokePx = Math.min(150, Math.max(0, lw));
          }
        }

        // Deformation
        const deformation = (text as any).deformation || 'none';
        const deformationIntensity = Math.max(-100, Math.min(100, (text as any).deformationIntensity ?? 0));
        const content = text.content || '';

        // Helper pour dessiner un caractère (stroke ou fill séparément)
        const drawCharStroke = (ch: string, dx: number, dy: number, angle: number, scale: number = 1, opacity: number = 1) => {
          if (strokePx <= 0 || !text.strokeColor) return;
          ctx.save();
          ctx.translate(dx, dy);
          if (!isNaN(angle) && angle !== 0) ctx.rotate(angle);
          if (scale !== 1) {
            ctx.scale(scale, scale);
          }
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = text.strokeColor;
          ctx.lineWidth = strokePx;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeText(ch, 0, 0);
          ctx.restore();
        };

        const drawCharFill = (ch: string, dx: number, dy: number, angle: number, scale: number = 1, opacity: number = 1) => {
          ctx.save();
          ctx.translate(dx, dy);
          if (!isNaN(angle) && angle !== 0) ctx.rotate(angle);
          if (scale !== 1) {
            ctx.scale(scale, scale);
          }
          ctx.globalAlpha = opacity;
          ctx.fillStyle = fillStyle;
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        };

        if (deformation === 'none' || content.length <= 1) {
          // Simple draw for full string - stroke d'abord, puis fill
          if (strokePx > 0 && text.strokeColor) {
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = strokePx;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeText(content, 0, 0);
          }
          ctx.fillStyle = fillStyle;
          ctx.globalAlpha = 1.0; // Ensure full opacity
          ctx.fillText(content, 0, 0);
        } else {
          // Per-character layout avec déformation - calculer positions d'abord
          const totalWidth = ctx.measureText(content).width;
          let cursor = -totalWidth / 2;
          const amp = (deformationIntensity / 100) * (fontSize * 1.2);
          const waveLen = Math.max(1, (Math.abs(deformationIntensity) / 100) * 8);
          
          // Étape 1: Calculer toutes les positions des caractères
          const charPositions: Array<{ch: string, x: number, y: number, angle: number, scale?: number, opacity?: number}> = [];
          const centerX = 0; // Centre du texte (cursor commence à -totalWidth/2)
          const centerIndex = content.length / 2;
          
          for (let i = 0; i < content.length; i++) {
            const ch = content[i];
            const w = ctx.measureText(ch).width;
            const midX = cursor + w / 2;
            let dy = 0;
            let ang = 0;
            let scale = 1;
            let opacity = 1;
            
            // Distance normalisée depuis le centre (-1 à 1)
            const distFromCenter = (i - centerIndex) / Math.max(1, centerIndex);
            const normalizedX = (midX - centerX) / (totalWidth / 2); // -1 à 1
            const progress = i / Math.max(1, content.length - 1); // 0 à 1
            
            if (deformation === 'flag') {
              dy = Math.sin(midX / (fontSize / 2)) * amp;
            } else if (deformation === 'wave') {
              dy = Math.sin((i / waveLen) * Math.PI * 2) * amp;
            } else if (deformation === 'arc') {
              // Allow negative arc using intensity < 50% (downwards), >=50% upwards
              const norm = deformationIntensity / 100; // -1..1
              if (Math.abs(norm) > 0.02) {
                const sign = Math.sign(norm);
                const radius = (fontSize * 2) / Math.max(0.1, Math.abs(norm));
                ang = (midX / radius) * sign;
                dy = sign * (radius * (1 - Math.cos(midX / radius)));
                // recentre vertically so middle characters stay near baseline
                const dyCenter = sign * (radius * (1 - Math.cos((totalWidth / 2) / radius)));
                dy -= dyCenter;
              }
            } else if (deformation === 'bulge') {
              // Bombement au centre (effet de surface gonflée)
              const bulgeFactor = 1 - Math.abs(normalizedX); // Plus fort au centre
              dy = Math.sin(normalizedX * Math.PI) * amp * bulgeFactor;
              scale = 1 + (bulgeFactor * amp / fontSize) * 0.3;
            } else if (deformation === 'pinch') {
              // Pincé au centre (inverse de bulge)
              const pinchFactor = Math.abs(normalizedX); // Plus fort aux extrémités
              dy = -Math.sin(normalizedX * Math.PI) * amp * (1 - pinchFactor);
              scale = 1 - (Math.abs(normalizedX) * amp / fontSize) * 0.2;
            } else if (deformation === 'fisheye') {
              // Effet fisheye (bombement circulaire)
              const radius = Math.abs(normalizedX) * totalWidth / 2;
              const maxRadius = totalWidth / 2;
              const fisheyeFactor = 1 - (radius / maxRadius); // Plus fort au centre
              dy = Math.sin(normalizedX * Math.PI * 2) * amp * fisheyeFactor;
              scale = 1 + (fisheyeFactor * amp / fontSize) * 0.4;
            } else if (deformation === 'squeeze') {
              // Compression/expansion horizontale selon le signe
              const squeezeFactor = Math.abs(normalizedX);
              const t = Math.abs(deformationIntensity) / 100;
              if (deformationIntensity >= 0) {
                scale = 1 - (squeezeFactor * t) * 0.7;
              } else {
                scale = 1 + (squeezeFactor * t) * 0.5;
              }
            } else if (deformation === 'skew') {
              // Inclinaison oblique
              const skewAmount = normalizedX * (deformationIntensity / 100) * 0.8;
              dy = skewAmount * fontSize * 0.3;
              ang = skewAmount * 0.3;
            } else if (deformation === 'spiral') {
              // Rotation progressive en spirale
              const spiralAngle = (i / content.length) * Math.PI * 6 * (deformationIntensity / 100);
              ang = spiralAngle;
              const spiralRadius = amp * (i / content.length);
              dy = Math.sin(spiralAngle) * spiralRadius;
            } else if (deformation === 'rotate') {
              // Rotation progressive selon la position
              ang = normalizedX * Math.PI * (deformationIntensity / 100) * 1.0;
            } else if (deformation === 'tilt') {
              // Pente simple (rotation légère)
              ang = normalizedX * (deformationIntensity / 100) * 0.7;
              dy = normalizedX * amp * 0.7;
            } else if (deformation === 'perspective') {
              // Effet de perspective 3D (plus petit au loin)
              let perspectiveFactor = (normalizedX + 1) / 2; // 0 à 1
              if (deformationIntensity < 0) perspectiveFactor = 1 - perspectiveFactor;
              scale = 0.4 + perspectiveFactor * 0.8;
              dy = (1 - perspectiveFactor) * amp * 0.6;
            } else if (deformation === 'fade') {
              // Atténuation progressive (taille et opacité)
              const fadeBase = Math.abs(normalizedX);
              const fadeFactor = deformationIntensity >= 0 ? fadeBase : 1 - fadeBase;
              scale = 1 - fadeFactor * 0.6;
              opacity = 1 - fadeFactor * 0.9;
            } else if (deformation === 'ribbon') {
              // Ruban qui suit une courbe
              const ribbonCurve = Math.sin(normalizedX * Math.PI) * amp;
              dy = ribbonCurve;
              ang = Math.cos(normalizedX * Math.PI) * (deformationIntensity / 100) * 0.6;
            } else if (deformation === 'incline') {
              // Inclinaison simple (montant/descendant)
              const inclineDirection = deformationIntensity / 100; // -1 à 1
              dy = normalizedX * amp * inclineDirection;
              ang = inclineDirection * 0.2;
            } else if (deformation === 'staircase') {
              // Effet escalier (décalage vertical progressif)
              const stepHeight = (amp / Math.max(1, content.length)) * 1.2;
              dy = i * stepHeight - (content.length * stepHeight / 2);
            } else if (deformation === 'wave-arc') {
              // Combinaison onde + arc
              const wavePart = Math.sin((i / waveLen) * Math.PI * 2) * amp * 0.5;
              const norm = deformationIntensity / 100;
              let arcPart = 0;
              if (Math.abs(norm) > 0.02) {
                const sign = Math.sign(norm);
                const radius = (fontSize * 2) / Math.max(0.1, Math.abs(norm));
                arcPart = sign * (radius * (1 - Math.cos(midX / radius))) * 0.5;
                const dyCenter = sign * (radius * (1 - Math.cos((totalWidth / 2) / radius)));
                arcPart -= dyCenter * 0.5;
              }
              dy = wavePart + arcPart;
            } else if (deformation === 'pulse') {
              // Pulsation (expansion/contraction)
              const pulsePhase = Math.sin(progress * Math.PI * 2) * (deformationIntensity / 100);
              scale = 1 + pulsePhase * 0.5;
              dy = pulsePhase * amp * 0.3;
            }
            
            charPositions.push({ ch, x: midX, y: dy, angle: ang, scale, opacity });
            cursor += w;
          }

          // Étape 2: Dessiner TOUS les strokes (contours) en premier
          if (strokePx > 0 && text.strokeColor) {
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = strokePx;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            for (const pos of charPositions) {
              drawCharStroke(pos.ch, pos.x, pos.y, pos.angle, pos.scale || 1, pos.opacity || 1);
            }
          }

          // Étape 3: Dessiner TOUS les fills (texte) par-dessus
          for (const pos of charPositions) {
            drawCharFill(pos.ch, pos.x, pos.y, pos.angle, pos.scale || 1, pos.opacity || 1);
          }
        }
        
        ctx.restore();
        drawnCount++;
      });
      
      // If some fonts were pending, retry shortly to render with proper fonts
      if (pendingFonts) {
        // Proactively request load for first library font to speed up readiness
        const first = fonts && fonts[0];
        if (first) {
          try { document.fonts.load(`12px "${first.display_name}"`); } catch {}
        }
        setTimeout(() => {
          if (redrawAllRef.current) redrawAllRef.current();
        }, 200);
      }

      // Draw bounding box for selected text
      if (selectedTextIdRef.current) {
        const selectedText = textsRef.current.find(t => t.id === selectedTextIdRef.current);
        if (selectedText) {
          // Get font info
          const font = fonts.find(f => f.id === selectedText.fontFamily);
          const baseFontSize = selectedText.fontSize || 700;
          
          // Apply scale factor like text rendering
          const SCALE_FACTOR = 0.5;
          const fontSize = baseFontSize * SCALE_FACTOR;
          
          // Set font and measure BEFORE drawing
          let bboxFontFamily = 'Arial';
          const bboxFont = selectedText.fontFamily ? fonts.find(f => f.id === selectedText.fontFamily) : null;
          if (bboxFont) {
            const fontReady = document.fonts.check(`12px "${bboxFont.display_name}"`);
            if (fontReady) {
              bboxFontFamily = bboxFont.display_name;
            }
          }
          ctx.font = `${fontSize}px ${bboxFontFamily}`;
          const textWidth = ctx.measureText(selectedText.content).width;
          const textHeight = fontSize;
          
          ctx.save();
          
          const [u, v] = selectedText.position;
          const x = u * canvas.width;
          const y = v * canvas.height;
          
          ctx.translate(x, y);
          ctx.rotate(selectedText.rotation);
          
          // Draw bounding box
          const bboxW = textWidth + 8;
          const bboxH = textHeight + 8;
          const halfW = bboxW / 2;
          const halfH = bboxH / 2;
          
          // Draw black dashes
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3;
          ctx.setLineDash([25, 25]);
          ctx.strokeRect(-halfW, -halfH, bboxW, bboxH);
          
          // Draw white dashes
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.lineDashOffset = 25;
          ctx.setLineDash([25, 25]);
          ctx.strokeRect(-halfW, -halfH, bboxW, bboxH);
          
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
          
          // Check if text is locked
          const isLocked = selectedText.locked || false;
          
          // Draw corner handles
          const handleSize = 16;
          const iconSize = 32;
          
          // Top-left - lock icon
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-halfW, -halfH, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          const lockIcon = iconImagesRef.current.get(isLocked ? 'lock' : 'delock');
          if (lockIcon && lockIcon.complete) {
            ctx.drawImage(lockIcon, -halfW - iconSize/2, -halfH - iconSize/2, iconSize, iconSize);
          }
          
          // Only show other icons if not locked
          if (!isLocked) {
            // Top-right - delete icon
            ctx.beginPath();
            ctx.arc(halfW, -halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const deleteIcon = iconImagesRef.current.get('delete');
            if (deleteIcon && deleteIcon.complete) {
              ctx.drawImage(deleteIcon, halfW - iconSize/2, -halfH - iconSize/2, iconSize, iconSize);
            }
            
            // Bottom-right - size icon
            ctx.beginPath();
            ctx.arc(halfW, halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const sizeIcon = iconImagesRef.current.get('size');
            if (sizeIcon && sizeIcon.complete) {
              ctx.drawImage(sizeIcon, halfW - iconSize/2, halfH - iconSize/2, iconSize, iconSize);
            }
            
            // Bottom-left - rotation icon
            ctx.beginPath();
            ctx.arc(-halfW, halfH, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const rotationIcon = iconImagesRef.current.get('rotation');
            if (rotationIcon && rotationIcon.complete) {
              ctx.drawImage(rotationIcon, -halfW - iconSize/2, halfH - iconSize/2, iconSize, iconSize);
            }
          }
          
          ctx.restore();
        }
      }
      
      // console.log(`✅ redrawAllTexts complete: drew ${drawnCount} texts`);
      
      // Force texture update
      overlayTex.needsUpdate = true;
      (overlayTex as any).version = Date.now();
      
      // Force source update
      if ((overlayTex as any).source && (overlayTex as any).source.data) {
        (overlayTex as any).source.data = canvas;
        (overlayTex as any).source.data.version = Date.now();
      }
      
      // Also update the texture image directly
      if ((overlayTex as any).image) {
        (overlayTex as any).image = canvas;
      }
    }
    
    // Combined redraw function (clears and redraws everything)
    const redrawAll = () => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      const overlayTex = overlayTexRef.current;
      if (!ctx || !canvas || !overlayTex) return;
      
      // CRITICAL: First reset ALL transformations to identity
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Reset all context properties
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      (ctx as any).filter = 'none';
      
      // CRITICAL: Reset line dash (this was causing traces!)
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      
      // Now clear the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Keep transparent background (avoid forcing white which can affect blending)
      
      // Draw logos then texts
      redrawAllLogos();
      redrawAllTexts();
      
      // Force immediate texture update and ensure WebGL knows about it
      overlayTex.needsUpdate = true;
      (overlayTex as any).version = Date.now();
      
      // Also update the texture source to force reupload
      if ((overlayTex as any).source) {
        (overlayTex as any).source.data = canvas;
        if ((overlayTex as any).source.data) {
          (overlayTex as any).source.data.version = Date.now();
        }
      }
      
      // Also update the texture image directly
      if ((overlayTex as any).image) {
        (overlayTex as any).image = canvas;
      }
    };
    
    // Store all functions in refs
    redrawAllLogosRef.current = redrawAllLogos;
    redrawAllTextsRef.current = redrawAllTexts;
    redrawAllRef.current = redrawAll;
    
    // Initial draw after a short delay
      setTimeout(() => {
      redrawAll();
    }, 100);

    function getInterUV(clientX: number, clientY: number): { u: number; v: number } | null {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera as any);
      const hits = raycaster.intersectObjects(overlayMeshes, true);
      if (!hits.length) return null;
      const h = hits[0];
      if (!h.uv) return null;
      return { u: h.uv.x, v: h.uv.y }; // NO inversion, like drawing
    }

    function findLogoAtPosition(u: number, v: number) {
      // Group logos by position to calculate visual offsets (same logic as rendering)
      const logosByPosition = new Map<string, Array<{id: string; index: number}>>();
      placedLogosRef.current.forEach((logo, index) => {
        const [lu, lv] = logo.position;
        const posKey = `${lu.toFixed(6)},${lv.toFixed(6)}`;
        if (!logosByPosition.has(posKey)) {
          logosByPosition.set(posKey, []);
        }
        logosByPosition.get(posKey)!.push({ id: logo.id, index });
      });
      
      const matchingLogos: Array<{logo: typeof placedLogosRef.current[0]; visualOffset: [number, number]}> = [];
      
      for (const logo of placedLogosRef.current) {
        const [logoU, logoV] = logo.position;
        // Calculate logo size in UV space using actual dimensions
        const img = logoImagesRef.current.get(logo.id);
        if (!img) continue;
        
        const SCALE_FACTOR = 0.50; // Same as drawing
        const logoWidth = logo.width ? logo.width * (logo.scale || 1) * SCALE_FACTOR : img.width * (logo.scale || 1) * SCALE_FACTOR;
        const logoHeight = logo.height ? logo.height * (logo.scale || 1) * SCALE_FACTOR : img.height * (logo.scale || 1) * SCALE_FACTOR;
        
        // Calculate visual offset (same as rendering)
        // The first logo (index 0) stays at original position, others are offset
        const posKey = `${logoU.toFixed(6)},${logoV.toFixed(6)}`;
        const logosAtSamePos = logosByPosition.get(posKey) || [];
        const logoIndexInGroup = logosAtSamePos.findIndex(l => l.id === logo.id);
        const hasOverlap = logosAtSamePos.length > 1;
        const offsetAmount = 15;
        const visualOffsetX = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
        const visualOffsetY = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
        const visualOffsetUV: [number, number] = [
          visualOffsetX / 2048, // Convert pixel offset to UV space
          visualOffsetY / 2048
        ];
        
        // Check click against visually offset position
        const visualU = logoU + visualOffsetUV[0];
        const visualV = logoV + visualOffsetUV[1];
        
        // Convert to UV space (rectangle, not square)
        const halfWidth = (logoWidth / 2048) / 2;
        const halfHeight = (logoHeight / 2048) / 2;
        
        if (u >= visualU - halfWidth && u <= visualU + halfWidth && v >= visualV - halfHeight && v <= visualV + halfHeight) {
          matchingLogos.push({ logo, visualOffset: visualOffsetUV });
        }
      }
      
      if (matchingLogos.length === 0) return null;
      
      // If multiple logos at same position, return the one that's not currently selected
      // or if none selected, return the most recently added (last in array)
      const currentlySelected = selectedLogoIdRef.current;
      const notSelected = matchingLogos.filter(({logo}) => logo.id !== currentlySelected);
      
      if (notSelected.length > 0) {
        // Return the first non-selected logo (or most recent if all are selected)
        return notSelected[0].logo;
      }
      
      // All are selected (shouldn't happen) or only one, return the most recent
      return matchingLogos[matchingLogos.length - 1].logo;
    }

    function findIconClick(u: number, v: number, selectedLogo: { id: string; position: [number, number, number], scale: number, rotation: number, width?: number, height?: number }) {
      const img = logoImagesRef.current.get(selectedLogo.id);
      if (!img || !img.complete) return null;
      
      const SCALE_FACTOR = 0.50;
      const logoWidth = selectedLogo.width ? selectedLogo.width * (selectedLogo.scale || 1) * SCALE_FACTOR : img.width * (selectedLogo.scale || 1) * SCALE_FACTOR;
      const logoHeight = selectedLogo.height ? selectedLogo.height * (selectedLogo.scale || 1) * SCALE_FACTOR : img.height * (selectedLogo.scale || 1) * SCALE_FACTOR;
      
      const [logoU, logoV] = selectedLogo.position;
      
      // Calculate visual offset for this logo (same as rendering)
      // The first logo (index 0) stays at original position, others are offset
      const logosByPosition = new Map<string, Array<{id: string; index: number}>>();
      placedLogosRef.current.forEach((logo, index) => {
        const [lu, lv] = logo.position;
        const posKey = `${lu.toFixed(6)},${lv.toFixed(6)}`;
        if (!logosByPosition.has(posKey)) {
          logosByPosition.set(posKey, []);
        }
        logosByPosition.get(posKey)!.push({ id: logo.id, index });
      });
      const posKey = `${logoU.toFixed(6)},${logoV.toFixed(6)}`;
      const logosAtSamePos = logosByPosition.get(posKey) || [];
      const logoIndexInGroup = logosAtSamePos.findIndex(l => l.id === selectedLogo.id);
      const hasOverlap = logosAtSamePos.length > 1;
      const offsetAmount = 15;
      const visualOffsetX = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
      const visualOffsetY = hasOverlap && logoIndexInGroup > 0 ? (logoIndexInGroup - 0.5) * offsetAmount : 0;
      
      // Convert UV position to pixel position (accounting for visual offset)
      const x = u * 2048;
      const y = v * 2048;
      const centerX = logoU * 2048 + visualOffsetX;
      const centerY = logoV * 2048 + visualOffsetY;
      
      // Calculate logo bounds in pixels (before rotation transform)
      const halfW = logoWidth / 2;
      const halfH = logoHeight / 2;
      
      // Transform click to logo-local space accounting for rotation
      const dx = x - centerX;
      const dy = y - centerY;
      const cosR = Math.cos(selectedLogo.rotation);
      const sinR = Math.sin(selectedLogo.rotation);
      const localX = dx * cosR + dy * sinR;
      const localY = -dx * sinR + dy * cosR;
      
      const touchRadius = 20; // Touch area (reduced for better accuracy)
      
      // Top-left corner (lock icon)
      const lockIconCenterX = -halfW;
      const lockIconCenterY = -halfH;
      const lockIconDist = Math.sqrt((localX - lockIconCenterX) ** 2 + (localY - lockIconCenterY) ** 2);
      
      if (lockIconDist <= touchRadius) {
        console.log('✅ Clicked on lock icon');
        return 'lock';
      }
      
      // Top-right corner (delete icon)
      const deleteIconCenterX = halfW;
      const deleteIconCenterY = -halfH;
      const deleteIconDist = Math.sqrt((localX - deleteIconCenterX) ** 2 + (localY - deleteIconCenterY) ** 2);
      
      if (deleteIconDist <= touchRadius) {
        console.log('✅ Clicked on delete icon');
        return 'delete';
      }
      
      // Bottom-right corner (size/resize icon)
      const sizeIconCenterX = halfW;
      const sizeIconCenterY = halfH;
      const sizeIconDist = Math.sqrt((localX - sizeIconCenterX) ** 2 + (localY - sizeIconCenterY) ** 2);
      
      if (sizeIconDist <= touchRadius) {
        console.log('✅ Clicked on size icon');
        return 'size';
      }
      
      // Bottom-left corner (rotation icon)
      const rotationIconCenterX = -halfW;
      const rotationIconCenterY = halfH;
      const rotationIconDist = Math.sqrt((localX - rotationIconCenterX) ** 2 + (localY - rotationIconCenterY) ** 2);
      
      if (rotationIconDist <= touchRadius) {
        console.log('✅ Clicked on rotation icon');
        return 'rotation';
      }
      
      return null;
    }

    function findTextAtPosition(u: number, v: number) {
      const isPointInsideText = (text: typeof textsRef.current[0]) => {
        const [textU, textV] = text.position;

        const baseFontSize = text.fontSize || 700;
        const SCALE_FACTOR = 0.5;
        const fontSize = baseFontSize * SCALE_FACTOR;
        const estimatedWidth = (text.content.length * fontSize * 0.6) / 2048;
        const estimatedHeight = fontSize / 2048;

        const halfWidth = estimatedWidth / 2;
        const halfHeight = estimatedHeight / 2;

        const dx = u - textU;
        const dy = v - textV;
        const rotation = text.rotation || 0;
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const localX = dx * cosR + dy * sinR;
        const localY = -dx * sinR + dy * cosR;

        return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
      };

      if (selectedTextIdRef.current) {
        const selectedText = textsRef.current.find(t => t.id === selectedTextIdRef.current);
        if (selectedText && isPointInsideText(selectedText)) {
          return selectedText;
        }
      }

      for (let i = textsRef.current.length - 1; i >= 0; i--) {
        const text = textsRef.current[i];
        if (!text || text.id === selectedTextIdRef.current) continue;
        if (isPointInsideText(text)) {
          return text;
        }
      }

      return null;
    }

    function findTextIconClick(u: number, v: number, selectedText: typeof textsRef.current[0]) {
      // Get font info for measurements - MUST match bounding box drawing exactly
      const baseFontSize = selectedText.fontSize || 700;
      
      // Apply scale factor like text rendering - MUST match exactly
      const SCALE_FACTOR = 0.5;
      const fontSize = baseFontSize * SCALE_FACTOR;
      
      // Measure text dimensions - MUST use same method as bounding box drawing
      let textWidth, textHeight;
      const ctx = ctxRef.current;
      if (ctx) {
        // Use the same font detection logic as bounding box drawing
        let measureFontFamily = 'Arial';
        const measureFont = selectedText.fontFamily ? fonts.find(f => f.id === selectedText.fontFamily) : null;
        if (measureFont) {
          const fontReady = document.fonts.check(`12px "${measureFont.display_name}"`);
          if (fontReady) {
            measureFontFamily = measureFont.display_name;
          }
        }
        ctx.font = `${fontSize}px ${measureFontFamily}`;
        textWidth = ctx.measureText(selectedText.content).width;
        textHeight = fontSize;
      } else {
        // Fallback estimation (shouldn't happen normally)
        textWidth = selectedText.content.length * fontSize * 0.6;
        textHeight = fontSize;
      }
      
      // Add padding to match bounding box (bboxW = textWidth + 8, bboxH = textHeight + 8)
      const bboxW = textWidth + 8;
      const bboxH = textHeight + 8;
      const halfW = bboxW / 2;
      const halfH = bboxH / 2;
      
      const [textU, textV] = selectedText.position;
      const x = u * 2048;
      const y = v * 2048;
      const centerX = textU * 2048;
      const centerY = textV * 2048;
      
      // Transform click to text-local space accounting for rotation
      const dx = x - centerX;
      const dy = y - centerY;
      const cosR = Math.cos(selectedText.rotation);
      const sinR = Math.sin(selectedText.rotation);
      const localX = dx * cosR + dy * sinR;
      const localY = -dx * sinR + dy * cosR;
      
      const touchRadius = 20; // Touch area (same as logos for consistency)
      
      // Top-left corner (lock icon)
      const lockIconCenterX = -halfW;
      const lockIconCenterY = -halfH;
      const lockIconDist = Math.sqrt((localX - lockIconCenterX) ** 2 + (localY - lockIconCenterY) ** 2);
      
      if (lockIconDist <= touchRadius) {
        console.log('✅ Clicked on text lock icon');
        return 'lock';
      }
      
      // Only check other icons if not locked
      if (!selectedText.locked) {
        // Top-right corner (delete icon)
        const deleteIconCenterX = halfW;
        const deleteIconCenterY = -halfH;
        const deleteIconDist = Math.sqrt((localX - deleteIconCenterX) ** 2 + (localY - deleteIconCenterY) ** 2);
        
        console.log('🔍 Text delete icon check:', {
          localX, localY,
          deleteIconCenterX, deleteIconCenterY,
          deleteIconDist, touchRadius,
          halfW, halfH,
          textWidth, textHeight
        });
        
        if (deleteIconDist <= touchRadius) {
          console.log('✅ Clicked on text delete icon, distance:', deleteIconDist, 'touchRadius:', touchRadius);
          return 'delete';
        }
        
        // Bottom-right corner (size icon)
        const sizeIconCenterX = halfW;
        const sizeIconCenterY = halfH;
        const sizeIconDist = Math.sqrt((localX - sizeIconCenterX) ** 2 + (localY - sizeIconCenterY) ** 2);
        
        if (sizeIconDist <= touchRadius) {
          console.log('✅ Clicked on text size icon');
          return 'size';
        }
        
        // Bottom-left corner (rotation icon)
        const rotationIconCenterX = -halfW;
        const rotationIconCenterY = halfH;
        const rotationIconDist = Math.sqrt((localX - rotationIconCenterX) ** 2 + (localY - rotationIconCenterY) ** 2);
        
        if (rotationIconDist <= touchRadius) {
          console.log('✅ Clicked on text rotation icon');
          return 'rotation';
        }
      }
      
      return null;
    }

    function onPointerDown(e: PointerEvent) {
      console.log('🔽 onPointerDown START - selectedLogoIdRef:', selectedLogoIdRef.current, 'selectedTextIdRef:', selectedTextIdRef.current, 'isDragging:', isDraggingRef.current, 'draggingLogoId:', draggingLogoIdRef.current, 'draggingTextId:', draggingTextIdRef.current, 'TIME:', Date.now());
      
      // If already dragging or rotating (logos OR texts), ignore any new pointerdown events completely
      if (isDraggingRef.current || draggingLogoIdRef.current || isResizingLogoIdRef.current || isRotatingLogoIdRef.current || 
          draggingTextIdRef.current || isResizingTextIdRef.current || isRotatingTextIdRef.current) {
        console.log('⏭️ Already interacting, ignoring pointerdown');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      console.log('✅ Not dragging, continuing with onPointerDown...');
      
      const uv = getInterUV(e.clientX, e.clientY);
      
      // Check if we're in text placement mode - doit être vérifié AVANT la vérification de uv
      // Utiliser une ref pour s'assurer que la valeur est à jour dans la closure
      const currentIsPlacingText = isPlacingTextRef.current;
      console.log('🔍 Checking text placement mode - isPlacingText:', currentIsPlacingText, 'type:', typeof currentIsPlacingText, 'from ref:', isPlacingTextRef.current);
      if (currentIsPlacingText) {
        console.log('📍 Text placement mode active, isPlacingText:', currentIsPlacingText, 'uv:', uv);
        e.preventDefault();
        e.stopPropagation();
        
        // Si pas de UV, essayer quand même de placer le texte au centre
        if (!uv) {
          console.log('⚠️ No UV found in text placement mode, placing text at center');
          if (onTextPlaced) {
            const position: [number, number, number] = [0.5, 0.5, 0];
            onTextPlaced(currentIsPlacingText, position);
          }
          return;
        }
        
        // Find the closest text zone to the clicked position
        if (textZones && textZones.length > 0) {
          // Convert UV to approximate 3D position (centered around origin)
          // UV coordinates (0-1) map roughly to a unit sphere
          const uvPosition: [number, number, number] = [
            (uv.u - 0.5) * 2,  // Map 0-1 to -1 to 1
            (1 - uv.v - 0.5) * 2, // Map 0-1 to 1 to -1 and center
            0 // Assume front face for now
          ];
          
          // Calculate distance to each zone and find the closest
          let closestZone = textZones[0];
          let minDistance = Infinity;
          
          textZones.forEach(zone => {
            const distance = Math.sqrt(
              Math.pow(zone.position[0] - uvPosition[0], 2) +
              Math.pow(zone.position[1] - uvPosition[1], 2) +
              Math.pow(zone.position[2] - uvPosition[2], 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestZone = zone;
            }
          });
          
          console.log('📍 Placing text in closest zone:', closestZone.name, 'distance:', minDistance);
          
          if (onTextPlaced) {
            // Use the zone's predefined position
            const position: [number, number, number] = closestZone.position;
            onTextPlaced(currentIsPlacingText, position, closestZone.zoneCategory);
          }
        } else {
          // No text zones available - place text directly at UV coordinates
          console.log('📍 No text zones available, placing text directly at UV:', uv.u, uv.v);
          if (onTextPlaced) {
            // Use UV coordinates directly (0-1 range)
            const position: [number, number, number] = [uv.u, uv.v, 0];
            onTextPlaced(currentIsPlacingText, position);
          }
        }
        return;
      }
      
      if (!uv) {
        // Click outside overlay meshes - let the event propagate to OrbitControls
        console.log('⚠️ No UV (click outside 3D model or overlay), letting event propagate to OrbitControls');
        return; // Return without capturing, let OrbitControls handle it
      }
      
      // === TEXT HANDLING (check text icons FIRST - ABSOLUTE PRIORITY) ===
      if (selectedTextIdRef.current) {
        const selectedText = textsRef.current.find(t => t.id === selectedTextIdRef.current);
        console.log('🔍 Checking for icon click on selected text:', selectedText?.id, 'uv:', uv);
        if (selectedText) {
          const textIconClick = findTextIconClick(uv.u, uv.v, selectedText);
          console.log('🔍 findTextIconClick result:', textIconClick, 'uv:', uv);
          if (textIconClick === 'delete') {
            // Check if text is locked
            if (selectedText.locked) {
              console.log('🔒 Text is locked, cannot delete');
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTextTimeoutRef.current) {
              console.log('🚫 Canceling pending deselection timeout');
              clearTimeout(deselectTextTimeoutRef.current);
              deselectTextTimeoutRef.current = null;
            }
            
            console.log('🗑️ DELETE icon clicked for text');
            const textIdToRemove = selectedTextIdRef.current;
            if (removeText) {
              removeText(textIdToRemove);
            }
            
            // Désélectionner le texte après suppression
            if (selectText) {
              selectText(null);
            }
            selectedTextIdRef.current = null;
            
            // Redraw to remove the bounding box
            setTimeout(() => {
              if (redrawAllRef.current) {
                redrawAllRef.current();
              }
            }, 10);
            return; // IMPORTANT: return early to prevent other handlers
          }
          if (textIconClick === 'size' && !selectedText.locked) {
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTextTimeoutRef.current) {
              clearTimeout(deselectTextTimeoutRef.current);
              deselectTextTimeoutRef.current = null;
            }
            
            isResizingTextIdRef.current = selectedText.id;
            initialTextScaleRef.current = (selectedText.fontSize || 120) / 120;
            const [textU, textV] = selectedText.position;
            const centerX = textU * 2048;
            const centerY = textV * 2048;
            const x = uv.u * 2048;
            const y = uv.v * 2048;
            initialTextResizeDistanceRef.current = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            return;
          }
          if (textIconClick === 'rotation' && !selectedText.locked) {
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTextTimeoutRef.current) {
              clearTimeout(deselectTextTimeoutRef.current);
              deselectTextTimeoutRef.current = null;
            }
            
            isRotatingTextIdRef.current = selectedText.id;
            const [textU, textV] = selectedText.position;
            const dx = uv.u * 2048 - textU * 2048;
            const dy = uv.v * 2048 - textV * 2048;
            initialTextRotationAngleRef.current = (selectedText.rotation || 0) - Math.atan2(dy, dx);
            return;
          }
          if (textIconClick === 'lock' && toggleTextLock) {
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTextTimeoutRef.current) {
              clearTimeout(deselectTextTimeoutRef.current);
              deselectTextTimeoutRef.current = null;
            }
            
            toggleTextLock(selectedText.id);
            return;
          }
        }
      }
      
      // Check if clicking on a text (BUT ONLY if no icon was clicked)
      // First check if we clicked on an icon of the selected text
      let clickedOnTextIcon = false;
      if (selectedTextIdRef.current) {
        const selectedText = textsRef.current.find(t => t.id === selectedTextIdRef.current);
        if (selectedText) {
          const textIconClick = findTextIconClick(uv.u, uv.v, selectedText);
          clickedOnTextIcon = textIconClick !== null;
          if (clickedOnTextIcon) {
            console.log('🔍 Clicked on text icon, skipping text drag detection');
          }
        }
      }
      
      // Only check for text click if we didn't click on an icon
      let clickedText = null;
      if (!clickedOnTextIcon) {
        clickedText = findTextAtPosition(uv.u, uv.v);
        if (clickedText && !clickedText.locked) {
          e.preventDefault();
          e.stopPropagation();
          
          // Cancel any pending deselection timeout
          if (deselectTextTimeoutRef.current) {
            clearTimeout(deselectTextTimeoutRef.current);
            deselectTextTimeoutRef.current = null;
          }
          
          draggingTextIdRef.current = clickedText.id;
          isDraggingRef.current = true;
          if (setIsDraggingText) setIsDraggingText(true);
          dragOffsetRef.u = uv.u - clickedText.position[0];
          dragOffsetRef.v = uv.v - clickedText.position[1];
          if (clickedText.id !== selectedTextIdRef.current && selectText) {
            selectText(clickedText.id, true); // Pass true to auto-open typography panel
          }
          return;
        }
      }
      
      // No text clicked - deselect text if one was selected
      if (selectedTextIdRef.current && !clickedText && !clickedOnTextIcon) {
        // Cancel any pending deselection timeout
        if (deselectTextTimeoutRef.current) {
          clearTimeout(deselectTextTimeoutRef.current);
        }
        
        // Delay deselection to prevent interference with rapid clicks
        deselectTextTimeoutRef.current = setTimeout(() => {
          // Only deselect if no drag started in the meantime
          if (!isDraggingRef.current && !draggingTextIdRef.current) {
            console.log('⏳ Deselecting text after delay');
            if (selectText) selectText(null);
            
            // Redraw to hide bounding box
            setTimeout(() => {
              if (redrawAllRef.current) {
                redrawAllRef.current();
              }
            }, 10);
          }
          deselectTextTimeoutRef.current = null;
        }, 150); // 150ms delay
      }
      
      // FIRST: Check if clicking on any icon of the selected logo (this takes ABSOLUTE priority)
      if (selectedLogoIdRef.current) {
        const selectedLogo = placedLogosRef.current.find(l => l.id === selectedLogoIdRef.current);
        console.log('🔍 Checking for icon click on selected logo:', selectedLogo?.id);
        if (selectedLogo) {
          const iconClick = findIconClick(uv.u, uv.v, selectedLogo);
          console.log('🔍 findIconClick result:', iconClick, 'uv:', uv);
          if (iconClick === 'delete') {
            // Check if logo is locked
            if (selectedLogo.locked) {
              console.log('🔒 Logo is locked, cannot delete');
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTimeoutRef.current) {
              console.log('🚫 Canceling pending deselection timeout');
              clearTimeout(deselectTimeoutRef.current);
              deselectTimeoutRef.current = null;
            }
            
            console.log('🗑️ DELETE icon clicked');
            if (onRequestLogoDelete) {
              onRequestLogoDelete(selectedLogoIdRef.current);
            }
            return;
          }
          
          if (iconClick === 'size') {
            // Check if logo is locked
            if (selectedLogo.locked) {
              console.log('🔒 Logo is locked, cannot resize');
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTimeoutRef.current) {
              console.log('🚫 Canceling pending deselection timeout');
              clearTimeout(deselectTimeoutRef.current);
              deselectTimeoutRef.current = null;
            }
            
            console.log('📏 SIZE icon clicked - starting resize');
            isResizingLogoIdRef.current = selectedLogo.id;
            
            // Store initial scale
            initialScaleRef.current = selectedLogo.scale || 1;
            
            // Calculate initial distance from logo center to click position
            const [logoU, logoV] = selectedLogo.position;
            const centerX = logoU * 2048;
            const centerY = logoV * 2048;
            
            const x = uv.u * 2048;
            const y = uv.v * 2048;
            
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            initialResizeDistanceRef.current = distance;
            
            // Ready for resize
            
            return;
          }
          
          if (iconClick === 'rotation') {
            // Check if logo is locked
            if (selectedLogo.locked) {
              console.log('🔒 Logo is locked, cannot rotate');
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTimeoutRef.current) {
              console.log('🚫 Canceling pending deselection timeout');
              clearTimeout(deselectTimeoutRef.current);
              deselectTimeoutRef.current = null;
            }
            
            console.log('🔄 ROTATION icon clicked - starting rotation');
            isRotatingLogoIdRef.current = selectedLogo.id;
            
            // Calculate initial angle from logo center to click position
            const [logoU, logoV] = selectedLogo.position;
            const centerX = logoU * 2048;
            const centerY = logoV * 2048;
            
            const x = uv.u * 2048;
            const y = uv.v * 2048;
            
            const dx = x - centerX;
            const dy = y - centerY;
            const mouseAngle = Math.atan2(dy, dx);
            
            // Store the current rotation of the logo (not the mouse angle)
            initialRotationAngleRef.current = (selectedLogo.rotation || 0) - mouseAngle;
            
            // Ready for rotation
            
            return;
          }
          
          if (iconClick === 'lock') {
            e.preventDefault();
            e.stopPropagation();
            
            // Cancel any pending deselection timeout
            if (deselectTimeoutRef.current) {
              console.log('🚫 Canceling pending deselection timeout');
              clearTimeout(deselectTimeoutRef.current);
              deselectTimeoutRef.current = null;
            }
            
            console.log('🔒 LOCK icon clicked - toggling lock');
            if (toggleLogoLock) {
              toggleLogoLock(selectedLogo.id);
            }
            
            // Redraw to show/hide icons
            setTimeout(() => {
              if (redrawAllRef.current) {
                redrawAllRef.current();
              }
            }, 10);
            
            return;
          }
        }
      }
      
      // SECOND: Check if clicking on any logo
      const clickedLogo = findLogoAtPosition(uv.u, uv.v);
      if (!clickedLogo) {
        // Click outside logo bounding box - deselect with a small delay to allow for double-click or rapid clicks
        console.log('❌ No logo clicked, will deselect after delay - uv:', { u: uv.u, v: uv.v }, 'placedLogos:', placedLogosRef.current.length);
        
        // Cancel any pending deselection timeout
        if (deselectTimeoutRef.current) {
          clearTimeout(deselectTimeoutRef.current);
        }
        
        // Delay deselection to prevent interference with rapid clicks
        deselectTimeoutRef.current = setTimeout(() => {
          // Only deselect if no drag started in the meantime
          if (!isDraggingRef.current && !draggingLogoIdRef.current) {
            console.log('⏳ Deselecting after delay');
            if (safeSelectLogoRef.current) safeSelectLogoRef.current(null);
          }
          deselectTimeoutRef.current = null;
        }, 150); // 150ms delay
        
        return;
      }
      
      // A logo was clicked - cancel any pending deselection timeout
      if (deselectTimeoutRef.current) {
        console.log('🚫 Logo clicked, canceling pending deselection');
        clearTimeout(deselectTimeoutRef.current);
        deselectTimeoutRef.current = null;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      console.log('✅ Logo clicked:', clickedLogo.id, 'Current selected:', selectedLogoIdRef.current);
      
      // Check if logo is locked - if so, don't start drag
      if (clickedLogo.locked) {
        console.log('🔒 Logo is locked, cannot drag');
        return;
      }
      
      // START DRAG IMMEDIATELY to prevent deselection
      console.log('🎯 Starting drag for logo:', clickedLogo.id);
      
      // Set drag refs FIRST to prevent deselection
      draggingLogoIdRef.current = clickedLogo.id;
      isDraggingRef.current = true;
      
      // Notify parent that dragging has started (BEFORE selecting logo)
      if (setIsDraggingLogo) {
        setIsDraggingLogo(true);
        console.log('🔔 Notified parent: isDraggingLogo = true');
      }
      
      // Set drag offset
      dragOffsetRef.u = uv.u - clickedLogo.position[0];
      dragOffsetRef.v = uv.v - clickedLogo.position[1];
      
      console.log('🔧 Ref values after setting:', 'draggingLogoIdRef:', draggingLogoIdRef.current, 'isDraggingRef:', isDraggingRef.current);
      
      // AFTER setting all drag state, handle selection - BUT only if clicking a different logo
      // Don't call selectLogo if it's the same logo, to avoid unnecessary re-renders
      if (clickedLogo.id !== selectedLogoIdRef.current) {
        console.log('🔄 Selecting different logo:', clickedLogo.id, 'current selected:', selectedLogoIdRef.current);
        if (safeSelectLogoRef.current) safeSelectLogoRef.current(clickedLogo.id);
      } else {
        console.log('✅ Same logo clicked, not calling selectLogo to avoid re-render');
      }
      return; // Exit after logo handling
    }

    function onPointerMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastDrawTime < THROTTLE_MS) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const uv = getInterUV(e.clientX, e.clientY);
      if (!uv) return;
      
      // Handle resize
      if (isResizingLogoIdRef.current) {
        const logo = placedLogosRef.current.find(l => l.id === isResizingLogoIdRef.current);
        if (logo) {
          // Calculate current distance from logo center to pointer position
          const [logoU, logoV] = logo.position;
          const centerX = logoU * 2048;
          const centerY = logoV * 2048;
          
          const x = uv.u * 2048;
          const y = uv.v * 2048;
          
          const dx = x - centerX;
          const dy = y - centerY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate scale ratio based on distance ratio
          const initialDistance = initialResizeDistanceRef.current;
          if (initialDistance > 0) {
            const scaleRatio = currentDistance / initialDistance;
            
            // Apply new scale based on initial scale
            const newScale = initialScaleRef.current * scaleRatio;
            
            // Calculate actual pixel dimensions
            const img = logoImagesRef.current.get(logo.id);
            if (img && img.complete) {
              const SCALE_FACTOR = 0.50;
              const baseWidth = logo.width || img.width;
              const baseHeight = logo.height || img.height;
              
              // Calculate the actual rendered pixel size (after SCALE_FACTOR)
              const actualPixelWidth = baseWidth * newScale * SCALE_FACTOR;
              const actualPixelHeight = baseHeight * newScale * SCALE_FACTOR;
              
              // Use the larger dimension for constraints (to ensure logo stays within bounds)
              const actualPixelSize = Math.max(actualPixelWidth, actualPixelHeight);
              
              // Apply pixel-based constraints: min 50px, max 400px
              const MIN_PIXELS = 50;
              const MAX_PIXELS = 400;
              
              let constrainedScale = newScale;
              if (actualPixelSize < MIN_PIXELS) {
                // Scale up to reach minimum size
                const minScale = (MIN_PIXELS / SCALE_FACTOR) / Math.max(baseWidth, baseHeight);
                constrainedScale = Math.max(newScale, minScale);
              } else if (actualPixelSize > MAX_PIXELS) {
                // Scale down to reach maximum size
                const maxScale = (MAX_PIXELS / SCALE_FACTOR) / Math.max(baseWidth, baseHeight);
                constrainedScale = Math.min(newScale, maxScale);
              }
              
              logo.scale = constrainedScale;
            } else {
              logo.scale = newScale;
            }
            
            if (redrawAllRef.current) {
              redrawAllRef.current();
            }
            
            lastDrawTime = now;
          }
        }
        return;
      }
      
      // Handle rotation
      if (isRotatingLogoIdRef.current) {
        const logo = placedLogosRef.current.find(l => l.id === isRotatingLogoIdRef.current);
        if (logo) {
          // Calculate current angle from logo center to pointer position
          const [logoU, logoV] = logo.position;
          const centerX = logoU * 2048;
          const centerY = logoV * 2048;
          
          const x = uv.u * 2048;
          const y = uv.v * 2048;
          
          const dx = x - centerX;
          const dy = y - centerY;
          const currentAngle = Math.atan2(dy, dx);
          
          // Apply rotation: logo rotation = stored offset + current mouse angle
          logo.rotation = initialRotationAngleRef.current + currentAngle;
          
          // Snap rotation to 5 degree increments (5° = 5 * PI / 180 radians)
          const STEP_DEGREES = 5;
          const STEP_RADIANS = STEP_DEGREES * Math.PI / 180;
          logo.rotation = Math.round(logo.rotation / STEP_RADIANS) * STEP_RADIANS;
          
          // Normalize rotation to [-PI, PI] range
          while (logo.rotation > Math.PI) logo.rotation -= 2 * Math.PI;
          while (logo.rotation < -Math.PI) logo.rotation += 2 * Math.PI;
          
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
          
          lastDrawTime = now;
        }
        return;
      }
      
      // Handle drag (check for logo drag first, then text drag)
      if (draggingLogoIdRef.current) {
      const logo = placedLogosRef.current.find(l => l.id === draggingLogoIdRef.current);
      if (!logo) return;
      
        let targetU = uv.u - dragOffsetRef.u;
        let targetV = uv.v - dragOffsetRef.v;

        // Magnetism (snap) to admin-defined snap lines (UV) only
        const canvas = canvasRef.current;
        const SNAP_PIXELS = 8; // same threshold as texts
        const snapLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
        if (canvas) {
          const x = targetU * canvas.width;
          const y = targetV * canvas.height;
          // Snap to admin-defined lines only (no axes, no other elements)
          snapLinesUVRef.current.forEach((ln) => {
            if (ln.type === 'vertical' && ln.u != null) {
              const lx = ln.u * canvas.width;
              if (Math.abs(x - lx) <= SNAP_PIXELS) {
                targetU = ln.u;
                snapLines.push({ x1: lx, y1: 0, x2: lx, y2: canvas.height });
              }
            } else if (ln.type === 'horizontal' && ln.v != null) {
              const ly = ln.v * canvas.height;
              if (Math.abs(y - ly) <= SNAP_PIXELS) {
                targetV = ln.v;
                snapLines.push({ x1: 0, y1: ly, x2: canvas.width, y2: ly });
              }
            }
          });
        }

    // Final enforcement pass: ensure any BACK materials are pure white with no maps
    try {
      gltf.scene.traverse((o: any) => {
        if (!o.isMesh) return;
        const mat = o.material as any;
        const name = (mat?.name || o.name || '').toString();
        if (/\bback\b/i.test(name)) {
          const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
          o.material = white as any;
          (o as any).castShadow = true;
          (o as any).receiveShadow = true;
        }
      });
    } catch {}
        // Share guides with the unified redraw (drawn in redrawAllTexts)
        guideLinesRef.current = snapLines;
        showGuidesRef.current = snapLines.length > 0;
      
      // Update logo position in local ref (only this specific logo by ID)
      console.log('🎯 Updating position for logo ID:', draggingLogoIdRef.current, 'from', logo.position, 'to', [targetU, targetV, logo.position[2]]);
      logo.position[0] = targetU;
      logo.position[1] = targetV;
      
      // Verify no other logos were affected
      const logosAtNewPos = placedLogosRef.current.filter(l => 
        l.id !== draggingLogoIdRef.current && 
        Math.abs(l.position[0] - targetU) < 0.0001 && 
        Math.abs(l.position[1] - targetV) < 0.0001
      );
      if (logosAtNewPos.length > 0) {
        console.warn('⚠️ WARNING: Other logos found at same position after drag:', logosAtNewPos.map(l => l.id));
      }
      
      // Direct redraw
        if (redrawAllRef.current) {
          redrawAllRef.current();
        }
      
      lastDrawTime = now;
        return;
      }
      
      // Handle text drag (for texts)
      if (draggingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === draggingTextIdRef.current);
        if (!text) return;

        let targetU = uv.u - dragOffsetRef.u;
        let targetV = uv.v - dragOffsetRef.v;

        // Magnetism (snap) to admin-defined snap lines (UV) only
        const canvas = canvasRef.current;
        const SNAP_PIXELS = 8; // threshold
        const snapLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
        if (canvas) {
          const x = targetU * canvas.width;
          const y = targetV * canvas.height;
          // Snap to admin-defined lines
          snapLinesUVRef.current.forEach((ln) => {
            if (ln.type === 'vertical' && ln.u != null) {
              const lx = ln.u * canvas.width;
              if (Math.abs(x - lx) <= SNAP_PIXELS) {
                targetU = ln.u;
                snapLines.push({ x1: lx, y1: 0, x2: lx, y2: canvas.height });
              }
            } else if (ln.type === 'horizontal' && ln.v != null) {
              const ly = ln.v * canvas.height;
              if (Math.abs(y - ly) <= SNAP_PIXELS) {
                targetV = ln.v;
                snapLines.push({ x1: 0, y1: ly, x2: canvas.width, y2: ly });
              }
            }
          });
          // Snap to other texts centers
          textsRef.current.forEach(other => {
            if (!other || other.id === text.id) return;
            const ox = other.position[0] * canvas.width;
            const oy = other.position[1] * canvas.height;
            if (Math.abs(x - ox) <= SNAP_PIXELS) {
              targetU = other.position[0];
              snapLines.push({ x1: ox, y1: 0, x2: ox, y2: canvas.height });
            }
            if (Math.abs(y - oy) <= SNAP_PIXELS) {
              targetV = other.position[1];
              snapLines.push({ x1: 0, y1: oy, x2: canvas.width, y2: oy });
            }
          });
        }
        guideLinesRef.current = snapLines;
        showGuidesRef.current = snapLines.length > 0;

        // Update text position in local ref
        text.position[0] = targetU;
        text.position[1] = targetV;

        if (redrawAllRef.current) {
          redrawAllRef.current();
        }

        lastDrawTime = now;
        return;
      }

      // Handle text resize
      if (isResizingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === isResizingTextIdRef.current);
        if (text) {
          const [textU, textV] = text.position;
          const centerX = textU * 2048;
          const centerY = textV * 2048;
          const x = uv.u * 2048;
          const y = uv.v * 2048;
          
          const dx = x - centerX;
          const dy = y - centerY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          const initialDistance = initialTextResizeDistanceRef.current;
          
          if (initialDistance > 0) {
            const scaleRatio = currentDistance / initialDistance;
            const newFontSize = initialTextScaleRef.current * 120 * scaleRatio;
            
            const currentLimits = textSizeLimitsRef.current;
            const MIN_FONT_SIZE = currentLimits?.min ?? 60;
            const MAX_FONT_SIZE = currentLimits?.max ?? 750;
            const constrainedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newFontSize));
            
            text.fontSize = constrainedSize;
            
            if (redrawAllRef.current) {
              redrawAllRef.current();
            }
            
            lastDrawTime = now;
          }
        }
        return;
      }
      
      // Handle text rotation
      if (isRotatingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === isRotatingTextIdRef.current);
        if (text) {
          const [textU, textV] = text.position;
          const centerX = textU * 2048;
          const centerY = textV * 2048;
          const x = uv.u * 2048;
          const y = uv.v * 2048;
          
          const dx = x - centerX;
          const dy = y - centerY;
          const currentAngle = Math.atan2(dy, dx);
          
          text.rotation = initialTextRotationAngleRef.current + currentAngle;
          
          // Snap rotation to 5 degree increments
          const STEP_DEGREES = 5;
          const STEP_RADIANS = STEP_DEGREES * Math.PI / 180;
          text.rotation = Math.round(text.rotation / STEP_RADIANS) * STEP_RADIANS;
          
          // Normalize
          while (text.rotation > Math.PI) text.rotation -= 2 * Math.PI;
          while (text.rotation < -Math.PI) text.rotation += 2 * Math.PI;
          
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
          
          lastDrawTime = now;
        }
        return;
      }
      
      // Handle text drag
      if (draggingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === draggingTextIdRef.current);
        if (!text) return;
        
        const targetU = uv.u - dragOffsetRef.u;
        const targetV = uv.v - dragOffsetRef.v;
        
        text.position[0] = targetU;
        text.position[1] = targetV;
        
        if (redrawAllRef.current) {
          redrawAllRef.current();
        }
        
        lastDrawTime = now;
        return;
      }
      
      // No active interaction
      console.log('⚠️ onPointerMove: No active interaction');
      return;
    }

    function onPointerUp() {
      console.log('🔼 onPointerUp - draggingLogoId:', draggingLogoIdRef.current, 'isDragging:', isDraggingRef.current, 'isResizing:', isResizingLogoIdRef.current, 'selectedLogoIdRef:', selectedLogoIdRef.current);
      
      // Handle resize end
      if (isResizingLogoIdRef.current) {
        const logo = placedLogosRef.current.find(l => l.id === isResizingLogoIdRef.current);
        if (logo && updateLogoScale) {
          console.log('📏 Ending resize for logo:', isResizingLogoIdRef.current, 'new scale:', logo.scale);
          updateLogoScale(isResizingLogoIdRef.current, logo.scale);
        }
        
        isResizingLogoIdRef.current = null;
        initialResizeDistanceRef.current = 0;
        initialScaleRef.current = 1;
        
        // Redraw to show bounding box after resize
        setTimeout(() => {
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
        }, 10);
        
        return;
      }
      
      // Handle rotation end
      if (isRotatingLogoIdRef.current) {
        const logo = placedLogosRef.current.find(l => l.id === isRotatingLogoIdRef.current);
        if (logo && updateLogoRotation) {
          console.log('🔄 Ending rotation for logo:', isRotatingLogoIdRef.current, 'new rotation:', logo.rotation);
          updateLogoRotation(isRotatingLogoIdRef.current, logo.rotation);
        }
        
        isRotatingLogoIdRef.current = null;
        initialRotationAngleRef.current = 0;
        
        // Redraw to show bounding box after rotation
        setTimeout(() => {
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
        }, 10);
        
        return;
      }
      
      // Handle drag end
      if (draggingLogoIdRef.current) {
        const logo = placedLogosRef.current.find(l => l.id === draggingLogoIdRef.current);
        if (logo && updateLogoPosition) {
          // Sync position with parent after drag ends
          updateLogoPosition(draggingLogoIdRef.current, logo.position);
        }
        
        // Keep selection active after drag - logo stays selected
        const draggedLogoId = draggingLogoIdRef.current;
        
        console.log('🔄 Ending drag for logo:', draggedLogoId);
        
        draggingLogoIdRef.current = null;
        isDraggingRef.current = false;
        // Hide guides after drag ends
        guideLinesRef.current = [];
        showGuidesRef.current = false;
        
        // Notify parent that dragging has ended
        if (setIsDraggingLogo) {
          setIsDraggingLogo(false);
          console.log('🔔 Notified parent: isDraggingLogo = false');
        }
        
        // Redraw to show bounding box after drag
        setTimeout(() => {
          if (redrawAllRef.current) {
            redrawAllRef.current();
          }
        }, 10);
        return;
      }
      
      // Handle text resize end
      if (isResizingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === isResizingTextIdRef.current);
        if (text && updateTextSize) {
          // console.log('📏 Ending resize for text:', isResizingTextIdRef.current, 'new fontSize:', text.fontSize);
          updateTextSize(isResizingTextIdRef.current, text.fontSize);
        }
        
        isResizingTextIdRef.current = null;
        initialTextResizeDistanceRef.current = 0;
        initialTextScaleRef.current = 1;
        
        setTimeout(() => {
          if (redrawAllTextsRef.current) {
            redrawAllTextsRef.current();
          }
        }, 10);
        return;
      }
      
      // Handle text rotation end
      if (isRotatingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === isRotatingTextIdRef.current);
        if (text && updateTextRotation) {
          console.log('🔄 Ending rotation for text:', isRotatingTextIdRef.current, 'new rotation:', text.rotation);
          updateTextRotation(isRotatingTextIdRef.current, text.rotation);
        }
        
        isRotatingTextIdRef.current = null;
        initialTextRotationAngleRef.current = 0;
        
        setTimeout(() => {
          if (redrawAllTextsRef.current) {
            redrawAllTextsRef.current();
          }
        }, 10);
        return;
      }
      
      // Handle text drag end
      if (draggingTextIdRef.current) {
        const text = textsRef.current.find(t => t.id === draggingTextIdRef.current);
        if (text && updateTextPosition) {
          updateTextPosition(draggingTextIdRef.current, text.position);
        }
        
        const draggedTextId = draggingTextIdRef.current;
        console.log('🔄 Ending drag for text:', draggedTextId);
        
        draggingTextIdRef.current = null;
        isDraggingRef.current = false;
        
        if (setIsDraggingText) {
          setIsDraggingText(false);
          console.log('🔔 Notified parent: isDraggingText = false');
        }
        
        // Hide guides after drag ends
        guideLinesRef.current = [];
        showGuidesRef.current = false;

        setTimeout(() => {
          if (redrawAllTextsRef.current) {
            redrawAllTextsRef.current();
          }
        }, 10);
        return;
      }
      
      if (!draggingLogoIdRef.current && !isResizingLogoIdRef.current && !isRotatingLogoIdRef.current && 
          !draggingTextIdRef.current && !isResizingTextIdRef.current && !isRotatingTextIdRef.current) {
        console.log('⚠️ onPointerUp called but no active drag or resize - IGNORING to prevent deselection');
      }
    }
    
    // Use normal event listeners (not capture) to allow OrbitControls to work
    // Only stop propagation when actually interacting with logos
    gl.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      overlayMeshes.forEach((om) => { 
        scene.remove(om); 
        om.geometry.dispose(); 
        // Dispose material if it exists
        if (om.material) {
          if (Array.isArray(om.material)) {
            om.material.forEach((mat: THREE.Material) => mat.dispose());
          } else {
            (om.material as THREE.Material).dispose();
          }
        }
      });
      overlayTex.dispose();
      gl.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gltf, scene]); // Don't depend on designSrc - only setup once

  return <primitive object={gltf.scene} />;
}

type Props = ThreeElements['group'] & {
  url: string;
  color: string;
  designTexture?: string;
  modelId?: string; // ID du modèle pour la détection automatique des matériaux
  textureMaps?: Record<string, string>; // Legacy - global maps
  materialMaps?: Record<string, {
    materialName: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
    aoMap?: string;
    opacityMap?: string;
    repeatX?: number;
    repeatY?: number;
    normalIntensity?: number;
    roughnessValue?: number;
    metalnessValue?: number;
    aoIntensity?: number;
    useUV2?: boolean;
  }>; // Nouveau - maps par matériau
  colors?: Record<string, string>; // Couleurs dynamiques (primary, secondary, tertiary, quaternary, quinary, etc.)
  fonts?: Array<{
    id: string;
    name: string;
    display_name: string;
    font_url: string;
    format: string;
    category?: string;
    active: boolean;
    letter_spacing?: number;
    created_at: string;
    updated_at: string;
  }>;
  texts?: Array<{
    id: string;
    content: string;
    position: [number, number, number];
    fontSize: number;
    color: string;
    editable: boolean;
    rotation: number;
    locked?: boolean;
    category: 'text' | 'nom' | 'numero';
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    strokeWidthUnit?: 'px';
    deformation?: string;
    deformationIntensity?: number;
    fillType?: 'solid' | 'gradient';
    gradientColors?: string[];
    gradientDirection?: 'horizontal' | 'vertical';
  }>;
  updateTextPosition?: (id: string, position: [number, number, number]) => void;
  updateTextRotation?: (id: string, rotation: number) => void;
  updateTextSize?: (id: string, fontSize: number) => void;
  toggleTextLock?: (id: string) => void;
  removeText?: (id: string) => void;
  selectedTextId?: string | null;
  selectText?: (id: string | null, autoOpenTypography?: boolean) => void;
  isDraggingText?: boolean;
  setIsDraggingText?: (dragging: boolean) => void;
  isRotatingText?: boolean;
  setIsRotatingText?: (rotating: boolean) => void;
  textSizeLimits?: { min: number; max: number };
  isResizingText?: boolean;
  setIsResizingText?: (resizing: boolean) => void;
  onSvgProcessed?: (svgUrl: string | null) => void;
  onTextAdded?: (textId: string, position: [number, number, number]) => void;
  placedLogos?: Array<{
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
  }>;
  updateLogoPosition?: (id: string, position: [number, number, number]) => void;
  updateLogoRotation?: (id: string, rotation: number) => void;
  updateLogoScale?: (id: string, scale: number) => void;
  toggleLogoLock?: (id: string) => void;
  removeLogo?: (id: string) => void;
  onRequestLogoDelete?: (id: string) => void;
  selectedLogoId?: string | null;
  selectLogo?: (id: string | null) => void;
  isDraggingLogo?: boolean;
  setIsDraggingLogo?: (dragging: boolean) => void;
  isRotatingLogo?: boolean;
  setIsRotatingLogo?: (rotating: boolean) => void;
  isResizingLogo?: boolean;
  setIsResizingLogo?: (resizing: boolean) => void;
  onClickCoordinates?: (coordinates: {uv: [number, number], svg: [number, number]} | null) => void;
  selectedDesign?: { id: string | null; svgUrl: string | null };
  isPlacingText?: 'nom' | 'numero' | null;
  textZones?: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    color: string;
    image?: string;
    categories?: string[];
    zoneCategory?: string;
    view?: 'front' | 'back' | 'left' | 'right';
    designId?: string | null;
  }>;
  onTextPlaced?: (category: 'nom' | 'numero', position: [number, number, number], zoneCategory?: string, rotation?: number) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  // Suppression de fontsLoaded pour éviter les boucles infinies
};

// Cache persistant pour les polices encodées en base64
const fontCache = new Map<string, string>();

// Fonction pour charger et mettre en cache une police
const loadFontToCache = async (font: any): Promise<string | null> => {
  const cacheKey = `${font.id}-${font.font_url}`;
  
  // Vérifier le cache en mémoire d'abord
  if (fontCache.has(cacheKey)) {
    // Police en cache mémoire
    return fontCache.get(cacheKey)!;
  }
  
  // Vérifier le localStorage pour un cache persistant
  const cachedBase64 = localStorage.getItem(`font_${font.id}`);
  if (cachedBase64) {
    // console.log(`✅ Police en cache localStorage: ${font.display_name}`);
    fontCache.set(cacheKey, cachedBase64);
    return cachedBase64;
  }
  
  try {
    // console.log(`📥 Chargement police: ${font.display_name} depuis ${font.font_url}`);
    
    const response = await fetch(font.font_url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const fontBlob = await response.blob();
    // console.log(`✅ Police chargée: ${font.display_name} (${fontBlob.size} bytes)`);
    
    // Convertir en base64
    const fontBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Corriger le type MIME pour les polices
        const mimeType = font.format === 'ttf' ? 'font/ttf' : 
                        font.format === 'otf' ? 'font/otf' : 
                        font.format === 'woff' ? 'font/woff' :
                        font.format === 'woff2' ? 'font/woff2' :
                        'font/ttf';
        const correctedResult = result.replace(/^data:[^;]+;/, `data:${mimeType};`);
        resolve(correctedResult);
      };
      reader.readAsDataURL(fontBlob);
    });
    
    // Mettre en cache en mémoire et localStorage
    fontCache.set(cacheKey, fontBase64);
    localStorage.setItem(`font_${font.id}`, fontBase64);
    
    // console.log(`✅ Police convertie et mise en cache: ${font.display_name}`);
    return fontBase64;
    
  } catch (error) {
    console.error(`❌ Erreur chargement ${font.display_name}:`, error);
      return null;
  }
};

export function ModelViewer({ url, color, designTexture, modelId, textureMaps, materialMaps, colors, fonts, texts, updateTextPosition, updateTextRotation, updateTextSize, toggleTextLock, removeText, selectedTextId, selectText, isDraggingText, setIsDraggingText, isRotatingText, setIsRotatingText, isResizingText, setIsResizingText, onSvgProcessed, onTextAdded, placedLogos, updateLogoPosition, updateLogoRotation, updateLogoScale, toggleLogoLock, removeLogo, onRequestLogoDelete, selectedLogoId, selectLogo, isDraggingLogo, setIsDraggingLogo, isRotatingLogo, setIsRotatingLogo, isResizingLogo, setIsResizingLogo, onClickCoordinates, selectedDesign, isPlacingText, textZones, onTextPlaced, onCanvasReady, textSizeLimits, ...props }: Props) {
  console.log('🎨 ModelViewer: designTexture =', designTexture);
  console.log('🎨 ModelViewer: placedLogos =', placedLogos);
  console.log('📍 ModelViewer: isPlacingText =', isPlacingText);
  
  // Wrapper for updateLogoPosition
  const handleUpdateLogoPosition = useCallback((id: string, position: [number, number, number]) => {
    if (updateLogoPosition) {
      updateLogoPosition(id, position);
    }
  }, [updateLogoPosition]);
  
  // Use placedLogos directly without adding racetech
  const logosToDisplay = useMemo(() => {
    return placedLogos || [];
  }, [placedLogos]);
  
  console.log('🎨 ModelViewer: logosToDisplay =', logosToDisplay.length, logosToDisplay.map(l => l.id));
  
  // Use SimpleViewer with placedLogos for multi-logo drag support
  // Wrapper for updateLogoScale
  const handleUpdateLogoScale = useCallback((id: string, scale: number) => {
    if (updateLogoScale) {
      updateLogoScale(id, scale);
    }
  }, [updateLogoScale]);
  
  // Wrapper for updateLogoRotation
  const handleUpdateLogoRotation = useCallback((id: string, rotation: number) => {
    if (updateLogoRotation) {
      updateLogoRotation(id, rotation);
    }
  }, [updateLogoRotation]);

  return <SimpleViewer 
    url={url} 
    designSrc={designTexture || undefined} 
    colors={colors} 
    onSvgProcessed={onSvgProcessed}
    selectedDesign={selectedDesign}
    materialMaps={materialMaps}
    placedLogos={logosToDisplay}
    updateLogoPosition={handleUpdateLogoPosition}
    updateLogoScale={handleUpdateLogoScale}
    updateLogoRotation={handleUpdateLogoRotation}
    selectedLogoId={selectedLogoId}
    selectLogo={selectLogo}
    onRequestLogoDelete={onRequestLogoDelete}
    toggleLogoLock={toggleLogoLock}
    setIsDraggingLogo={setIsDraggingLogo}
    isPlacingText={isPlacingText}
    textZones={textZones}
    onTextPlaced={onTextPlaced}
    texts={texts}
    updateTextPosition={updateTextPosition}
    updateTextRotation={updateTextRotation}
    updateTextSize={updateTextSize}
    selectedTextId={selectedTextId}
    selectText={selectText}
    removeText={removeText}
    toggleTextLock={toggleTextLock}
    setIsDraggingText={setIsDraggingText}
    fonts={fonts}
    onCanvasReady={onCanvasReady}
    textSizeLimits={textSizeLimits}
  />;
}


