import { create } from "zustand";

export type ConfigState = {
  modelUrl: string | null;
  color: string;
  text: string;
  logoUrl: string | null;
  materialsFilter: string[]; // apply color only to these materials
  materialColors: Record<string, string>; // per-material color map
  decal: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    designUrl: string | null;
    editable: boolean;
  };
  logo: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    editable: boolean;
  };
  text3d: {
    position: [number, number, number];
    rotation: [number, number, number];
    fontSize: number;
    editable: boolean;
  };

  snapshots: Array<{ id: string; thumbDataUrl: string; state: any; createdAt: number }>;

  history: Array<Pick<ConfigState, "modelUrl" | "color" | "text" | "logoUrl" | "materialsFilter">>;
  future: Array<Pick<ConfigState, "modelUrl" | "color" | "text" | "logoUrl" | "materialsFilter">>;

  setModelUrl: (url: string | null) => void;
  setColor: (c: string) => void;
  setText: (t: string) => void;
  setLogoUrl: (u: string | null) => void;
  setMaterialsFilter: (names: string[]) => void;
  setMaterialColor: (name: string, color: string) => void;
  setDecal: (partial: Partial<ConfigState["decal"]>) => void;
  setLogo: (partial: Partial<ConfigState["logo"]>) => void;
  setText3d: (partial: Partial<ConfigState["text3d"]>) => void;
  addSnapshot: (thumbDataUrl: string) => void;
  restoreFromSnapshot: (state: any) => void;

  undo: () => void;
  redo: () => void;
};

function snapshot(s: ConfigState) {
  return {
    modelUrl: s.modelUrl,
    color: s.color,
    text: s.text,
    logoUrl: s.logoUrl,
    materialsFilter: s.materialsFilter.slice(),
  };
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  modelUrl: null,
  color: "#ffffff",
  text: "STRETCHMX",
  logoUrl: null,
  materialsFilter: [],
  materialColors: {},
  decal: { position: [0, 0.6, 0.52], rotation: [0, 0, 0], scale: 0.6, designUrl: null, editable: false },
  logo: { position: [0, 0.6, 0.51], rotation: [0, 0, 0], scale: 0.3, editable: false },
  text3d: { position: [0, -0.9, 0], rotation: [0, 0, 0], fontSize: 0.18, editable: false },

  snapshots: [],

  history: [],
  future: [],

  setModelUrl: (url) => set((s) => ({ history: [...s.history, snapshot(s)], future: [], modelUrl: url })),
  setColor: (c) => set((s) => ({ history: [...s.history, snapshot(s)], future: [], color: c })),
  setText: (t) => set((s) => ({ history: [...s.history, snapshot(s)], future: [], text: t })),
  setLogoUrl: (u) => set((s) => ({ history: [...s.history, snapshot(s)], future: [], logoUrl: u })),
  setMaterialsFilter: (names) => set((s) => ({ history: [...s.history, snapshot(s)], future: [], materialsFilter: names })),
  setMaterialColor: (name, color) => set((s) => ({
    history: [...s.history, snapshot(s)],
    future: [],
    materialColors: { ...s.materialColors, [name]: color },
  })),
  setDecal: (partial) => set((s) => ({
    history: [...s.history, snapshot(s)],
    future: [],
    decal: { ...s.decal, ...partial },
  })),
  setLogo: (partial) => set((s) => ({
    history: [...s.history, snapshot(s)],
    future: [],
    logo: { ...s.logo, ...partial },
  })),
  setText3d: (partial) => set((s) => ({
    history: [...s.history, snapshot(s)],
    future: [],
    text3d: { ...s.text3d, ...partial },
  })),
  addSnapshot: (thumbDataUrl) => set((s) => ({
    snapshots: [
      { id: crypto.randomUUID(), thumbDataUrl, state: snapshot(s), createdAt: Date.now() },
      ...s.snapshots,
    ],
  })),
  restoreFromSnapshot: (state) => set((s) => ({
    history: [...s.history, snapshot(s)],
    future: [],
    modelUrl: state.modelUrl ?? s.modelUrl,
    color: state.color ?? s.color,
    text: state.text ?? s.text,
    logoUrl: state.logoUrl ?? s.logoUrl,
    materialsFilter: state.materialsFilter ?? s.materialsFilter,
    materialColors: state.materialColors ?? s.materialColors,
    decal: state.decal ?? s.decal,
  })),

  undo: () => set((s) => {
    if (s.history.length === 0) return s as any;
    const prev = s.history[s.history.length - 1];
    const history = s.history.slice(0, -1);
    const current = snapshot(s);
    return { ...s, ...prev, history, future: [current, ...s.future] } as any;
  }),
  redo: () => set((s) => {
    if (s.future.length === 0) return s as any;
    const next = s.future[0];
    const future = s.future.slice(1);
    const current = snapshot(s);
    return { ...s, ...next, future, history: [...s.history, current] } as any;
  }),
}));


