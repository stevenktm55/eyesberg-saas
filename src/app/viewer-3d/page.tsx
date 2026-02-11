"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Viewer3DScene,
  DEFAULT_VIEWER_ENV_SETTINGS,
  type ViewerEnvSettings,
  type ViewerModelItem,
  type EnvPreset,
  type ToneMappingType,
  type ShadowMapType,
} from "./Viewer3DScene";

export interface ModelDesignPair {
  id: string;
  modelUrl: string | null;
  design2DUrl: string | null;
}

function generateId() {
  return `md-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function useFPS() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      frameCount.current += 1;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return fps;
}

const ENV_PRESETS: { value: EnvPreset; label: string }[] = [
  { value: "apartment", label: "Appartement" },
  { value: "city", label: "Ville" },
  { value: "dawn", label: "Aube" },
  { value: "forest", label: "Forêt" },
  { value: "lobby", label: "Hall" },
  { value: "night", label: "Nuit" },
  { value: "park", label: "Parc" },
  { value: "studio", label: "Studio" },
  { value: "sunset", label: "Coucher de soleil" },
  { value: "warehouse", label: "Entrepôt" },
  { value: "room", label: "Salle (Room)" },
];

const TONE_MAPPING_OPTIONS: { value: ToneMappingType; label: string }[] = [
  { value: "none", label: "Aucun" },
  { value: "linear", label: "Linéaire" },
  { value: "reinhard", label: "Reinhard" },
  { value: "cineon", label: "Cineon" },
  { value: "aces", label: "ACES Filmic" },
];

const SHADOW_MAP_OPTIONS: { value: ShadowMapType; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "pcf", label: "PCF" },
  { value: "pcfsoft", label: "PCF Soft" },
  { value: "vsm", label: "VSM" },
];

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-black truncate">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 h-1.5 accent-black"
        />
        <span className="text-xs text-black w-8 tabular-nums">{value.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  const update = (i: 0 | 1 | 2, v: string) => {
    const n = Number(v);
    const next: [number, number, number] = [...value];
    next[i] = Number.isFinite(n) ? n : next[i];
    onChange(next);
  };
  return (
    <div className="space-y-1">
      <span className="text-xs text-black">{label}</span>
      <div className="flex gap-1">
        <input
          type="number"
          value={value[0]}
          onChange={(e) => update(0, e.target.value)}
          className="w-14 px-1 py-0.5 text-xs text-black border border-gray-300 rounded bg-white"
          step={0.5}
        />
        <input
          type="number"
          value={value[1]}
          onChange={(e) => update(1, e.target.value)}
          className="w-14 px-1 py-0.5 text-xs text-black border border-gray-300 rounded bg-white"
          step={0.5}
        />
        <input
          type="number"
          value={value[2]}
          onChange={(e) => update(2, e.target.value)}
          className="w-14 px-1 py-0.5 text-xs text-black border border-gray-300 rounded bg-white"
          step={0.5}
        />
      </div>
    </div>
  );
}

export default function Viewer3DPage() {
  const [pairs, setPairs] = useState<ModelDesignPair[]>([
    { id: generateId(), modelUrl: null, design2DUrl: null },
  ]);
  const [envSettings, setEnvSettings] = useState<ViewerEnvSettings>(
    DEFAULT_VIEWER_ENV_SETTINGS
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fps = useFPS();

  const updateEnv = useCallback((patch: Partial<ViewerEnvSettings>) => {
    setEnvSettings((s) => ({ ...s, ...patch }));
  }, []);

  const updatePair = useCallback((id: string, patch: Partial<ModelDesignPair>) => {
    setPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const setPairModelUrl = useCallback((id: string, url: string | null) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.modelUrl?.startsWith("blob:")) URL.revokeObjectURL(p.modelUrl);
        return { ...p, modelUrl: url };
      })
    );
  }, []);

  const setPairDesign2DUrl = useCallback((id: string, url: string | null) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.design2DUrl?.startsWith("blob:")) URL.revokeObjectURL(p.design2DUrl);
        return { ...p, design2DUrl: url };
      })
    );
  }, []);

  const addPair = useCallback(() => {
    setPairs((prev) => [
      ...prev,
      { id: generateId(), modelUrl: null, design2DUrl: null },
    ]);
  }, []);

  const removePair = useCallback((id: string) => {
    setPairs((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p?.modelUrl?.startsWith("blob:")) URL.revokeObjectURL(p.modelUrl);
      if (p?.design2DUrl?.startsWith("blob:")) URL.revokeObjectURL(p.design2DUrl);
      const next = prev.filter((x) => x.id !== id);
      return next.length > 0 ? next : [{ id: generateId(), modelUrl: null, design2DUrl: null }];
    });
  }, []);

  const viewerModels: ViewerModelItem[] = pairs
    .filter((p): p is ModelDesignPair & { modelUrl: string } => p.modelUrl != null)
    .map((p) => ({ modelUrl: p.modelUrl, design2DUrl: p.design2DUrl }));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <style dangerouslySetInnerHTML={{ __html: `
        .viewer-3d-sidebar,
        .viewer-3d-sidebar * { color: #000 !important; -webkit-text-fill-color: #000 !important; }
        .viewer-3d-sidebar input,
        .viewer-3d-sidebar select,
        .viewer-3d-sidebar option { color: #000 !important; background-color: #fff !important; -webkit-text-fill-color: #000 !important; }
        .viewer-3d-sidebar input::placeholder { color: #666 !important; }
      `}} />
      {/* Sidebar - textes forcés en noir pour lisibilité */}
      <aside
        className={`viewer-3d-sidebar ${
          sidebarCollapsed ? "w-12" : "w-80"
        } flex flex-col border-r border-gray-200 bg-white shadow-sm transition-[width] duration-200 flex-shrink-0 text-black`}
        style={{ color: "#000" }}
      >
        <div className="flex items-center justify-between h-12 px-3 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="font-semibold text-black">Viewer 3D</h1>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-1.5 rounded hover:bg-gray-100 text-black"
            aria-label={sidebarCollapsed ? "Ouvrir la barre" : "Réduire la barre"}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-black">
            {/* Modèles 3D + Designs 2D liés */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-black">Modèles 3D &amp; designs 2D</h2>
                <button
                  type="button"
                  onClick={addPair}
                  className="text-xs px-2 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-black"
                >
                  + Ajouter
                </button>
              </div>
              <p className="text-xs text-black/80 mb-2">
                Chaque bloc associe un modèle 3D à un design 2D (optionnel).
              </p>
              <div className="space-y-4">
                {pairs.map((pair, index) => (
                  <div
                    key={pair.id}
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-black">
                        Modèle #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePair(pair.id)}
                        className="text-xs px-1.5 py-0.5 rounded border border-red-200 text-red-700 hover:bg-red-50"
                        title="Supprimer ce modèle"
                      >
                        Supprimer
                      </button>
                    </div>
                    <label className="block">
                      <span className="text-xs text-black">Modèle 3D (GLB/GLTF)</span>
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPairModelUrl(pair.id, URL.createObjectURL(f));
                        }}
                        className="mt-0.5 block w-full text-xs text-black file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-black"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Ou URL du modèle 3D"
                      value={pair.modelUrl ?? ""}
                      onChange={(e) => setPairModelUrl(pair.id, e.target.value.trim() || null)}
                      className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded placeholder:text-gray-600"
                    />
                    <label className="block pt-1 border-t border-gray-200">
                      <span className="text-xs text-black">Design 2D lié à ce modèle</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPairDesign2DUrl(pair.id, URL.createObjectURL(f));
                        }}
                        className="mt-0.5 block w-full text-xs text-black file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-black"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Ou URL du design 2D"
                      value={pair.design2DUrl ?? ""}
                      onChange={(e) => setPairDesign2DUrl(pair.id, e.target.value.trim() || null)}
                      className="w-full px-2 py-1 text-xs text-black border border-gray-300 rounded placeholder:text-gray-600"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Arrière-plan */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Arrière-plan</h2>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={envSettings.backgroundColor}
                  onChange={(e) => updateEnv({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={envSettings.backgroundColor}
                  onChange={(e) => updateEnv({ backgroundColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs text-black border border-gray-300 rounded"
                />
              </div>
            </section>

            {/* Ombres */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Ombres</h2>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-black">Activer les ombres</span>
                <input
                  type="checkbox"
                  checked={envSettings.shadowsEnabled}
                  onChange={(e) => updateEnv({ shadowsEnabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              <label className="block mt-1">
                <span className="text-xs text-black">Type</span>
                <select
                  value={envSettings.shadowMapType}
                  onChange={(e) => updateEnv({ shadowMapType: e.target.value as ShadowMapType })}
                  className="mt-0.5 block w-full px-2 py-1 text-xs text-black border border-gray-300 rounded bg-white"
                >
                  {SHADOW_MAP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* Tone mapping */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Tone mapping</h2>
              <select
                value={envSettings.toneMapping}
                onChange={(e) => updateEnv({ toneMapping: e.target.value as ToneMappingType })}
                className="block w-full px-2 py-1 text-xs text-black border border-gray-300 rounded bg-white"
              >
                {TONE_MAPPING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <SliderRow
                label="Exposition"
                value={envSettings.toneMappingExposure}
                min={0.1}
                max={2}
                onChange={(v) => updateEnv({ toneMappingExposure: v })}
              />
            </section>

            {/* Environnement / Réflexions */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Environnement (réflexions)</h2>
              <select
                value={envSettings.environmentPreset}
                onChange={(e) => updateEnv({ environmentPreset: e.target.value as EnvPreset })}
                className="block w-full px-2 py-1 text-xs text-black border border-gray-300 rounded bg-white"
              >
                {ENV_PRESETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <SliderRow
                label="Intensité env."
                value={envSettings.environmentIntensity}
                min={0}
                max={2}
                onChange={(v) => updateEnv({ environmentIntensity: v })}
              />
            </section>

            {/* Lumières */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Lumières</h2>
              <SliderRow
                label="Ambiante"
                value={envSettings.ambientLightIntensity}
                min={0}
                max={2}
                onChange={(v) => updateEnv({ ambientLightIntensity: v })}
              />
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs text-black">Couleur ambiante</span>
                <input
                  type="color"
                  value={envSettings.ambientLightColor}
                  onChange={(e) => updateEnv({ ambientLightColor: e.target.value })}
                  className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <SliderRow
                label="Key light"
                value={envSettings.directionalKeyIntensity}
                min={0}
                max={5}
                onChange={(v) => updateEnv({ directionalKeyIntensity: v })}
              />
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-black">Key cast shadow</span>
                <input
                  type="checkbox"
                  checked={envSettings.directionalKeyCastShadow}
                  onChange={(e) => updateEnv({ directionalKeyCastShadow: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              <Vec3Input
                label="Key position"
                value={envSettings.directionalKeyPosition}
                onChange={(v) => updateEnv({ directionalKeyPosition: v })}
              />
              <SliderRow
                label="Fill"
                value={envSettings.directionalFillIntensity}
                min={0}
                max={3}
                onChange={(v) => updateEnv({ directionalFillIntensity: v })}
              />
              <Vec3Input
                label="Fill position"
                value={envSettings.directionalFillPosition}
                onChange={(v) => updateEnv({ directionalFillPosition: v })}
              />
              <SliderRow
                label="Rim"
                value={envSettings.directionalRimIntensity}
                min={0}
                max={3}
                onChange={(v) => updateEnv({ directionalRimIntensity: v })}
              />
              <Vec3Input
                label="Rim position"
                value={envSettings.directionalRimPosition}
                onChange={(v) => updateEnv({ directionalRimPosition: v })}
              />
              <SliderRow
                label="Point 1"
                value={envSettings.pointLight1Intensity}
                min={0}
                max={3}
                onChange={(v) => updateEnv({ pointLight1Intensity: v })}
              />
              <Vec3Input
                label="Point 1 position"
                value={envSettings.pointLight1Position}
                onChange={(v) => updateEnv({ pointLight1Position: v })}
              />
              <SliderRow
                label="Point 2"
                value={envSettings.pointLight2Intensity}
                min={0}
                max={3}
                onChange={(v) => updateEnv({ pointLight2Intensity: v })}
              />
              <Vec3Input
                label="Point 2 position"
                value={envSettings.pointLight2Position}
                onChange={(v) => updateEnv({ pointLight2Position: v })}
              />
            </section>

            {/* Grille */}
            <section>
              <h2 className="text-sm font-medium text-black mb-2">Grille</h2>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-black">Afficher la grille</span>
                <input
                  type="checkbox"
                  checked={envSettings.showGrid}
                  onChange={(e) => updateEnv({ showGrid: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              <SliderRow
                label="Taille"
                value={envSettings.gridSize}
                min={1}
                max={50}
                step={1}
                onChange={(v) => updateEnv({ gridSize: v })}
              />
              <SliderRow
                label="Divisions"
                value={envSettings.gridDivisions}
                min={2}
                max={50}
                step={1}
                onChange={(v) => updateEnv({ gridDivisions: v })}
              />
            </section>
          </div>
        )}
      </aside>

      {/* Viewer full screen */}
      <main className="flex-1 min-w-0 relative">
        {/* Fenêtre FPS en haut à droite */}
        <div
          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-md bg-black/70 text-white font-mono text-sm tabular-nums pointer-events-none"
          aria-live="polite"
        >
          {fps} FPS
        </div>
        <Viewer3DScene
          models={viewerModels}
          envSettings={envSettings}
        />
        {viewerModels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm">
            Ajoutez au moins un modèle 3D (bouton « + Ajouter » dans la barre)
          </div>
        )}
      </main>
    </div>
  );
}
