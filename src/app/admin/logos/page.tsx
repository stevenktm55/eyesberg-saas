'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoVariant {
  id: string;
  name: string;
  file: string;
}

interface Logo {
  id: string;
  name: string;
  tags?: string[];
  variants: LogoVariant[];
}

export default function AdminLogosPage() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [libraries, setLibraries] = useState<Array<{id: string; name: string}>>([]);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | 'all'>('all');
  const [libraryLogos, setLibraryLogos] = useState<Record<string, string[]>>({});

  // États pour nouveau logo
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoTags, setNewLogoTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [variantName, setVariantName] = useState('Original');
  
  // États pour ajouter une variante
  const [selectedLogoForVariant, setSelectedLogoForVariant] = useState<string | null>(null);

  useEffect(() => {
    fetchLogos();
    fetchLibraries();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await fetch('/api/logos');
      const data = await response.json();
      setLogos(data);
    } catch (error) {
      console.error('Error fetching logos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLibraries = async () => {
    try {
      const res = await fetch('/api/logo-libraries');
      const data = await res.json();
      setLibraries(data);
    } catch (e) {
      console.error('Error fetching libraries', e);
    }
  };

  // Charger les logos d'une bibliothèque quand on change de sélection
  useEffect(() => {
    (async () => {
      if (selectedLibraryId && selectedLibraryId !== 'all') {
        try {
          const res = await fetch(`/api/logo-libraries?libraryId=${encodeURIComponent(selectedLibraryId)}`);
          const list = await res.json();
          setLibraryLogos(prev => ({ ...prev, [selectedLibraryId as string]: (Array.isArray(list) ? list : []).map((l:any)=>l.id) }));
        } catch (e) {
          setLibraryLogos(prev => ({ ...prev, [selectedLibraryId as string]: [] }));
        }
      }
    })();
  }, [selectedLibraryId]);

  // Précharger l'appartenance de tous les logos à toutes les bibliothèques au chargement
  useEffect(() => {
    (async () => {
      if (!Array.isArray(libraries) || libraries.length === 0) return;
      const entries: Record<string, string[]> = {};
      for (const lib of libraries) {
        try {
          const res = await fetch(`/api/logo-libraries?libraryId=${encodeURIComponent(lib.id)}`);
          const list = await res.json();
          entries[lib.id] = (Array.isArray(list) ? list : []).map((l:any)=>l.id);
        } catch {
          entries[lib.id] = [];
        }
      }
      setLibraryLogos(prev => ({ ...prev, ...entries }));
    })();
  }, [libraries.map(l => l.id).join(',')]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile || !newLogoName.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', newLogoName);
      formData.append('tags', newLogoTags);
      formData.append('variantName', variantName);

      const response = await fetch('/api/logos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchLogos();
        // Si une bibliothèque est sélectionnée, attacher automatiquement le dernier logo créé
        if (selectedLibraryId && selectedLibraryId !== 'all') {
          try {
            const payload = await response.json();
            const createdList = payload?.logos || [];
            const created = createdList[createdList.length - 1];
            if (created?.id) {
              await handleAttachToLibrary(selectedLibraryId as string, created.id);
              // rafraîchir la vue bibliothèque
              const res = await fetch(`/api/logo-libraries?libraryId=${encodeURIComponent(selectedLibraryId)}`);
              const list = await res.json();
              setLibraryLogos(prev => ({ ...prev, [selectedLibraryId as string]: (Array.isArray(list) ? list : []).map((l:any)=>l.id) }));
            }
          } catch {}
        }
        setNewLogoName('');
        setNewLogoTags('');
        setSelectedFile(null);
        setVariantName('Original');
        
        // Reset file input
        const fileInput = document.getElementById('logoFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim()) return;
    const res = await fetch('/api/logo-libraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newLibraryName }) });
    if (res.ok) {
      setNewLibraryName('');
      fetchLibraries();
    }
  };

  const handleAttachToLibrary = async (libraryId: string, logoId: string) => {
    await fetch('/api/logo-libraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'attach_logo', libraryId, logoId }) });
  };

  const handleDetachFromLibrary = async (libraryId: string, logoId: string) => {
    await fetch('/api/logo-libraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'detach_logo', libraryId, logoId }) });
  };

  const handleAddVariant = async (logoId: string, file: File, variantName: string) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('logoId', logoId);
      formData.append('variantName', variantName);

      const response = await fetch('/api/logos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchLogos();
        setSelectedLogoForVariant(null);
      }
    } catch (error) {
      console.error('Error adding variant:', error);
      alert('Erreur lors de l\'ajout de la variante');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVariant = async (logoId: string, variantId: string) => {
    if (!confirm('Supprimer cette variante ?')) return;

    try {
      await fetch(`/api/logos?logoId=${logoId}&variantId=${variantId}`, {
        method: 'DELETE',
      });
      await fetchLogos();
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  };

  const handleDeleteLogo = async (logoId: string) => {
    if (!confirm('Supprimer ce logo et toutes ses variantes ?')) return;

    try {
      const res = await fetch(`/api/logos?logoId=${logoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Mise à jour optimiste locale
      setLogos(prev => prev.filter(l => l.id !== logoId));
      setLibraryLogos(prev => {
        const copy: Record<string, string[]> = { ...prev };
        for (const k of Object.keys(copy)) {
          copy[k] = (copy[k] || []).filter(id => id !== logoId);
        }
        return copy;
      });
      // Rafraîchir la liste serveur en arrière-plan
      fetchLogos();
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert("Erreur lors de la suppression du logo. Réessaie ou rafraîchis la page.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Logos</h1>
            <p className="text-gray-600 mt-2">Gérez des bibliothèques de logos, variantes, et affectations</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Retour
          </Link>
        </div>

        {/* Gestion des bibliothèques */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bibliothèques</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">Créer une bibliothèque</label>
              <input value={newLibraryName} onChange={(e)=>setNewLibraryName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Partenaires 2025" />
            </div>
            <button onClick={handleCreateLibrary} className="px-4 py-2 bg-black text-white rounded-lg">Créer</button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-700">Filtrer par bibliothèque:</span>
            <select value={selectedLibraryId} onChange={(e)=>setSelectedLibraryId((e.target.value || 'all') as any)} className="px-3 py-2 border rounded">
              <option value="all">Toutes ({logos.length})</option>
              {(Array.isArray(libraries) ? libraries : []).map(lib => (
                <option key={lib.id} value={lib.id}>
                  {lib.name} ({(libraryLogos[lib.id] || []).length || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formulaire d'ajout de logo */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ajouter un nouveau logo</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nom du logo *
              </label>
              <input
                type="text"
                value={newLogoName}
                onChange={(e) => setNewLogoName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Nike Swoosh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={newLogoTags}
                onChange={(e) => setNewLogoTags(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: sport, nike, swoosh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nom de la variante *
              </label>
              <select
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Original">Original</option>
                <option value="Blanc">Blanc</option>
                <option value="Noir">Noir</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Fichier (SVG, PNG, JPG, JPEG) *
              </label>
              <input
                id="logoFile"
                type="file"
                accept=".svg,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              onClick={handleUploadLogo}
              disabled={isUploading || !selectedFile || !newLogoName.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isUploading ? 'Upload en cours...' : 'Ajouter le logo'}
            </button>
          </div>
        </div>

        {/* Liste des logos */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Logos existants ({logos.length})
          </h2>

          {logos.length === 0 ? (
            <p className="text-gray-500">Aucun logo pour le moment</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(
                ((selectedLibraryId !== 'all' && libraryLogos[selectedLibraryId as string])
                  ? logos.filter(l => (libraryLogos[selectedLibraryId as string] || []).includes(l.id))
                  : logos)
              ).map((logo) => (
                <div key={logo.id} className="border border-gray-200 rounded-lg p-3 h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{logo.name}</h3>
                      {logo.tags && logo.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {logo.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteLogo(logo.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Affectation aux bibliothèques */}
                  {libraries.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-700">Ajouter à une bibliothèque:</span>
                      {libraries.map(lib => {
                        const isMember = (libraryLogos[lib.id] || []).includes(logo.id);
                        return (
                          <button
                            key={lib.id}
                            onClick={async ()=>{
                              if (isMember) {
                                await handleDetachFromLibrary(lib.id, logo.id);
                                setLibraryLogos(prev => ({
                                  ...prev,
                                  [lib.id]: (prev[lib.id] || []).filter(id => id !== logo.id)
                                }));
                              } else {
                                await handleAttachToLibrary(lib.id, logo.id);
                                setLibraryLogos(prev => ({
                                  ...prev,
                                  [lib.id]: Array.from(new Set([...(prev[lib.id] || []), logo.id]))
                                }));
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              isMember ? 'bg-black text-white border-black' : 'bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                            title={isMember ? 'Retirer de cette bibliothèque' : 'Ajouter à cette bibliothèque'}
                          >
                            {lib.name} {isMember ? '×' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Variantes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-900">
                      Variantes ({logo.variants.length})
                    </h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {logo.variants
                        .sort((a, b) => {
                          // Mettre la variante "default" en premier
                          if (a.name.toLowerCase() === 'default') return -1;
                          if (b.name.toLowerCase() === 'default') return 1;
                          // Ensuite trier par ordre alphabétique
                          return a.name.localeCompare(b.name);
                        })
                        .map((variant) => (
                        <div key={variant.id} className="border border-gray-200 rounded p-2">
                          <div className="relative w-full h-16 bg-gray-100 rounded mb-1.5 flex items-center justify-center">
                            {variant.file.endsWith('.svg') ? (
                              <img
                                src={variant.file}
                                alt={variant.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Image
                                src={variant.file}
                                alt={variant.name}
                                width={72}
                                height={72}
                                className="object-contain"
                              />
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-900 truncate">{variant.name}</p>
                          <button
                            onClick={() => handleDeleteVariant(logo.id, variant.id)}
                            className="text-[10px] text-red-600 hover:text-red-800 mt-0.5"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}

                      {/* Bouton ajouter variante */}
                      {logo.variants.length < 3 && (
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 flex flex-col items-center justify-center">
                          {selectedLogoForVariant === logo.id ? (
                            <div className="w-full">
                              <select
                                onChange={(e) => {
                                  const variantName = e.target.value;
                                  if (variantName) {
                                    const fileInput = document.createElement('input');
                                    fileInput.type = 'file';
                                    fileInput.accept = '.svg,.png,.jpg,.jpeg';
                                    fileInput.onchange = (e) => {
                                      const target = e.target as HTMLInputElement;
                                      if (target.files && target.files[0]) {
                                        handleAddVariant(logo.id, target.files[0], variantName);
                                      }
                                    };
                                    fileInput.click();
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs border rounded mb-1.5"
                                defaultValue=""
                              >
                                <option value="">Choisir...</option>
                                <option value="Original">Original</option>
                                <option value="Blanc">Blanc</option>
                                <option value="Noir">Noir</option>
                              </select>
                              <button
                                onClick={() => setSelectedLogoForVariant(null)}
                                className="text-[10px] text-gray-600 hover:text-gray-800"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedLogoForVariant(logo.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Ajouter variante
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}









