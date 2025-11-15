"use client";
import { useEffect, useState } from "react";

type Design = {
  id: string;
  name: string;
  svgUrl: string;
};

type SnapLine = {
  id: string;
  name: string;
  position: [number, number]; // [u, v] coordinates
  type: 'vertical' | 'horizontal';
  designId: string;
};

export default function SnapLinesAdminPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Formulaire pour nouvelle ligne
  const [newLineName, setNewLineName] = useState("");
  const [newLinePosition, setNewLinePosition] = useState<[number, number]>([0.5, 0.5]);
  const [newLineType, setNewLineType] = useState<'vertical' | 'horizontal'>('vertical');
  
  // États pour la duplication
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  useEffect(() => {
    loadDesigns();
  }, []);

  useEffect(() => {
    if (selectedDesignId) {
      loadSnapLines(selectedDesignId);
    } else {
      setSnapLines([]);
    }
  }, [selectedDesignId]);

  const loadDesigns = async () => {
    try {
      const response = await fetch('/api/designs');
      if (response.ok) {
        const data = await response.json();
        setDesigns(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des designs:', error);
    }
  };

  const loadSnapLines = async (designId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/snap-lines?designId=${encodeURIComponent(designId)}`);
      if (response.ok) {
        const data = await response.json();
        setSnapLines(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des snap-lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSnapLine = async () => {
    if (!selectedDesignId || !newLineName.trim()) {
      console.log('❌ Données manquantes:', { selectedDesignId, newLineName });
      return;
    }

    console.log('🔄 Ajout de la snap-line:', {
      name: newLineName,
      position: newLinePosition,
      type: newLineType,
      designId: selectedDesignId
    });

    try {
      const response = await fetch('/api/snap-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLineName,
          position: newLinePosition,
          type: newLineType,
          designId: selectedDesignId
        })
      });

      console.log('📡 Réponse API:', response.status, response.statusText);

      if (response.ok) {
        const newSnapLine = await response.json();
        console.log('✅ Snap-line ajoutée:', newSnapLine);
        setSnapLines([...snapLines, newSnapLine]);
        setNewLineName("");
        setNewLinePosition([0.5, 0.5]);
        setNewLineType('vertical');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        alert(`Erreur lors de l'ajout: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la snap-line:', error);
      alert(`Erreur: ${error}`);
    }
  };

  const deleteSnapLine = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne de magnétisme ?')) return;

    try {
      const response = await fetch(`/api/snap-lines?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSnapLines(snapLines.filter(line => line.id !== id));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la snap-line:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedDesignId) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convertir en coordonnées UV normalisées (0-1)
    const u = x / canvas.width;
    const v = y / canvas.height;
    
    setNewLinePosition([u, v]);
  };

  // Fonction pour dupliquer les snap-lines vers un autre design
  const duplicateSnapLines = async (targetDesignId: string) => {
    if (!selectedDesignId) return;
    
    setDuplicateLoading(true);
    try {
      const response = await fetch('/api/snap-lines/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDesignId: selectedDesignId,
          targetDesignId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur duplication: ${error}`);
      }

      const result = await response.json();
      alert(`✅ ${result.duplicatedCount} lignes magnétiques dupliquées avec succès vers "${result.targetDesign}" !`);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error('Erreur duplication snap-lines:', error);
      alert(`❌ Erreur lors de la duplication: ${error.message}`);
    } finally {
      setDuplicateLoading(false);
    }
  };

  const selectedDesign = designs.find(d => d.id === selectedDesignId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lignes de magnétisme</h1>
      </div>

      {/* Sélection du design */}
      <div className="bg-white p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-3">Sélectionner un design</h2>
        <select
          value={selectedDesignId || ""}
          onChange={(e) => setSelectedDesignId(e.target.value || null)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Choisir un design --</option>
          {designs.map(design => (
            <option key={design.id} value={design.id}>
              {design.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDesignId && selectedDesign && (
        <div className="grid grid-cols-2 gap-6">
          {/* Aperçu UV avec snap-lines */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-3">Aperçu UV - Cliquez pour positionner</h2>
            <div className="relative">
              <canvas
                width={1000}
                height={1000}
                className="border border-gray-300 cursor-crosshair"
                onClick={handleCanvasClick}
                style={{ 
                  backgroundImage: `url(${selectedDesign.svgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              {/* Afficher les snap-lines existantes */}
              {snapLines.map(line => (
                <div
                  key={line.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: line.type === 'vertical' ? `${line.position[0] * 1000}px` : '0px',
                    top: line.type === 'horizontal' ? `${line.position[1] * 1000}px` : '0px',
                    width: line.type === 'vertical' ? '2px' : '1000px',
                    height: line.type === 'vertical' ? '1000px' : '2px',
                    backgroundColor: '#ff0000',
                    transform: line.type === 'vertical' 
                      ? 'translateX(-1px)' 
                      : 'translateY(-1px)'
                  }}
                  title={line.name}
                />
              ))}
              {/* Afficher la position de la nouvelle ligne */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: newLineType === 'vertical' ? `${newLinePosition[0] * 1000}px` : '0px',
                  top: newLineType === 'horizontal' ? `${newLinePosition[1] * 1000}px` : '0px',
                  width: newLineType === 'vertical' ? '2px' : '1000px',
                  height: newLineType === 'vertical' ? '1000px' : '2px',
                  backgroundColor: '#00ff00',
                  transform: newLineType === 'vertical' 
                    ? 'translateX(-1px)' 
                    : 'translateY(-1px)'
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Position: ({newLinePosition[0].toFixed(3)}, {newLinePosition[1].toFixed(3)})
            </p>
          </div>

          {/* Formulaire d'ajout */}
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-3">Ajouter une ligne</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Ex: Centre vertical"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newLineType}
                  onChange={(e) => setNewLineType(e.target.value as 'vertical' | 'horizontal')}
                  className="w-full p-2 border rounded"
                >
                  <option value="vertical">Vertical (ligne complète)</option>
                  <option value="horizontal">Horizontal (ligne complète)</option>
                </select>
              </div>

              <button
                onClick={addSnapLine}
                disabled={!newLineName.trim()}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Ajouter la ligne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des snap-lines existantes */}
      {selectedDesignId && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Lignes existantes</h2>
            {snapLines.length > 0 && (
              <button
                onClick={() => setShowDuplicateModal(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
              >
                Dupliquer vers un autre design
              </button>
            )}
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : snapLines.length === 0 ? (
            <p className="text-gray-500">Aucune ligne de magnétisme pour ce design</p>
          ) : (
            <div className="space-y-2">
              {snapLines.map(line => (
                <div key={line.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{line.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({line.position[0].toFixed(3)}, {line.position[1].toFixed(3)}) - {line.type}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSnapLine(line.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de duplication des snap-lines */}
      {showDuplicateModal && selectedDesignId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Dupliquer les lignes magnétiques</h3>
            <p className="text-gray-600 mb-4">
              Dupliquer les lignes de <strong>{selectedDesign?.name}</strong> vers :
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {designs
                .filter(d => d.id !== selectedDesignId)
                .map(design => (
                  <button
                    key={design.id}
                    className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => duplicateSnapLines(design.id)}
                    disabled={duplicateLoading}
                  >
                    <img 
                      src={design.svgUrl} 
                      alt={design.name} 
                      className="w-12 h-12 object-contain bg-white rounded border" 
                    />
                    <span className="font-medium">{design.name}</span>
                  </button>
                ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowDuplicateModal(false)}
                disabled={duplicateLoading}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}