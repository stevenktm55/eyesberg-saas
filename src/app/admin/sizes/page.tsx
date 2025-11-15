'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SizeGuide {
  id?: string;
  measurement_type: string;
  value: string;
}

interface Size {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
  model_type?: string; // 'maillot' ou 'pantalon'
  guide: SizeGuide[];
}

export default function SizesAdminPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formModelType, setFormModelType] = useState<'maillot' | 'pantalon'>('maillot');
  const [formGuide, setFormGuide] = useState<SizeGuide[]>([]);

  useEffect(() => {
    loadSizes();
  }, []);

  async function loadSizes() {
    try {
      const response = await fetch('/api/sizes');
      const data = await response.json();
      setSizes(data);
    } catch (error) {
      console.error('Erreur chargement tailles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function openCreateModal() {
    setEditingSize(null);
    setFormName('');
    setFormOrder(sizes.length);
    setFormModelType('maillot');
    
    // Charger les templates de mesures pour le type sélectionné
    const defaultGuide = await loadMeasurementTemplates('maillot');
    setFormGuide(defaultGuide);
    
    setIsModalOpen(true);
  }
  
  async function loadMeasurementTemplates(modelType: 'maillot' | 'pantalon'): Promise<SizeGuide[]> {
    try {
      const response = await fetch(`/api/measurement-templates?model_type=${modelType}`);
      if (response.ok) {
        const templates = await response.json();
        return templates.map((t: any) => ({ measurement_type: t.measurement_type, value: '' }));
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    }
    return [];
  }

  function openEditModal(size: Size) {
    setEditingSize(size);
    setFormName(size.name);
    setFormOrder(size.display_order);
    setFormModelType((size.model_type as 'maillot' | 'pantalon') || 'maillot');
    setFormGuide(size.guide.length > 0 ? [...size.guide] : [
      { measurement_type: 'Hauteur (cm)', value: '' },
      { measurement_type: 'Poitrine (cm)', value: '' },
      { measurement_type: 'Taille (cm)', value: '' },
      { measurement_type: 'Hanches (cm)', value: '' },
    ]);
    setIsModalOpen(true);
  }

  async function handleSubmit() {
    try {
      if (editingSize) {
        // Mise à jour
        await fetch('/api/sizes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSize.id,
            name: formName,
            display_order: formOrder,
            active: editingSize.active,
            model_type: formModelType,
            guide: formGuide.filter(g => g.value.trim() !== '')
          })
        });
      } else {
        // Création
        await fetch('/api/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            display_order: formOrder,
            model_type: formModelType,
            guide: formGuide.filter(g => g.value.trim() !== '')
          })
        });
      }

      setIsModalOpen(false);
      loadSizes();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette taille ?')) return;

    try {
      await fetch(`/api/sizes?id=${id}`, {
        method: 'DELETE'
      });
      loadSizes();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleToggleActive(size: Size) {
    try {
      await fetch('/api/sizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...size,
          active: !size.active
        })
      });
      loadSizes();
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  }

  function updateGuideItem(index: number, field: 'measurement_type' | 'value', value: string) {
    const newGuide = [...formGuide];
    newGuide[index][field] = value;
    setFormGuide(newGuide);
  }

  function addGuideItem() {
    setFormGuide([...formGuide, { measurement_type: '', value: '' }]);
  }

  function removeGuideItem(index: number) {
    setFormGuide(formGuide.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Gestion des Tailles</h1>
          <p className="text-gray-500 mt-1">Configurer les tailles et le guide des tailles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            ➕ Nouvelle Taille
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Retour Admin
          </Link>
        </div>
      </div>

      {/* Liste des tailles */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sizes.map((size) => (
            <div
              key={size.id}
              className={`bg-white rounded-lg border-2 p-6 ${
                size.active ? 'border-gray-200' : 'border-red-200 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-black">{size.name}</h3>
                  {size.model_type && (
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {size.model_type === 'maillot' ? '👕 Maillot' : '👖 Pantalon'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(size)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      size.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {size.active ? '✓ Actif' : '✗ Inactif'}
                  </button>
                </div>
              </div>

              {/* Guide des tailles */}
              {size.guide.length > 0 && (
                <div className="mb-4 text-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Guide des tailles:</h4>
                  <div className="space-y-1">
                    {size.guide.map((item, index) => (
                      <div key={index} className="flex justify-between text-gray-600">
                        <span>{item.measurement_type}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditModal(size)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => handleDelete(size.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-black">
                {editingSize ? 'Modifier la taille' : 'Nouvelle taille'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Nom de la taille */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la taille *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: M, L, XL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Ordre d'affichage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Type de modèle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de modèle
                </label>
                <select
                  value={formModelType}
                  onChange={async (e) => {
                    const newType = e.target.value as 'maillot' | 'pantalon';
                    setFormModelType(newType);
                    // Charger les templates automatiquement
                    const templates = await loadMeasurementTemplates(newType);
                    setFormGuide(templates);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="maillot">Maillot</option>
                  <option value="pantalon">Pantalon</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Les tailles pour le modèle pantalon seront différentes des tailles maillot
                </p>
              </div>

              {/* Guide des tailles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Guide des tailles
                  </label>
                  <button
                    onClick={addGuideItem}
                    className="px-3 py-1 bg-gray-100 text-black rounded hover:bg-gray-200 text-sm font-medium"
                  >
                    ➕ Ajouter une mesure
                  </button>
                </div>
                <div className="space-y-3">
                  {formGuide.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={item.measurement_type}
                        onChange={(e) => updateGuideItem(index, 'measurement_type', e.target.value)}
                        placeholder="Type de mesure"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateGuideItem(index, 'value', e.target.value)}
                        placeholder="Valeur"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        onClick={() => removeGuideItem(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formName.trim()}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSize ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
