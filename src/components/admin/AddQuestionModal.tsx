"use client";

import { useState } from "react";

export type InputType =
  | "thumbnail"
  | "dropdown"
  | "radio"
  | "label"
  | "file"
  | "text"
  | "checkbox"
  | "color"
  | "none"
  | "group"
  | "bulk";

export type DisplayType =
  | "none"
  | "image"
  | "color"
  | "logo"
  | "text"
  | "font"
  | "fontSize"
  | "textColor"
  | "textOutline";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (inputType: InputType, displayType: DisplayType) => void;
}

interface TypeOption {
  id: InputType | DisplayType;
  label: string;
  icon: string;
  description?: string;
}

const INPUT_TYPES: TypeOption[] = [
  { id: "thumbnail", label: "Thumbnail", icon: "🖼️" },
  { id: "dropdown", label: "Dropdown", icon: "📋" },
  { id: "radio", label: "Radio button", icon: "🔘" },
  { id: "label", label: "Label", icon: "🏷️" },
  { id: "file", label: "File upload", icon: "📤" },
  { id: "text", label: "Text input", icon: "✏️" },
  { id: "checkbox", label: "Checkbox", icon: "☑️" },
  { id: "color", label: "Color picker", icon: "🎨" },
  { id: "none", label: "None", icon: "🚫" },
  { id: "group", label: "Group", icon: "📁" },
  { id: "bulk", label: "Bulk order", icon: "📦" },
];

const DISPLAY_TYPES: TypeOption[] = [
  { id: "none", label: "None", icon: "🚫", description: "Not shown on product" },
  { id: "image", label: "Image", icon: "🖼️" },
  { id: "color", label: "Color", icon: "🎨" },
  { id: "logo", label: "Logo", icon: "⭐" },
  { id: "text", label: "Text", icon: "📝" },
  { id: "font", label: "Font", icon: "🔤" },
  { id: "fontSize", label: "Font size", icon: "📏" },
  { id: "textColor", label: "Text color", icon: "🎨" },
  { id: "textOutline", label: "Text outline", icon: "✏️" },
];

// Descriptions dynamiques selon la combinaison
const getCombinationDescription = (
  inputType: InputType | null,
  displayType: DisplayType | null
): string => {
  if (!inputType || !displayType) {
    return "Please select what you want to create";
  }

  const combinations: Record<string, string> = {
    "color-color": "Create a multiple choice question where each answer is a color applied on the 3D product",
    "radio-color": "Create a multiple choice question where each answer applies a color on the 3D product",
    "dropdown-color": "Create a dropdown question where each option applies a color on the 3D product",
    "thumbnail-color": "Create a thumbnail selection question where each option applies a color on the 3D product",
    "radio-image": "Create a multiple choice question where each answer changes the product texture",
    "thumbnail-image": "Create a thumbnail selection question where each option changes the product texture",
    "dropdown-image": "Create a dropdown question where each option changes the product texture",
    "text-text": "Create a text input question where the user's text appears on the 3D product",
    "file-logo": "Create a file upload question where the uploaded file appears as a logo on the 3D product",
    "radio-font": "Create a multiple choice question where each answer changes the font",
    "radio-textColor": "Create a multiple choice question where each answer changes the text color",
    "radio-textOutline": "Create a multiple choice question where each answer changes the text outline",
    "none-none": "Create a hidden question for logic purposes only (behind the scene)",
    "label-none": "Create a label/question separator (not shown on product)",
  };

  const key = `${inputType}-${displayType}`;
  return (
    combinations[key] ||
    `Create a ${inputType} question with ${displayType} display type on the 3D product`
  );
};

export function AddQuestionModal({
  isOpen,
  onClose,
  onCreate,
}: AddQuestionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInputType, setSelectedInputType] = useState<InputType | null>(
    null
  );
  const [selectedDisplayType, setSelectedDisplayType] =
    useState<DisplayType | null>(null);

  if (!isOpen) return null;

  const handleInputTypeSelect = (type: InputType) => {
    setSelectedInputType(type);
    setStep(2);
  };

  const handleDisplayTypeSelect = (type: DisplayType) => {
    setSelectedDisplayType(type);
  };

  const handleCreate = () => {
    if (selectedInputType && selectedDisplayType) {
      onCreate(selectedInputType, selectedDisplayType);
      // Reset
      setStep(1);
      setSelectedInputType(null);
      setSelectedDisplayType(null);
      onClose();
    }
  };

  const handleClose = () => {
    // Reset
    setStep(1);
    setSelectedInputType(null);
    setSelectedDisplayType(null);
    onClose();
  };

  const canCreate = selectedInputType !== null && selectedDisplayType !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Add question</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input Type */}
          <div className={step === 1 ? "block" : "hidden"}>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              1. Select an input type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {INPUT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleInputTypeSelect(type.id as InputType)}
                  className={`p-4 border-2 rounded-lg transition-all hover:border-blue-400 hover:bg-blue-50 text-left ${
                    selectedInputType === type.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {type.label}
                  </div>
                  {type.id === "bulk" && (
                    <span className="inline-block mt-1 text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                      beta
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Display Type */}
          <div className={step === 2 ? "block" : "hidden"}>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              2. Select a display type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {DISPLAY_TYPES.map((type) => {
                const isDisabled = type.id === "none" && selectedInputType === "none";
                return (
                  <button
                    key={type.id}
                    onClick={() =>
                      !isDisabled && handleDisplayTypeSelect(type.id as DisplayType)
                    }
                    disabled={isDisabled}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      isDisabled
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : selectedDisplayType === type.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {type.label}
                    </div>
                    {type.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {type.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setStep(1);
                setSelectedDisplayType(null);
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to step 1
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {getCombinationDescription(selectedInputType, selectedDisplayType)}
            </p>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                canCreate
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

