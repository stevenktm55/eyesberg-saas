"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Font {
  id: string;
  name: string;
  display_name: string;
  font_url: string;
  format: string;
  category?: string;
  active: boolean;
  letter_spacing?: number;
  show_for_names?: boolean;
  show_for_numbers?: boolean;
  created_at: string;
  updated_at: string;
}

export default function FontsAdminPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontName, setFontName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFontId, setEditingFontId] = useState<string | null>(null);
  const [editingLetterSpacing, setEditingLetterSpacing] = useState<number>(0);
  const [editingShowForNames, setEditingShowForNames] = useState<boolean>(true);
  const [editingShowForNumbers, setEditingShowForNumbers] = useState<boolean>(true);

  // Charger les polices
  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      const response = await fetch('/api/fonts');
      const data = await response.json();
      setFonts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des polices:', error);
      setError('Erreur lors du chargement des polices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier l'extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['ttf', 'otf', 'woff', 'woff2'];
      
      if (!extension || !validExtensions.includes(extension)) {
        setError('Format de fichier non valide. Utilisez .ttf, .otf, .woff ou .woff2');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !fontName) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', fontName);

      const response = await fetch('/api/fonts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      setSuccess('Police ajoutée avec succès !');
      setFontName('');
      setSelectedFile(null);
      
      // Réinitialiser l'input file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Recharger la liste
      await loadFonts();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'ajout de la police');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer la police "${name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/fonts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSuccess('Police supprimée avec succès');
      await loadFonts();
    } catch (error) {
      setError('Erreur lors de la suppression de la police');
    }
  };

  const handleEditFont = async (id: string, letterSpacing: number, showForNames: boolean, showForNumbers: boolean) => {
    try {
      const response = await fetch('/api/fonts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          letterSpacing, 
          showForNames, 
          showForNumbers 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      setSuccess('Police modifiée avec succès');
      setEditingFontId(null);
      await loadFonts();
    } catch (error) {
      setError('Erreur lors de la modification de la police');
    }
  };

  const startEditing = (font: Font) => {
    setEditingFontId(font.id);
    setEditingLetterSpacing(font.letter_spacing || 0);
    setEditingShowForNames(font.show_for_names ?? true);
    setEditingShowForNumbers(font.show_for_numbers ?? true);
  };

  // Charger dynamiquement les polices pour l'aperçu
  useEffect(() => {
    fonts.forEach(font => {
      if (typeof window !== 'undefined' && font.font_url) {
        const fontFace = new FontFace(font.display_name, `url(${font.font_url})`);
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
        }).catch(err => {
          console.error('Erreur lors du chargement de la police:', font.display_name, err);
        });
      }
    });
  }, [fonts]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Typographies</h1>
          <p className="text-gray-600 mt-2">Ajoutez et gérez les polices disponibles dans le configurateur</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Ajouter une nouvelle police</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la police
              </label>
              <input
                type="text"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="Ex: Montserrat, Roboto, Arial..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier de police
              </label>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Formats acceptés : .ttf, .otf, .woff, .woff2
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Fichier sélectionné :</span> {selectedFile.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Taille : {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile || !fontName}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUploading ? 'Upload en cours...' : 'Ajouter la police'}
            </button>
          </form>
        </div>

        {/* Liste des polices */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Polices disponibles</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : fonts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune police ajoutée</p>
              <p className="text-sm mt-1">Uploadez votre première police ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fonts.map((font) => (
                <div
                  key={font.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{font.display_name}</h3>
                        <p className="text-sm text-gray-500">
                          Format: {font.format.toUpperCase()} • {font.name}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            font.show_for_names ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {font.show_for_names ? '✓ Noms' : '✗ Noms'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            font.show_for_numbers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {font.show_for_numbers ? '✓ Numéros' : '✗ Numéros'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Ajoutée le {new Date(font.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      {/* Aperçu de la police */}
                      <div className="flex-1 max-w-md">
                        <p 
                          className="text-2xl text-gray-800"
                          style={{ 
                            fontFamily: font.display_name,
                            letterSpacing: `${font.letter_spacing || 0}em`
                          }}
                        >
                          AaBbCc 123
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Letter-spacing: {font.letter_spacing || 0}em
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bouton modifier */}
                    <button
                      onClick={() => startEditing(font)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier la police"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleDelete(font.id, font.name)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal d'édition */}
        {editingFontId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Modifier la police</h3>
              
              <div className="space-y-4">
                {/* Letter-spacing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Letter-spacing (en em)
                  </label>
                  <input
                    type="number"
                    value={editingLetterSpacing}
                    onChange={(e) => setEditingLetterSpacing(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="-0.5"
                    max="0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valeur en em (proportionnelle à la taille de la police). Valeurs négatives rapprochent, positives éloignent.
                  </p>
                </div>

                {/* Filtres d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Affichage dans le configurateur
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showForNames"
                        checked={editingShowForNames}
                        onChange={(e) => setEditingShowForNames(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showForNames" className="ml-2 text-sm text-gray-700">
                        Afficher pour les noms
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showForNumbers"
                        checked={editingShowForNumbers}
                        onChange={(e) => setEditingShowForNumbers(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showForNumbers" className="ml-2 text-sm text-gray-700">
                        Afficher pour les numéros
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Décochez pour masquer cette police dans les sections correspondantes du configurateur
                  </p>
                </div>

                {/* Aperçu en temps réel */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                  <p 
                    className="text-2xl text-gray-800"
                    style={{ 
                      fontFamily: fonts.find(f => f.id === editingFontId)?.display_name,
                      letterSpacing: `${editingLetterSpacing}em`
                    }}
                  >
                    AaBbCc 123
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setEditingFontId(null)}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => handleEditFont(editingFontId, editingLetterSpacing, editingShowForNames, editingShowForNumbers)}
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}









