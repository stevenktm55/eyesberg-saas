"use client";

import { useEffect, useState, useRef } from "react";

type SizePattern = {
  id: string;
  name: string;
  model3dId: string;
  description?: string;
  sizes: string[]; // Liste des tailles personnalisées
  files: Array<{
    id: string;
    size: string;
    uvType: "UV0" | "UV2";
    svgUrl: string;
    metadata?: any;
  }>;
};

type Model3D = {
  id: string;
  name: string;
};

export default function SizesConfigPage() {
  const [patterns, setPatterns] = useState<SizePattern[]>([]);
  const [models, setModels] = useState<Model3D[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [editingPattern, setEditingPattern] = useState<SizePattern | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPattern, setNewPattern] = useState<{
    model3dId: string;
    name: string;
    description: string;
    sizes: string[];
  }>({
    model3dId: "",
    name: "",
    description: "",
    sizes: [],
  });
  const [uploadingSize, setUploadingSize] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [newSizeData, setNewSizeData] = useState<{
    name: string;
    file: File | null;
  }>({
    name: "",
    file: null,
  });

  useEffect(() => {
    fetchModels();
    fetchPatterns();
  }, []);

  async function fetchModels() {
    try {
      const res = await fetch("/api/models-3d");
      if (!res.ok) throw new Error("Failed to fetch models");
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  }

  async function fetchPatterns() {
    try {
      const res = await fetch("/api/size-patterns");
      if (!res.ok) throw new Error("Failed to fetch patterns");
      const data = await res.json();
      // Regrouper les patterns UV0 et UV2 par nom et modèle
      const patternsMap = new Map<string, SizePattern>();
      
      (Array.isArray(data) ? data : []).forEach((pattern: any) => {
        const key = `${pattern.name}-${pattern.model3dId}`;
        if (!patternsMap.has(key)) {
          // Créer un nouveau pattern groupé
          const sizesSet = new Set<string>();
          pattern.files?.forEach((f: any) => {
            sizesSet.add(f.size_name || f.size);
          });
          patternsMap.set(key, {
            id: pattern.id, // Utiliser l'ID du pattern UV0 comme ID principal
            name: pattern.name,
            model3dId: pattern.model3dId,
            description: pattern.description,
            sizes: Array.from(sizesSet).sort(),
            files: pattern.files?.map((f: any) => ({
              id: f.id,
              size: f.size_name || f.size,
              uvType: pattern.uv_type || pattern.uvType || "UV0",
              svgUrl: f.svg_url || f.svgUrl,
              metadata: f.metadata,
            })) || [],
          });
        } else {
          // Fusionner avec le pattern existant
          const existing = patternsMap.get(key)!;
          pattern.files?.forEach((f: any) => {
            existing.sizes.push(f.size_name || f.size);
            existing.files.push({
              id: f.id,
              size: f.size_name || f.size,
              uvType: pattern.uv_type || pattern.uvType || "UV0",
              svgUrl: f.svg_url || f.svgUrl,
              metadata: f.metadata,
            });
          });
          existing.sizes = Array.from(new Set(existing.sizes)).sort();
        }
      });
      
      setPatterns(Array.from(patternsMap.values()));
    } catch (error) {
      console.error("Error fetching patterns:", error);
    }
  }

  async function createPattern() {
    if (!newPattern.model3dId || !newPattern.name) {
      alert("Veuillez remplir le nom et sélectionner un modèle 3D");
      return;
    }

    if (newPattern.sizes.length === 0) {
      alert("Veuillez ajouter au moins une taille");
      return;
    }

    setLoading(true);
    try {
      // Créer le pattern pour UV0 (les deux types UV partagent le même pattern)
      const res = await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: newPattern.model3dId,
          name: newPattern.name,
          description: newPattern.description,
          uvType: "UV0", // Par défaut, on crée pour UV0
        }),
      });

      if (!res.ok) throw new Error("Failed to create pattern");
      const patternData = await res.json();
      
      // Créer aussi le pattern pour UV2 avec le même nom et description
      await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: newPattern.model3dId,
          name: newPattern.name,
          description: newPattern.description,
          uvType: "UV2",
        }),
      });
      
      await fetchPatterns();
      setNewPattern({
        model3dId: "",
        name: "",
        description: "",
        sizes: [],
      });
      setEditingPattern(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating pattern:", error);
      alert("Erreur lors de la création du groupe de tailles");
    } finally {
      setLoading(false);
    }
  }

  async function updatePattern() {
    if (!editingPattern || !editingPattern.model3dId || !editingPattern.name) {
      alert("Veuillez remplir le nom et sélectionner un modèle 3D");
      return;
    }

    setLoading(true);
    try {
      // Mettre à jour les deux patterns (UV0 et UV2)
      const res0 = await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: editingPattern.model3dId,
          name: editingPattern.name,
          description: editingPattern.description || "",
          uvType: "UV0",
        }),
      });

      const res2 = await fetch("/api/size-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model3dId: editingPattern.model3dId,
          name: editingPattern.name,
          description: editingPattern.description || "",
          uvType: "UV2",
        }),
      });

      if (!res0.ok || !res2.ok) throw new Error("Failed to update pattern");
      
      await fetchPatterns();
      setEditingPattern(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error updating pattern:", error);
      alert("Erreur lors de la mise à jour du groupe de tailles");
    } finally {
      setLoading(false);
    }
  }

  async function deletePattern(patternId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe de tailles ?")) return;

    setLoading(true);
    try {
      // Supprimer les deux patterns (UV0 et UV2)
      // On récupère d'abord le pattern pour trouver l'autre
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern) {
        // Récupérer tous les patterns avec le même nom et modèle pour supprimer UV0 et UV2
        const patternsToDelete = patterns.filter(p => 
          p.name === pattern.name && p.model3dId === pattern.model3dId
        );
        
        for (const p of patternsToDelete) {
          const res = await fetch(`/api/size-patterns?id=${encodeURIComponent(p.id)}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete pattern");
        }
      }
      
      await fetchPatterns();
    } catch (error) {
      console.error("Error deleting pattern:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(patternId: string, size: string, uvType: "UV0" | "UV2", file: File) {
    setUploadingSize(`${size}-${uvType}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patternId", patternId);
      formData.append("size", size);
      formData.append("uvType", uvType);

      const res = await fetch("/api/size-patterns/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload file");
      
      await fetchPatterns();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploadingSize(null);
    }
  }

  async function deleteFile(patternId: string, fileId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) return;

    setLoading(true);
    try {
      // TODO: Implémenter l'API DELETE pour les fichiers
      // Pour l'instant, on peut juste mettre à jour le pattern sans ce fichier
      await fetchPatterns();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  function openAddSizeModal() {
    setNewSizeData({
      name: "",
      file: null,
    });
    setShowAddSizeModal(true);
  }

  async function handleAddSize() {
    if (!newSizeData.name.trim()) {
      alert("Veuillez entrer un nom de taille");
      return;
    }

    const sizeName = newSizeData.name.trim();

    // Ajouter la taille à la liste
    if (editingPattern) {
      if (editingPattern.sizes.includes(sizeName)) {
        alert("Cette taille existe déjà");
        return;
      }
      setEditingPattern({
        ...editingPattern,
        sizes: [...editingPattern.sizes, sizeName].sort(),
      });
    } else {
      if (newPattern.sizes.includes(sizeName)) {
        alert("Cette taille existe déjà");
        return;
      }
      setNewPattern({
        ...newPattern,
        sizes: [...newPattern.sizes, sizeName].sort(),
      });
    }

    // Si on est en mode édition et qu'il y a un fichier, l'uploader pour UV0 et UV2
    if (editingPattern && newSizeData.file) {
      // Trouver les patterns UV0 et UV2
      const patternUV0 = patterns.find(p => 
        p.name === editingPattern.name && 
        p.model3dId === editingPattern.model3dId &&
        p.id === editingPattern.id
      );
      
      // Chercher le pattern UV2 correspondant
      const patternUV2 = patterns.find(p => 
        p.name === editingPattern.name && 
        p.model3dId === editingPattern.model3dId &&
        p.id !== editingPattern.id
      );

      // Uploader le même fichier pour UV0 et UV2
      if (patternUV0) {
        await uploadFile(patternUV0.id, sizeName, "UV0", newSizeData.file);
      }
      if (patternUV2) {
        await uploadFile(patternUV2.id, sizeName, "UV2", newSizeData.file);
      }
    }

    // Fermer le modal
    setShowAddSizeModal(false);
    setNewSizeData({
      name: "",
      file: null,
    });
  }

  function removeSize(size: string) {
    if (editingPattern) {
      setEditingPattern({
        ...editingPattern,
        sizes: editingPattern.sizes.filter(s => s !== size),
      });
    } else {
      setNewPattern({
        ...newPattern,
        sizes: newPattern.sizes.filter(s => s !== size),
      });
    }
  }

  const togglePattern = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId);
    } else {
      newExpanded.add(patternId);
    }
    setExpandedPatterns(newExpanded);
  };

  const filteredPatterns = patterns.filter((pattern) =>
    pattern.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showModal = editingPattern !== null || isCreating;

  return (
    <div style={{ fontFamily: 'var(--stepn-font-body)' }}>
      {/* Search and Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        gap: '16px'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: 1,
          maxWidth: '400px'
        }}>
          <input
            type="text"
            placeholder="Rechercher un groupe de tailles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'var(--stepn-font-body)'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#a0a0a0',
            fontSize: '16px'
          }}>
            ⌕
          </span>
        </div>
        <button
          onClick={() => {
            setNewPattern({
              model3dId: "",
              name: "",
              description: "",
              sizes: [],
            });
            setEditingPattern(null);
            setIsCreating(true);
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8eff36',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'var(--stepn-font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span>+</span>
          Nouveau groupe de tailles
        </button>
      </div>

      {/* Pattern Groups List */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          border: '2px dashed #2a2a2a',
          borderRadius: '8px',
          padding: '64px 32px',
          textAlign: 'center',
          color: '#a0a0a0'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun groupe de tailles</p>
          <p style={{ fontSize: '14px' }}>
            {searchQuery ? 'Aucun résultat pour votre recherche' : 'Créez votre premier groupe de tailles pour commencer'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPatterns.map((pattern) => {
            const isExpanded = expandedPatterns.has(pattern.id);
            const model = models.find((m) => m.id === pattern.model3dId);
            const fileCount = pattern.files.length;
            
            // Utiliser editingPattern.sizes si on est en mode édition pour ce pattern
            const displayPattern = editingPattern && editingPattern.id === pattern.id 
              ? editingPattern 
              : pattern;
            const displaySizes = editingPattern && editingPattern.id === pattern.id
              ? editingPattern.sizes
              : pattern.sizes;

            return (
              <div
                key={pattern.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => togglePattern(pattern.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#222222';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#a0a0a0',
                      fontSize: '12px',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                    <span style={{
                      color: isExpanded ? '#8eff36' : '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ✓
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '4px',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {pattern.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#a0a0a0',
                        fontFamily: 'var(--stepn-font-body)'
                      }}>
                        {displaySizes.length} taille{displaySizes.length > 1 ? 's' : ''} • {model?.name || 'Modèle inconnu'}
                      </p>
                    </div>
                  </div>
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPattern(pattern);
                    setIsCreating(false);
                  }}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a0a0a0',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#8eff36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#a0a0a0';
                    }}
                  >
                    ✎
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid #2a2a2a',
                    padding: '16px',
                    backgroundColor: '#0a0a0a'
                  }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={openAddSizeModal}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          fontFamily: 'var(--stepn-font-body)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                        }}
                      >
                        <span>+</span>
                        Ajouter une taille
                      </button>
                    </div>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Taille</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>UV0 (Designs)</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>UV2 (Logos)</th>
                          <th style={{
                            textAlign: 'left',
                            padding: '12px',
                            color: '#a0a0a0',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pattern.sizes.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#a0a0a0' }}>
                              Aucune taille. Ajoutez des tailles dans le modal d'édition.
                            </td>
                          </tr>
                        ) : (
                          pattern.sizes.map((size) => {
                            const fileUV0 = pattern.files.find((f) => f.size === size && f.uvType === "UV0");
                            const fileUV2 = pattern.files.find((f) => f.size === size && f.uvType === "UV2");
                            const fileKeyUV0 = `${pattern.id}-${size}-UV0`;
                            const fileKeyUV2 = `${pattern.id}-${size}-UV2`;
                            const isUploadingUV0 = uploadingSize === `${size}-UV0`;
                            const isUploadingUV2 = uploadingSize === `${size}-UV2`;

                            return (
                              <tr key={size} style={{ borderBottom: '1px solid #1a1a1a' }}>
                                <td style={{ padding: '12px', color: '#ffffff', fontWeight: '500' }}>{size}</td>
                                
                                {/* UV0 Column */}
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: 'column' }}>
                                    {fileUV0 ? (
                                      <a
                                        href={fileUV0.svgUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: '#8eff36',
                                          textDecoration: 'none',
                                          fontSize: '12px'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.textDecoration = 'underline';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.textDecoration = 'none';
                                        }}
                                      >
                                        Voir SVG
                                      </a>
                                    ) : (
                                      <span style={{ color: '#a0a0a0', fontSize: '12px' }}>-</span>
                                    )}
                                    <input
                                      ref={(el) => {
                                        fileInputRefs.current[fileKeyUV0] = el;
                                      }}
                                      type="file"
                                      accept=".svg"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                          uploadFile(displayPattern.id, size, "UV0", selectedFile);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        fileInputRefs.current[fileKeyUV0]?.click();
                                      }}
                                      disabled={isUploadingUV0}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: isUploadingUV0 ? '#3a3a3a' : '#2a2a2a',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: '4px',
                                        color: isUploadingUV0 ? '#8eff36' : '#ffffff',
                                        fontSize: '12px',
                                        cursor: isUploadingUV0 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isUploadingUV0) {
                                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isUploadingUV0) {
                                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                                        }
                                      }}
                                    >
                                      {isUploadingUV0 ? 'Upload...' : fileUV0 ? 'Remplacer' : 'Upload'}
                                    </button>
                                  </div>
                                </td>
                                
                                {/* UV2 Column */}
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: 'column' }}>
                                    {fileUV2 ? (
                                      <a
                                        href={fileUV2.svgUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: '#8eff36',
                                          textDecoration: 'none',
                                          fontSize: '12px'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.textDecoration = 'underline';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.textDecoration = 'none';
                                        }}
                                      >
                                        Voir SVG
                                      </a>
                                    ) : (
                                      <span style={{ color: '#a0a0a0', fontSize: '12px' }}>-</span>
                                    )}
                                    <input
                                      ref={(el) => {
                                        fileInputRefs.current[fileKeyUV2] = el;
                                      }}
                                      type="file"
                                      accept=".svg"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                          uploadFile(displayPattern.id, size, "UV2", selectedFile);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        fileInputRefs.current[fileKeyUV2]?.click();
                                      }}
                                      disabled={isUploadingUV2}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: isUploadingUV2 ? '#3a3a3a' : '#2a2a2a',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: '4px',
                                        color: isUploadingUV2 ? '#8eff36' : '#ffffff',
                                        fontSize: '12px',
                                        cursor: isUploadingUV2 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isUploadingUV2) {
                                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isUploadingUV2) {
                                          e.currentTarget.style.backgroundColor = '#2a2a2a';
                                        }
                                      }}
                                    >
                                      {isUploadingUV2 ? 'Upload...' : fileUV2 ? 'Remplacer' : 'Upload'}
                                    </button>
                                  </div>
                                </td>
                                
                                {/* Actions Column */}
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {fileUV0 && (
                                      <button
                                        onClick={() => deleteFile(displayPattern.id, fileUV0.id)}
                                        style={{
                                          padding: '6px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          color: '#a0a0a0',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#ff4444';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#a0a0a0';
                                        }}
                                        title="Supprimer UV0"
                                      >
                                        ×
                                      </button>
                                    )}
                                    {fileUV2 && (
                                      <button
                                        onClick={() => deleteFile(displayPattern.id, fileUV2.id)}
                                        style={{
                                          padding: '6px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          color: '#a0a0a0',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#ff4444';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = '#a0a0a0';
                                        }}
                                        title="Supprimer UV2"
                                      >
                                        ×
                                      </button>
                                    )}
                                    <button
                                      onClick={() => removeSize(size)}
                                      style={{
                                        padding: '6px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#a0a0a0',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ff4444';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#a0a0a0';
                                      }}
                                      title="Supprimer la taille"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => {
            setEditingPattern(null);
            setIsCreating(false);
            setNewPattern({
              model3dId: "",
              name: "",
              description: "",
              sizes: [],
            });
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)',
                margin: 0
              }}>
                {editingPattern ? 'Modifier le groupe de tailles' : 'Nouveau groupe de tailles'}
              </h2>
              <button
                onClick={() => {
                  setEditingPattern(null);
                  setNewPattern({
                    model3dId: "",
                    name: "",
                    description: "",
                    sizes: [],
                  });
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#a0a0a0',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0a0a0';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={editingPattern ? editingPattern.name : newPattern.name}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, name: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, name: e.target.value });
                      }
                    }}
                    placeholder="Ex: Maillot Standard"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Modèle 3D
                  </label>
                  <select
                    value={editingPattern ? editingPattern.model3dId : newPattern.model3dId}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, model3dId: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, model3dId: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}
                  >
                    <option value="">Sélectionner un modèle 3D</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Description (optionnel)
                  </label>
                  <textarea
                    value={editingPattern ? editingPattern.description || "" : newPattern.description}
                    onChange={(e) => {
                      if (editingPattern) {
                        setEditingPattern({ ...editingPattern, description: e.target.value });
                      } else {
                        setNewPattern({ ...newPattern, description: e.target.value });
                      }
                    }}
                    placeholder="Description du groupe de tailles..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              {editingPattern && (
                <button
                  onClick={() => deletePattern(editingPattern.id)}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#4a4a4a' : '#ff4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  Supprimer
                </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button
                  onClick={() => {
                    setEditingPattern(null);
                    setNewPattern({
                      model3dId: "",
                      name: "",
                      description: "",
                      sizes: [],
                    });
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={editingPattern ? updatePattern : createPattern}
                  disabled={!!(loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)))}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? '#4a4a4a' : '#8eff36',
                    border: 'none',
                    borderRadius: '8px',
                    color: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? '#a0a0a0' : '#000000',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading || (!editingPattern && (!newPattern.name || !newPattern.model3dId)) || (editingPattern && (!editingPattern.name || !editingPattern.model3dId)) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && ((editingPattern && editingPattern.name && editingPattern.model3dId) || (!editingPattern && newPattern.name && newPattern.model3dId))) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && ((editingPattern && editingPattern.name && editingPattern.model3dId) || (!editingPattern && newPattern.name && newPattern.model3dId))) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  {loading ? 'Enregistrement...' : editingPattern ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Size Modal */}
      {showAddSizeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}
          onClick={() => {
            setShowAddSizeModal(false);
            setNewSizeData({
              name: "",
              file: null,
            });
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #2a2a2a'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: 'var(--stepn-font-body)',
                margin: 0
              }}>
                Ajouter une taille
              </h2>
              <button
                onClick={() => {
                  setShowAddSizeModal(false);
                  setNewSizeData({
                    name: "",
                    file: null,
                  });
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#a0a0a0',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0a0a0';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Nom de la taille
                  </label>
                  <input
                    type="text"
                    value={newSizeData.name}
                    onChange={(e) => {
                      setNewSizeData({ ...newSizeData, name: e.target.value });
                    }}
                    placeholder="Ex: XS, S, M, L, XL, XXL, ou un nom personnalisé"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    Fichier SVG {newSizeData.file && <span style={{ color: '#8eff36', fontSize: '12px' }}>✓</span>}
                  </label>
                  <input
                    type="file"
                    accept=".svg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewSizeData({ ...newSizeData, file: file });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'var(--stepn-font-body)'
                    }}
                  />
                  {newSizeData.file && (
                    <p style={{ color: '#8eff36', fontSize: '12px', marginTop: '4px' }}>
                      Fichier sélectionné: {newSizeData.file.name}
                    </p>
                  )}
                  <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                    Ce fichier sera utilisé pour UV0 (Designs) et UV2 (Logos)
                  </p>
                </div>

                <p style={{ color: '#a0a0a0', fontSize: '12px', fontStyle: 'italic' }}>
                  Note: Le fichier SVG est optionnel. Vous pourrez l'uploader plus tard depuis le tableau.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '24px',
              borderTop: '1px solid #2a2a2a'
            }}>
              <button
                onClick={() => {
                  setShowAddSizeModal(false);
                  setNewSizeData({
                    name: "",
                    file: null,
                  });
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAddSize}
                disabled={!newSizeData.name.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !newSizeData.name.trim() ? '#4a4a4a' : '#8eff36',
                  border: 'none',
                  borderRadius: '8px',
                  color: !newSizeData.name.trim() ? '#a0a0a0' : '#000000',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !newSizeData.name.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (newSizeData.name.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newSizeData.name.trim()) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
