"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type ToneMappingType = "none" | "linear" | "reinhard" | "cineon" | "aces";
export type ShadowMapType = "basic" | "pcf" | "pcfsoft" | "vsm";
export type EnvPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse"
  | "room";

export interface ViewerEnvSettings {
  backgroundColor: string;
  shadowsEnabled: boolean;
  shadowMapType: ShadowMapType;
  toneMapping: ToneMappingType;
  toneMappingExposure: number;
  environmentPreset: EnvPreset;
  environmentIntensity: number;
  ambientLightIntensity: number;
  ambientLightColor: string;
  directionalKeyIntensity: number;
  directionalKeyPosition: [number, number, number];
  directionalKeyCastShadow: boolean;
  directionalFillIntensity: number;
  directionalFillPosition: [number, number, number];
  directionalRimIntensity: number;
  directionalRimPosition: [number, number, number];
  pointLight1Intensity: number;
  pointLight1Position: [number, number, number];
  pointLight2Intensity: number;
  pointLight2Position: [number, number, number];
  showGrid: boolean;
  gridSize: number;
  gridDivisions: number;
}

const defaultEnvSettings: ViewerEnvSettings = {
  backgroundColor: "#e8e8e8",
  shadowsEnabled: true,
  shadowMapType: "pcfsoft",
  toneMapping: "aces",
  toneMappingExposure: 0.4,
  environmentPreset: "studio",
  environmentIntensity: 1,
  ambientLightIntensity: 0.4,
  ambientLightColor: "#ffffff",
  directionalKeyIntensity: 2,
  directionalKeyPosition: [12, 18, 12],
  directionalKeyCastShadow: true,
  directionalFillIntensity: 1,
  directionalFillPosition: [-8, 12, 8],
  directionalRimIntensity: 1.2,
  directionalRimPosition: [0, 8, -15],
  pointLight1Intensity: 1.5,
  pointLight1Position: [5, 15, 8],
  pointLight2Intensity: 1.2,
  pointLight2Position: [-5, 12, 8],
  showGrid: false,
  gridSize: 10,
  gridDivisions: 10,
};

function GlSettings({ settings }: { settings: ViewerEnvSettings }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = settings.shadowsEnabled;
    const shadowTypes: Record<ShadowMapType, number> = {
      basic: THREE.BasicShadowMap,
      pcf: THREE.PCFShadowMap,
      pcfsoft: THREE.PCFSoftShadowMap,
      vsm: THREE.VSMShadowMap,
    };
    gl.shadowMap.type = shadowTypes[settings.shadowMapType];
    const toneMappingTypes: Record<ToneMappingType, number> = {
      none: THREE.NoToneMapping,
      linear: THREE.LinearToneMapping,
      reinhard: THREE.ReinhardToneMapping,
      cineon: THREE.CineonToneMapping,
      aces: THREE.ACESFilmicToneMapping,
    };
    (gl as any).toneMapping = toneMappingTypes[settings.toneMapping];
    (gl as any).toneMappingExposure = settings.toneMappingExposure;
  }, [gl, settings]);
  return null;
}

function SceneLights({ settings }: { settings: ViewerEnvSettings }) {
  const ambientColor = new THREE.Color(settings.ambientLightColor);
  return (
    <>
      <ambientLight intensity={settings.ambientLightIntensity} color={ambientColor} />
      <directionalLight
        position={settings.directionalKeyPosition}
        intensity={settings.directionalKeyIntensity}
        castShadow={settings.directionalKeyCastShadow}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={settings.directionalFillPosition}
        intensity={settings.directionalFillIntensity}
      />
      <directionalLight
        position={settings.directionalRimPosition}
        intensity={settings.directionalRimIntensity}
      />
      <pointLight
        position={settings.pointLight1Position}
        intensity={settings.pointLight1Intensity}
        distance={40}
        decay={1.8}
      />
      <pointLight
        position={settings.pointLight2Position}
        intensity={settings.pointLight2Intensity}
        distance={40}
        decay={1.8}
      />
    </>
  );
}

/** Une entrée modèle 3D avec design 2D et maps PBR optionnelles */
export interface ViewerModelItem {
  modelUrl: string;
  design2DUrl: string | null;
  normalMapUrl?: string | null;
  roughnessMapUrl?: string | null;
  metallicMapUrl?: string | null;
  aoMapUrl?: string | null;
}

