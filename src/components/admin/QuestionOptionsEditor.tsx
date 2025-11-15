"use client";

import { useState } from "react";
import { ProductQuestion } from "./ProductEditor3D";

interface QuestionOptionsEditorProps {
  question: ProductQuestion;
  onUpdate: (question: ProductQuestion) => void;
}

export function QuestionOptionsEditor({
  question,
  onUpdate,
}: QuestionOptionsEditorProps) {
  const [editingOption, setEditingOption] = useState<string | null>(null);

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
                  <button
                    onClick={() => {
                      // TODO: Implémenter l'upload d'image
                      alert("Image upload coming soon");
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Upload Image
                  </button>
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
    </div>
  );
}

