"use client";
import { useEffect, useRef, useState } from "react";
import OffscreenThumbnailCapture from "@/components/OffscreenThumbnailCapture";

type Color = {
  name: string;
  value: string;
};

type Design2D = {
  id: string;
  name: string;
  svgUrl: string;
  createdAt: string;
  thumbUrl?: string;
  model_type?: 'maillot' | 'pantalon'; // Type de modèle pour le design
  primaryColor?: string; // Legacy - pour compatibilité
  secondaryColor?: string; // Legacy - pour compatibilité  
  tertiaryColor?: string; // Legacy - pour compatibilité
  colors?: Color[]; // Nouveau système dynamique
};

// HiddenPreview removed

export default function DesignsAdminPage() {
  const [designs, setDesigns] = useState<Design2D[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumb, setThumb] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [tertiaryColor, setTertiaryColor] = useState("#cccccc");
  const [colors, setColors] = useState<Color[]>([
    { name: "primary", value: "#000000" },
    { name: "secondary", value: "#ffffff" },
    { name: "tertiary", value: "#cccccc" }
  ]);
  const [modelType, setModelType] = useState<'maillot' | 'pantalon'>('maillot');
  const [editingDesign, setEditingDesign] = useState<Design2D | null>(null);
  // Les palettes sont maintenant gérées via le SVG Color Mapper
  const [libraries, setLibraries] = useState<Array<{id: string; name: string}>>([]);
  const [selectedDesignLibraries, setSelectedDesignLibraries] = useState<Record<string, string[]>>({});
  const [pendingLibraryIds, setPendingLibraryIds] = useState<string[]>([]); // bibliothèques à assigner pour un nouveau design
  const [regenQueue, setRegenQueue] = useState<string[]>([]);
  const [regenStarted, setRegenStarted] = useState(false);
  
  // États pour la sélection du modèle pour les aperçus
  const [models, setModels] = useState<Array<{id: string; name: string; glbUrl: string}>>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [designModelIds, setDesignModelIds] = useState<Record<string, string>>({}); // Modèle par design
  
  
  // États pour la génération automatique de miniatures
  const [thumbnailGeneration, setThumbnailGeneration] = useState<{
    isGenerating: boolean;
    designId: string | null;
    modelUrl: string | null;
    designSvgUrl: string | null;
    colors: Record<string, string>;
    textureMaps: Record<string, string>;
    materialMaps: Record<string, any>;
    hasError: boolean;
  }>({
    isGenerating: false,
    designId: null,
    modelUrl: null,
    designSvgUrl: null,
    colors: {},
    textureMaps: {},
    materialMaps: {},
    hasError: false
  });

  // Noms standardisés pour les couleurs (correspondance avec les classes CSS)
  const colorNames = ["primary", "secondary", "tertiary", "quaternary", "quinary", "senary", "septenary", "octonary"];
  
  // Fonctions pour gérer la génération automatique de miniatures
  const generateThumbnail = async (designId: string) => {
    try {
      setThumbnailGeneration(prev => ({ ...prev, isGenerating: true, designId }));
      
      // Utiliser le modèle spécifique au design, ou le modèle global par défaut
      const modelIdForDesign = designModelIds[designId] || selectedModelId;
      
      // Récupérer les informations nécessaires avec le modèle sélectionné
      const response = await fetch('/api/designs/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          designId,
          modelId: modelIdForDesign // Passer le modèle spécifique au design
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        throw new Error(`Failed to get thumbnail generation data: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('📄 Réponse API:', responseText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        console.error('📄 Contenu reçu:', responseText);
        throw new Error('Invalid JSON response from API');
      }
      
      const { modelUrl, designSvgUrl, colors, textureMaps, materialMaps } = data;
      
      // Convertir les colors en Record<string, string>
      const colorsRecord: Record<string, string> = {};
      colors.forEach((color: {name: string, value: string}) => {
        colorsRecord[color.name] = color.value;
      });
      
      setThumbnailGeneration(prev => ({
        ...prev,
        modelUrl,
        designSvgUrl,
        colors: colorsRecord,
        textureMaps: textureMaps || {},
        materialMaps: materialMaps || {}
      }));
      
    } catch (error) {
      console.error('Erreur lors de la génération de miniature:', error);
      setThumbnailGeneration(prev => ({ ...prev, isGenerating: false, designId: null, hasError: true }));
    }
  };

  const handleThumbnailCapture = async (canvas: HTMLCanvasElement) => {
    try {
      if (!thumbnailGeneration.designId) {
        console.log('⚠️ Pas de designId pour la capture');
        return;
      }
      
      console.log('📸 Capture de la miniature...');
      
    // Convertir le canvas en data URL (WebP pour meilleure compatibilité)
    const dataUrl = canvas.toDataURL('image/webp', 0.9);
      console.log('✅ Data URL créée:', dataUrl.substring(0, 50) + '...');
      
      // Sauvegarder la miniature
      console.log('💾 Sauvegarde de la miniature...');
      const response = await fetch('/api/designs/generate-thumbnail', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: thumbnailGeneration.designId,
          thumbnailDataUrl: dataUrl
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        throw new Error(`Failed to save thumbnail: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Miniature générée et sauvegardée:', result.thumbnailUrl);
      
      // Rafraîchir la liste des designs
      await refresh();
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de miniature:', error);
      setThumbnailGeneration(prev => ({ ...prev, hasError: true }));
    } finally {
      console.log('🔄 Arrêt de la génération');
      setThumbnailGeneration({
        isGenerating: false,
        designId: null,
        modelUrl: null,
        designSvgUrl: null,
        colors: {},
        textureMaps: {},
        materialMaps: {},
        hasError: false
      });
    }
  };

  const handleThumbnailError = (error: string) => {
    console.error('Erreur lors de la génération de miniature:', error);
    setThumbnailGeneration({
      isGenerating: false,
      designId: null,
      modelUrl: null,
      designSvgUrl: null,
      colors: {},
      textureMaps: {},
      materialMaps: {},
      hasError: true
    });
  };

  // Fonctions pour gérer les couleurs dynamiquement
  const addColor = () => {
    const colorIndex = colors.length;
    const newColor: Color = {
      name: colorNames[colorIndex] || `color${colorIndex + 1}`,
      value: "#cccccc"
    };
    setColors([...colors, newColor]);
  };

  const removeColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColorName = (index: number, name: string) => {
    setColors(colors.map((color, i) => 
      i === index ? { ...color, name } : color
    ));
  };

  const updateColorValue = (index: number, value: string) => {
    setColors(colors.map((color, i) => 
      i === index ? { ...color, value } : color
    ));
  };

  // Fonction pour mettre à jour le modèle d'un design spécifique
  const updateDesignModel = (designId: string, modelId: string) => {
    setDesignModelIds(prev => ({
      ...prev,
      [designId]: modelId
    }));
  };

  async function refresh() {
    const res = await fetch("/api/designs");
    const list = await res.json();
    setDesigns(list);
  }

  useEffect(() => {
    refresh();
    // Les palettes sont maintenant gérées via le SVG Color Mapper
    // Charger les bibliothèques disponibles
    (async () => {
      try {
        const res = await fetch('/api/logo-libraries');
        const list = await res.json();
        setLibraries(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('❌ Erreur chargement bibliothèques:', e);
      }
    })();
  }, []);

  // Charger les modèles disponibles
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/models");
        const list = await res.json();
        setModels(Array.isArray(list) ? list : []);
        
        // Sélectionner le premier modèle par défaut
        if (list.length > 0 && !selectedModelId) {
          setSelectedModelId(list[0].id);
        }
      } catch (e) {
        console.error('❌ Erreur chargement modèles:', e);
      }
    })();
  }, []);

  // Générer automatiquement les miniatures manquantes, une par une
  useEffect(() => {
    console.log('🔍 useEffect génération:', { 
      isGenerating: thumbnailGeneration.isGenerating, 
      queueLength: regenQueue.length,
      designsCount: designs.length 
    });
    
    if (thumbnailGeneration.isGenerating) {
      console.log('⏸️ Génération en cours, arrêt');
      return;
    }
    
    // Protection contre la boucle infinie
    if (designs.length === 0) {
      console.log('⏸️ Pas de designs chargés');
      return;
    }
    
    // Arrêter si il y a eu une erreur
    if (thumbnailGeneration.hasError) {
      console.log('⏸️ Erreur détectée, arrêt de la génération automatique');
      return;
    }
    
    // Traiter la file de régénération si présente
    if (regenQueue.length > 0) {
      const [nextId, ...rest] = regenQueue;
      console.log('📝 Traitement de la file:', nextId, 'reste:', rest.length);
      setRegenQueue(rest);
      generateThumbnail(nextId);
      return;
    }
    
    // Sinon, traiter la première miniature manquante
    const missing = designs.find(d => !d.thumbUrl);
    if (missing) {
      console.log('🎯 Miniature manquante trouvée:', missing.id);
      console.log('⚠️ Génération automatique désactivée - utilise le bouton manuel');
      // generateThumbnail(missing.id);
    } else {
      console.log('✅ Toutes les miniatures sont présentes');
    }
  }, [designs, regenQueue.length, thumbnailGeneration.isGenerating]);

  // Fonction pour déclencher une régénération complète
  const triggerFullRegen = () => {
    console.log('🔄 Déclenchement régénération complète, designs:', designs.length);
    if (designs.length > 0) {
      const queue = designs.map(d => d.id);
      console.log('📋 File de régénération:', queue);
      setRegenQueue(queue);
    } else {
      console.log('❌ Aucun design trouvé');
    }
  };

  // Fonction pour réinitialiser l'état de génération (en cas de blocage)
  const resetGeneration = () => {
    setThumbnailGeneration({
      isGenerating: false,
      designId: null,
      modelUrl: null,
      designSvgUrl: null,
      colors: {},
      textureMaps: {},
      materialMaps: {}
    });
    setRegenQueue([]);
  };

  // Timeout de sécurité pour éviter les blocages
  useEffect(() => {
    if (thumbnailGeneration.isGenerating) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Timeout de sécurité - arrêt de la génération');
        resetGeneration();
      }, 30000); // 30 secondes max
      return () => clearTimeout(timeout);
    }
  }, [thumbnailGeneration.isGenerating]);

  // Analyser le contenu SVG pour détecter les problèmes potentiels
  const analyzeSvgContent = async (file: File): Promise<{ hasImages: boolean; hasExternalLinks: boolean; warnings: string[] }> => {
    const warnings: string[] = [];
    let hasImages = false;
    let hasExternalLinks = false;

    try {
      const text = await file.text();
      
      // Détecter les images intégrées
      if (text.includes('<image')) {
        hasImages = true;
        warnings.push('Ce SVG contient des éléments <image>');
      }
      
      // Détecter les références externes
      if (text.includes('href=') || text.includes('xlink:href=')) {
        hasExternalLinks = true;
        warnings.push('Ce SVG contient des références externes (href)');
      }
      
      // Détecter les images en base64
      if (text.includes('data:image/')) {
        warnings.push('Ce SVG contient des images en base64 (peut être lourd)');
      }
      
      // Détecter les références de fichiers
      const fileRefs = text.match(/href="[^"]*\.(jpg|jpeg|png|gif|webp)/gi);
      if (fileRefs) {
        warnings.push(`Références de fichiers détectées: ${fileRefs.join(', ')}`);
        hasExternalLinks = true;
      }
      
    } catch (error) {
      warnings.push('Impossible d\'analyser le contenu SVG');
    }

    return { hasImages, hasExternalLinks, warnings };
  };

  // Fonction pour convertir un fichier en base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  // Validation d'un fichier SVG
  const validateSvgFile = async (file: File): Promise<{ isValid: boolean; error?: string; warnings?: string[] }> => {
    if (!file) {
      return { isValid: false, error: "Aucun fichier sélectionné" };
    }

    // Vérifier l'extension
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension !== 'svg') {
      return { isValid: false, error: "Le fichier doit être un SVG (.svg)" };
    }

    // Vérifier la taille (limite de 100MB pour Supabase Pro)
    const maxSizeMB = 100;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { isValid: false, error: `Le fichier est trop lourd (${Math.round(file.size / 1024 / 1024)}MB). Maximum autorisé: ${maxSizeMB}MB` };
    }

    // Vérifier le type MIME
    if (file.type && !file.type.includes('svg') && !file.type.includes('xml')) {
      return { isValid: false, error: `Type de fichier non supporté: ${file.type}` };
    }

    // Analyser le contenu pour détecter les problèmes
    const analysis = await analyzeSvgContent(file);
    
    return { 
      isValid: true, 
      warnings: analysis.warnings.length > 0 ? analysis.warnings : undefined 
    };
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('🔍 DEBUG onSubmit - file:', file, 'name:', name);
    if (!file || !name) {
      console.log('❌ Missing file or name');
      return;
    }

    // Valider le fichier SVG
    const validation = await validateSvgFile(file);
    if (!validation.isValid) {
      alert(`❌ Erreur de validation: ${validation.error}`);
      return;
    }

    // Afficher les avertissements si il y en a
    if (validation.warnings && validation.warnings.length > 0) {
      const proceed = confirm(`⚠️ Avertissements détectés dans votre SVG:\n\n${validation.warnings.join('\n')}\n\nVoulez-vous continuer l'upload ?`);
      if (!proceed) {
        return;
      }
    }

    console.log('📋 Validation SVG réussie:', {
      name: file.name,
      size: Math.round(file.size / 1024) + 'KB',
      type: file.type,
      colors: colors.length,
      warnings: validation.warnings
    });

    setLoading(true);
    try {
      // Détecter si le fichier est trop gros pour l'API Vercel (> 1MB pour être sûr)
      const isLargeFile = file.size > 1 * 1024 * 1024; // 1MB
      let res: Response;
      
      if (isLargeFile) {
        console.log(`📦 Fichier volumineux détecté (${Math.round(file.size / 1024)}KB) - Upload direct Supabase`);
        
        // Pour les fichiers > 3MB, utiliser directement l'upload Supabase côté client
        const { supabase } = await import('@/lib/supabase');
        
        // Créer un nom de fichier unique
        const timestamp = Date.now();
        const fileName = `${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        
        console.log('🚀 Upload direct vers Supabase Storage:', fileName);
        
        // Upload vers Supabase Storage - essayer d'abord le bucket designs, puis large-designs
        let uploadData, uploadError;
        
        // Utiliser le fichier original directement pour éviter toute compression
        console.log('📁 Taille fichier original:', file.size, 'bytes');
        
        // SOLUTION: Upload par chunks pour éviter la limite de taille Vercel
        console.log('📦 Upload par chunks pour éviter la limite Vercel (413)');
        
        // Créer un nom de fichier unique
        const fileTimestamp = Date.now();
        const chunkFileName = `${fileTimestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        
        // Diviser le fichier en chunks de 1MB
        const chunkSize = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        console.log(`📊 Fichier divisé en ${totalChunks} chunks de ${chunkSize} bytes`);
        
        // Uploader chaque chunk
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          
          console.log(`📤 Upload chunk ${i + 1}/${totalChunks} (${start}-${end})`);
          
          const formData = new FormData();
          formData.append('chunk', chunk);
          formData.append('fileName', chunkFileName);
          formData.append('chunkIndex', i.toString());
          formData.append('totalChunks', totalChunks.toString());
          formData.append('isLastChunk', (i === totalChunks - 1).toString());
          
          // Pour le dernier chunk, ajouter les métadonnées
          if (i === totalChunks - 1) {
            formData.append('name', name);
            formData.append('model_type', modelType);
            formData.append('primaryColor', primaryColor);
            formData.append('secondaryColor', secondaryColor);
            formData.append('tertiaryColor', tertiaryColor);
            if (thumb) formData.append('thumbnail', thumb);
          }
          
          const chunkResponse = await fetch('/api/designs/upload-chunk', {
            method: 'POST',
            body: formData
          });
          
          if (!chunkResponse.ok) {
            throw new Error(`Erreur upload chunk ${i + 1}: ${chunkResponse.status}`);
          }
          
          console.log(`✅ Chunk ${i + 1}/${totalChunks} uploadé`);
        }
        
        console.log('✅ Tous les chunks uploadés, création du design...');
        
        // Créer l'entrée dans la base de données
        const dbResponse = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_from_chunks',
            fileName: chunkFileName,
            name: name,
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
            tertiaryColor: tertiaryColor,
            // Les couleurs sont maintenant gérées via le SVG Color Mapper
            thumbnail: thumb ? await fileToBase64(thumb) : null
          })
        });
        
        if (!dbResponse.ok) {
          throw new Error(`Erreur création DB: ${dbResponse.status}`);
        }
        
        const dbResult = await dbResponse.json();
        console.log('✅ Design créé:', dbResult);
        
        // Rafraîchir la liste
        await refresh();
        setLoading(false);
        return;
      } else {
        // Fichier normal - API standard
      const fd = new FormData();
      fd.append("name", name);
      fd.append("file", file);
      fd.append("shopDomain", "local.stretchmx");
      fd.append("mappedRegions", "{}");
        fd.append("primaryColor", primaryColor);
        fd.append("secondaryColor", secondaryColor);
        fd.append("tertiaryColor", tertiaryColor);
        fd.append("colors", JSON.stringify(colors));
      if (thumb) fd.append("thumbnail", thumb);
        
        console.log('🚀 Envoi vers API standard');
        res = await fetch('/api/designs', { method: 'POST', body: fd });
      }
      
      console.log('📡 Réponse API:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`;
        try {
          // Essayer de lire comme JSON d'abord
          const errorData = await res.json();
          errorMessage += `: ${errorData.error || 'Unknown error'}`;
          console.error('❌ Erreur API (JSON):', errorData);
        } catch (jsonError) {
          // Si JSON échoue, essayer de lire comme texte
          try {
            const errorText = await res.text();
            errorMessage += `: ${errorText || 'Unknown error'}`;
            console.error('❌ Erreur API (Text):', errorText);
          } catch (textError) {
            // Si les deux échouent, utiliser le message d'erreur par défaut
            errorMessage += `: ${res.statusText || 'Unknown error'}`;
            console.error('❌ Erreur API (Status):', res.statusText);
          }
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log('✅ Upload réussi:', result);
      // Assigner les bibliothèques sélectionnées pour le nouveau design
      if (result?.id && pendingLibraryIds.length > 0) {
        try {
          await fetch('/api/logo-libraries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'assign_designs', designId: result.id, libraryIds: pendingLibraryIds })
          });
        } catch (e) {
          console.error('❌ Erreur assignation bibliothèques (nouveau design):', e);
        }
      }
      
      resetForm();
      await refresh();
      
      // Générer automatiquement une miniature si pas fournie
      if (!thumb && result.id) {
        console.log('🎨 Déclenchement de la génération automatique de miniature pour:', result.id);
        setTimeout(() => generateThumbnail(result.id), 1000); // Délai pour laisser le temps au design d'être enregistré
      }
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
      setName("");
      setFile(null);
      setThumb(null);
    setPrimaryColor("#000000");
    setSecondaryColor("#ffffff");
    setTertiaryColor("#cccccc");
    setColors([
      { name: "primary", value: "#000000" },
      { name: "secondary", value: "#ffffff" },
      { name: "tertiary", value: "#cccccc" }
    ]);
    setEditingDesign(null);
    setPendingLibraryIds([]);
  }

  async function onEditColors(design: Design2D) {
    setEditingDesign(design);
    // Les couleurs sont maintenant gérées via le SVG Color Mapper, on ne les charge plus ici
  }

  async function onSaveColors() {
    if (!editingDesign) return;
    setLoading(true);
    try {
      const response = await fetch("/api/designs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDesign.id,
          primaryColor, // Legacy pour compatibilité
          secondaryColor, // Legacy pour compatibilité
          tertiaryColor, // Legacy pour compatibilité
          colors // Nouveau système dynamique
        })
      });
      if (!response.ok) throw new Error("update failed");
      resetForm();
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onPickThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) { setThumb(null); return; }
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      // cover
      const imgRatio = img.width / img.height;
      const canvasRatio = 1; // square
      let drawW = size, drawH = size;
      if (imgRatio > canvasRatio) {
        drawH = size;
        drawW = Math.floor(size * imgRatio);
      } else {
        drawW = size;
        drawH = Math.floor(size / imgRatio);
      }
      const dx = Math.floor((size - drawW) / 2);
      const dy = Math.floor((size - drawH) / 2);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, dx, dy, drawW, drawH);
      const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), "image/png", 0.92));
      if (blob) {
        const resized = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
        setThumb(resized);
      } else {
        setThumb(file);
      }
      URL.revokeObjectURL(url);
    } catch {
      setThumb(file);
    }
  }

  return (
    <div className="min-h-screen bg-white">
    <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Designs 2D</h1>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              console.log('🖱️ Bouton cliqué');
              triggerFullRegen();
            }}
            disabled={thumbnailGeneration.isGenerating || regenQueue.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {thumbnailGeneration.isGenerating || regenQueue.length > 0 ? 'Régénération...' : '🔄 Régénérer toutes les vignettes'}
          </button>
        </div>
        {(thumbnailGeneration.isGenerating || regenQueue.length > 0) && (
          <button
            onClick={resetGeneration}
            className="ml-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            ⏹️ Arrêter
          </button>
        )}
        {thumbnailGeneration.hasError && (
          <button
            onClick={() => setThumbnailGeneration(prev => ({ ...prev, hasError: false }))}
            className="ml-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            🔄 Réessayer
          </button>
        )}
      {/* No auto thumbnail generation per request */}
      <form onSubmit={editingDesign ? (e) => { e.preventDefault(); resetForm(); } : onSubmit} className="space-y-3 border p-4 rounded">
        {editingDesign && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Modification des couleurs</h3>
                <p className="text-xs text-blue-700">Design: {editingDesign.name}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        {!editingDesign && (
          <>
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded p-2" placeholder="Logo poitrine v1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Type de modèle</label>
          <select
            value={modelType}
            onChange={e => setModelType(e.target.value as 'maillot' | 'pantalon')}
            className="w-full border rounded p-2"
          >
            <option value="maillot">Maillot</option>
            <option value="pantalon">Pantalon</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Fichier .svg/.png</label>
          <input type="file" accept=".svg,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file && (
                <div className="text-xs text-gray-600 mt-1">
                  <div>Fichier sélectionné: {file.name}</div>
                  <div>Taille: {Math.round(file.size / 1024)}KB</div>
                  {file.name.toLowerCase().endsWith('.svg') && (
                    <div className="text-amber-600 mt-1">
                      ⚠️ SVG avec images intégrées: Vérifiez que les images sont en base64 ou que les liens sont accessibles
                    </div>
                  )}
                </div>
              )}
        </div>
        <div>
          <label className="block text-sm font-medium">Vignette (PNG/JPG)</label>
          <input type="file" accept=".png,.jpg,.jpeg" onChange={onPickThumb} />
          {thumb && <div className="text-xs text-gray-600 mt-1">Vignette 512×512 prête</div>}
        </div>
          </>
        )}
        
        {/* Affectation bibliothèques de logos */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Bibliothèques de logos affectées au design</h3>
          <p className="text-xs text-gray-600 mb-3">Sélectionnez les bibliothèques de logos visibles pour ce design dans le configurateur.</p>
          <div className="flex flex-wrap gap-2">
            {libraries.map(lib => {
              const designId = editingDesign?.id || '';
              const selected = designId
                ? (selectedDesignLibraries[designId] || []).includes(lib.id)
                : pendingLibraryIds.includes(lib.id);
              return (
                <button
                  key={lib.id}
                  type="button"
                  onClick={async () => {
                    const id = editingDesign?.id;
                    if (!id) {
                      // Nouveau design: toggle local seulement
                      setPendingLibraryIds(prev => selected ? prev.filter(x => x !== lib.id) : [...prev, lib.id]);
                      return;
                    }
                    const current = selectedDesignLibraries[id] || [];
                    const next = selected ? current.filter(x => x !== lib.id) : [...current, lib.id];
                    setSelectedDesignLibraries(prev => ({ ...prev, [id]: next }));
                    await fetch('/api/logo-libraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign_designs', designId: id, libraryIds: next }) });
                  }}
                  className={`text-xs px-3 py-1 rounded border ${selected ? 'bg-black text-white border-black' : 'bg-white text-gray-800'}`}
                >
                  {lib.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Envoi..." : editingDesign ? "Fermer" : "Ajouter"}
        </button>
      </form>
      <ul className="grid grid-cols-2 gap-3">
        {designs.map(d => (
          <li key={d.id} className="border rounded p-3 space-y-2">
            <div className="font-medium">{d.name}</div>
            {d.thumbUrl ? (
              <img src={d.thumbUrl} alt={d.name} className="w-32 h-32 object-cover bg-white rounded border" />
            ) : (
              <img src={d.svgUrl} alt={d.name} className="w-32 h-32 object-contain bg-white rounded border" />
            )}
            
            {/* Afficher les couleurs dynamiques */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Couleurs:</span>
              <div className="flex gap-1 flex-wrap">
                {d.colors && d.colors.length > 0 ? (
                  // Nouveau système dynamique
                  d.colors
                    .filter((color: any) => color && color.value) // Filtrer les couleurs valides
                    .map((color, index) => (
                      <div 
                        key={index}
                        className="w-4 h-4 rounded border border-gray-300" 
                        style={{ backgroundColor: color.value }} 
                        title={`${color.name}: ${color.value}`}
                      ></div>
                    ))
                ) : (
                  // Fallback sur le système legacy
                  <>
                    {d.primaryColor && (
                      <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: d.primaryColor }} title={`Primary: ${d.primaryColor}`}></div>
                    )}
                    {d.secondaryColor && (
                      <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: d.secondaryColor }} title={`Secondary: ${d.secondaryColor}`}></div>
                    )}
                    {d.tertiaryColor && (
                      <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: d.tertiaryColor }} title={`Tertiary: ${d.tertiaryColor}`}></div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Sélecteur de modèle pour ce design */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Modèle:</span>
              <select
                value={designModelIds[d.id] || selectedModelId || ''}
                onChange={e => updateDesignModel(d.id, e.target.value)}
                className="text-xs px-2 py-1 border rounded"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <a href={d.svgUrl} className="text-blue-600 underline" target="_blank">ouvrir</a>
              {/* Génération automatique: plus de bouton manuel */}
              <button
                className="text-green-600 hover:underline"
                onClick={() => onEditColors(d)}
              >Modifier couleurs</button>
              {/* Charger bibliothèques affectées pour ce design */}
                <button
                className="text-gray-700 hover:underline"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/logo-libraries?designId=${encodeURIComponent(d.id)}`);
                    const list = await res.json();
                    setSelectedDesignLibraries(prev => ({ ...prev, [d.id]: (Array.isArray(list) ? list : []).map((x:any)=>x.id) }));
                    setEditingDesign(d);
                  } catch (e) {
                    setEditingDesign(d);
                  }
                }}
              >Affecter bibliothèques</button>
              <button
                className="text-purple-600 hover:underline"
                onClick={() => generateThumbnail(d.id)}
                disabled={thumbnailGeneration.isGenerating}
              >
                {thumbnailGeneration.isGenerating && thumbnailGeneration.designId === d.id ? 'Génération...' : '🖼️ Générer aperçu'}
              </button>
              <button
                className="text-red-600 hover:underline ml-auto"
                onClick={async () => {
                  if (confirm(`Êtes-vous sûr de vouloir supprimer le design "${d.name}" ?`)) {
                    try {
                      const response = await fetch(`/api/designs?id=${encodeURIComponent(d.id)}`, { method: "DELETE" });
                      if (!response.ok) {
                        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                      }
                  await refresh();
                      console.log('✅ Design supprimé avec succès');
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression:', error);
                      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                    }
                  }
                }}
              >Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
      </div>
      
      {/* Composant pour la génération automatique de miniatures */}
      {thumbnailGeneration.isGenerating && thumbnailGeneration.modelUrl && thumbnailGeneration.designSvgUrl && (
        <OffscreenThumbnailCapture
          modelUrl={thumbnailGeneration.modelUrl}
          designSvgUrl={thumbnailGeneration.designSvgUrl}
          colors={thumbnailGeneration.colors}
          textureMaps={thumbnailGeneration.textureMaps}
          materialMaps={thumbnailGeneration.materialMaps}
          onCapture={handleThumbnailCapture}
          onError={handleThumbnailError}
        />
      )}
    </div>
  );
}

