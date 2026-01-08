import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ArrowLeftRight, SplitSquareHorizontal, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

interface ImageComparisonModalProps {
  originalImage: string;
  restoredImage: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImageComparisonModal: React.FC<ImageComparisonModalProps> = ({
  originalImage,
  restoredImage,
  onConfirm,
  onCancel
}) => {
  // Slider State (0-100)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  // Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- Slider Logic ---
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent panning start
    setIsDraggingSlider(true);
  };

  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomSpeed = 0.1;
    const newZoom = Math.max(1, Math.min(8, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
    setZoom(newZoom);
    
    // Reset pan if zoomed out to 1
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  };

  // --- Pan Logic ---
  const handlePanStart = (e: React.MouseEvent) => {
    if (zoom > 1 && !isDraggingSlider) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGlobalMove = (e: MouseEvent) => {
    // Handle Slider Drag
    if (isDraggingSlider && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.min(100, Math.max(0, x)));
    }

    // Handle Image Panning
    if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGlobalUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDraggingSlider, isPanning, lastMousePos]);


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8">
      <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
                <SplitSquareHorizontal size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Compare Result</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                     <span className="flex items-center gap-1"><ZoomIn size={12}/> Scroll to Zoom</span>
                     <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                     <span className="flex items-center gap-1"><MousePointer2 size={12}/> Drag to Pan</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono text-slate-300">
                {Math.round(zoom * 100)}%
             </div>
             <button
                 onClick={() => { setZoom(1); setPan({x:0, y:0}); }}
                 className="text-xs text-indigo-400 hover:text-indigo-300 underline"
             >
                 Reset View
             </button>
          </div>
        </div>

        {/* Comparison Area */}
        <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
           
           <div 
             ref={containerRef}
             className={`relative w-full h-full select-none overflow-hidden ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
             onWheel={handleWheel}
             onMouseDown={handlePanStart}
           >
              {/* Inner container that moves/scales */}
              <div 
                style={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                 <div className="relative max-w-full max-h-full">
                     {/* Original Image (Bottom Layer) */}
                     <img 
                        ref={imageRef}
                        src={originalImage} 
                        alt="Original" 
                        className="max-w-full max-h-[85vh] object-contain pointer-events-none select-none shadow-2xl"
                        draggable={false}
                     />
                    
                     {/* Restored Image (Top Layer - Clipped) */}
                     {/* The key here is to stack it perfectly on top of the original */}
                     <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{ 
                          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
                        }}
                     >
                         <img 
                            src={restoredImage} 
                            alt="Restored" 
                            className="w-full h-full object-contain select-none"
                            draggable={false}
                        />
                     </div>
                 </div>
              </div>

              {/* Slider UI Overlay (Static relative to viewport) */}
              <div 
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(0,0,0,0.8)] z-20 hover:w-1.5 transition-all"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleSliderMouseDown}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-xl text-slate-900 border-2 border-slate-300 hover:scale-110 transition-transform">
                   <ArrowLeftRight size={20} />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-6 left-6 z-10 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/20 pointer-events-none shadow-lg">
                Original
              </div>
              <div className="absolute bottom-6 right-6 z-10 bg-purple-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/20 pointer-events-none shadow-lg">
                Restored
              </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end items-center gap-3 shrink-0">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium"
            >
              <X size={18} />
              Discard
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-purple-900/20"
            >
              <Check size={18} />
              Apply Restoration
            </button>
        </div>
      </div>
    </div>
  );
};
