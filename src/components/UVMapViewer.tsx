"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

type Zone = {
  id: string;
  name: string;
  position: [number, number, number]; // UV coordinates [u, v, 0]
  rotation: number; // Rotation in radians
  width: number; // Width in UV space (0-1)
  height: number; // Height in UV space (0-1)
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
};

export function UVMapViewer({
  modelUrl,
  zones,
  selectedZoneId,
  onZoneSelect,
  onZonePlaced,
  onZoneUpdate,
  isPlacingZone,
  canvasSize = 2048
}: UVMapViewerProps) {
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

  // Generate UV map visualization
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

    // Extract UV coordinates from all meshes
    scene.traverse((object: any) => {
      if (object.isMesh && object.geometry) {
        const geometry = object.geometry;
        const uvAttribute = geometry.attributes.uv;
        
        if (uvAttribute) {
          const positionAttribute = geometry.attributes.position;
          const index = geometry.index;
          
          // Draw UV wireframe
          ctx.strokeStyle = "#4a4a4a";
          ctx.lineWidth = 1;
          
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
              ctx.moveTo(uv0.x * canvas.width, (1 - uv0.y) * canvas.height);
              ctx.lineTo(uv1.x * canvas.width, (1 - uv1.y) * canvas.height);
              ctx.lineTo(uv2.x * canvas.width, (1 - uv2.y) * canvas.height);
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
              ctx.moveTo(uv0.x * canvas.width, (1 - uv0.y) * canvas.height);
              ctx.lineTo(uv1.x * canvas.width, (1 - uv1.y) * canvas.height);
              ctx.lineTo(uv2.x * canvas.width, (1 - uv2.y) * canvas.height);
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
      }
    });

    // Convert canvas to image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setUvMapImage(url);
      }
    });
  }, [scene, canvasSize]);

  // Convert screen coordinates to UV coordinates
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
    
    // Convert to UV coordinates (0-1)
    const u = Math.max(0, Math.min(1, x / canvas.width));
    const v = Math.max(0, Math.min(1, 1 - (y / canvas.height))); // Flip Y axis
    
    return [u, v];
  }, [pan, scale]);

  // Convert UV coordinates to screen coordinates
  const uvToScreen = useCallback((uv: [number, number]): { x: number; y: number } | null => {
    if (!containerRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Get canvas display size (may be different from actual canvas size due to CSS)
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const scaleX = canvasDisplayWidth / canvas.width;
    const scaleY = canvasDisplayHeight / canvas.height;
    
    const x = uv[0] * canvas.width * scaleX * scale + pan.x;
    const y = (1 - uv[1]) * canvas.height * scaleY * scale + pan.y;
    
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

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicking on a zone or its handles
    let clickedZone: Zone | null = null;
    let clickedHandle: 'resize' | 'rotate' | null = null;
    
    for (const zone of zones) {
      const screenPos = uvToScreen([zone.position[0], zone.position[1]]);
      if (!screenPos) continue;
      
      const zoneWidth = zone.width * canvasRef.current.width * scale;
      const zoneHeight = zone.height * canvasRef.current.height * scale;
      
      // Check rotation handle (top center, 20px above)
      const handleSize = 8;
      const rotationHandleY = screenPos.y - zoneHeight / 2 - 20;
      const rotationHandleX = screenPos.x;
      if (
        Math.abs(mouseX - rotationHandleX) < handleSize &&
        Math.abs(mouseY - rotationHandleY) < handleSize
      ) {
        clickedZone = zone;
        clickedHandle = 'rotate';
        break;
      }
      
      // Check resize handles (corners)
      const corners = [
        { x: screenPos.x - zoneWidth / 2, y: screenPos.y - zoneHeight / 2 },
        { x: screenPos.x + zoneWidth / 2, y: screenPos.y - zoneHeight / 2 },
        { x: screenPos.x - zoneWidth / 2, y: screenPos.y + zoneHeight / 2 },
        { x: screenPos.x + zoneWidth / 2, y: screenPos.y + zoneHeight / 2 }
      ];
      
      for (const corner of corners) {
        if (
          Math.abs(mouseX - corner.x) < handleSize &&
          Math.abs(mouseY - corner.y) < handleSize
        ) {
          clickedZone = zone;
          clickedHandle = 'resize';
          break;
        }
      }
      
      if (clickedZone) break;
      
      // Check if clicking inside zone (accounting for rotation)
      if (isPointInRotatedRect(
        { x: mouseX, y: mouseY },
        screenPos,
        zoneWidth,
        zoneHeight,
        zone.rotation
      )) {
        clickedZone = zone;
        clickedHandle = null;
        break;
      }
    }
    
    if (clickedZone) {
      // Start dragging/resizing/rotating
      setDragZoneId(clickedZone.id);
      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(true);
      setIsResizing(clickedHandle === 'resize');
      setIsRotating(clickedHandle === 'rotate');
      onZoneSelect(clickedZone.id);
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
  }, [zones, uvToScreen, screenToUV, isPlacingZone, onZoneSelect, onZonePlaced, scale, isPointInRotatedRect]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging && dragStart && dragZoneId && canvasRef.current) {
      const dx = (mouseX - dragStart.x) / scale;
      const dy = (mouseY - dragStart.y) / scale;
      
      const zone = zones.find(z => z.id === dragZoneId);
      if (!zone) return;
      
      // Convert screen delta to UV delta
      const uvDx = dx / canvasRef.current.width;
      const uvDy = -dy / canvasRef.current.height; // Flip Y
      
      if (isResizing) {
        // Resize zone (from corner)
        const newWidth = Math.max(0.01, Math.min(1, zone.width + Math.abs(uvDx) * 2));
        const newHeight = Math.max(0.01, Math.min(1, zone.height + Math.abs(uvDy) * 2));
        onZoneUpdate(dragZoneId, { width: newWidth, height: newHeight });
      } else if (isRotating) {
        // Rotate zone
        const center = uvToScreen([zone.position[0], zone.position[1]]);
        if (center) {
          const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
          onZoneUpdate(dragZoneId, { rotation: angle });
        }
      } else {
        // Move zone
        const newU = Math.max(0, Math.min(1, zone.position[0] + uvDx));
        const newV = Math.max(0, Math.min(1, zone.position[1] + uvDy));
        onZoneUpdate(dragZoneId, { position: [newU, newV, 0] });
      }
      
      setDragStart({ x: mouseX, y: mouseY });
    }
  }, [isDragging, dragStart, dragZoneId, zones, isResizing, isRotating, uvToScreen, onZoneUpdate, scale]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragZoneId(null);
    setIsResizing(false);
    setIsRotating(false);
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
      const x = zone.position[0] * zonesCanvas.width;
      const y = (1 - zone.position[1]) * zonesCanvas.height;
      const width = zone.width * zonesCanvas.width;
      const height = zone.height * zonesCanvas.height;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(zone.rotation);
      
      // Draw zone rectangle
      const isSelected = selectedZoneId === zone.id;
      ctx.strokeStyle = isSelected ? "#8eff36" : "#ffffff";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected ? "rgba(142, 255, 54, 0.2)" : "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.strokeRect(-width / 2, -height / 2, width, height);
      
      // Draw resize handles if selected
      if (isSelected) {
        const handleSize = 8;
        ctx.fillStyle = "#8eff36";
        // Corner handles
        ctx.fillRect(-width / 2 - handleSize / 2, -height / 2 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(width / 2 - handleSize / 2, -height / 2 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(-width / 2 - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(width / 2 - handleSize / 2, height / 2 - handleSize / 2, handleSize, handleSize);
        // Rotation handle
        ctx.fillRect(width / 2 - handleSize / 2, -height / 2 - 20 - handleSize / 2, handleSize, handleSize);
      }
      
      // Draw zone name
      if (isSelected) {
        ctx.fillStyle = "#8eff36";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, 0, -height / 2 - 10);
      }
      
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
        cursor: isPlacingZone ? "crosshair" : isDragging ? "grabbing" : "grab"
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

