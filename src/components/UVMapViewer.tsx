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

type SnapLine = {
  id: string;
  name: string;
  start: [number, number]; // UV coordinates [u, v]
  end: [number, number]; // UV coordinates [u, v]
  type: "horizontal" | "vertical" | "diagonal";
};

type UVMapViewerProps = {
  modelUrl: string;
  zones?: Zone[];
  snapLines?: SnapLine[];
  selectedZoneId?: string | null;
  selectedSnapLineId?: string | null;
  onZoneSelect?: (id: string | null) => void;
  onSnapLineSelect?: (id: string | null) => void;
  onZonePlaced?: (position: [number, number, number]) => void;
  onSnapLinePlaced?: (position: [number, number]) => void;
  onZoneUpdate?: (id: string, updates: Partial<Zone>) => void;
  onSnapLineUpdate?: (id: string, updates: Partial<SnapLine>) => void;
  isPlacingZone?: boolean;
  isPlacingSnapLine?: boolean;
  placingStart?: [number, number] | null;
  snapLineSettings?: { type?: "horizontal" | "vertical" | "diagonal" };
  canvasSize?: number; // Size of the UV map canvas (default: 2048)
  design2DUrl?: string | null; // Optional 2D design SVG to overlay on UV map
  onZoneConfirm?: () => void; // Callback when zone is confirmed
};

