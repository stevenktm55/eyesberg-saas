"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { ProductQuestion, ProductLayer } from "./ProductEditor3D";
import { Simple3DViewer } from "./Simple3DViewer";

interface Canvas3DPreviewProps {
  modelUrl: string | null;
  questions: ProductQuestion[];
  layers: ProductLayer[];
  onModelUrlChange: (url: string | null) => void;
}

export function Canvas3DPreview({
  modelUrl,
  questions,
  layers,
  onModelUrlChange,
}: Canvas3DPreviewProps) {
  const [currentView, setCurrentView] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const totalViews = 5; // Comme Kickflip

  const handleViewChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentView((prev) => (prev === 1 ? totalViews : prev - 1));
    } else {
      setCurrentView((prev) => (prev === totalViews ? 1 : prev + 1));
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Controls bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <button
            onClick={() => handleViewChange("prev")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Previous view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium px-2">{currentView}</span>
          <button
            onClick={() => handleViewChange("next")}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Next view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          {/* View selector */}
          <div className="flex gap-1">
            {Array.from({ length: totalViews }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentView(i + 1)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentView === i + 1 ? "bg-blue-600" : "bg-gray-300"
                }`}
                title={`View ${i + 1}`}
              />
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
            <button
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          {/* Share button */}
          <button
            className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded transition-colors"
            title="Share"
          >
            Share
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        {modelUrl ? (
          <Canvas
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 5], fov: 50 }}
            className="bg-gray-900"
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Simple3DViewer
                url={modelUrl}
                questions={questions}
                layers={layers}
              />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={10}
              />
              <Environment preset="studio" />
            </Suspense>
          </Canvas>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">No 3D model loaded</p>
              <p className="text-xs mt-1">Upload a GLTF/GLB model to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* View indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
        <span className="text-sm font-medium">View {currentView}</span>
      </div>
    </div>
  );
}

