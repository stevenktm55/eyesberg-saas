"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Model3D = {
  id: string;
  name: string;
  glbUrl: string;
  createdAt: string;
};

export default function ModelsAdminPage() {
  const [models, setModels] = useState<Model3D[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uvDesign, setUvDesign] = useState<File | null>(null);
  const [normalMap, setNormalMap] = useState<File | null>(null);
  const [roughnessMap, setRoughnessMap] = useState<File | null>(null);
  const [metalnessMap, setMetalnessMap] = useState<File | null>(null);
  const [aoMap, setAoMap] = useState<File | null>(null);
  const [materialsSchema, setMaterialsSchema] = useState(`{
    "materials": []
  }`);
  const [loading, setLoading] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/models").then(r => r.json()).then(setModels);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Mode édition : on peut modifier sans re-uploader le GLB
    if (editingModelId) {
      if (!name) return;
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append("id", editingModelId);
        fd.append("name", name);
        if (file) fd.append("file", file); // Optionnel en mode édition
        if (uvDesign) fd.append("uvDesign", uvDesign);
        // Toujours envoyer les champs de texture maps pour permettre la suppression
        fd.append("normalMap", normalMap || "");
        fd.append("roughnessMap", roughnessMap || "");
        fd.append("metalnessMap", metalnessMap || "");
        fd.append("aoMap", aoMap || "");
        fd.append("materialsSchema", materialsSchema);
        
        const res = await fetch("/api/models", { method: "PUT", body: fd });
        if (!res.ok) throw new Error("update failed");
        const updated = await res.json();
        setModels(prev => prev.map(m => m.id === editingModelId ? updated : m));
        
        // Reset form
        setEditingModelId(null);
        setName("");
        setFile(null);
        setUvDesign(null);
        setNormalMap(null);
        setRoughnessMap(null);
        setMetalnessMap(null);
        setAoMap(null);
        setMaterialsSchema(`{\n    "materials": []\n  }`);
      } finally {
        setLoading(false);
      }
    } else {
      // Mode création : GLB obligatoire
      if (!file || !name) return;
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("file", file);
        if (uvDesign) fd.append("uvDesign", uvDesign);
        if (normalMap) fd.append("normalMap", normalMap);
        if (roughnessMap) fd.append("roughnessMap", roughnessMap);
        if (metalnessMap) fd.append("metalnessMap", metalnessMap);
        if (aoMap) fd.append("aoMap", aoMap);
        fd.append("materialsSchema", materialsSchema);
        fd.append("shopDomain", "local.stretchmx");
        const res = await fetch("/api/models", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload failed");
        const created = await res.json();
        setModels(prev => [created, ...prev]);
        setName("");
        setFile(null);
        setUvDesign(null);
        setNormalMap(null);
        setRoughnessMap(null);
        setMetalnessMap(null);
        setAoMap(null);
      } finally {
        setLoading(false);
      }
    }
  }
  
  function startEditing(model: Model3D) {
    setEditingModelId(model.id);
    setName(model.name);
    // Les fichiers ne peuvent pas être pré-remplis, l'utilisateur devra les re-uploader s'il veut les changer
  }
  
  function cancelEditing() {
    setEditingModelId(null);
    setName("");
    setFile(null);
    setUvDesign(null);
    setNormalMap(null);
    setRoughnessMap(null);
    setMetalnessMap(null);
    setAoMap(null);
    setMaterialsSchema(`{\n    "materials": []\n  }`);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">🎨 Modèles 3D</h1>
            <Link 
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingModelId ? "✏️ Modifier le modèle" : "➕ Ajouter un modèle 3D"}
            </h2>
            {editingModelId && (
              <button
                type="button"
                onClick={cancelEditing}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                ✖️ Annuler
              </button>
            )}
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du modèle</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Maillot v1" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier .glb/.gltf {editingModelId ? "(optionnel - laissez vide pour garder l'actuel)" : "*"}
              </label>
              <input type="file" accept=".glb,.gltf" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full" />
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Textures (optionnel)</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Design UV (SVG 4096×4096 ou PNG)</label>
                  <input type="file" accept=".svg,.png,.jpg,.jpeg" onChange={e => setUvDesign(e.target.files?.[0] ?? null)} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">Sera ajouté automatiquement à la bibliothèque de designs</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Normal Map (PNG/JPG)</label>
                  <input type="file" accept=".png,.jpg,.jpeg" onChange={e => setNormalMap(e.target.files?.[0] ?? null)} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">Pour les détails de relief et texture</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roughness Map (PNG/JPG)</label>
                  <input type="file" accept=".png,.jpg,.jpeg" onChange={e => setRoughnessMap(e.target.files?.[0] ?? null)} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">Contrôle la rugosité de la surface</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metalness Map (PNG/JPG)</label>
                  <input type="file" accept=".png,.jpg,.jpeg" onChange={e => setMetalnessMap(e.target.files?.[0] ?? null)} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">Définit les zones métalliques</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AO Map (PNG/JPG)</label>
                  <input type="file" accept=".png,.jpg,.jpeg" onChange={e => setAoMap(e.target.files?.[0] ?? null)} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">Ambient Occlusion pour les ombres</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials schema (JSON - avancé)</label>
              <textarea value={materialsSchema} onChange={e => setMaterialsSchema(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={6} />
            </div>
            
            <button disabled={loading} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
              {loading ? "⏳ Envoi en cours..." : (editingModelId ? "💾 Mettre à jour" : "✅ Ajouter le modèle")}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Modèles existants ({models.length})</h2>
          {models.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p>Aucun modèle 3D pour le moment</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {models.map(m => (
                <li key={m.id} className={`border border-gray-200 p-4 rounded-lg flex items-center gap-4 transition-colors ${editingModelId === m.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                  <span className="font-medium text-gray-900 flex-1">{m.name}</span>
                  <a href={m.glbUrl} className="text-blue-600 hover:underline text-sm" target="_blank" rel="noopener noreferrer">📥 Télécharger</a>
                  <button
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm"
                    onClick={() => startEditing(m)}
                    disabled={editingModelId === m.id}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                    onClick={async () => {
                      if (!confirm(`Supprimer "${m.name}" ?`)) return;
                      await fetch(`/api/models?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
                      setModels(prev => prev.filter(x => x.id !== m.id));
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}