"use client";

import { EditorTab } from "./ProductEditor3D";

interface ProductEditorTabsProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function ProductEditorTabs({ activeTab, onTabChange }: ProductEditorTabsProps) {
  const tabs: { id: EditorTab; label: string; badge?: string }[] = [
    { id: "build", label: "Build" },
    { id: "pricing", label: "Pricing" },
    { id: "variants", label: "Variants" },
    { id: "connect", label: "Connect" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

