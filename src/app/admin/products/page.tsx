"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Mapping = {
  id: string;
  shopify_product_id: string;
  model_id: string;
  design_ids: string[];
  model_type?: 'maillot' | 'pantalon';
  created_at: string;
};

type ModelItem = { id: string; name: string };
type DesignItem = { id: string; name: string };

export default function ProductMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [shopifyProductId, setShopifyProductId] = useState('');
  const [modelId, setModelId] = useState('');
  const [designIds, setDesignIds] = useState<string[]>([]);
  const [modelType, setModelType] = useState<'maillot' | 'pantalon'>('maillot');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadAll() {
    const [mapRes, modelsRes, designsRes] = await Promise.all([
      fetch('/api/product-mappings'),
      fetch('/api/models'),
      fetch('/api/designs'),
    ]);
    const mapJson = await mapRes.json();
    const modelsJson = await modelsRes.json();
    const designsJson = await designsRes.json();
    setMappings(Array.isArray(mapJson) ? mapJson : []);
    setModels((modelsJson?.items || modelsJson || []).map((m: any) => ({ id: m.id, name: m.name || m.fileName || m.id })));
    setDesigns((designsJson || []).map((d: any) => ({ id: d.id, name: d.name })));
  }

  useEffect(() => { loadAll(); }, []);

  async function saveMapping(e: React.FormEvent) {
    e.preventDefault();
    if (!shopifyProductId || !modelId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = editingId 
        ? await fetch('/api/product-mappings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: editingId,
              shopify_product_id: shopifyProductId.trim(), 
              model_id: modelId, 
              design_ids: designIds,
              model_type: modelType
            }),
          })
        : await fetch('/api/product-mappings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              shopify_product_id: shopifyProductId.trim(), 
              model_id: modelId, 
              design_ids: designIds,
              model_type: modelType
            }),
          });
      if (!res.ok) {
        const msg = await res.text().catch(()=>'');
        setError(msg || `Erreur ${res.status}`);
        return;
      }
      setSuccess(editingId ? 'Mapping modifié avec succès' : 'Mapping créé avec succès');
      resetForm();
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setShopifyProductId('');
    setModelId('');
    setDesignIds([]);
    setModelType('maillot');
    setEditingId(null);
  }

  function startEditing(mapping: Mapping) {
    setShopifyProductId(mapping.shopify_product_id);
    setModelId(mapping.model_id);
    setDesignIds(mapping.design_ids || []);
    setModelType(mapping.model_type || 'maillot');
    setEditingId(mapping.id);
    setError(null);
    setSuccess(null);
    // Scroll to form
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function removeMapping(id: string) {
    if (!confirm('Supprimer ce mapping ?')) return;
    await fetch(`/api/product-mappings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadAll();
  }

  const toggleDesign = (id: string) => {
    setDesignIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Produits Shopify → Modèle & Designs</h1>

      <form onSubmit={saveMapping} className="space-y-3 border p-4 rounded bg-white">
        {error && (
          <div className="p-2 text-sm rounded bg-red-50 border border-red-200 text-red-700">{error}</div>
        )}
        {success && (
          <div className="p-2 text-sm rounded bg-green-50 border border-green-200 text-green-700">{success}</div>
        )}
        <div>
          <label className="block text-sm font-medium">ID produit Shopify</label>
          <input value={shopifyProductId} onChange={e => setShopifyProductId(e.target.value)} className="w-full border rounded p-2" placeholder="ex: 12345678901234" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Modèle 3D</label>
          <select value={modelId} onChange={e => setModelId(e.target.value)} className="w-full border rounded p-2" required>
            <option value="">— Sélectionner —</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Modal de taille à utiliser</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="maillot" 
                checked={modelType === 'maillot'} 
                onChange={(e) => setModelType(e.target.value as 'maillot')}
              />
              <span>Maillot</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="pantalon" 
                checked={modelType === 'pantalon'} 
                onChange={(e) => setModelType(e.target.value as 'pantalon')}
              />
              <span>Pantalon</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Designs autorisés</label>
          <div className="grid grid-cols-2 gap-2">
            {designs.map(d => (
              <label key={d.id} className="flex items-center gap-2 text-sm border rounded p-2">
                <input type="checkbox" checked={designIds.includes(d.id)} onChange={() => toggleDesign(d.id)} />
                <span className="truncate">{d.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {loading ? 'Enregistrement…' : editingId ? 'Modifier le mapping' : 'Créer le mapping'}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={resetForm} 
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-2">
        {mappings.map(m => (
          <li key={m.id} className="border rounded p-3 bg-white">
            <div className="text-sm text-black"><span className="font-medium">Produit:</span> {m.shopify_product_id}</div>
            <div className="text-sm text-black"><span className="font-medium">Modèle:</span> {(models.find(x=>x.id===m.model_id)?.name) || m.model_id}</div>
            <div className="text-sm text-black"><span className="font-medium">Modal de taille:</span> <span className={`inline-block px-2 py-1 rounded text-xs ${m.model_type === 'pantalon' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{m.model_type || 'maillot'}</span></div>
            <div className="text-sm text-black"><span className="font-medium">Designs:</span> {m.design_ids.map(id => designs.find(x=>x.id===id)?.name || id).join(', ') || '—'}</div>
            <div className="mt-2 flex gap-3">
              <Link 
                href={`/admin/products/${m.id}/editor`}
                className="text-blue-600 hover:underline font-medium"
              >
                ✏️ Éditer (3D)
              </Link>
              <button onClick={() => startEditing(m)} className="text-blue-600 hover:underline">Modifier</button>
              <button onClick={() => removeMapping(m.id)} className="text-red-600 hover:underline">Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


