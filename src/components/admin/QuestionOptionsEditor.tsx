"use client";

import { useState } from "react";
import { ProductQuestion } from "./ProductEditor3D";
import { BackgroundRemovalModal } from "./BackgroundRemovalModal";

interface QuestionOptionsEditorProps {
  question: ProductQuestion;
  onUpdate: (question: ProductQuestion) => void;
}

export function QuestionOptionsEditor({
  question,
  onUpdate,
}: QuestionOptionsEditorProps) {
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [showBackgroundRemovalModal, setShowBackgroundRemovalModal] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [selectedOptionForUpload, setSelectedOptionForUpload] = useState<string | null>(null);
  const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null);

  if (!question.options || question.options.length === 0) {
    return null;
  }

  const handleColorChange = (option: string, color: string) => {
    const optionColors = question.optionColors || {};
    optionColors[option] = color;
    onUpdate({ ...question, optionColors });
  };

  const handlePriceChange = (option: string, price: number) => {
    const optionPrices = question.optionPrices || {};
    if (price > 0) {
      optionPrices[option] = price;
    } else {
      delete optionPrices[option];
    }
    onUpdate({ ...question, optionPrices });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">
        Configure Options
      </div>
      
      {question.displayType === "color" && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <div
              key={option}
              className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
            >
              <div className="flex-1 text-sm text-gray-700">{option}</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Color:</label>
                <input
                  type="color"
                  value={question.optionColors?.[option] || "#000000"}
                  onChange={(e) => handleColorChange(option, e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{
                    backgroundColor: question.optionColors?.[option] || "#000000",
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Price:</label>
                <input
                  type="number"
                  value={question.optionPrices?.[option] || 0}
                  onChange={(e) =>
                    handlePriceChange(option, parseFloat(e.target.value) || 0)
                  }
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <span className="text-xs text-gray-400">€</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {question.displayType === "image" && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <div
              key={option}
              className="p-2 border border-gray-200 rounded-lg"
            >
              <div className="text-sm text-gray-700 mb-2">{option}</div>
              <div className="flex items-center gap-2">
                {question.optionImages?.[option] ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={question.optionImages[option]}
                      alt={option}
                      className="w-16 h-16 object-cover rounded border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        const optionImages = { ...question.optionImages };
                        delete optionImages[option];
                        onUpdate({ ...question, optionImages });
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFileForUpload(file);
                          setSelectedOptionForUpload(option);
                          setShowBackgroundRemovalModal(true);
                        }
                      }}
                      className="hidden"
                      id={`image-upload-${option}`}
                    />
                    <label
                      htmlFor={`image-upload-${option}`}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 cursor-pointer inline-block"
                    >
                      Upload Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {question.displayType !== "color" &&
        question.displayType !== "image" &&
        question.displayType !== "none" && (
          <div className="text-xs text-gray-500">
            Configure options in the 3D preview
          </div>
        )}

      {/* Modal de suppression de fond */}
      <BackgroundRemovalModal
        isOpen={showBackgroundRemovalModal}
        imageFile={selectedFileForUpload}
        onClose={() => {
          setShowBackgroundRemovalModal(false);
          setSelectedFileForUpload(null);
          setSelectedOptionForUpload(null);
          setProcessedImageDataUrl(null);
        }}
        onConfirm={(dataUrl) => {
          if (selectedOptionForUpload) {
            // Uploader l'image traitée vers Supabase
            uploadProcessedImage(dataUrl, selectedOptionForUpload);
          }
          setShowBackgroundRemovalModal(false);
          setSelectedFileForUpload(null);
          setSelectedOptionForUpload(null);
          setProcessedImageDataUrl(null);
        }}
        onCancel={() => {
          // Si annulé, uploader l'image originale
          if (selectedFileForUpload && selectedOptionForUpload) {
            uploadOriginalImage(selectedFileForUpload, selectedOptionForUpload);
          }
          setShowBackgroundRemovalModal(false);
          setSelectedFileForUpload(null);
          setSelectedOptionForUpload(null);
          setProcessedImageDataUrl(null);
        }}
      />
    </div>
  );

  async function uploadProcessedImage(dataUrl: string, option: string) {
    try {
      // Convertir data URL en File
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `processed-${option}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/logos/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        const optionImages = { ...question.optionImages };
        optionImages[option] = uploadData.url;
        onUpdate({ ...question, optionImages });
      }
    } catch (error) {
      console.error('Erreur upload image traitée:', error);
    }
  }

  async function uploadOriginalImage(file: File, option: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/logos/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        const optionImages = { ...question.optionImages };
        optionImages[option] = uploadData.url;
        onUpdate({ ...question, optionImages });
      }
    } catch (error) {
      console.error('Erreur upload image originale:', error);
    }
  }
}