function SceneModel({
  url,
  design2DUrl,
  normalMapUrl,
  roughnessMapUrl,
  metallicMapUrl,
  aoMapUrl,
  position = [0, 0, 0],
}: {
  url: string;
  design2DUrl?: string | null;
  normalMapUrl?: string | null;
  roughnessMapUrl?: string | null;
  metallicMapUrl?: string | null;
  aoMapUrl?: string | null;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    return cloned;
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        (object as any).castShadow = true;
        (object as any).receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    if (!clonedScene) return;
    const loader = new THREE.TextureLoader();
    const urls = {
      design: design2DUrl || null,
      normal: normalMapUrl || null,
      roughness: roughnessMapUrl || null,
      metallic: metallicMapUrl || null,
      ao: aoMapUrl || null,
    };
    const toLoad = Object.values(urls).filter(Boolean) as string[];
    if (toLoad.length === 0) return;

    let cancelled = false;
    const loaded: Record<string, THREE.Texture> = {};
    let loadedCount = 0;

    const tryApply = () => {
      if (loadedCount < toLoad.length || cancelled) return;
      clonedScene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const mesh = object as THREE.Mesh;
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const name = ((mat as any)?.name || mesh.name || "").toLowerCase();
          if (/back/i.test(name)) return;
          const geom = mesh.geometry as THREE.BufferGeometry;
          if (geom) {
            let uv2Attr = geom.getAttribute("uv2");
            const uvAttr = geom.getAttribute("uv");
            if (!uv2Attr && uvAttr) {
              uv2Attr = new THREE.BufferAttribute(
                new Float32Array((uvAttr as THREE.BufferAttribute).array),
                2
              );
              geom.setAttribute("uv2", uv2Attr);
            }
            if (uv2Attr && (urls.design || urls.normal || urls.roughness || urls.metallic || urls.ao)) {
              geom.setAttribute("uv", uv2Attr.clone());
            }
          }
          let standard = mat as THREE.MeshStandardMaterial;
          if (!(standard instanceof THREE.MeshStandardMaterial)) {
            standard = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 });
            mesh.material = standard;
          }
          if (loaded.design) {
            const t = loaded.design.clone();
            t.colorSpace = THREE.SRGBColorSpace;
            t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
            t.repeat.set(1, 1);
            t.offset.set(0, 0);
            t.flipY = false;
            standard.map = t;
          }
          if (loaded.normal) {
            const t = loaded.normal.clone();
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.flipY = false;
            standard.normalMap = t;
            standard.normalScale = new THREE.Vector2(1, 1);
          }
          if (loaded.roughness) {
            const t = loaded.roughness.clone();
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.flipY = false;
            standard.roughnessMap = t;
            standard.roughness = 1;
          }
          if (loaded.metallic) {
            const t = loaded.metallic.clone();
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.flipY = false;
            standard.metalnessMap = t;
            standard.metalness = 1;
          }
          if (loaded.ao) {
            const t = loaded.ao.clone();
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.flipY = false;
            standard.aoMap = t;
            standard.aoMapIntensity = 1;
          }
          standard.needsUpdate = true;
          (mesh as any).castShadow = true;
          (mesh as any).receiveShadow = true;
        }
      });
    };

    const onLoad = (key: string) => (tex: THREE.Texture) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      loaded[key] = tex;
      loadedCount += 1;
      tryApply();
    };
    const onError = (key: string) => () => {
      if (!cancelled) {
        loadedCount += 1;
        tryApply();
      }
    };

    if (urls.design) loader.load(urls.design, onLoad("design"), undefined, onError("design"));
    if (urls.normal) loader.load(urls.normal, onLoad("normal"), undefined, onError("normal"));
    if (urls.roughness) loader.load(urls.roughness, onLoad("roughness"), undefined, onError("roughness"));
    if (urls.metallic) loader.load(urls.metallic, onLoad("metallic"), undefined, onError("metallic"));
    if (urls.ao) loader.load(urls.ao, onLoad("ao"), undefined, onError("ao"));

    return () => {
      cancelled = true;
      Object.values(loaded).forEach((t) => t.dispose());
    };
  }, [clonedScene, design2DUrl, normalMapUrl, roughnessMapUrl, metallicMapUrl, aoMapUrl]);

  return (
    <group position={position}>
      <primitive ref={groupRef} object={clonedScene} />
    </group>
  );
}

