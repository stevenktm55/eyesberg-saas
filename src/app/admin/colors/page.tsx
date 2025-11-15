"use client";
import { useEffect, useState } from "react";

type Palette = { id: string; name: string; colors: Array<{ hex: string; name: string }> };

export default function ColorsAdminPage() {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [name, setName] = useState("");
  const [colors, setColors] = useState<Array<{ hex: string; name: string }>>([
    { hex: "#000000", name: "Noir" },
    { hex: "#ffffff", name: "Blanc" },
    { hex: "#ff0000", name: "Rouge" },
  ]);
  const [loading, setLoading] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  async function refresh() {
    const res = await fetch("/api/palettes");
    const list = await res.json();
    setPalettes(list);
  }

  useEffect(() => { refresh(); }, []);

  function updateColorHex(idx: number, value: string) {
    setColors(prev => prev.map((c, i) => i === idx ? { ...c, hex: value } : c));
  }

  function updateColorName(idx: number, value: string) {
    setColors(prev => prev.map((c, i) => i === idx ? { ...c, name: value } : c));
  }

  function addColor() {
    setColors(prev => [...prev, { hex: "#000000", name: "" }]);
  }

  function removeColor(idx: number) {
    setColors(prev => prev.filter((_, i) => i !== idx));
  }

  function moveColorUp(idx: number) {
    if (idx === 0) return;
    setColors(prev => {
      const newColors = [...prev];
      [newColors[idx - 1], newColors[idx]] = [newColors[idx], newColors[idx - 1]];
      return newColors;
    });
  }

  function moveColorDown(idx: number) {
    if (idx === colors.length - 1) return;
    setColors(prev => {
      const newColors = [...prev];
      [newColors[idx], newColors[idx + 1]] = [newColors[idx + 1], newColors[idx]];
      return newColors;
    });
  }

  // Drag & drop reordering
  function onDragStart(idx: number) {
    setDraggingIdx(idx);
  }
  function onDragEnter(overIdx: number) {
    if (draggingIdx === null || draggingIdx === overIdx) return;
    setColors(prev => {
      const list = [...prev];
      const [moved] = list.splice(draggingIdx, 1);
      list.splice(overIdx, 0, moved);
      return list;
    });
    setDraggingIdx(overIdx);
  }
  function onDragEnd() {
    setDraggingIdx(null);
  }

  function startEditing(palette: Palette) {
    setEditingPaletteId(palette.id);
    setName(palette.name);
    setColors(palette.colors);
  }

  function cancelEditing() {
    setEditingPaletteId(null);
    setName("");
    setColors([
      { hex: "#000000", name: "Noir" },
      { hex: "#ffffff", name: "Blanc" },
      { hex: "#ff0000", name: "Rouge" },
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || colors.length === 0) return;
    setLoading(true);
    try {
      if (editingPaletteId) {
        // Mode édition
        const res = await fetch("/api/palettes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPaletteId, name, colors }),
        });
        if (!res.ok) throw new Error("update failed");
        setEditingPaletteId(null);
      } else {
        // Mode création
        const res = await fetch("/api/palettes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, colors }),
        });
        if (!res.ok) throw new Error("save failed");
      }
      setName("");
      setColors([
        { hex: "#000000", name: "Noir" },
        { hex: "#ffffff", name: "Blanc" },
        { hex: "#ff0000", name: "Rouge" },
      ]);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Couleurs</h1>
        <form onSubmit={onSubmit} className="space-y-3 border p-4 rounded bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">
            {editingPaletteId ? "✏️ Modifier la palette" : "➕ Créer une palette"}
          </h2>
          {editingPaletteId && (
            <button
              type="button"
              onClick={cancelEditing}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
            >
              ✖️ Annuler
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Nom de la palette</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded p-2" placeholder="Palette team A" />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Couleurs</div>
          <div className="space-y-2">
            {colors.map((c, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 ${draggingIdx === idx ? 'opacity-70' : ''}`}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveColorUp(idx)}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                    title="Monter"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveColorDown(idx)}
                    disabled={idx === colors.length - 1}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                    title="Descendre"
                  >
                    ▼
                  </button>
                </div>
                <input type="color" value={c.hex} onChange={e => updateColorHex(idx, e.target.value)} className="w-12 h-10" />
                <input
                  className="border rounded p-2 flex-1 text-sm"
                  placeholder="Nom (ex: Rouge équipe)"
                  value={c.name}
                  onChange={e => updateColorName(idx, e.target.value)}
                />
                <button type="button" className="text-red-600 hover:text-red-800 text-sm px-2" onClick={() => removeColor(idx)}>🗑️</button>
              </div>
            ))}
          </div>
          <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={addColor}>+ Ajouter une couleur</button>
        </div>
        <button disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
          {loading ? "⏳ Enregistrement..." : (editingPaletteId ? "💾 Mettre à jour" : "✅ Enregistrer la palette")}
        </button>
      </form>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Palettes existantes ({palettes.length})</h2>
        {palettes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded">
            <p>Aucune palette pour le moment</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {palettes.map(p => (
              <li key={p.id} className={`border p-4 rounded bg-white transition-colors ${editingPaletteId === p.id ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-lg">{p.name}</div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm"
                      onClick={() => startEditing(p)}
                      disabled={editingPaletteId === p.id}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                      onClick={async () => { 
                        if (!confirm(`Supprimer la palette "${p.name}" ?`)) return;
                        await fetch(`/api/palettes?id=${encodeURIComponent(p.id)}`, { method: "DELETE" }); 
                        await refresh(); 
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {p.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border">
                      <div className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm" style={{ backgroundColor: c.hex }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{c.name || "Sans nom"}</span>
                        <span className="text-xs text-gray-500">{c.hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}




