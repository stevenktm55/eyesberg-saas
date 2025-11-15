"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { loadZoneMap, detectZone, getZoneDisplayName, type ZoneName } from "@/utils/uvZoneDetector";

interface TextZone {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  image?: string; // Chemin vers l'image de la vignette
  categories?: string[]; // Catégories: 'text', 'nom', 'numero', 'logo-torse', 'logo-dos', 'logo-bras-gauche', 'logo-bras-droit'
  // Dimensions éventuellement persistées côté API
  defaultLogoWidth?: number;
  defaultLogoHeight?: number;
  defaultTextWidth?: number;
  defaultTextHeight?: number;
  defaultRotation?: number; // Rotation par défaut en degrés
  zoneCategory?: string;
  view?: 'front' | 'back' | 'left' | 'right'; // Vue du vêtement
}

interface Design {
  id: string;
  name: string;
  svgUrl: string;
  thumbnailUrl?: string;
}

export default function TextZonesAdmin() {
  const [zones, setZones] = useState<TextZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingZone, setIsPlacingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [clickPosition, setClickPosition] = useState<{ u: number; v: number; zone: ZoneName } | null>(null);
  const [previewPos, setPreviewPos] = useState<{ u: number; v: number } | null>(null);
  const [zoneMapCanvas, setZoneMapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['nom']);
  const [selectedZoneCategory, setSelectedZoneCategory] = useState<string>('torse');
  const [selectedView, setSelectedView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  // Dimensions par défaut pour les logos (en pixels UV 0-4096)
  const [defaultLogoWidth, setDefaultLogoWidth] = useState<number>(600);
  const [defaultLogoHeight, setDefaultLogoHeight] = useState<number>(250);
  // String inputs (logos) pour saisie libre + validation au blur
  const [defaultLogoWidthInput, setDefaultLogoWidthInput] = useState<string>(String(600));
  const [defaultLogoHeightInput, setDefaultLogoHeightInput] = useState<string>(String(250));
  // Dimensions par défaut pour les textes (en pixels UV 0-4096)
  const [defaultTextWidth, setDefaultTextWidth] = useState<number>(900);
  const [defaultTextHeight, setDefaultTextHeight] = useState<number>(200);
  // String inputs to allow free typing before validation
  const [defaultTextWidthInput, setDefaultTextWidthInput] = useState<string>(String(900));
  const [defaultTextHeightInput, setDefaultTextHeightInput] = useState<string>(String(200));
  // Rotation par défaut (en degrés)
  const [defaultRotation, setDefaultRotation] = useState<number>(0);
  const uvMapRef = useRef<HTMLDivElement>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string>('');
  const [selectedDesignUrl, setSelectedDesignUrl] = useState<string>('');
  const [uvNaturalSize, setUvNaturalSize] = useState<{w:number;h:number}|null>(null);
  const [uvRenderedSize, setUvRenderedSize] = useState<{w:number;h:number}>({ w: 512, h: 512 });

  // Presets globaux réutilisables
  const [globalPresets, setGlobalPresets] = useState<Array<{ id: string; name: string }>>([]);
  const [newPresetName, setNewPresetName] = useState<string>('');
  
  // Duplication des zones
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [sourceDesignId, setSourceDesignId] = useState<string>('');
  const [targetDesignId, setTargetDesignId] = useState<string>('');
  const [duplicating, setDuplicating] = useState<boolean>(false);

  // Debug infos
  const [debugCounts, setDebugCounts] = useState<Array<{ designId: string | null; count: number }>>([]);
  const [debugNullZones, setDebugNullZones] = useState<TextZone[]>([]);

  // Charger les designs disponibles
  useEffect(() => {
    async function loadDesigns() {
      try {
        const response = await fetch('/api/designs');
        if (response.ok) {
          const data = await response.json();
          setDesigns(data);
          // Sélectionner le premier design par défaut
          if (data.length > 0) {
            setSelectedDesignId(data[0].id);
            setSelectedDesignUrl(data[0].svgUrl);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des designs:', error);
      }
    }
    loadDesigns();
  }, []);

  useEffect(() => {
    // Vider les zones lors du changement de design pour éviter l'affichage résiduel
    setZones([]);
    if (!selectedDesignId) {
      setIsLoading(false);
      return;
    }
    loadZones();
    // Charger la zone map pour la détection de couleur
    async function loadMap() {
      if (!selectedDesignUrl) return;
      
      const canvas = await loadZoneMap(selectedDesignUrl);
      if (canvas) {
        setZoneMapCanvas(canvas);
        console.log('✅ Zone map chargée pour l\'admin');
      }
    }
    loadMap();

    // Debug: charger répartition et zones nulles
    (async () => {
      try {
        const res = await fetch('/api/text-zones');
        if (res.ok) {
          const list: any[] = await res.json();
          const counts = new Map<string | null, number>();
          list.forEach(z => {
            const key = z.designId || null;
            counts.set(key, (counts.get(key) || 0) + 1);
          });
          setDebugCounts(Array.from(counts.entries()).map(([designId, count]) => ({ designId, count })));
          setDebugNullZones(list.filter(z => !z.designId));
        }
      } catch {}
    })();

    // Charger les presets globaux
    (async () => {
      try {
        const res = await fetch('/api/zone-categories');
        if (res.ok) setGlobalPresets(await res.json());
      } catch {}
    })();
  }, [selectedDesignUrl, selectedDesignId]);

  const loadZones = async () => {
    try {
      const qs = selectedDesignId ? `?designId=${encodeURIComponent(selectedDesignId)}` : '';
      const response = await fetch(`/api/text-zones${qs}`);
      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUVMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingZone || !uvMapRef.current || !zoneMapCanvas) return;

    const rect = uvMapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convertir en coordonnées de l'image (0-1 sur l'image affichée 512x512)
    const imageU = (x / rect.width); // Position sur l'image (responsive)
    const imageV = (y / rect.height); // Position sur l'image (responsive)
    setPreviewPos({ u: imageU, v: imageV });
    
    // IMPORTANT : L'image SVG affichée correspond à l'UV map BRUTE
    // Les coordonnées brutes du modèle ont U ∈ [0.044, 0.982], V ∈ [-1, 0]
    const U_MIN = 0.044, U_MAX = 0.982;
    const U_RANGE = U_MAX - U_MIN;
    
    // Reconvertir vers les coordonnées brutes du modèle POUR LA DÉTECTION
    const rawU = U_MIN + (imageU * U_RANGE);
    const rawV = imageV - 1; // L'image va de 0 (haut) à 1 (bas), rawV va de -1 (bas) à 0 (haut)
    
    // Pour detectZone, utiliser les coordonnées BRUTES corrigées (comme dans le test)
    const detectionU = rawU;
    const detectionV = rawV + 1; // Ramener V de [-1,0] vers [0,1]
    
    const zone = detectZone([detectionU, detectionV], zoneMapCanvas);
    
    // Pour le stockage, utiliser les coordonnées NORMALISÉES (pour le ModelViewer)
    const normalizedU = (rawU - U_MIN) / U_RANGE;
    const normalizedV = imageV; // Stocker directement imageV (pas d'inversion ici)
    
    console.log('🎯 Clic admin:');
    console.log('  Image:', { x, y });
    console.log('  Raw UV (modèle):', [rawU.toFixed(3), rawV.toFixed(3)]);
    console.log('  Detection UV:', [detectionU.toFixed(3), detectionV.toFixed(3)]);
    console.log('  Normalized UV (stocké):', [normalizedU.toFixed(3), normalizedV.toFixed(3)]);
    console.log('  Zone:', zone);

    setClickPosition({ u: normalizedU, v: normalizedV, zone });
  };

  // Gérer la sélection d'image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload de l'image
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/zone-images', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.imagePath;
      } else {
        console.error('Erreur lors de l\'upload de l\'image');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleConfirmZone = async () => {
    if (!newZoneName.trim() || !clickPosition) return;

    try {
      // Upload de l'image si une nouvelle image est sélectionnée, sinon garder l'existante
      const uploadedImagePath = await uploadImage();
      const finalImagePath = uploadedImagePath || existingImageUrl;
      
      // Coercer les dimensions entrées librement AVANT sauvegarde (évite dépendance au blur)
      const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
      const effTextW = clamp(Number(defaultTextWidthInput || defaultTextWidth) || defaultTextWidth, 10, 4096);
      const effTextH = clamp(Number(defaultTextHeightInput || defaultTextHeight) || defaultTextHeight, 10, 4096);
      const effLogoW = clamp(Number(defaultLogoWidthInput || defaultLogoWidth) || defaultLogoWidth, 10, 4096);
      const effLogoH = clamp(Number(defaultLogoHeightInput || defaultLogoHeight) || defaultLogoHeight, 10, 4096);

      const newZone = {
        designId: selectedDesignId || undefined,
        name: newZoneName,
        position: [clickPosition.u, clickPosition.v, 0] as [number, number, number],
        color: clickPosition.zone, // Zone détectée par la couleur du pixel
        image: finalImagePath, // Utiliser la nouvelle image ou garder l'existante
        categories: selectedCategories.includes('logo') ? [`logo-${selectedZoneCategory}`] : selectedCategories, // Catégories avec zone spécifique pour logos
        zoneCategory: selectedZoneCategory,
        view: selectedView,
        // Dimensions par défaut pour les logos (si zone de logo)
        defaultLogoWidth: selectedCategories.includes('logo') ? effLogoW : undefined,
        defaultLogoHeight: selectedCategories.includes('logo') ? effLogoH : undefined,
        // Dimensions par défaut pour les textes (si zone nom/numero)
        defaultTextWidth: selectedCategories.some(c => ['nom','numero'].includes(c)) ? effTextW : undefined,
        defaultTextHeight: selectedCategories.some(c => ['nom','numero'].includes(c)) ? effTextH : undefined,
        // Rotation par défaut
        defaultRotation: defaultRotation,
      };

      const url = editingZoneId ? `/api/text-zones?id=${editingZoneId}` : '/api/text-zones';
      const method = editingZoneId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newZone),
      });

      if (response.ok) {
        await loadZones();
        setNewZoneName('');
        setClickPosition(null);
        setIsPlacingZone(false);
        setEditingZoneId(null);
        setSelectedImage(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        setSelectedCategories(['nom']); // Réinitialiser aux catégories par défaut
        setSelectedZoneCategory('torse');
        setDefaultLogoWidth(600);
        setDefaultLogoHeight(250);
        setDefaultTextWidth(900);
        setDefaultTextHeight(200);
        setDefaultTextWidthInput('900');
        setDefaultTextHeightInput('200');
        setDefaultLogoWidthInput('600');
        setDefaultLogoHeightInput('250');
        setDefaultRotation(0);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const handleCancelPlacement = () => {
    setIsPlacingZone(false);
    setEditingZoneId(null);
    setNewZoneName('');
    setClickPosition(null);
    setSelectedImage(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setSelectedCategories(['nom']); // Réinitialiser
    setSelectedZoneCategory('torse');
    setDefaultLogoWidth(600);
    setDefaultLogoHeight(250);
    setDefaultTextWidth(900);
    setDefaultTextHeight(200);
    setDefaultTextWidthInput('900');
    setDefaultTextHeightInput('200');
    setDefaultLogoWidthInput('600');
    setDefaultLogoHeightInput('250');
    setDefaultRotation(0);
  };
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;

    try {
      const response = await fetch(`/api/text-zones?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadZones();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const startEditZone = (zone: TextZone) => {
    console.log('🔧 Début édition zone:', zone);
    
    setIsPlacingZone(true);
    setEditingZoneId(zone.id);
    setNewZoneName(zone.name);
    
    // Repositionner le curseur/preview et la zone de détection
    setPreviewPos({ u: zone.position[0], v: zone.position[1] });
    setClickPosition({ u: zone.position[0], v: zone.position[1], zone: zone.color as ZoneName });
    
    // Catégories existantes - extraire 'logo' de 'logo-torse', 'logo-dos', etc.
    console.log('📋 Catégories de la zone:', zone.categories);
    const categories = zone.categories || ['nom'];
    const processedCategories = categories.map(cat => {
      if (cat.startsWith('logo-')) return 'logo';
      return cat;
    });
    console.log('📋 Catégories traitées:', processedCategories);
    setSelectedCategories(processedCategories);
    
    // Emplacement (zoneCategory)
    console.log('📍 Emplacement de la zone:', zone.zoneCategory);
    setSelectedZoneCategory(zone.zoneCategory || 'torse');
    
    // Dimensions par défaut - TEXTE
    console.log('📏 Dimensions texte:', { width: zone.defaultTextWidth, height: zone.defaultTextHeight });
    const textW = zone.defaultTextWidth || 900;
    const textH = zone.defaultTextHeight || 200;
    setDefaultTextWidth(textW);
    setDefaultTextHeight(textH);
    setDefaultTextWidthInput(String(textW));
    setDefaultTextHeightInput(String(textH));
    
    // Dimensions par défaut - LOGO
    console.log('📏 Dimensions logo:', { width: zone.defaultLogoWidth, height: zone.defaultLogoHeight });
    const logoW = zone.defaultLogoWidth || 600;
    const logoH = zone.defaultLogoHeight || 250;
    setDefaultLogoWidth(logoW);
    setDefaultLogoHeight(logoH);
    setDefaultLogoWidthInput(String(logoW));
    setDefaultLogoHeightInput(String(logoH));
    
    // Rotation par défaut
    console.log('🔄 Rotation:', zone.defaultRotation);
    setDefaultRotation(zone.defaultRotation || 0);
    
    // Afficher l'image existante si présente
    if (zone.image) {
      console.log('🖼️ Image existante:', zone.image);
      setImagePreview(zone.image);
      setExistingImageUrl(zone.image);
      setSelectedImage(null);
    } else {
      setSelectedImage(null);
      setImagePreview(null);
      setExistingImageUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-screen">
      <header className="bg-white shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🎯 Zones de texte
            </h1>
            <Link 
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
        {/* Sélecteur de design */}
        {designs.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow-sm p-4 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎨 Sélectionner un design pour caler les zones de texte
            </label>
            <select
              value={selectedDesignId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedDesignId(id);
                const d = designs.find(dd => dd.id === id);
                setSelectedDesignUrl(d?.svgUrl || '');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {designs.map((design) => (
                <option key={design.id} value={design.id}>
                  {design.name}
                </option>
              ))}
            </select>
            {selectedDesignUrl && (
              <div className="mt-2 text-sm text-gray-500">
                ✅ Design actif : {designs.find(d => d.id === selectedDesignId)?.name}
              </div>
            )}
          </div>
        )}

        {/* Debug panel */}
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-800">🛠️ Debug zones</div>
            <button
              type="button"
              onClick={async () => {
                // Assigner toutes les zones sans design au design sélectionné
                if (!selectedDesignId) return;
                if (!confirm('Assigner toutes les zones sans design au design sélectionné ?')) return;
                try {
                  const res = await fetch('/api/text-zones', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'assign_nulls', designId: selectedDesignId })
                  });
                  const data = await res.json();
                  console.log('🔧 assign_nulls:', data);
                  await loadZones();
                } catch (e) {
                  console.error('❌ assign_nulls failed:', e);
                }
              }}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
            >
              Assigner zones nulles → design sélectionné
            </button>
          </div>
          <div className="text-xs text-gray-700">
            <div className="mb-2">Répartition par design_id:</div>
            <ul className="list-disc pl-5 mb-3">
              {debugCounts.map((c, i) => (
                <li key={i}>
                  {c.designId ? c.designId : '(null)'}: {c.count}
                </li>
              ))}
            </ul>
            {debugNullZones.length > 0 ? (
              <div className="text-amber-700">
                Zones sans design_id: {debugNullZones.length}
              </div>
            ) : (
              <div className="text-green-700">Aucune zone sans design_id</div>
            )}
          </div>
        </div>

        {/* Actions sur les zones */}
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800">Actions sur les zones</h3>
            <button
              type="button"
              onClick={() => setShowDuplicateModal(true)}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              📋 Dupliquer les zones
            </button>
          </div>
        </div>

        {/* Presets globaux réutilisables */}
        <div className="mb-4 bg-white rounded-lg shadow-sm p-4 flex-shrink-0">
              <div className="text-sm font-medium text-gray-800 mb-2">Presets globaux d'emplacements</div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {globalPresets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedZoneCategory(p.name)}
                    className={`px-2 py-1 text-xs rounded border ${selectedZoneCategory===p.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                    title="Appliquer comme emplacement actif"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  placeholder="Ajouter un preset (ex: jambe droite)"
                  value={newPresetName}
                  onChange={(e)=>setNewPresetName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const name = newPresetName.trim();
                    if (!name) return;
                    try {
                      const res = await fetch('/api/zone-categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                      });
                      if (res.ok) {
                        const created = await res.json();
                        setGlobalPresets(prev => {
                          const exists = prev.some(p => p.name.toLowerCase() === created.name.toLowerCase());
                          return exists ? prev : [...prev, created];
                        });
                        setNewPresetName('');
                      }
                    } catch {}
                  }}
                  className="px-3 py-2 bg-indigo-600 text-white rounded text-sm"
                >
                  Ajouter
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ces presets sont réutilisables sur tous les designs.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contrôles à gauche */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
            <h2 className="text-xl font-semibold mb-4">Ajouter une zone</h2>
            
            {!isPlacingZone ? (
              <button
                onClick={() => setIsPlacingZone(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <span>➕</span>
                Nouvelle zone
              </button>
            ) : (
              <div className="space-y-4 pb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la zone
                  </label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Ex: Poitrine, Dos..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Upload d'image pour la vignette */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image de la vignette (optionnel)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {imagePreview && (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={imagePreview}
                            alt="Prévisualisation"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-sm text-gray-600">
                          {selectedImage ? (
                            <>
                              <div className="font-medium">{selectedImage.name}</div>
                              <div className="text-xs text-gray-500">
                                {(selectedImage.size / 1024).toFixed(1)} KB
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500">Image existante</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            setExistingImageUrl(null);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sélecteur de catégories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégories (où cette zone sera disponible)
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes('nom')}
                        onChange={() => toggleCategory('nom')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Nom</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes('numero')}
                        onChange={() => toggleCategory('numero')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Numéro</span>
                    </label>
                  </div>
                  
                  {/* Case unique Logo */}
                  <label className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes('logo')}
                      onChange={() => toggleCategory('logo')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Logo</span>
                  </label>

                  {/* Sélecteur d'emplacement (nom/numero/logo) */}
                  {selectedCategories.some(c => ['nom','numero','logo'].includes(c)) && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Emplacement</label>
                      <div className="flex flex-wrap gap-2">
                        {globalPresets.length > 0 ? (
                          globalPresets.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedZoneCategory(p.name)}
                              className={`px-3 py-2 rounded border ${selectedZoneCategory===p.name?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}
                            >
                              {p.name}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Aucun preset. Ajoutez-en plus haut.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sélecteur de vue */}
                  {selectedCategories.some(c => ['nom','numero','logo'].includes(c)) && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vue du vêtement</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedView('front')}
                          className={`px-3 py-2 rounded border ${selectedView==='front'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}
                        >
                          👤 Face
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedView('back')}
                          className={`px-3 py-2 rounded border ${selectedView==='back'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}
                        >
                          🔙 Arrière
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedView('left')}
                          className={`px-3 py-2 rounded border ${selectedView==='left'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}
                        >
                          ⬅️ Gauche
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedView('right')}
                          className={`px-3 py-2 rounded border ${selectedView==='right'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}
                        >
                          ➡️ Droite
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Sélectionnez dans quels onglets cette zone sera proposée
                  </p>
                </div>

                {selectedCategories.some(c => ['nom','numero'].includes(c)) && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-800">
                        Dimensions par défaut du texte (visible avant sauvegarde)
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Largeur (px sur UV 4096)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultTextWidthInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDefaultTextWidthInput(val);
                            const num = Number(val);
                            if (!Number.isNaN(num)) {
                              setDefaultTextWidth(Math.max(10, Math.min(4096, num)));
                            }
                          }}
                          onBlur={() => {
                            const num = Number(defaultTextWidthInput);
                            const clamped = Number.isNaN(num) ? defaultTextWidth : Math.max(10, Math.min(4096, num));
                            setDefaultTextWidth(clamped);
                            setDefaultTextWidthInput(String(clamped));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hauteur (px sur UV 4096)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultTextHeightInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDefaultTextHeightInput(val);
                            const num = Number(val);
                            if (!Number.isNaN(num)) {
                              setDefaultTextHeight(Math.max(10, Math.min(4096, num)));
                            }
                          }}
                          onBlur={() => {
                            const num = Number(defaultTextHeightInput);
                            const clamped = Number.isNaN(num) ? defaultTextHeight : Math.max(10, Math.min(4096, num));
                            setDefaultTextHeight(clamped);
                            setDefaultTextHeightInput(String(clamped));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Ces dimensions seront utilisées comme taille par défaut des textes (nom/numéro) ajoutés dans cette zone sur le configurateur.</p>
                  </div>
                )}

                {/* Dimensions par défaut (prévisualisation et saisie) pour zones de logos */}
                {selectedCategories.includes('logo') && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-800">
                        Dimensions par défaut du logo (visible avant sauvegarde)
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Largeur (px sur UV 4096)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultLogoWidthInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDefaultLogoWidthInput(val);
                            const num = Number(val);
                            if (!Number.isNaN(num)) {
                              setDefaultLogoWidth(Math.max(10, Math.min(4096, num)));
                            }
                          }}
                          onBlur={() => {
                            const num = Number(defaultLogoWidthInput);
                            const clamped = Number.isNaN(num) ? defaultLogoWidth : Math.max(10, Math.min(4096, num));
                            setDefaultLogoWidth(clamped);
                            setDefaultLogoWidthInput(String(clamped));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hauteur (px sur UV 4096)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultLogoHeightInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDefaultLogoHeightInput(val);
                            const num = Number(val);
                            if (!Number.isNaN(num)) {
                              setDefaultLogoHeight(Math.max(10, Math.min(4096, num)));
                            }
                          }}
                          onBlur={() => {
                            const num = Number(defaultLogoHeightInput);
                            const clamped = Number.isNaN(num) ? defaultLogoHeight : Math.max(10, Math.min(4096, num));
                            setDefaultLogoHeight(clamped);
                            setDefaultLogoHeightInput(String(clamped));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Ces dimensions seront utilisées comme taille par défaut des logos ajoutés dans cette zone sur le configurateur.</p>
                  </div>
                )}

                {/* Rotation par défaut (pour textes et logos) */}
                {selectedCategories.some(c => ['nom','numero','logo'].includes(c)) && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      Rotation par défaut (degrés)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={defaultRotation}
                        onChange={(e) => setDefaultRotation(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">-180°</span>
                        <span className="font-bold text-purple-700">{defaultRotation}°</span>
                        <span className="text-gray-600">+180°</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Cette rotation sera appliquée par défaut aux éléments ajoutés dans cette zone.</p>
                  </div>
                )}

                {clickPosition && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">✓ Position sélectionnée</p>
                    <p className="text-xs text-green-600 mt-1">
                      U: {clickPosition.u.toFixed(3)}, V: {clickPosition.v.toFixed(3)}
                    </p>
                    <p className="text-xs text-green-700 font-semibold mt-1">
                      Zone: {getZoneDisplayName(clickPosition.zone)}
                    </p>
                  </div>
                )}

                {!clickPosition && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {zoneMapCanvas ? (
                      <p className="text-sm text-blue-800">
                        👆 Cliquez sur l'UV map pour placer la zone
                      </p>
                    ) : (
                      <p className="text-sm text-orange-800">
                        ⏳ Chargement de la zone map...
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmZone}
                    disabled={!newZoneName.trim() || !clickPosition || isUploadingImage}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploadingImage ? 'Upload en cours...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={handleCancelPlacement}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* UV Map au centre */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">UV Map</h2>
            <div 
              ref={uvMapRef}
              onClick={handleUVMapClick}
              className={`relative border-2 ${isPlacingZone ? 'border-blue-500 cursor-crosshair' : 'border-gray-300'} rounded-lg overflow-hidden w-full`}
              style={{ paddingTop: '100%' }}
            >
              {selectedDesignUrl ? (
                <img
                  src={selectedDesignUrl}
                  alt="Design SVG sélectionné"
                  className="absolute inset-0 w-full h-full object-contain bg-white"
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setUvNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                    console.log('🖼️ UV image natural size:', img.naturalWidth, img.naturalHeight);
                  }}
                />
              ) : null}
              {/* Mesure du container pour positionner correctement les previews */}
              <div
                className="absolute inset-0"
                ref={(el) => {
                  if (!el) return;
                  const ro = new (window as any).ResizeObserver((entries: any) => {
                    const r = entries[0].contentRect;
                    setUvRenderedSize({ w: r.width, h: r.height });
                  });
                  ro.observe(el);
                }}
              />
              
                  {/* Prévisualisation de la taille par défaut pour zone logo (avant sauvegarde) */}
                  {isPlacingZone && previewPos && selectedCategories.includes('logo') && (
                    <div
                      className="absolute border-2 border-blue-600 bg-white pointer-events-none"
                      style={{
                        left: `${previewPos.u * uvRenderedSize.w}px`,
                        top: `${previewPos.v * uvRenderedSize.h}px`,
                        transform: `translate(-50%, -50%) rotate(${defaultRotation}deg)`,
                        width: `${(defaultLogoWidth / 4096) * uvRenderedSize.w}px`,
                        height: `${(defaultLogoHeight / 4096) * uvRenderedSize.h}px`,
                        zIndex: 10
                      }}
                      title={`Prévisualisation ${defaultLogoWidth}x${defaultLogoHeight}px, rotation ${defaultRotation}°`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black">
                          LOGO
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Prévisualisation de la taille par défaut pour zone texte (avant sauvegarde) */}
                  {isPlacingZone && previewPos && selectedCategories.some(c => ['nom','numero'].includes(c)) && (
                    <div
                      className="absolute border-2 border-blue-600 bg-white pointer-events-none"
                      style={{
                        left: `${previewPos.u * uvRenderedSize.w}px`,
                        top: `${previewPos.v * uvRenderedSize.h}px`,
                        transform: `translate(-50%, -50%) rotate(${defaultRotation}deg)`,
                        width: `${(defaultTextWidth / 4096) * uvRenderedSize.w}px`,
                        height: `${(defaultTextHeight / 4096) * uvRenderedSize.h}px`,
                        zIndex: 11
                      }}
                      title={`Prévisualisation texte ${defaultTextWidth}x${defaultTextHeight}px, rotation ${defaultRotation}°`}
                    >
                      <div className="w-full h-full flex items-center justify-center text-blue-700 text-[10px] font-bold">
                        {selectedCategories.includes('nom') ? 'NOM' : selectedCategories.includes('numero') ? 'NUMÉRO' : 'TEXTE'}
                      </div>
                    </div>
                  )}

              {/* Afficher les zones existantes (s'assurer qu'on recharge après ajout) */}
              {zones
                .filter(z => !selectedDesignId || (z as any).designId === selectedDesignId)
                .map((zone) => {
                // Vérifier si c'est une zone de logo (catégorie commence par 'logo-')
                const isLogoZone = zone.categories?.some(cat => cat.startsWith('logo-'));
                const isTextZone = zone.categories?.some(cat => ['nom','numero'].includes(cat));
                
                return isLogoZone ? (
                  // Rectangle blanc avec texte pour les logos (cliquable pour modifier)
                  <div
                    key={zone.id}
                    className="absolute bg-white border-2 border-black shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
                    style={{
                      left: `calc(${zone.position[0] * 100}% )`,
                      top: `calc(${zone.position[1] * 100}% )`,
                      transform: `translate(-50%, -50%) rotate(${(zone as any).defaultRotation ?? 0}deg)`,
                      width: `${(((zone as any).defaultLogoWidth ?? 600) / 4096) * 100}%`,
                      height: `${(((zone as any).defaultLogoHeight ?? 250) / 4096) * 100}%`,
                    }}
                    title={`${zone.name} — rotation ${(zone as any).defaultRotation ?? 0}° — cliquer pour modifier`}
                    onClick={() => startEditZone(zone)}
                  >
                    <span className="text-xs font-bold text-black">LOGO</span>
                  </div>
                ) : isTextZone ? (
                  // Rectangle pour textes (nom/numéro) (cliquable pour modifier)
                  <div
                    key={zone.id}
                    className="absolute bg-white/80 border-2 border-indigo-600 shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
                    style={{
                      left: `calc(${zone.position[0] * 100}%)`,
                      top: `calc(${zone.position[1] * 100}%)`,
                      transform: `translate(-50%, -50%) rotate(${(zone as any).defaultRotation ?? 0}deg)`,
                      width: `${(((zone as any).defaultTextWidth ?? 900) / 4096) * 100}%`,
                      height: `${(((zone as any).defaultTextHeight ?? 200) / 4096) * 100}%`,
                    }}
                    title={`${zone.name} — rotation ${(zone as any).defaultRotation ?? 0}° — cliquer pour modifier`}
                    onClick={() => startEditZone(zone)}
                  >
                    <span className="text-xs font-bold text-indigo-700">{(zone.categories||[]).includes('nom') ? 'NOM' : (zone.categories||[]).includes('numero') ? 'NUMÉRO' : 'TEXTE'}</span>
                  </div>
                ) : (
                  // Point rouge pour les autres zones de texte simples
                  <div
                    key={zone.id}
                    className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                      left: `calc(${zone.position[0] * 100}%)`,
                      top: `calc(${zone.position[1] * 100}%)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={zone.name}
                  />
                );
              })}

              {/* Afficher la position du clic en cours */}
              {clickPosition && (
                <div
                  className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse pointer-events-none"
                  style={{
                    left: `calc(${clickPosition.u * 100}%)`,
                    top: `calc(${clickPosition.v * 100}%)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
            {/* Info taille UV */}
            {uvNaturalSize && (
              <div className="mt-2 text-xs">
                <span className="px-2 py-1 rounded bg-gray-100 border text-gray-700">
                  UV image: {uvNaturalSize.w}×{uvNaturalSize.h} px {uvNaturalSize.w!==4096||uvNaturalSize.h!==4096 ? '(attendu 4096×4096)' : '(ok)'}
                </span>
              </div>
            )}
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500">
                {isPlacingZone ? '🎯 Mode placement actif - Cliquez pour placer' : '📍 Points rouges = zones de texte | Rectangles blancs = zones de logos'}
              </p>
              
              
            </div>
          </div>

          {/* Liste des zones */}
          <div className="bg-white rounded-lg shadow p-6 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">
              Zones configurées ({zones.length})
            </h2>
            
            {isLoading ? (
              <p className="text-gray-500">Chargement...</p>
            ) : zones.length === 0 ? (
              <p className="text-gray-500">Aucune zone configurée</p>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Image de la vignette si elle existe */}
                      {zone.image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          <Image
                            src={zone.image}
                            alt={zone.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{zone.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Position: U={zone.position[0].toFixed(2)}, V={zone.position[1].toFixed(2)}
                        </p>
                        {zone.zoneCategory && (
                          <p className="text-sm text-gray-500">
                            Emplacement: {zone.zoneCategory}
                          </p>
                        )}
                        {zone.view && (
                          <p className="text-sm text-gray-500">
                            Vue: {zone.view === 'front' ? '👤 Face' : zone.view === 'back' ? '🔙 Arrière' : zone.view === 'left' ? '⬅️ Gauche' : '➡️ Droite'}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {(() => {
                            const isLogo = zone.categories?.includes('logo');
                            const isText = zone.categories?.some(c => ['nom','numero'].includes(c));
                            const w = isText ? (zone.defaultTextWidth ?? 900) : isLogo ? (zone.defaultLogoWidth ?? 600) : undefined;
                            const h = isText ? (zone.defaultTextHeight ?? 200) : isLogo ? (zone.defaultLogoHeight ?? 250) : undefined;
                            if (w && h) {
                              return `Dimensions: ${w}×${h} px`;
                            }
                            return `Zone: ${getZoneDisplayName(zone.color as ZoneName)}`;
                          })()}
                        </p>
                        {zone.image && (
                          <p className="text-xs text-blue-600 mt-1">
                            📷 Vignette disponible
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEditZone(zone)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de duplication des zones */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dupliquer les zones</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source (design à copier)
                </label>
                <select
                  value={sourceDesignId}
                  onChange={(e) => setSourceDesignId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un design source</option>
                  {designs.map(design => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination (design de destination)
                </label>
                <select
                  value={targetDesignId}
                  onChange={(e) => setTargetDesignId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un design destination</option>
                  {designs.map(design => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>

              {sourceDesignId && targetDesignId && sourceDesignId === targetDesignId && (
                <div className="text-red-600 text-sm">
                  ⚠️ La source et la destination doivent être différentes
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSourceDesignId('');
                  setTargetDesignId('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                disabled={duplicating}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!sourceDesignId || !targetDesignId || sourceDesignId === targetDesignId) return;
                  
                  setDuplicating(true);
                  try {
                    const response = await fetch('/api/text-zones/duplicate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sourceDesignId,
                        targetDesignId
                      })
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Erreur lors de la duplication');
                    }

                    const result = await response.json();
                    alert(`✅ ${result.count} zones dupliquées avec succès de "${designs.find(d => d.id === sourceDesignId)?.name}" vers "${designs.find(d => d.id === targetDesignId)?.name}"`);
                    
                    // Recharger les zones si on est sur le design de destination
                    if (selectedDesignId === targetDesignId) {
                      await loadZones();
                    }
                    
                    setShowDuplicateModal(false);
                    setSourceDesignId('');
                    setTargetDesignId('');
                  } catch (error) {
                    console.error('❌ Erreur duplication:', error);
                    alert(`❌ Erreur: ${error.message}`);
                  } finally {
                    setDuplicating(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={!sourceDesignId || !targetDesignId || sourceDesignId === targetDesignId || duplicating}
              >
                {duplicating ? 'Duplication...' : 'Dupliquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