export function UVMapViewer({
  modelUrl,
  zones = [],
  snapLines = [],
  selectedZoneId = null,
  selectedSnapLineId = null,
  onZoneSelect,
  onSnapLineSelect,
  onZonePlaced,
  onSnapLinePlaced,
  onZoneUpdate,
  onSnapLineUpdate,
  isPlacingZone = false,
  isPlacingSnapLine = false,
  placingStart = null,
  snapLineSettings,
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
  const [dragSnapLineId, setDragSnapLineId] = useState<string | null>(null);
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
    if (!scene || !canvasRef.current) {
      console.log('⏳ Waiting for scene or canvas:', { hasScene: !!scene, hasCanvas: !!canvasRef.current });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error('❌ Failed to get 2D context');
      return;
    }

    // Set canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas with dark background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    console.log('🔄 Generating UV map, design2DUrl:', design2DUrl, 'type:', typeof design2DUrl);

    // Load and draw 2D design if provided
    if (design2DUrl) {
      // Check if it's an SVG or image
      const isSvg = design2DUrl.toLowerCase().endsWith('.svg') || design2DUrl.includes('svg') || design2DUrl.startsWith('data:image/svg');
      
      if (isSvg) {
        // Load SVG and convert to image
        fetch(design2DUrl)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
            return res.text();
          })
          .then(svgText => {
            console.log('📥 SVG fetched, length:', svgText.length);
            // Create an image from SVG
            const img = new Image();
            // Use data URL for better compatibility
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
            
            img.onload = () => {
              console.log('✅ SVG design loaded successfully, size:', img.width, 'x', img.height);
              // Redraw everything
              ctx.fillStyle = "#1a1a1a";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw design 2D without any transformation
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              console.log('✅ Design 2D drawn on canvas');
              
              // Convert to image
              canvas.toBlob((blob) => {
                if (blob) {
                  const imageUrl = URL.createObjectURL(blob);
                  setUvMapImage(imageUrl);
                  console.log('✅ UV map image created');
                } else {
                  console.error('❌ Failed to create blob from canvas');
                }
              });
            };
            
            img.onerror = (error) => {
              console.error("Error loading SVG design 2D:", error);
              // If design fails to load, show empty canvas
              canvas.toBlob((blob) => {
                if (blob) {
                  const imageUrl = URL.createObjectURL(blob);
                  setUvMapImage(imageUrl);
                }
              });
            };
            
            img.src = svgDataUrl;
          })
          .catch(error => {
            console.error("Error fetching SVG design 2D:", error);
            // If design fails to load, show empty canvas
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                setUvMapImage(url);
              }
            });
          });
      } else {
        // Regular image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          console.log('✅ Image design loaded successfully, size:', img.width, 'x', img.height);
          // Redraw everything
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw design 2D without any transformation
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          console.log('✅ Design 2D drawn on canvas');
          
          // Convert to image
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setUvMapImage(url);
              console.log('✅ UV map image created');
            } else {
              console.error('❌ Failed to create blob from canvas');
            }
          });
        };
        img.onerror = (error) => {
          console.error("Error loading design 2D:", error);
          // If design fails to load, show empty canvas
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setUvMapImage(url);
            }
          });
        };
        img.src = design2DUrl;
      }
    } else {
      // No design - just show empty canvas
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setUvMapImage(url);
        }
      });
    }
  }, [scene, canvasSize, design2DUrl]);

  // Helper function to draw UV wireframe (with 180° rotation)
  const drawUVWireframe = (ctx: CanvasRenderingContext2D, scene: THREE.Scene, width: number, height: number) => {
    // Apply 180° rotation to the entire wireframe
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI); // 180 degrees
    ctx.translate(-width / 2, -height / 2);
    
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
              
              // Draw triangle edges (rotation is applied via ctx transform)
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
              
              // Draw triangle edges (rotation is applied via ctx transform)
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
    
    ctx.restore(); // Restore after rotation
  };

  // Convert screen coordinates to UV coordinates (accounting for objectFit: contain and pan/scale)
  const screenToUV = useCallback((screenX: number, screenY: number): [number, number] | null => {
    if (!containerRef.current || !canvasRef.current) return null;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    
    // Calculate the actual displayed size of the canvas (accounting for objectFit: contain)
    const containerAspect = containerRect.width / containerRect.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let canvasDisplayWidth: number;
    let canvasDisplayHeight: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (containerAspect > canvasAspect) {
      // Container is wider - canvas height limits, centered horizontally
      canvasDisplayHeight = containerRect.height;
      canvasDisplayWidth = canvasDisplayHeight * canvasAspect;
      offsetX = (containerRect.width - canvasDisplayWidth) / 2;
    } else {
      // Container is taller - canvas width limits, centered vertically
      canvasDisplayWidth = containerRect.width;
      canvasDisplayHeight = canvasDisplayWidth / canvasAspect;
      offsetY = (containerRect.height - canvasDisplayHeight) / 2;
    }
    
    // Mouse position relative to container
    const mouseX = screenX - containerRect.left;
    const mouseY = screenY - containerRect.top;
    
    // Account for objectFit: contain offset
    const mouseXInCanvas = mouseX - offsetX;
    const mouseYInCanvas = mouseY - offsetY;
    
    // Convert to canvas pixel coordinates
    // Account for pan and scale transformations
    const scaleX = canvas.width / canvasDisplayWidth;
    const scaleY = canvas.height / canvasDisplayHeight;
    
    const canvasMouseX = ((mouseXInCanvas - pan.x) / scale) * scaleX;
    const canvasMouseY = ((mouseYInCanvas - pan.y) / scale) * scaleY;
    
    // Convert to UV coordinates (0-1)
    const u = Math.max(0, Math.min(1, canvasMouseX / canvas.width));
    const v = Math.max(0, Math.min(1, canvasMouseY / canvas.height));
    
    // Invert vertical axis: (u, v) -> (u, 1-v) to match drawing convention
    const finalU = u;
    const finalV = 1 - v;
    
    return [finalU, finalV];
  }, [pan, scale]);

  // Convert UV coordinates to screen coordinates (with vertical inversion)
  const uvToScreen = useCallback((uv: [number, number]): { x: number; y: number } | null => {
    if (!containerRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Get canvas display size (may be different from actual canvas size due to CSS)
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const scaleX = canvasDisplayWidth / canvas.width;
    const scaleY = canvasDisplayHeight / canvas.height;
    
    // Invert vertical axis: (u, v) -> (u, 1-v) for screen coordinates
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

  // Handle mouse down - select zone, move selected zone, or place new one
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !canvasRef.current || !zonesCanvasRef.current) return;
    
    // Get bounding rects
    const containerRect = containerRef.current.getBoundingClientRect();
    const zonesCanvasRect = zonesCanvasRef.current.getBoundingClientRect();
    
    // Calculate the actual displayed size of the canvas (accounting for objectFit: contain)
    // The canvas maintains aspect ratio, so we need to find which dimension is limiting
    const containerAspect = containerRect.width / containerRect.height;
    const canvasAspect = canvasRef.current.width / canvasRef.current.height;
    
    let canvasDisplayWidth: number;
    let canvasDisplayHeight: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (containerAspect > canvasAspect) {
      // Container is wider - canvas height limits, centered horizontally
      canvasDisplayHeight = containerRect.height;
      canvasDisplayWidth = canvasDisplayHeight * canvasAspect;
      offsetX = (containerRect.width - canvasDisplayWidth) / 2;
    } else {
      // Container is taller - canvas width limits, centered vertically
      canvasDisplayWidth = containerRect.width;
      canvasDisplayHeight = canvasDisplayWidth / canvasAspect;
      offsetY = (containerRect.height - canvasDisplayHeight) / 2;
    }
    
    // Mouse position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Account for objectFit: contain offset
    const mouseXInCanvas = mouseX - offsetX;
    const mouseYInCanvas = mouseY - offsetY;
    
    // Convert to canvas pixel coordinates
    // Account for pan and scale transformations
    const scaleX = canvasRef.current.width / canvasDisplayWidth;
    const scaleY = canvasRef.current.height / canvasDisplayHeight;
    
    const canvasMouseX = ((mouseXInCanvas - pan.x) / scale) * scaleX;
    const canvasMouseY = ((mouseYInCanvas - pan.y) / scale) * scaleY;
    
    // Check if clicking on a zone
    let clickedZone: Zone | null = null;
    
    for (const zone of zones) {
      // Calculate zone center position in canvas pixels (matching drawing: x = u * width, y = (1-v) * height)
      const zoneCenterX = zone.position[0] * canvasRef.current.width;
      const zoneCenterY = (1 - zone.position[1]) * canvasRef.current.height;
      
      // Zone size in canvas pixels
      const zoneWidth = zone.width * canvasRef.current.width;
      const zoneHeight = zone.height * canvasRef.current.height;
      
      // Check if clicking inside zone (accounting for rotation in degrees)
      const isInside = isPointInRotatedRect(
        { x: canvasMouseX, y: canvasMouseY },
        { x: zoneCenterX, y: zoneCenterY },
        zoneWidth,
        zoneHeight,
        (zone.rotation * Math.PI) / 180 // Convert degrees to radians
      );
      
      if (isInside) {
        clickedZone = zone;
        break;
      }
    }
    
    // Check if clicking on a snap line
    let clickedSnapLine: SnapLine | null = null;
    const snapLineClickThreshold = 5; // pixels
    
    for (const snapLine of snapLines) {
      const startX = snapLine.start[0] * canvasRef.current.width;
      const startY = (1 - snapLine.start[1]) * canvasRef.current.height;
      const endX = snapLine.end[0] * canvasRef.current.width;
      const endY = (1 - snapLine.end[1]) * canvasRef.current.height;
      
      // Calculate distance from point to line segment
      const A = canvasMouseX - startX;
      const B = canvasMouseY - startY;
      const C = endX - startX;
      const D = endY - startY;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;
      
      let xx: number, yy: number;
      if (param < 0) {
        xx = startX;
        yy = startY;
      } else if (param > 1) {
        xx = endX;
        yy = endY;
      } else {
        xx = startX + param * C;
        yy = startY + param * D;
      }
      
      const dx = canvasMouseX - xx;
      const dy = canvasMouseY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapLineClickThreshold) {
        clickedSnapLine = snapLine;
        break;
      }
    }
    
    if (clickedZone) {
      // Select the zone and start dragging
      // Use container-relative coordinates for drag (not canvas-relative)
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      if (onZoneSelect) onZoneSelect(clickedZone.id);
      setDragZoneId(clickedZone.id);
      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(true);
      e.preventDefault();
      e.stopPropagation();
    } else if (clickedSnapLine) {
      // Select the snap line and start dragging
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      if (onSnapLineSelect) onSnapLineSelect(clickedSnapLine.id);
      setDragSnapLineId(clickedSnapLine.id);
      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(true);
      e.preventDefault();
      e.stopPropagation();
    } else if (isPlacingZone && onZonePlaced) {
      // Place new zone using screenToUV (which works correctly)
      const uv = screenToUV(e.clientX, e.clientY);
      if (uv) {
        onZonePlaced([uv[0], uv[1], 0]);
      }
    } else if (isPlacingSnapLine && onSnapLinePlaced) {
      // Place snap line point with constraint based on type
      const uv = screenToUV(e.clientX, e.clientY);
      if (uv) {
        if (placingStart) {
          // Second click - constrain based on type
          const constrainedUV = constrainSnapLineEnd(placingStart, uv, snapLineSettings?.type || 'vertical');
          onSnapLinePlaced(constrainedUV);
        } else {
          // First click
          onSnapLinePlaced(uv);
        }
      }
    } else {
      // Deselect
      if (onZoneSelect) onZoneSelect(null);
      if (onSnapLineSelect) onSnapLineSelect(null);
    }
  }, [zones, snapLines, screenToUV, isPlacingZone, isPlacingSnapLine, onZoneSelect, onSnapLineSelect, onZonePlaced, onSnapLinePlaced, pan, scale, isPointInRotatedRect, placingStart, snapLineSettings]);

  // Helper function to constrain snap line end point based on type
  const constrainSnapLineEnd = useCallback((start: [number, number], end: [number, number], type: "horizontal" | "vertical" | "diagonal"): [number, number] => {
    if (type === "horizontal") {
      // Force same Y coordinate
      return [end[0], start[1]];
    } else if (type === "vertical") {
      // Force same X coordinate
      return [start[0], end[1]];
    } else {
      // Diagonal - allow free movement
      return end;
    }
  }, []);

  // Handle mouse move - drag zone or snap line if dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart || (!dragZoneId && !dragSnapLineId) || !containerRef.current || !canvasRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate delta in screen space
    const dx = mouseX - dragStart.x;
    const dy = mouseY - dragStart.y;
    
    // Convert screen delta to UV delta
    const canvasDisplayWidth = rect.width;
    const canvasDisplayHeight = rect.height;
    const scaleX = canvasRef.current.width / canvasDisplayWidth;
    const scaleY = canvasRef.current.height / canvasDisplayHeight;
    
    const uvDx = (dx / scale) * scaleX / canvasRef.current.width;
    const uvDy = (dy / scale) * scaleY / canvasRef.current.height;
    
    if (dragZoneId && onZoneUpdate) {
      // Get current zone position
      const zone = zones.find(z => z.id === dragZoneId);
      if (!zone) return;
      
      // Update zone position (invert vertical delta because of vertical axis inversion)
      const newU = Math.max(0, Math.min(1, zone.position[0] + uvDx));
      const newV = Math.max(0, Math.min(1, zone.position[1] - uvDy)); // Invert sign for vertical
      
      onZoneUpdate(dragZoneId, { position: [newU, newV, 0] });
    } else if (dragSnapLineId && onSnapLineUpdate) {
      // Get current snap line
      const snapLine = snapLines.find(sl => sl.id === dragSnapLineId);
      if (!snapLine) return;
      
      // Update snap line position (move both start and end by the same delta)
      const newStartU = Math.max(0, Math.min(1, snapLine.start[0] + uvDx));
      const newStartV = Math.max(0, Math.min(1, snapLine.start[1] - uvDy)); // Invert sign for vertical
      const newEndU = Math.max(0, Math.min(1, snapLine.end[0] + uvDx));
      const newEndV = Math.max(0, Math.min(1, snapLine.end[1] - uvDy)); // Invert sign for vertical
      
      // Apply constraint based on type
      const constrainedEnd = constrainSnapLineEnd([newStartU, newStartV], [newEndU, newEndV], snapLine.type);
      
      onSnapLineUpdate(dragSnapLineId, { 
        start: [newStartU, newStartV],
        end: constrainedEnd
      });
    }
    
    setDragStart({ x: mouseX, y: mouseY });
  }, [isDragging, dragStart, dragZoneId, dragSnapLineId, zones, snapLines, onZoneUpdate, onSnapLineUpdate, scale, constrainSnapLineEnd]);

  // Handle mouse up - stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragZoneId(null);
    setDragSnapLineId(null);
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
    
    // Draw zones (with vertical inversion)
    zones.forEach(zone => {
      const x = zone.position[0] * zonesCanvas.width;
      const y = (1 - zone.position[1]) * zonesCanvas.height;
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

    // Draw snap lines
    snapLines.forEach(snapLine => {
      const startX = snapLine.start[0] * zonesCanvas.width;
      const startY = (1 - snapLine.start[1]) * zonesCanvas.height;
      const endX = snapLine.end[0] * zonesCanvas.width;
      const endY = (1 - snapLine.end[1]) * zonesCanvas.height;
      
      const isSelected = selectedSnapLineId === snapLine.id;
      ctx.strokeStyle = isSelected ? "#8eff36" : "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw start and end points
      ctx.fillStyle = isSelected ? "#8eff36" : "#ffffff";
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw placing start point if placing snap line
    if (isPlacingSnapLine && placingStart) {
      const startX = placingStart[0] * zonesCanvas.width;
      const startY = (1 - placingStart[1]) * zonesCanvas.height;
      ctx.strokeStyle = "#8eff36";
      ctx.fillStyle = "#8eff36";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [zones, snapLines, selectedZoneId, selectedSnapLineId, isPlacingSnapLine, placingStart]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
          cursor: (isPlacingZone || isPlacingSnapLine) ? "crosshair" : isDragging ? "grabbing" : "default"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => {
        e.preventDefault();
        if (!containerRef.current || !canvasRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get mouse position relative to canvas
        const canvasX = (mouseX - pan.x) / scale;
        const canvasY = (mouseY - pan.y) / scale;
        
        // Calculate zoom delta
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(5, scale * delta));
        
        // Adjust pan to zoom towards mouse position
        const scaleChange = newScale / scale;
        const newPanX = mouseX - canvasX * newScale;
        const newPanY = mouseY - canvasY * newScale;
        
        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
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
          transformOrigin: "top left",
          display: uvMapImage ? "none" : "block"
        }}
      />
      {uvMapImage && (
        <img
          src={uvMapImage}
          alt="UV Map with Design 2D"
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
      )}
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
      {(isPlacingZone || isPlacingSnapLine) && (
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
          {isPlacingSnapLine 
            ? (placingStart ? "Cliquez pour terminer la ligne" : "Cliquez pour commencer la ligne")
            : "Cliquez sur l'UV map pour placer la zone"}
        </div>
      )}
    </div>
  );
}