function SceneContent({
  models,
  settings,
}: {
  models: ViewerModelItem[];
  settings: ViewerEnvSettings;
}) {
  const { scene, gl } = useThree();
  const roomEnvRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (settings.environmentPreset !== "room") return;
    let mounted = true;
    (async () => {
      try {
        const { RoomEnvironment } = await import(
          "three/examples/jsm/environments/RoomEnvironment.js"
        );
        const pmrem = new THREE.PMREMGenerator(gl);
        const envTex = pmrem.fromScene(new RoomEnvironment(), 0.005).texture;
        if (mounted) {
          scene.environment = envTex;
          (scene as any).environmentIntensity = settings.environmentIntensity;
          roomEnvRef.current = envTex;
        } else {
          envTex.dispose();
        }
      } catch (e) {
        console.warn("RoomEnvironment load failed:", e);
      }
    })();
    return () => {
      mounted = false;
      if (roomEnvRef.current) {
        roomEnvRef.current.dispose();
        roomEnvRef.current = null;
      }
    };
  }, [settings.environmentPreset, gl, scene]);

  useEffect(() => {
    if (scene.environment && typeof (scene as any).environmentIntensity !== "undefined") {
      (scene as any).environmentIntensity = settings.environmentIntensity;
    }
  }, [settings.environmentIntensity, scene]);

  // Un seul centre : tous les modèles sont ajoutés au centre du viewer (0, 0, 0)
  const viewerCenter: [number, number, number] = [0, 0, 0];

  return (
    <>
      <GlSettings settings={settings} />
      <color attach="background" args={[settings.backgroundColor]} />
      {settings.environmentPreset !== "room" && (
        <Environment
          preset={settings.environmentPreset as "apartment" | "city" | "dawn" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse"}
          intensity={settings.environmentIntensity}
        />
      )}
      <SceneLights settings={settings} />
      {settings.showGrid && (
        <gridHelper
          args={[settings.gridSize, settings.gridDivisions, "#888", "#ccc"]}
        />
      )}
      {models.map((item, index) => (
        <Suspense key={`${item.modelUrl}-${index}`} fallback={null}>
          <SceneModel
            url={item.modelUrl}
            design2DUrl={item.design2DUrl ?? undefined}
            normalMapUrl={item.normalMapUrl ?? undefined}
            roughnessMapUrl={item.roughnessMapUrl ?? undefined}
            metallicMapUrl={item.metallicMapUrl ?? undefined}
            aoMapUrl={item.aoMapUrl ?? undefined}
            position={viewerCenter}
          />
        </Suspense>
      ))}
      <OrbitControls
        enableZoom
        enablePan
        enableRotate
        minDistance={1}
        maxDistance={20}
      />
    </>
  );
}

export interface Viewer3DSceneProps {
  /** Liste des modèles 3D, chacun avec son design 2D lié */
  models: ViewerModelItem[];
  envSettings: ViewerEnvSettings;
}

export const DEFAULT_VIEWER_ENV_SETTINGS = defaultEnvSettings;

export function Viewer3DScene({
  models,
  envSettings,
}: Viewer3DSceneProps) {
  const settings = { ...defaultEnvSettings, ...envSettings };
  return (
    <div style={{ width: "100%", height: "100%", background: settings.backgroundColor }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = settings.shadowsEnabled;
          const t: Record<ShadowMapType, number> = {
            basic: THREE.BasicShadowMap,
            pcf: THREE.PCFShadowMap,
            pcfsoft: THREE.PCFSoftShadowMap,
            vsm: THREE.VSMShadowMap,
          };
          gl.shadowMap.type = t[settings.shadowMapType];
          const tm: Record<ToneMappingType, number> = {
            none: THREE.NoToneMapping,
            linear: THREE.LinearToneMapping,
            reinhard: THREE.ReinhardToneMapping,
            cineon: THREE.CineonToneMapping,
            aces: THREE.ACESFilmicToneMapping,
          };
          (gl as any).toneMapping = tm[settings.toneMapping];
          (gl as any).toneMappingExposure = settings.toneMappingExposure;
        }}
      >
        <SceneContent models={models} settings={settings} />
      </Canvas>
    </div>
  );
}
