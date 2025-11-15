"use client";

import { useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Zone {
  name: string;
  points: Point[];
  color: string;
}

export default function MapZonesPolygonPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Face');
  const [selectedDesign, setSelectedDesign] = useState<string>('/uploads/designs/2d996078-b261-4bc2-b3b9-329c7243ffa3.svg');

  const zoneNames = ['Face', 'Dos', 'Col', 'Manche Gauche', 'Manche Droite', 'Custom'];
  const colors = ['#ff000080', '#00ff0080', '#0000ff80', '#ffff0080', '#ff00ff80', '#00ffff80'];

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);
    
    const newPoint = { x, y };
    setCurrentPoints([...currentPoints, newPoint]);
    
    console.log(`📍 Point ${currentPoints.length + 1}:`, { x: x.toFixed(3), y: y.toFixed(3) });
  };

  const finishZone = () => {
    if (currentPoints.length < 3) {
      alert('Il faut au moins 3 points pour créer une zone !');
      return;
    }

    const color = colors[zones.length % colors.length];
    const newZone: Zone = {
      name: currentZoneName,
      points: currentPoints,
      color,
    };

    setZones([...zones, newZone]);
    setCurrentPoints([]);
    
    console.log('✅ Zone créée:', {
      name: currentZoneName,
      pointsCount: currentPoints.length,
      points: currentPoints.map(p => ({ x: p.x.toFixed(3), y: p.y.toFixed(3) })),
    });
  };

  const cancelCurrentZone = () => {
    setCurrentPoints([]);
  };

  const exportZones = () => {
    const zonesData = zones.map(z => ({
      name: z.name,
      polygon: z.points.map(p => ({
        x: parseFloat(p.x.toFixed(3)),
        y: parseFloat(p.y.toFixed(3)),
      }))
    }));
    
    console.log('📦 ZONES UV (POLYGONES) À COPIER :');
    console.log(JSON.stringify(zonesData, null, 2));
    
    // Créer aussi un format pour le code
    console.log('\n📝 FORMAT CODE :');
    console.log('const UV_ZONES = ' + JSON.stringify(zonesData, null, 2) + ';');
    
    alert('Zones copiées dans la console ! Appuyez sur F12 et copiez le JSON.');
  };

  // Convertir les points en string SVG path
  const pointsToSVGPath = (points: Point[]) => {
    if (points.length === 0) return '';
    const pathParts = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'}${p.x * 600},${p.y * 600}`
    );
    return pathParts.join(' ') + ' Z';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🗺️ Délimiter les zones UV (Polygones)</h1>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Canvas UV avec zones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">UV Map - Cliquez pour créer des polygones</h2>
            
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

            {/* Nom de la zone en cours */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Zone en cours :</label>
              <select 
                value={currentZoneName} 
                onChange={(e) => setCurrentZoneName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {zoneNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
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
              onClick={handleCanvasClick}
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

              {/* Zones finalisées */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {zones.map((zone, i) => (
                  <g key={i}>
                    <path
                      d={pointsToSVGPath(zone.points)}
                      fill={zone.color}
                      stroke={zone.color.replace('80', '')}
                      strokeWidth="2"
                    />
                    <text
                      x={zone.points[0].x * 600}
                      y={zone.points[0].y * 600}
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      style={{ textShadow: '0 0 3px black' }}
                    >
                      {zone.name}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Zone en cours de dessin */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {currentPoints.length > 0 && (
                  <g>
                    {/* Lignes entre les points */}
                    {currentPoints.map((point, i) => {
                      if (i === 0) return null;
                      const prevPoint = currentPoints[i - 1];
                      return (
                        <line
                          key={i}
                          x1={prevPoint.x * 600}
                          y1={prevPoint.y * 600}
                          x2={point.x * 600}
                          y2={point.y * 600}
                          stroke="white"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      );
                    })}
                    {/* Ligne de retour au premier point (preview) */}
                    {currentPoints.length > 2 && (
                      <line
                        x1={currentPoints[currentPoints.length - 1].x * 600}
                        y1={currentPoints[currentPoints.length - 1].y * 600}
                        x2={currentPoints[0].x * 600}
                        y2={currentPoints[0].y * 600}
                        stroke="white"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.5"
                      />
                    )}
                    {/* Points */}
                    {currentPoints.map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x * 600}
                        cy={point.y * 600}
                        r="5"
                        fill="white"
                        stroke="black"
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>

            <div className="mt-4 space-y-2">
              {currentPoints.length > 0 && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Zone "{currentZoneName}" : {currentPoints.length} points
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={finishZone}
                        disabled={currentPoints.length < 3}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                      >
                        ✅ Terminer cette zone
                      </button>
                      <button
                        onClick={cancelCurrentZone}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <p>🖱️ <strong>Cliquez</strong> pour ajouter des points au polygone</p>
                <p>✅ Minimum 3 points pour former une zone</p>
                <p>🔄 Les points se connectent automatiquement</p>
              </div>
            </div>
          </div>

          {/* Liste des zones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Zones délimitées ({zones.length}/5)</h2>
            
            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune zone définie</p>
                <p className="text-xs mt-1">Cliquez sur l'UV map pour créer des polygones</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {zones.map((zone, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded border" style={{ borderColor: zone.color.replace('80', '') }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{zone.name}</span>
                      <button
                        onClick={() => setZones(zones.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                      <div>{zone.points.length} points</div>
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
            <li>2. <strong>Sélectionnez le nom de la zone</strong> (Face, Dos, Col, etc.)</li>
            <li>3. <strong>Cliquez sur l'UV map</strong> pour ajouter des points au polygone</li>
            <li>4. <strong>Tracez le contour</strong> de la zone en cliquant autour (minimum 3 points)</li>
            <li>5. <strong>Cliquez sur "✅ Terminer cette zone"</strong> quand vous avez fini</li>
            <li>6. <strong>Répétez</strong> pour les 5 zones (Face, Dos, Col, Manche G, Manche D)</li>
            <li>7. <strong>Exportez</strong> et envoyez-moi le JSON</li>
          </ol>
        </div>

        {/* Légende des couleurs */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">🎨 Légende des zones :</h3>
          <div className="grid grid-cols-5 gap-2">
            {zoneNames.slice(0, 5).map((name, i) => (
              <div key={name} className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border-2 border-gray-600"
                  style={{ backgroundColor: colors[i] }}
                />
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}











