"use client";

import { SvgColorMapper } from "@/components/admin/SvgColorMapper";
import { useState } from "react";

export default function SvgColorMapperPage() {
  const [exportedSvg, setExportedSvg] = useState<string>("");

  const handleExport = (svgString: string) => {
    setExportedSvg(svgString);
    console.log("SVG exporté:", svgString);
  };

  return (
    <div className="flex flex-col bg-gray-50">
      <div>
        <SvgColorMapper onExport={handleExport} className="" />
      </div>
      {exportedSvg && (
        <div className="flex-shrink-0 border-t bg-white p-4 max-h-64 overflow-auto shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">SVG Exporté</h2>
            <button
              onClick={() => {
                const blob = new Blob([exportedSvg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "design-mapped.svg";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              💾 Télécharger
            </button>
          </div>
          <pre className="text-xs bg-gray-50 border rounded p-2 overflow-auto max-h-40">
            {exportedSvg.substring(0, 500)}...
          </pre>
        </div>
      )}
    </div>
  );
}
