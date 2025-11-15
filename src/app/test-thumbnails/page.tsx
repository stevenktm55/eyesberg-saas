"use client";

import { useEffect, useState } from "react";

export default function TestThumbnails() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDesigns() {
      try {
        console.log('🔍 Chargement des designs...');
        const response = await fetch('/api/designs');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Designs chargés:', data);
        setDesigns(data);
      } catch (err: any) {
        console.error('❌ Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDesigns();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Thumbnails</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Thumbnails</h1>
        <p className="text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Thumbnails</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Données brutes:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(designs, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Affichage des thumbnails:</h2>
        <div className="grid grid-cols-3 gap-4">
          {designs.map((design) => (
            <div key={design.id} className="border rounded p-4">
              <h3 className="font-medium mb-2">{design.name}</h3>
              
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">thumbUrl présent: {design.thumbUrl ? '✅ OUI' : '❌ NON'}</p>
                {design.thumbUrl && (
                  <p className="text-xs text-gray-500 break-all">{design.thumbUrl}</p>
                )}
              </div>

              {design.thumbUrl && (
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1">Thumbnail:</p>
                  <div className="bg-white border rounded p-2">
                    <img 
                      src={design.thumbUrl} 
                      alt={design.name}
                      className="w-full h-32 object-contain"
                      onLoad={() => console.log(`✅ Image chargée: ${design.name}`)}
                      onError={(e) => {
                        console.error(`❌ Erreur chargement image: ${design.name}`, e);
                        console.error(`URL: ${design.thumbUrl}`);
                      }}
                    />
                  </div>
                </div>
              )}

              {design.svgUrl && (
                <div>
                  <p className="text-sm font-medium mb-1">SVG (fallback):</p>
                  <div className="bg-white border rounded p-2">
                    <img 
                      src={design.svgUrl} 
                      alt={design.name}
                      className="w-full h-32 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {designs.length === 0 && (
        <p className="text-gray-600">Aucun design trouvé.</p>
      )}
    </div>
  );
}
