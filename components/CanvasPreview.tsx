
import React, { useEffect, useRef, useState } from 'react';
import { TextBubble, BoundingBox, BubbleShape } from '../types';
import { detectDominantColor } from '../utils/imageAnalysis';

interface CanvasPreviewProps {
  imageSrc: string | null;
  bubbles: TextBubble[];
  selectedBubbleIds: string[];
  onSelectBubbles: (ids: string[]) => void;
  onAddBubble: (box: BoundingBox, shape: BubbleShape, detectedColor?: string) => void; 
  onUpdateBubbleBox: (id: string, box: BoundingBox) => void;
  forwardedRef: React.RefObject<HTMLCanvasElement>;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  mode: 'view' | 'draw' | 'picker' | 'crop';
  onColorPicked: (color: string) => void;
  currentShape?: BubbleShape;
  isPreviewMode?: boolean;
  selectedFont: string;
  backgroundColor: string;
  onRecordHistory: () => void;
  cropBox?: BoundingBox | null;
  onUpdateCropBox?: (box: BoundingBox | null) => void;
}

type ResizeHandleType = 'nw' | 'ne' | 'sw' | 'se' | null;

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  imageSrc,
  bubbles,
  selectedBubbleIds,
  onSelectBubbles,
  onAddBubble,
  onUpdateBubbleBox,
  forwardedRef,
  zoomLevel,
  onZoomChange,
  mode,
  onColorPicked,
  currentShape = 'ellipse',
  isPreviewMode = false,
  selectedFont,
  backgroundColor,
  onRecordHistory,
  cropBox = null,
  onUpdateCropBox = (_: BoundingBox | null) => {}
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [fitScale, setFitScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [currentDragPos, setCurrentDragPos] = useState<{x: number, y: number} | null>(null);

  // Bubble Dragging State
  const [draggedBubbleId, setDraggedBubbleId] = useState<string | null>(null);
  const [dragStartMousePos, setDragStartMousePos] = useState<{x: number, y: number} | null>(null);
  const [initialBubbleBox, setInitialBubbleBox] = useState<BoundingBox | null>(null);

  // Bubble Resizing State
  const [resizingHandle, setResizingHandle] = useState<ResizeHandleType>(null);
  const [hoverHandle, setHoverHandle] = useState<ResizeHandleType>(null);
  
  // Smart Draw State
  const [isHoveringSelected, setIsHoveringSelected] = useState(false);

  // Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{x: number, y: number} | null>(null);

  // Load image once
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        setLoadedImage(img);
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      };
    } else {
      setLoadedImage(null);
      setNaturalSize(null);
    }
  }, [imageSrc]);

  // Non-passive wheel listener for reliable zooming
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (isPreviewMode) return;
      
      // We'll zoom on wheel by default. If you want traditional scrolling, 
      // you could check for e.ctrlKey, but for this specific request, 
      // we'll make wheel zoom directly.
      e.preventDefault();
      
      const delta = -e.deltaY;
      const factor = Math.pow(1.1, delta / 150); // Adjusted sensitivity
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * factor));
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Relative point on the content before zoom
      const contentX = (container.scrollLeft + mouseX) / zoomLevel;
      const contentY = (container.scrollTop + mouseY) / zoomLevel;
      
      onZoomChange(newZoom);
      
      // Request next frame to adjust scroll after state update has reflected in DOM
      requestAnimationFrame(() => {
        if (container) {
          container.scrollLeft = contentX * newZoom - mouseX;
          container.scrollTop = contentY * newZoom - mouseY;
        }
      });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, [zoomLevel, isPreviewMode, onZoomChange]);

  // Redraw canvas loop
  useEffect(() => {
    const canvas = forwardedRef.current;
    if (!canvas || !loadedImage) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Ensure dimensions match natural size for high quality
    if (canvas.width !== loadedImage.naturalWidth) {
        canvas.width = loadedImage.naturalWidth;
        canvas.height = loadedImage.naturalHeight;
    }

    let animationId: number;

    const render = () => {
        let pulseFactor = 0;
        
        // If selected bubble exists and we are not in preview mode, animate
        if (selectedBubbleIds.length > 0 && !isPreviewMode) {
             const now = Date.now();
             pulseFactor = (Math.sin(now / 150) + 1) / 2;
             animationId = requestAnimationFrame(render);
        }

        draw(ctx, loadedImage, bubbles, pulseFactor);
    };

    render();

    return () => {
        if (animationId) cancelAnimationFrame(animationId);
    };
  }, [bubbles, selectedBubbleIds, isDrawing, currentDragPos, mode, currentShape, fitScale, zoomLevel, loadedImage, isPreviewMode, selectedFont, cropBox, draggedBubbleId, resizingHandle]);

  // Calculate "Fit to Screen" scale
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && naturalSize) {
        // Subtract a small buffer (40px) for padding visual
        const containerWidth = wrapperRef.current.clientWidth - 40;
        const containerHeight = wrapperRef.current.clientHeight - 40;
        
        const scaleX = Math.max(0, containerWidth) / naturalSize.w;
        const scaleY = Math.max(0, containerHeight) / naturalSize.h;
        
        // Fit within the box, max 1 (100%) for the "base" scale
        setFitScale(Math.min(scaleX, scaleY, 1));
      }
    };
    
    // Call immediately and on window resize
    handleResize(); 
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [naturalSize]); 

  const hexToRgba = (hex: string, alpha: number) => {
    if (hex.length === 7) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };

  const draw = (
      ctx: CanvasRenderingContext2D, 
      img: HTMLImageElement, 
      bubbles: TextBubble[],
      pulseFactor: number = 0
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    const currentDisplayScale = fitScale * zoomLevel;
    const handleSizeNatural = currentDisplayScale > 0 ? 10 / currentDisplayScale : 10;
    
    bubbles.forEach(bubble => {
      const { ymin, xmin, ymax, xmax } = bubble.box;
      const x = (xmin / 1000) * ctx.canvas.width;
      const y = (ymin / 1000) * ctx.canvas.height;
      const w = ((xmax - xmin) / 1000) * ctx.canvas.width;
      const h = ((ymax - ymin) / 1000) * ctx.canvas.height;

      const hasContent = bubble.translatedText.length > 0;
      const color = bubble.backgroundColor || '#ffffff';
      const alpha = bubble.opacity !== undefined ? bubble.opacity : 1;

      // Ensure that we shade out the original text fully if opacity is high
      ctx.fillStyle = hasContent ? hexToRgba(color, alpha) : 'rgba(255, 255, 255, 0.3)';
      
      const centerX = x + w / 2;
      const centerY = y + h / 2;

      ctx.beginPath();
      const shape = bubble.shape || 'ellipse';

      if (shape === 'ellipse') {
         const rx = Math.abs(w / 2);
         const ry = Math.abs(h / 2);
         ctx.ellipse(centerX, centerY, rx, ry, 0, 0, 2 * Math.PI);
      } else {
         ctx.roundRect(x, y, w, h, 4); 
      }

      ctx.fill();

      if (!isPreviewMode && mode !== 'crop') {
          const isSelected = selectedBubbleIds.includes(bubble.id);
          const isDraggingThis = draggedBubbleId === bubble.id;
          
          if (isSelected) {
            const baseAlpha = 0.7;
            const alpha = baseAlpha + (pulseFactor * 0.3);
            
            // Visual cue for dragging
            if (isDraggingThis) {
                ctx.strokeStyle = `rgba(34, 211, 238, 0.9)`;
                ctx.setLineDash([8, 6]);
            } else {
                ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
                ctx.setLineDash([]);
            }
            
            const baseWidth = 2 / currentDisplayScale + 2;
            const pulseWidth = pulseFactor * 1.5; 
            ctx.lineWidth = baseWidth + pulseWidth;
            ctx.stroke();
            ctx.setLineDash([]); 

            // Draw Handles only if ONE bubble is selected
            if (selectedBubbleIds.length === 1) {
                ctx.lineWidth = 1 / currentDisplayScale + 1;

                const handles = [
                    { x: x, y: y, type: 'nw' }, { x: x + w, y: y, type: 'ne' },
                    { x: x, y: y + h, type: 'sw' }, { x: x + w, y: y + h, type: 'se' },
                ];

                handles.forEach(hPos => {
                    const isHandleActive = resizingHandle === hPos.type;
                    if (resizingHandle && !isHandleActive) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
                    } else {
                        ctx.fillStyle = isHandleActive ? '#ef4444' : '#ffffff'; 
                        ctx.strokeStyle = isHandleActive ? '#ef4444' : `rgba(99, 102, 241, ${alpha})`;
                    }
                    
                    const size = isHandleActive ? handleSizeNatural * 1.2 : handleSizeNatural;
                    const offset = size / 2;

                    ctx.beginPath();
                    ctx.rect(hPos.x - offset, hPos.y - offset, size, size);
                    ctx.fill();
                    ctx.stroke();
                });
            }

          } else if (!hasContent) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
      }

      if (hasContent) {
        ctx.fillStyle = bubble.textColor || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const padding = 8;
        let maxTextWidth = Math.max(10, w - (padding * 2));
        let maxTextHeight = Math.max(10, h - (padding * 2));
        
        if (shape === 'ellipse') {
            maxTextWidth = Math.max(10, (w * 0.85) - (padding * 2));
            maxTextHeight = Math.max(10, (h * 0.85) - (padding * 2));
        }
        
        let fontSize = bubble.fontSize || Math.floor(h * 0.6); 
        if (!bubble.fontSize) fontSize = Math.min(fontSize, 120);
        
        const customLineHeightMultiplier = bubble.lineHeight || 1.1;

        const minFontSize = 10;
        let lines: string[] = [];
        let lineHeight = fontSize * customLineHeightMultiplier;

        const fontWeight = selectedFont === 'Comic Neue' ? 'bold' : 'normal';

        if (bubble.fontSize) {
            ctx.font = `${fontWeight} ${fontSize}px "${selectedFont}", "Comic Sans MS", sans-serif`;
            lines = wrapText(ctx, bubble.translatedText, maxTextWidth);
            lineHeight = fontSize * customLineHeightMultiplier;
        } else {
            while (fontSize >= minFontSize) {
              ctx.font = `${fontWeight} ${fontSize}px "${selectedFont}", "Comic Sans MS", sans-serif`;
              lineHeight = fontSize * customLineHeightMultiplier;
              lines = wrapText(ctx, bubble.translatedText, maxTextWidth);
              const totalHeight = lines.length * lineHeight;
              
              const fitsWidth = lines.every(line => ctx.measureText(line).width <= maxTextWidth + 2);
              const fitsHeight = totalHeight <= maxTextHeight;

              if (fitsWidth && fitsHeight) break;
              fontSize -= 2;
            }
        }
        
        lineHeight = fontSize * customLineHeightMultiplier;
        const totalTextHeight = lines.length * lineHeight;
        const blockTop = centerY - (totalTextHeight / 2);

        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, blockTop + (index * lineHeight) + (lineHeight / 2));
        });
      }
    });

    if (mode === 'crop') {
        const fullW = ctx.canvas.width;
        const fullH = ctx.canvas.height;
        let cx = 0, cy = 0, cw = 0, ch = 0;

        if (isDrawing && startPos && currentDragPos) {
             const x1 = Math.min(startPos.x, currentDragPos.x);
             const y1 = Math.min(startPos.y, currentDragPos.y);
             const x2 = Math.max(startPos.x, currentDragPos.x);
             const y2 = Math.max(startPos.y, currentDragPos.y);
             cx = x1; cy = y1; cw = x2 - x1; ch = y2 - y1;
        } else if (cropBox) {
             cx = (cropBox.xmin / 1000) * fullW;
             cy = (cropBox.ymin / 1000) * fullH;
             cw = ((cropBox.xmax - cropBox.xmin) / 1000) * fullW;
             ch = ((cropBox.ymax - cropBox.ymin) / 1000) * fullH;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        if (cw > 0 && ch > 0) {
            ctx.fillRect(0, 0, fullW, cy);
            ctx.fillRect(0, cy + ch, fullW, fullH - (cy + ch));
            ctx.fillRect(0, cy, cx, ch);
            ctx.fillRect(cx + cw, cy, fullW - (cx + cw), ch);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(cx, cy, cw, ch);
            ctx.setLineDash([]);
        } else {
            ctx.fillRect(0, 0, fullW, fullH);
        }
    } else if (!isPreviewMode && isDrawing && startPos && currentDragPos) {
      const x = Math.min(startPos.x, currentDragPos.x);
      const y = Math.min(startPos.y, currentDragPos.y);
      const w = Math.abs(currentDragPos.x - startPos.x);
      const h = Math.abs(currentDragPos.y - startPos.y);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'; 
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      if (currentShape === 'ellipse') {
         ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, 2 * Math.PI);
      } else {
         ctx.rect(x, y, w, h);
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const rawWords = text.trim().split(/\s+/);
    const atoms: string[] = [];
    for (const word of rawWords) {
        if (word.includes('-')) {
             const parts = word.split('-');
             parts.forEach((p, i) => {
                 if (i < parts.length - 1) atoms.push(p + '-');
                 else if (p) atoms.push(p);
             });
        } else {
            atoms.push(word);
        }
    }
    if (atoms.length === 0) return [];

    let lines: string[] = [];
    let currentLine = atoms[0];

    for (let i = 1; i < atoms.length; i++) {
        const atom = atoms[i];
        const separator = currentLine.endsWith('-') ? '' : ' ';
        const testLine = currentLine + separator + atom;
        if (ctx.measureText(testLine).width > maxWidth) {
            lines.push(currentLine);
            currentLine = atom;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
  }

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!naturalSize || !forwardedRef.current) return null;
    const rect = forwardedRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = naturalSize.w / rect.width;
    const scaleY = naturalSize.h / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const getHandleUnderMouse = (mouseX: number, mouseY: number, bubble: TextBubble): ResizeHandleType => {
      if (!naturalSize) return null;
      const currentDisplayScale = fitScale * zoomLevel;
      const handleSizeNatural = currentDisplayScale > 0 ? 10 / currentDisplayScale : 10;
      const handleHitRadius = handleSizeNatural * 1.5; 
      const { ymin, xmin, ymax, xmax } = bubble.box;
      const x = (xmin / 1000) * naturalSize.w;
      const y = (ymin / 1000) * naturalSize.h;
      const w = ((xmax - xmin) / 1000) * naturalSize.w;
      const h = ((ymax - ymin) / 1000) * naturalSize.h;
      if (Math.abs(mouseX - x) <= handleHitRadius && Math.abs(mouseY - y) <= handleHitRadius) return 'nw';
      if (Math.abs(mouseX - (x + w)) <= handleHitRadius && Math.abs(mouseY - y) <= handleHitRadius) return 'ne';
      if (Math.abs(mouseX - x) <= handleHitRadius && Math.abs(mouseY - (y + h)) <= handleHitRadius) return 'sw';
      if (Math.abs(mouseX - (x + w)) <= handleHitRadius && Math.abs(mouseY - (y + h)) <= handleHitRadius) return 'se';
      return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (mode === 'picker') return;

    // Single select or multi select interaction
    if (mode !== 'crop' && coords && naturalSize) {
        // First check handles for CURRENTLY SELECTED bubble (only if one is selected)
        if (selectedBubbleIds.length === 1) {
            const selectedBubble = bubbles.find(b => b.id === selectedBubbleIds[0]);
            if (selectedBubble) {
                const handle = getHandleUnderMouse(coords.x, coords.y, selectedBubble);
                if (handle) {
                    onRecordHistory();
                    setResizingHandle(handle);
                    setInitialBubbleBox(selectedBubble.box);
                    return;
                }
            }
        }

        const normX = (coords.x / naturalSize.w) * 1000;
        const normY = (coords.y / naturalSize.h) * 1000;
        const clickedBubble = [...bubbles].reverse().find(b => {
             return normX >= b.box.xmin && normX <= b.box.xmax &&
                    normY >= b.box.ymin && normY <= b.box.ymax;
        });

        if (clickedBubble) {
            onRecordHistory();
            const isSelected = selectedBubbleIds.includes(clickedBubble.id);
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                if (isSelected) {
                    onSelectBubbles(selectedBubbleIds.filter(id => id !== clickedBubble.id));
                } else {
                    onSelectBubbles([...selectedBubbleIds, clickedBubble.id]);
                }
            } else {
                if (!isSelected) onSelectBubbles([clickedBubble.id]);
                setDraggedBubbleId(clickedBubble.id);
                setDragStartMousePos({ x: normX, y: normY });
                setInitialBubbleBox(clickedBubble.box);
            }
            return;
        }
    }

    if (mode === 'draw' || mode === 'crop') {
      if (coords) {
          setIsDrawing(true);
          setStartPos(coords);
          setCurrentDragPos(coords);
          onSelectBubbles([]); 
      }
      return;
    }

    if (mode === 'view') {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        if (selectedBubbleIds.length > 0 && !e.shiftKey) onSelectBubbles([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart && scrollContainerRef.current) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        scrollContainerRef.current.scrollLeft -= dx;
        scrollContainerRef.current.scrollTop -= dy;
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (isDrawing && coords) {
      setCurrentDragPos(coords);
      return;
    }

    if (coords && naturalSize) {
        if (selectedBubbleIds.length === 1 && !draggedBubbleId && !isPreviewMode) {
             const selectedBubble = bubbles.find(b => b.id === selectedBubbleIds[0]);
             if (selectedBubble) {
                 const handle = getHandleUnderMouse(coords.x, coords.y, selectedBubble);
                 setHoverHandle(handle);
                 const normX = (coords.x / naturalSize.w) * 1000;
                 const normY = (coords.y / naturalSize.h) * 1000;
                 const isInside = normX >= selectedBubble.box.xmin && normX <= selectedBubble.box.xmax &&
                                  normY >= selectedBubble.box.ymin && normY <= selectedBubble.box.ymax;
                 setIsHoveringSelected(isInside);
             } else {
                 setHoverHandle(null);
                 setIsHoveringSelected(false);
             }
        } else {
             setHoverHandle(null);
             setIsHoveringSelected(false);
        }
    }

    if (!coords || !naturalSize) return;

    if (resizingHandle && selectedBubbleIds.length === 1 && initialBubbleBox) {
        const normX = (coords.x / naturalSize.w) * 1000;
        const normY = (coords.y / naturalSize.h) * 1000;
        let newBox = { ...initialBubbleBox };
        switch (resizingHandle) {
            case 'nw': newBox.xmin = Math.min(normX, initialBubbleBox.xmax - 10); newBox.ymin = Math.min(normY, initialBubbleBox.ymax - 10); break;
            case 'ne': newBox.xmax = Math.max(normX, initialBubbleBox.xmin + 10); newBox.ymin = Math.min(normY, initialBubbleBox.ymax - 10); break;
            case 'sw': newBox.xmin = Math.min(normX, initialBubbleBox.xmax - 10); newBox.ymax = Math.max(normY, initialBubbleBox.ymin + 10); break;
            case 'se': newBox.xmax = Math.max(normX, initialBubbleBox.xmin + 10); newBox.ymax = Math.max(normY, initialBubbleBox.ymin + 10); break;
        }
        onUpdateBubbleBox(selectedBubbleIds[0], newBox);
    } 
    else if (draggedBubbleId && dragStartMousePos && initialBubbleBox) {
         const dx = (coords.x / naturalSize.w * 1000) - dragStartMousePos.x;
         const dy = (coords.y / naturalSize.h * 1000) - dragStartMousePos.y;
         const newBox = {
             ymin: initialBubbleBox.ymin + dy,
             xmin: initialBubbleBox.xmin + dx,
             ymax: initialBubbleBox.ymax + dy,
             xmax: initialBubbleBox.xmax + dx
         };
         onUpdateBubbleBox(draggedBubbleId, newBox);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    if (isPanning) {
        setIsPanning(false);
        setPanStart(null);
        return;
    }
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (isDrawing && startPos && currentDragPos && naturalSize) {
       const x1 = Math.min(startPos.x, currentDragPos.x);
       const y1 = Math.min(startPos.y, currentDragPos.y);
       const x2 = Math.max(startPos.x, currentDragPos.x);
       const y2 = Math.max(startPos.y, currentDragPos.y);
       const w = x2 - x1;
       const h = y2 - y1;
       if (w > 5 && h > 5) {
           const box: BoundingBox = {
               xmin: Math.round((x1 / naturalSize.w) * 1000),
               ymin: Math.round((y1 / naturalSize.h) * 1000),
               xmax: Math.round((x2 / naturalSize.w) * 1000),
               ymax: Math.round((y2 / naturalSize.h) * 1000)
           };
           if (mode === 'crop') {
               onUpdateCropBox(box);
           } else {
               let detectedColor = undefined;
               if (forwardedRef.current) {
                   const ctx = forwardedRef.current.getContext('2d');
                   if (ctx) detectedColor = detectDominantColor(ctx, x1, y1, w, h, currentShape as BubbleShape);
               }
               onAddBubble(box, currentShape, detectedColor);
           }
       }
       setIsDrawing(false);
       setStartPos(null);
       setCurrentDragPos(null);
    } 
    else if (mode === 'picker' && coords && forwardedRef.current) {
         const ctx = forwardedRef.current.getContext('2d');
         if (ctx) {
             const p = ctx.getImageData(coords.x, coords.y, 1, 1).data;
             const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
             onColorPicked(hex);
         }
    }
    setDraggedBubbleId(null);
    setDragStartMousePos(null);
    setInitialBubbleBox(null);
    setResizingHandle(null);
  };

  const getCursorClass = () => {
    if (mode === 'picker') return 'cursor-crosshair';
    if (mode === 'crop') return 'cursor-crosshair';
    if (resizingHandle) {
        return ['nw', 'se'].includes(resizingHandle) ? 'cursor-nwse-resize' : 'cursor-nesw-resize';
    }
    if (draggedBubbleId) return 'cursor-grabbing';
    if (hoverHandle) {
        return ['nw', 'se'].includes(hoverHandle) ? 'cursor-nwse-resize' : 'cursor-nesw-resize';
    }
    if ((mode === 'draw' || mode === 'view') && isHoveringSelected) return 'cursor-move';
    if (mode === 'draw') return 'cursor-crosshair';
    if (mode === 'view') return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    return 'cursor-default';
  };

  return (
    <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-transparent">
       <div 
          ref={scrollContainerRef}
          className={`w-full h-full overflow-auto custom-scrollbar relative outline-none flex`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
       >
          <div className="flex-none min-w-full min-h-full flex p-10">
             <div 
              className="relative shadow-2xl transition-transform duration-75 ease-out m-auto flex-shrink-0"
              style={{ 
                 width: naturalSize ? naturalSize.w * fitScale * zoomLevel : 'auto',
                 height: naturalSize ? naturalSize.h * fitScale * zoomLevel : 'auto'
              }}
             >
                 <canvas
                    ref={forwardedRef}
                    className={`block w-full h-full ${getCursorClass()}`}
                    style={{ backgroundColor: backgroundColor.startsWith('#') ? backgroundColor : 'transparent' }}
                 />
             </div>
          </div>
       </div>
    </div>
  );
};
