"use client";

import { useState } from "react";
import { ProductQuestion, ProductLayer } from "./ProductEditor3D";
import { InputType, DisplayType } from "./AddQuestionModal";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";

interface SettingsPanelProps {
  selectedQuestionId: string | null;
  selectedLayerId: string | null;
  questions: ProductQuestion[];
  layers: ProductLayer[];
  onQuestionsChange: (questions: ProductQuestion[]) => void;
  onLayersChange: (layers: ProductLayer[]) => void;
  shop?: string;
}

interface QuestionOption {
  id: string;
  label: string;
  value: string;
  color?: string; // Pour displayType === "color"
  imageUrl?: string; // Pour displayType === "image"
  price?: number; // Prix additionnel pour cette option
}

export function SettingsPanel({
  selectedQuestionId,
  selectedLayerId,
  questions,
  layers,
  onQuestionsChange,
  onLayersChange,
  shop,
}: SettingsPanelProps) {
  const [groupSettingsTab, setGroupSettingsTab] = useState<"group" | "groupSettings">("group");
  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const isGroup = selectedQuestion?.type === "group" || selectedQuestion?.inputType === "group";

  if (!selectedQuestion && !selectedLayer) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-400">
          <p className="text-sm">Select a question or layer to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Settings</h3>
          {isGroup && (
            <div className="flex gap-1">
              <button
                onClick={() => setGroupSettingsTab("group")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  groupSettingsTab === "group"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Group
              </button>
              <button
                onClick={() => setGroupSettingsTab("groupSettings")}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  groupSettingsTab === "groupSettings"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Group settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedQuestion && isGroup && groupSettingsTab === "groupSettings" ? (
          <GroupSettingsTab
            question={selectedQuestion}
            questions={questions}
            layers={layers}
            onUpdate={(updated) => {
              const updatedQuestions = questions.map((q) =>
                q.id === selectedQuestionId ? updated : q
              );
              onQuestionsChange(updatedQuestions);
            }}
          />
        ) : selectedQuestion && (
          <div className="space-y-4">
            {/* Question Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium mb-1">Question Type</div>
              <div className="text-sm text-gray-700">
                {selectedQuestion.inputType ? (
                  <>
                    <span className="font-medium">{selectedQuestion.inputType}</span>
                    {selectedQuestion.displayType && (
                      <>
                        {" → "}
                        <span className="font-medium">{selectedQuestion.displayType}</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="font-medium">{selectedQuestion.type}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={selectedQuestion.label}
                onChange={(e) => {
                  const updated = questions.map((q) =>
                    q.id === selectedQuestionId ? { ...q, label: e.target.value } : q
                  );
                  onQuestionsChange(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Question title"
              />
            </div>

            {/* Options selon le type d'input */}
            {(selectedQuestion.type === "radio" || 
              selectedQuestion.inputType === "radio" || 
              selectedQuestion.inputType === "dropdown" || 
              selectedQuestion.inputType === "thumbnail" ||
              selectedQuestion.inputType === "color") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                  {selectedQuestion.displayType === "color" && (
                    <span className="text-xs text-gray-500 ml-2">(with colors)</span>
                  )}
                  {selectedQuestion.displayType === "image" && (
                    <span className="text-xs text-gray-500 ml-2">(with images)</span>
                  )}
                </label>
                <textarea
                  value={selectedQuestion.options?.join("\n") || ""}
                  onChange={(e) => {
                    const options = e.target.value.split("\n").filter((o) => o.trim());
                    const updated = questions.map((q) =>
                      q.id === selectedQuestionId ? { ...q, options } : q
                    );
                    onQuestionsChange(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    selectedQuestion.displayType === "color"
                      ? "One option per line (e.g., Red, Blue, Green)"
                      : selectedQuestion.displayType === "image"
                      ? "One option per line (images will be configured separately)"
                      : "One option per line"
                  }
                  rows={4}
                />
                {selectedQuestion.displayType === "color" && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Configure colors for each option below
                  </p>
                )}
              </div>
            )}

            {/* Options Editor (for color/image display types) */}
            {selectedQuestion.displayType &&
              (selectedQuestion.displayType === "color" ||
                selectedQuestion.displayType === "image") &&
              selectedQuestion.options &&
              selectedQuestion.options.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <QuestionOptionsEditor
                    question={selectedQuestion}
                    onUpdate={(updated) => {
                      const updatedQuestions = questions.map((q) =>
                        q.id === selectedQuestionId ? updated : q
                      );
                      onQuestionsChange(updatedQuestions);
                    }}
                  />
                </div>
              )}

            {/* Text input specific settings */}
            {(selectedQuestion.inputType === "text" || selectedQuestion.type === "text") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                <input
                  type="text"
                  value={(selectedQuestion as any).placeholder || ""}
                  onChange={(e) => {
                    const updated = questions.map((q) =>
                      q.id === selectedQuestionId ? { ...q, placeholder: e.target.value } : q
                    );
                    onQuestionsChange(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {/* Display Type Settings */}
            {selectedQuestion.displayType && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Display Settings</h4>
                
                {/* Layer/Mesh selection for 3D */}
                {(selectedQuestion.displayType === "color" || 
                  selectedQuestion.displayType === "text" || 
                  selectedQuestion.displayType === "logo") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Layer (3D)
                    </label>
                    <select
                      value={(selectedQuestion as any).layerId || ""}
                      onChange={(e) => {
                        const updated = questions.map((q) =>
                          q.id === selectedQuestionId ? { ...q, layerId: e.target.value } : q
                        );
                        onQuestionsChange(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a layer...</option>
                      {layers.map((layer) => (
                        <option key={layer.id} value={layer.id}>
                          {layer.name} {layer.meshName && `(${layer.meshName})`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select which 3D layer this question affects
                    </p>
                  </div>
                )}

                {/* Text display settings */}
                {selectedQuestion.displayType === "text" && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Font
                      </label>
                      <select
                        value={(selectedQuestion as any).fontFamily || ""}
                        onChange={(e) => {
                          const updated = questions.map((q) =>
                            q.id === selectedQuestionId ? { ...q, fontFamily: e.target.value } : q
                          );
                          onQuestionsChange(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Default</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier">Courier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Font Size
                      </label>
                      <input
                        type="number"
                        value={(selectedQuestion as any).fontSize || 16}
                        onChange={(e) => {
                          const updated = questions.map((q) =>
                            q.id === selectedQuestionId ? { ...q, fontSize: parseInt(e.target.value) } : q
                          );
                          onQuestionsChange(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="8"
                        max="72"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visibility */}
            <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
              <input
                type="checkbox"
                id="visible"
                checked={selectedQuestion.visible !== false}
                onChange={(e) => {
                  const updated = questions.map((q) =>
                    q.id === selectedQuestionId ? { ...q, visible: e.target.checked } : q
                  );
                  onQuestionsChange(updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="visible" className="text-sm text-gray-700">
                Visible in question panel
              </label>
            </div>

            {/* Required */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={(selectedQuestion as any).required || false}
                onChange={(e) => {
                  const updated = questions.map((q) =>
                    q.id === selectedQuestionId ? { ...q, required: e.target.checked } : q
                  );
                  onQuestionsChange(updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="text-sm text-gray-700">
                Required
              </label>
            </div>
          </div>
        )}

        {selectedLayer && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layer Name</label>
              <input
                type="text"
                value={selectedLayer.name}
                onChange={(e) => {
                  const updated = layers.map((l) =>
                    l.id === selectedLayerId ? { ...l, name: e.target.value } : l
                  );
                  onLayersChange(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mesh Name</label>
              <input
                type="text"
                value={selectedLayer.meshName || ""}
                onChange={(e) => {
                  const updated = layers.map((l) =>
                    l.id === selectedLayerId ? { ...l, meshName: e.target.value } : l
                  );
                  onLayersChange(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name of the mesh in 3D model"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="layer-visible"
                checked={selectedLayer.visible}
                onChange={(e) => {
                  const updated = layers.map((l) =>
                    l.id === selectedLayerId ? { ...l, visible: e.target.checked } : l
                  );
                  onLayersChange(updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="layer-visible" className="text-sm text-gray-700">
                Visible
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="behind-scene"
                checked={selectedLayer.behindScene || false}
                onChange={(e) => {
                  const updated = layers.map((l) =>
                    l.id === selectedLayerId ? { ...l, behindScene: e.target.checked } : l
                  );
                  onLayersChange(updated);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="behind-scene" className="text-sm text-gray-700">
                Behind the scene (not shown in question panel)
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Group Settings Tab Component
interface GroupSettingsTabProps {
  question: ProductQuestion;
  questions: ProductQuestion[];
  layers: ProductLayer[];
  onUpdate: (question: ProductQuestion) => void;
}

function GroupSettingsTab({ question, questions, layers, onUpdate }: GroupSettingsTabProps) {
  const [description, setDescription] = useState<string>(
    (question as any).description || ""
  );
  const [descriptionEnabled, setDescriptionEnabled] = useState<boolean>(
    (question as any).descriptionEnabled !== false
  );
  const [stepThumbnail, setStepThumbnail] = useState<string | null>(
    (question as any).stepThumbnail || null
  );
  const [switchView, setSwitchView] = useState<string>(
    (question as any).switchView || "none"
  );

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate({
      ...question,
      description: value,
      descriptionEnabled,
    } as any);
  };

  const handleDescriptionToggle = (enabled: boolean) => {
    setDescriptionEnabled(enabled);
    onUpdate({
      ...question,
      description: enabled ? description : "",
      descriptionEnabled: enabled,
    } as any);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload to server and get URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setStepThumbnail(url);
        onUpdate({
          ...question,
          stepThumbnail: url,
        } as any);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchViewChange = (view: string) => {
    setSwitchView(view);
    onUpdate({
      ...question,
      switchView: view,
    } as any);
  };

  // Get available views from layers
  const availableViews = layers
    .filter((l) => l.visible && !l.behindScene)
    .map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-4">
      {/* Description Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="checkbox"
            checked={descriptionEnabled}
            onChange={(e) => handleDescriptionToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        {descriptionEnabled && (
          <div className="border border-gray-300 rounded-lg">
            {/* Rich Text Editor Toolbar */}
            <div className="border-b border-gray-200 p-2 flex gap-2 bg-gray-50">
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Bold"
                onClick={() => {
                  const textarea = document.getElementById("description-editor") as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selected = description.substring(start, end);
                    const newText = description.substring(0, start) + `**${selected}**` + description.substring(end);
                    handleDescriptionChange(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 2, end + 2);
                    }, 0);
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Italic"
                onClick={() => {
                  const textarea = document.getElementById("description-editor") as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selected = description.substring(start, end);
                    const newText = description.substring(0, start) + `*${selected}*` + description.substring(end);
                    handleDescriptionChange(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 1, end + 1);
                    }, 0);
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Underline"
                onClick={() => {
                  const textarea = document.getElementById("description-editor") as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selected = description.substring(start, end);
                    const newText = description.substring(0, start) + `<u>${selected}</u>` + description.substring(end);
                    handleDescriptionChange(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 3, end + 3);
                    }, 0);
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h14M5 12h14M5 19h14" />
                </svg>
              </button>
              <div className="w-px bg-gray-300 mx-1" />
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Link"
                onClick={() => {
                  const url = prompt("Enter URL:");
                  if (url) {
                    const textarea = document.getElementById("description-editor") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = description.substring(start, end) || url;
                      const newText = description.substring(0, start) + `[${selected}](${url})` + description.substring(end);
                      handleDescriptionChange(newText);
                    }
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded"
                title="Bullet List"
                onClick={() => {
                  const textarea = document.getElementById("description-editor") as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const lines = description.split("\n");
                    let currentLine = 0;
                    let charCount = 0;
                    for (let i = 0; i < lines.length; i++) {
                      if (charCount + lines[i].length + 1 > start) {
                        currentLine = i;
                        break;
                      }
                      charCount += lines[i].length + 1;
                    }
                    lines[currentLine] = lines[currentLine] ? `- ${lines[currentLine]}` : "- ";
                    handleDescriptionChange(lines.join("\n"));
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>
            {/* Textarea */}
            <textarea
              id="description-editor"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full p-3 border-0 focus:outline-none focus:ring-0 resize-none"
              rows={6}
              placeholder="Enter description text..."
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4" />

      {/* Step Thumbnail Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Step thumbnail</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="hidden"
            id="thumbnail-upload"
          />
          <label htmlFor="thumbnail-upload" className="cursor-pointer">
            {stepThumbnail ? (
              <div className="space-y-2">
                <img src={stepThumbnail} alt="Thumbnail" className="max-w-full max-h-32 mx-auto rounded" />
                <p className="text-xs text-gray-500">Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Drop file to attach, or <span className="text-blue-600">browse</span></p>
              </div>
            )}
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The step thumbnail will be shown only on parent elements.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4" />

      {/* Switch View Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">Switch view</label>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <select
          value={switchView}
          onChange={(e) => handleSwitchViewChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          {availableViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

