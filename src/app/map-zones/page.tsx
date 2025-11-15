"use client";

import { useState } from "react";

interface Zone {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export default function MapZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentZone, setCurrentZone] = useState<Partial<Zone> | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>('/uploads/designs/2d996078-b261-4bc2-b3b9-329c7243ffa3.svg');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const zoneNames = ['Face', 'Dos', 'Col', 'Manche Gauche', 'Manche Droite'];
  const colors = ['#ff000080', '#00ff0080', '#0000ff80', '#ffff0080', '#ff00ff80'];

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    
    setStartPoint({ x, y });
    setIsDrawing(true);
    
    console.log('🎨 Début de zone:', { x: x.toFixed(3), y: y.toFixed(3) });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    
    setCurrentZone({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !currentZone) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);
    
    // Ne créer une zone que si elle a une taille minimale
    if (width > 0.02 && height > 0.02) {
      const zoneName = zoneNames[zones.length % zoneNames.length];
      const color = colors[zones.length % colors.length];
      
      const newZone: Zone = {
        name: zoneName,
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width,
        height,
        color,
      };
      
      setZones([...zones, newZone]);
      
      console.log('✅ Zone créée:', {
        name: zoneName,
        x: newZone.x.toFixed(3),
        y: newZone.y.toFixed(3),
        width: newZone.width.toFixed(3),
        height: newZone.height.toFixed(3),
      });
    }
    
    setIsDrawing(false);
    setCurrentZone(null);
    setStartPoint(null);
  };

  const exportZones = () => {
    const zonesData = zones.map(z => ({
      name: z.name,
      uv: {
        x: parseFloat(z.x.toFixed(3)),
        y: parseFloat(z.y.toFixed(3)),
        width: parseFloat(z.width.toFixed(3)),
        height: parseFloat(z.height.toFixed(3)),
      }
    }));
    
    console.log('📦 ZONES UV À COPIER :');
    console.log(JSON.stringify(zonesData, null, 2));
    
    alert('Zones copiées dans la console ! Appuyez sur F12 et copiez le JSON.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🗺️ Délimiter les zones UV</h1>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Canvas UV avec zones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">UV Map - Dessinez les zones</h2>
            
            {/* Sélecteur de design */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Texture UV :</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDesign('/uploads/designs/2d996078-b261-4bc2-b3b9-329c7243ffa3.svg')}
                  className={`px-3 py-1 text-sm rounded ${selectedDesign?.includes('2d996078') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Design 1
                </button>
                <button
                  onClick={() => setSelectedDesign('/uploads/designs/b47ee063-362b-42b5-aca6-20eefd820ec7.svg')}
                  className={`px-3 py-1 text-sm rounded ${selectedDesign?.includes('b47ee063') ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Design 2
                </button>
              </div>
            </div>

            {/* Canvas interactif */}
            <div 
              className="relative border-4 border-gray-600 rounded cursor-crosshair select-none"
              style={{ 
                width: '600px', 
                height: '600px',
                backgroundImage: selectedDesign ? `url(${selectedDesign})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Grille */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
                {[...Array(11)].map((_, i) => (
                  <g key={i}>
                    <line x1={`${i * 10}%`} y1="0%" x2={`${i * 10}%`} y2="100%" stroke="white" strokeWidth="1" />
                    <line x1="0%" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="white" strokeWidth="1" />
                  </g>
                ))}
              </svg>

              {/* Zones existantes */}
              {zones.map((zone, i) => (
                <div
                  key={i}
                  className="absolute border-2 pointer-events-none"
                  style={{
                    left: `${zone.x * 100}%`,
                    top: `${zone.y * 100}%`,
                    width: `${zone.width * 100}%`,
                    height: `${zone.height * 100}%`,
                    backgroundColor: zone.color,
                    borderColor: zone.color.replace('80', ''),
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 text-xs font-bold px-1"
                    style={{ 
                      color: 'white',
                      textShadow: '0 0 3px black',
                    }}
                  >
                    {zone.name}
                  </div>
                </div>
              ))}

              {/* Zone en cours de dessin */}
              {isDrawing && currentZone && currentZone.width && currentZone.height && (
                <div
                  className="absolute border-2 border-dashed border-white pointer-events-none"
                  style={{
                    left: `${currentZone.x! * 100}%`,
                    top: `${currentZone.y! * 100}%`,
                    width: `${currentZone.width * 100}%`,
                    height: `${currentZone.height * 100}%`,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }}
                />
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>🖱️ <strong>Cliquez et glissez</strong> pour dessiner une zone rectangulaire</p>
              <p>📝 Les zones seront nommées automatiquement : Face, Dos, Col, Manche G, Manche D</p>
            </div>
          </div>

          {/* Liste des zones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Zones délimitées ({zones.length}/5)</h2>
            
            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune zone définie</p>
                <p className="text-xs mt-1">Dessinez des rectangles sur l'UV map</p>
              </div>
            ) : (
              <div className="space-y-2">
                {zones.map((zone, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded border" style={{ borderColor: zone.color.replace('80', '') }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{zone.name}</span>
                      <button
                        onClick={() => setZones(zones.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ❌
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                      <div>X: {zone.x.toFixed(3)} → {(zone.x + zone.width).toFixed(3)}</div>
                      <div>Y: {zone.y.toFixed(3)} → {(zone.y + zone.height).toFixed(3)}</div>
                      <div>Taille: {zone.width.toFixed(3)} × {zone.height.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="mt-6 space-y-2">
              <button
                onClick={exportZones}
                disabled={zones.length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                📦 Exporter les zones (console)
              </button>
              
              <button
                onClick={() => setZones([])}
                disabled={zones.length === 0}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
              >
                🗑️ Tout effacer
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instructions :</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li>1. <strong>Choisissez un design</strong> pour voir la texture UV</li>
            <li>2. <strong>Dessinez des rectangles</strong> autour de chaque zone (Face, Dos, Col, Manches)</li>
            <li>3. <strong>Ordre de dessin</strong> : Face → Dos → Col → Manche G → Manche D</li>
            <li>4. <strong>Une fois terminé</strong>, cliquez sur "Exporter les zones"</li>
            <li>5. <strong>Copiez le JSON</strong> de la console et envoyez-le moi</li>
            <li>6. Je vais créer un système de mapping automatique basé sur ces zones ! 🎯</li>
          </ol>
        </div>

        {/* Aperçu du code généré */}
        {zones.length > 0 && (
          <div className="mt-6 bg-gray-900 text-gray-100 rounded-lg p-6">
            <h3 className="font-semibold mb-3">💾 Aperçu du code (sera copié dans la console) :</h3>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(zones.map(z => ({
                name: z.name,
                uv: {
                  x: parseFloat(z.x.toFixed(3)),
                  y: parseFloat(z.y.toFixed(3)),
                  width: parseFloat(z.width.toFixed(3)),
                  height: parseFloat(z.height.toFixed(3)),
                }
              })), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}











