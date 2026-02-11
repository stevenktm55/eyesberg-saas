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

/** Une entrée modèle 3D avec son design 2D lié */
export interface ViewerModelItem {
  modelUrl: string;
  design2DUrl: string | null;
}

function SceneModel({
  url,
  design2DUrl,
  position = [0, 0, 0],
}: {
  url: string;
  design2DUrl?: string | null;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone();
    // Ne pas modifier scale ni position : on respecte l'origine et la taille d'origine du .glb
    return cloned;
  }, [scene]);

  // Sans design 2D : activer ombres sur les meshes
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
    if (!clonedScene || !design2DUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      design2DUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        clonedScene.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material) {
            const mesh = object as THREE.Mesh;
            const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const name = ((mat as any)?.name || mesh.name || "").toLowerCase();
            if (/back/i.test(name)) return;
            let standard = mat as THREE.MeshStandardMaterial;
            if (!(standard instanceof THREE.MeshStandardMaterial)) {
              standard = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: texture.clone(),
              });
              mesh.material = standard;
            } else {
              standard.map = texture.clone();
            }
            standard.needsUpdate = true;
            (mesh as any).castShadow = true;
            (mesh as any).receiveShadow = true;
          }
        });
      },
      undefined,
      (err) => console.error("Design 2D load error:", err)
    );
  }, [clonedScene, design2DUrl]);

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
