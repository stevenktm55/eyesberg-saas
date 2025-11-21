"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Model3DPreviewWithControlsProps {
  url: string | null;
  className?: string;
  style?: React.CSSProperties;
  materialMaps?: Record<string, any>;
  design2DUrl?: string | null;
  modelParts?: Array<{ name: string; material_map_id?: string | null }>;
  zoomSpeed?: number;
  rotateSpeed?: number;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialRotation?: number;
}

function Model({ 
  url, 
  materialMaps, 
  design2DUrl, 
  modelParts 
}: { 
  url: string;
  materialMaps?: Record<string, any>;
  design2DUrl?: string | null;
  modelParts?: Array<{ name: string; material_map_id?: string | null }>;
}) {
  const { scene } = useGLTF(url);
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // Clone la scène pour éviter les mutations
  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    
    // Auto-fit le modèle dans la scène
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.5 / maxDim;
      cloned.scale.multiplyScalar(scale);
      cloned.position.sub(center.multiplyScalar(scale));
    }
    
    return cloned;
  }, [scene]);

  // Refs pour stocker le SVG original et suivre les versions (comme dans ModelViewer)
  const originalSvgRef = React.useRef<string | null>(null);
  const appliedSvgRef = React.useRef<string | null>(null);
  const [svgBaseVersion, setSvgBaseVersion] = React.useState(0);

  // Setup meshes and load design texture (UV0) - runs when design2DUrl changes (comme ModelViewer ligne 390-651)
  React.useEffect(() => {
    if (!clonedScene) return;
    if (!design2DUrl) return; // aucun design à charger
    
    console.log('🎨 Loading design texture from:', design2DUrl);

    const meshes: THREE.Mesh[] = [];
    clonedScene.traverse((o: any) => { if (o.isMesh) meshes.push(o as THREE.Mesh); });
    if (meshes.length === 0) return;
    
    console.log('🎨 Found', meshes.length, 'meshes');

    // Split meshes into back/front; prepare backs immediately (comme ModelViewer ligne 418-459)
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

    // Load and process SVG ONCE (comme ModelViewer ligne 462-543)
    const loadAndProcessSVGOnce = async () => {
      try {
        console.log('🔄 Loading SVG:', design2DUrl);
        let svgText = originalSvgRef.current;
        if (!svgText) {
          const srcToFetch = design2DUrl ? `${design2DUrl}${design2DUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : '';
          const response = await fetch(srcToFetch || '');
          if (!response.ok) {
            console.error('❌ SVG fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
          }
          svgText = await response.text();
          originalSvgRef.current = svgText;
          setSvgBaseVersion(v => v + 1);
        }
        if (!svgText || svgText.trim().length === 0) {
          console.error('❌ SVG is empty');
          throw new Error('SVG content is empty');
        }
        let finalSvg = svgText;
        // On s'arrête ici: l'application de texture se fait dans l'effet de recolor uniquement
        return;
      } catch (error) {
        console.error('❌ Error loading SVG:', error);
      }
    };

    loadAndProcessSVGOnce();
  }, [clonedScene, design2DUrl]);

  // Recolor pass: rebuild texture from cached original SVG and apply to front meshes (comme ModelViewer ligne 653-873)
  React.useEffect(() => {
    if (!clonedScene) return;
    if (!originalSvgRef.current) return;
    
    let finalSvg = originalSvgRef.current;
    const alreadyApplied = appliedSvgRef.current === finalSvg;
    if (alreadyApplied) {
      console.log('ℹ️ SVG identical to last applied, skipping reapply');
      return;
    }
    
    // Apply to front meshes only using a data URL Image (comme ModelViewer ligne 686-872)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('✅ SVG image loaded, size:', img.width, 'x', img.height);
      const size = 4096; // Utiliser 4096 comme ModelViewer (ligne 690)
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) {
        console.error('❌ Failed to get canvas context');
        return;
      }
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      console.log('✅ Design drawn on canvas 4096x4096');
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
      console.log('✅ Design texture created, applying to meshes...');
      
      const meshes: THREE.Mesh[] = [];
      clonedScene.traverse((o: any) => { if (o.isMesh) meshes.push(o as THREE.Mesh); });
      console.log('📦 Found', meshes.length, 'meshes to apply design to');
      const isBack = (m: THREE.Mesh) => {
        const matName = ((m.material as any)?.name) || (m as any)?.userData?.materialName || '';
        return /back/i.test(matName) || /back/i.test(m.name || '');
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
          console.log('✅ Design texture applied to material:', (newMaterial as any).name, 'map:', newMaterial.map ? 'YES' : 'NO');
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
      console.log('✅ Texture fully updated after recolor');
      appliedSvgRef.current = finalSvg;
    };
    img.onerror = (error) => {
      console.error('❌ Failed to load SVG image', error);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(finalSvg);
  }, [clonedScene, svgBaseVersion, materialMaps]);

  return <primitive ref={groupRef} object={clonedScene} />;
}

export function Model3DPreviewWithControls({ 
  url, 
  materialMaps, 
  design2DUrl, 
  modelParts,
  zoomSpeed = 1,
  rotateSpeed = 1,
  minZoom = 1,
  maxZoom = 10,
  initialZoom = 5,
  initialRotation = 0,
  className,
  style 
}: Model3DPreviewWithControlsProps) {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Mettre à jour la vitesse de rotation
  React.useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = rotateSpeed;
    }
  }, [rotateSpeed]);

  if (!url) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: style?.backgroundColor || '#e8e8e8',
        ...style 
      }}>
        <p style={{ color: '#666', fontFamily: 'var(--stepn-font-body)' }}>No model URL provided</p>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{ width: '100%', height: '100%', backgroundColor: style?.backgroundColor || '#e8e8e8' }}
    >
      <Canvas
        camera={{ position: [0, 0, initialZoom], fov: 50 }}
        style={{ width: '100%', height: '100%', backgroundColor: style?.backgroundColor || '#e8e8e8' }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        <color attach="background" args={[style?.backgroundColor || '#e8e8e8']} />
        
        <Suspense fallback={null}>
          <Model 
            url={url} 
            materialMaps={materialMaps}
            design2DUrl={design2DUrl}
            modelParts={modelParts}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={minZoom}
          maxDistance={maxZoom}
          zoomSpeed={zoomSpeed}
          rotateSpeed={rotateSpeed}
          target={[0, 0, 0]}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
