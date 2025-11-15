"use client";

import { useState } from "react";
import { ProductQuestion, ProductLayer } from "./ProductEditor3D";
import { AddQuestionModal, InputType, DisplayType } from "./AddQuestionModal";

interface QuestionsPanelProps {
  questions: ProductQuestion[];
  layers: ProductLayer[];
  onQuestionsChange: (questions: ProductQuestion[]) => void;
  onLayersChange: (layers: ProductLayer[]) => void;
  selectedQuestionId: string | null;
  onQuestionSelect: (id: string | null) => void;
  selectedLayerId: string | null;
  onLayerSelect: (id: string | null) => void;
}

type PanelTab = "questions" | "layers" | "settings";

export function QuestionsPanel({
  questions,
  layers,
  onQuestionsChange,
  onLayersChange,
  selectedQuestionId,
  onQuestionSelect,
  selectedLayerId,
  onLayerSelect,
}: QuestionsPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("questions");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSubmitActionModal, setShowSubmitActionModal] = useState(false);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [dragOverQuestionId, setDragOverQuestionId] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleAddQuestion = () => {
    setIsModalOpen(true);
  };

  const handleCreateQuestion = (inputType: InputType, displayType: DisplayType) => {
    // Mapper les types Kickflip vers nos types internes
    let questionType: ProductQuestion["type"] = "text";
    
    // Mapping InputType vers notre type
    if (inputType === "radio" || inputType === "thumbnail" || inputType === "dropdown") {
      questionType = "radio";
    } else if (inputType === "color") {
      questionType = "color";
    } else if (inputType === "text") {
      questionType = "text";
    } else if (inputType === "checkbox") {
      questionType = "checkbox";
    } else if (inputType === "group") {
      questionType = "group";
    } else if (inputType === "image" || inputType === "file") {
      questionType = "image";
    }

    const newQuestion: ProductQuestion = {
      id: `q${Date.now()}`,
      type: questionType,
      label: `New ${inputType} question`,
      visible: displayType !== "none",
      // Stocker les types originaux pour référence future
      inputType: inputType as any,
      displayType: displayType as any,
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestionId(questionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", questionId);
    // Style du curseur pendant le drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedQuestionId(null);
    setDragOverQuestionId(null);
  };

  const handleDragOver = (e: React.DragEvent, questionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedQuestionId && draggedQuestionId !== questionId) {
      setDragOverQuestionId(questionId);
    }
  };

  const handleDragLeave = () => {
    setDragOverQuestionId(null);
  };

  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();
    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) {
      setDraggedQuestionId(null);
      setDragOverQuestionId(null);
      return;
    }

    const draggedIndex = questions.findIndex((q) => q.id === draggedQuestionId);
    const targetIndex = questions.findIndex((q) => q.id === targetQuestionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedQuestionId(null);
      setDragOverQuestionId(null);
      return;
    }

    // Réorganiser les questions
    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, removed);

    onQuestionsChange(newQuestions);
    setDraggedQuestionId(null);
    setDragOverQuestionId(null);
  };

  const getQuestionIcon = (question: ProductQuestion) => {
    // Utiliser inputType si disponible (système Kickflip)
    if (question.inputType) {
      const iconMap: Record<string, string> = {
        thumbnail: "🖼️",
        dropdown: "📋",
        radio: "🔘",
        label: "🏷️",
        file: "📤",
        text: "✏️",
        checkbox: "☑️",
        color: "🎨",
        none: "🚫",
        group: "📁",
        bulk: "📦",
      };
      return iconMap[question.inputType] || "❓";
    }
    
    // Fallback sur le type classique
    switch (question.type) {
      case "group":
        return "📁";
      case "color":
        return "🎨";
      case "text":
        return "✏️";
      case "image":
        return "🖼️";
      case "radio":
        return "🔘";
      case "checkbox":
        return "☑️";
      default:
        return "❓";
    }
  };

  const visibleQuestions = questions.filter((q) => q.visible !== false);
  const behindSceneLayers = layers.filter((l) => l.behindScene);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add question</h2>
          <button
            onClick={handleAddQuestion}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            + Add question
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              activeTab === "questions"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab("layers")}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              activeTab === "layers"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Layers
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              activeTab === "settings"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "questions" && (
          <div>
            {/* Questions list */}
            <ul className="divide-y divide-gray-200">
              {visibleQuestions.map((question) => (
                <li
                  key={question.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, question.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, question.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, question.id)}
                  className={`transition-all ${
                    draggedQuestionId === question.id ? "opacity-50" : ""
                  } ${
                    dragOverQuestionId === question.id ? "border-t-2 border-blue-500" : ""
                  }`}
                >
                  <div
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedQuestionId === question.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => onQuestionSelect(question.id)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to reorder"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestion(question.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            expandedQuestions.has(question.id) ? "rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="text-lg">{getQuestionIcon(question)}</span>
                      <span className="flex-1 text-sm font-medium">{question.label}</span>
                      {question.displayType && question.displayType !== "none" && (
                        <span className="text-xs text-gray-400">
                          ({question.displayType})
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Behind the scene section */}
            {behindSceneLayers.length > 0 && (
              <div className="border-t border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Behind the scene</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Not shown in question panel</p>
                <ul className="space-y-1">
                  {behindSceneLayers.map((layer) => (
                    <li
                      key={layer.id}
                      className={`p-2 text-xs rounded cursor-pointer hover:bg-gray-50 ${
                        selectedLayerId === layer.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => onLayerSelect(layer.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>🖼️</span>
                        <span>{layer.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add to cart action */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Add to cart</span>
                <button
                  onClick={() => setShowSubmitActionModal(true)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Edit submit action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "layers" && (
          <LayersTab
            layers={layers}
            onLayersChange={onLayersChange}
            selectedLayerId={selectedLayerId}
            onLayerSelect={onLayerSelect}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab />
        )}
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateQuestion}
      />

      {/* Edit Submit Action Modal */}
      {showSubmitActionModal && (
        <EditSubmitActionModal
          isOpen={showSubmitActionModal}
          onClose={() => setShowSubmitActionModal(false)}
        />
      )}
    </div>
  );
}

// Layers Tab Component
interface LayersTabProps {
  layers: ProductLayer[];
  onLayersChange: (layers: ProductLayer[]) => void;
  selectedLayerId: string | null;
  onLayerSelect: (id: string | null) => void;
}

function LayersTab({
  layers,
  onLayersChange,
  selectedLayerId,
  onLayerSelect,
}: LayersTabProps) {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  const handleAddLayer = () => {
    const newLayer: ProductLayer = {
      id: `l${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      behindScene: false,
    };
    onLayersChange([...layers, newLayer]);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (confirm("Are you sure you want to delete this layer?")) {
      onLayersChange(layers.filter((l) => l.id !== layerId));
      if (selectedLayerId === layerId) {
        onLayerSelect(null);
      }
    }
  };

  const handleMoveLayer = (layerId: string, direction: "up" | "down") => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;

    const newLayers = [...layers];
    if (direction === "up" && index > 0) {
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
    } else if (direction === "down" && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    }
    onLayersChange(newLayers);
  };

  // Drag & Drop handlers for layers
  const handleLayerDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", layerId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleLayerDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleLayerDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedLayerId && draggedLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  };

  const handleLayerDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleLayerDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    const draggedIndex = layers.findIndex((l) => l.id === draggedLayerId);
    const targetIndex = layers.findIndex((l) => l.id === targetLayerId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    // Réorganiser les layers
    const newLayers = [...layers];
    const [removed] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, removed);

    onLayersChange(newLayers);
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={handleAddLayer}
        className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
      >
        + Add layer
      </button>

      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleLayerDragStart(e, layer.id)}
            onDragEnd={handleLayerDragEnd}
            onDragOver={(e) => handleLayerDragOver(e, layer.id)}
            onDragLeave={handleLayerDragLeave}
            onDrop={(e) => handleLayerDrop(e, layer.id)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedLayerId === layer.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            } ${
              draggedLayerId === layer.id ? "opacity-50" : ""
            } ${
              dragOverLayerId === layer.id ? "border-t-2 border-blue-500" : ""
            }`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                {/* Drag Handle */}
                <div
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">#{index + 1}</span>
                <span className="text-sm font-medium">{layer.name}</span>
                {layer.behindScene && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    Behind scene
                  </span>
                )}
                {!layer.visible && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveLayer(layer.id, "up");
                  }}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveLayer(layer.id, "down");
                  }}
                  disabled={index === layers.length - 1}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLayer(layer.id);
                  }}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            {layer.meshName && (
              <p className="text-xs text-gray-500 mt-1 ml-6">Mesh: {layer.meshName}</p>
            )}
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No layers yet</p>
          <p className="text-xs mt-1">Add a layer to get started</p>
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Product Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3D Model URL
            </label>
            <input
              type="text"
              placeholder="https://example.com/model.glb"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL of the 3D model file (GLTF/GLB format)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview Image URL
            </label>
            <input
              type="text"
              placeholder="https://example.com/preview.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Preview image shown in product listings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-save"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="auto-save" className="text-sm text-gray-700">
              Auto-save changes
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-preview"
              defaultChecked
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="show-preview" className="text-sm text-gray-700">
              Show preview in editor
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Settings</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Camera Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="X"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Y"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Z"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Camera Target
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="X"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Y"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Z"
                className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Submit Action Modal Component
interface EditSubmitActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function EditSubmitActionModal({ isOpen, onClose }: EditSubmitActionModalProps) {
  const [actionType, setActionType] = useState<"addToCart" | "redirect" | "custom">("addToCart");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // TODO: Sauvegarder la configuration de l'action
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Edit Submit Action</h3>
        
        {showSuccessMessage ? (
          <div className="text-center py-4">
            <div className="text-green-600 mb-2">✓ Saved successfully</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="addToCart">Add to Cart</option>
                <option value="redirect">Redirect to URL</option>
                <option value="custom">Custom Action</option>
              </select>
            </div>

            {actionType === "redirect" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URL
                </label>
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/thank-you"
                />
              </div>
            )}

            {actionType === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter custom action message or JavaScript code"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

