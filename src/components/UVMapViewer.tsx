"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

type Zone = {
  id: string;
  name: string;
  position: [number, number, number]; // UV coordinates [u, v, 0]
  rotation: number; // Rotation in degrees
  width: number; // Width in UV space (0-1)
  height: number; // Height in UV space (0-1)
  isLogo?: boolean; // true for logo, false for text
};

type UVMapViewerProps = {
  modelUrl: string;
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneSelect: (id: string | null) => void;
  onZonePlaced: (position: [number, number, number]) => void;
  onZoneUpdate: (id: string, updates: Partial<Zone>) => void;
  isPlacingZone: boolean;
  canvasSize?: number; // Size of the UV map canvas (default: 2048)
  design2DUrl?: string | null; // Optional 2D design SVG to overlay on UV map
  onZoneConfirm?: () => void; // Callback when zone is confirmed
};

export function UVMapViewer({
  modelUrl,
  zones,
  selectedZoneId,
  onZoneSelect,
  onZonePlaced,
  onZoneUpdate,
  isPlacingZone,
  canvasSize = 2048,
  design2DUrl,
  onZoneConfirm
}: UVMapViewerProps) {
  // Expose selectedZoneId to handleMouseDown
  const selectedZoneIdRef = useRef(selectedZoneId);
  useEffect(() => {
    selectedZoneIdRef.current = selectedZoneId;
  }, [selectedZoneId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uvMapImage, setUvMapImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragZoneId, setDragZoneId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  // Load the 3D model to extract UV map
  useEffect(() => {
    if (!modelUrl) return;
    
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        setScene(gltf.scene);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );
  }, [modelUrl]);

  // Generate UV map visualization with optional 2D design overlay
  useEffect(() => {
    if (!scene || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas with dark background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw 2D design if provided
    if (design2DUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Redraw everything
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rotate canvas 180 degrees
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI); // 180 degrees
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Draw design 2D
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        ctx.restore();
        
        // Then draw UV wireframe on top (also rotated)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI); // 180 degrees
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawUVWireframe(ctx, scene, canvas.width, canvas.height);
        ctx.restore();
        
        // Convert to image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setUvMapImage(url);
          }
        });
      };
      img.onerror = () => {
        // If design fails to load, just draw UV wireframe (rotated)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI); // 180 degrees
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawUVWireframe(ctx, scene, canvas.width, canvas.height);
        ctx.restore();
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setUvMapImage(url);
          }
        });
      };
      img.src = design2DUrl;
    } else {
      // Just draw UV wireframe (rotated)
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI); // 180 degrees
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      drawUVWireframe(ctx, scene, canvas.width, canvas.height);
      ctx.restore();
      
      // Convert canvas to image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setUvMapImage(url);
        }
      });
    }
  }, [scene, canvasSize, design2DUrl]);

  // Helper function to draw UV wireframe
  const drawUVWireframe = (ctx: CanvasRenderingContext2D, scene: THREE.Scene, width: number, height: number) => {
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 1;
    
    scene.traverse((object: any) => {
      if (object.isMesh && object.geometry) {
        const geometry = object.geometry;
        const uvAttribute = geometry.attributes.uv;
        
        if (uvAttribute) {
          const index = geometry.index;
          
          if (index) {
            // Indexed geometry
            for (let i = 0; i < index.count; i += 3) {
              const i0 = index.getX(i);
              const i1 = index.getX(i + 1);
              const i2 = index.getX(i + 2);
              
              const uv0 = new THREE.Vector2(uvAttribute.getX(i0), uvAttribute.getY(i0));
              const uv1 = new THREE.Vector2(uvAttribute.getX(i1), uvAttribute.getY(i1));
              const uv2 = new THREE.Vector2(uvAttribute.getX(i2), uvAttribute.getY(i2));
              
              // Draw triangle edges
              ctx.beginPath();
              ctx.moveTo(uv0.x * width, (1 - uv0.y) * height);
              ctx.lineTo(uv1.x * width, (1 - uv1.y) * height);
              ctx.lineTo(uv2.x * width, (1 - uv2.y) * height);
              ctx.closePath();
              ctx.stroke();
            }
          } else {
            // Non-indexed geometry
            for (let i = 0; i < uvAttribute.count; i += 3) {
              const uv0 = new THREE.Vector2(uvAttribute.getX(i), uvAttribute.getY(i));
              const uv1 = new THREE.Vector2(uvAttribute.getX(i + 1), uvAttribute.getY(i + 1));
              const uv2 = new THREE.Vector2(uvAttribute.getX(i + 2), uvAttribute.getY(i + 2));
              
              // Draw triangle edges
              ctx.beginPath();
              ctx.moveTo(uv0.x * width, (1 - uv0.y) * height);
              ctx.lineTo(uv1.x * width, (1 - uv1.y) * height);
              ctx.lineTo(uv2.x * width, (1 - uv2.y) * height);
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      }
    });
  };

  // Convert screen coordinates to UV coordinates (accounting for 180° rotation)
  const screenToUV = useCallback((screenX: number, screenY: number): [number, number] | null => {
    if (!containerRef.current || !canvasRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    // Get canvas display size (may be different from actual canvas size due to CSS)
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const scaleX = canvas.width / canvasDisplayWidth;
    const scaleY = canvas.height / canvasDisplayHeight;
    
    // Account for pan and scale
    const x = (screenX - rect.left - pan.x) / scale * scaleX;
    const y = (screenY - rect.top - pan.y) / scale * scaleY;
    
    // Convert to UV coordinates (0-1) and apply 180° rotation
    // After 180° rotation: (u, v) -> (1-u, 1-v)
    const u = Math.max(0, Math.min(1, x / canvas.width));
    const v = Math.max(0, Math.min(1, 1 - (y / canvas.height))); // Flip Y axis
    
    // Apply 180° rotation: flip both coordinates
    const rotatedU = 1 - u;
    const rotatedV = 1 - v;
    
    return [rotatedU, rotatedV];
  }, [pan, scale]);

  // Convert UV coordinates to screen coordinates (accounting for 180° rotation)
  const uvToScreen = useCallback((uv: [number, number]): { x: number; y: number } | null => {
    if (!containerRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Get canvas display size (may be different from actual canvas size due to CSS)
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const scaleX = canvasDisplayWidth / canvas.width;
    const scaleY = canvasDisplayHeight / canvas.height;
    
    // Apply 180° rotation: flip both coordinates
    const rotatedU = 1 - uv[0];
    const rotatedV = 1 - uv[1];
    
    const x = rotatedU * canvas.width * scaleX * scale + pan.x;
    const y = rotatedV * canvas.height * scaleY * scale + pan.y;
    
    return { x, y };
  }, [pan, scale]);

  // Check if point is inside rotated rectangle
  const isPointInRotatedRect = useCallback((
    point: { x: number; y: number },
    center: { x: number; y: number },
    width: number,
    height: number,
    rotation: number
  ): boolean => {
    // Translate point to origin
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    // Rotate point back
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    
    // Check if inside unrotated rectangle
    return Math.abs(rotatedX) < width / 2 && Math.abs(rotatedY) < height / 2;
  }, []);

  // Handle mouse down - select zone, move selected zone, or place new one
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicking on a zone
    let clickedZone: Zone | null = null;
    
    for (const zone of zones) {
      const screenPos = uvToScreen([zone.position[0], zone.position[1]]);
      if (!screenPos || !canvasRef.current) continue;
      
      const zoneWidth = zone.width * canvasRef.current.width * scale;
      const zoneHeight = zone.height * canvasRef.current.height * scale;
      
      // Check if clicking inside zone (accounting for rotation in degrees)
      if (isPointInRotatedRect(
        { x: mouseX, y: mouseY },
        screenPos,
        zoneWidth,
        zoneHeight,
        (zone.rotation * Math.PI) / 180 // Convert degrees to radians
      )) {
        clickedZone = zone;
        break;
      }
    }
    
    if (clickedZone) {
      // Select the zone
      onZoneSelect(clickedZone.id);
    } else if (selectedZoneId) {
      // If a zone is selected and we click outside, move it to the clicked position
      const uv = screenToUV(e.clientX, e.clientY);
      if (uv) {
        onZoneUpdate(selectedZoneId, { position: [uv[0], uv[1], 0] });
      }
    } else if (isPlacingZone) {
      // Place new zone
      const uv = screenToUV(e.clientX, e.clientY);
      if (uv) {
        onZonePlaced([uv[0], uv[1], 0]);
      }
    } else {
      // Deselect
      onZoneSelect(null);
    }
  }, [zones, uvToScreen, screenToUV, isPlacingZone, onZoneSelect, onZonePlaced, onZoneUpdate, scale, isPointInRotatedRect]);

  // Handle mouse move - no longer needed for dragging, but keep for potential future use
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // No drag functionality - zones are managed via settings panel
  }, []);

  // Handle mouse up - no longer needed
  const handleMouseUp = useCallback(() => {
    // No drag functionality
  }, []);

  // Draw zones on canvas (separate layer for zones to allow pan/zoom)
  const zonesCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!zonesCanvasRef.current || !canvasRef.current) return;
    
    const zonesCanvas = zonesCanvasRef.current;
    const baseCanvas = canvasRef.current;
    const ctx = zonesCanvas.getContext("2d");
    if (!ctx) return;
    
    // Match base canvas size
    zonesCanvas.width = baseCanvas.width;
    zonesCanvas.height = baseCanvas.height;
    
    // Clear
    ctx.clearRect(0, 0, zonesCanvas.width, zonesCanvas.height);
    
    // Draw zones
    zones.forEach(zone => {
      // Apply 180° rotation to match UV map
      const x = (1 - zone.position[0]) * zonesCanvas.width;
      const y = zone.position[1] * zonesCanvas.height;
      const width = zone.width * zonesCanvas.width;
      const height = zone.height * zonesCanvas.height;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((zone.rotation * Math.PI) / 180); // Convert degrees to radians
      
      // Draw zone rectangle (no bounding box, just subtle border)
      const isSelected = selectedZoneId === zone.id;
      ctx.strokeStyle = isSelected ? "#8eff36" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.fillStyle = isSelected ? "rgba(142, 255, 54, 0.1)" : "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      
      // Draw "Logo" or "Texte" text in center
      ctx.fillStyle = isSelected ? "#8eff36" : "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const zoneType = zone.isLogo ? "Logo" : "Texte";
      ctx.fillText(zoneType, 0, 0);
      
      ctx.restore();
    });
  }, [zones, selectedZoneId]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
        cursor: isPlacingZone ? "crosshair" : "default"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "top left"
        }}
      />
      <canvas
        ref={zonesCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "top left"
        }}
      />
      {isPlacingZone && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "12px 20px",
          backgroundColor: "rgba(142, 255, 54, 0.9)",
          color: "#000000",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "500",
          pointerEvents: "none",
          zIndex: 10
        }}>
          Cliquez sur l'UV map pour placer la zone
        </div>
      )}
    </div>
  );
}

