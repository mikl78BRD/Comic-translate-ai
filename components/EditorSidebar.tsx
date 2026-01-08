
import React, { useState } from 'react';
import { TextBubble, BubbleShape, BubbleType } from '../types';
import { Pencil, Trash2, Type, Circle, Square, MessageCircle, Captions, Undo2, Redo2, Droplets, Shapes, CaseUpper, ArrowUpDown, MoreHorizontal, Settings2, Layers, Search, ScanLine, LogOut, Home, RefreshCw } from 'lucide-react';

interface EditorSidebarProps {
  bubbles: TextBubble[];
  onUpdateBubble: (id: string, newText: string) => void;
  onUpdateBubbleFontSize: (id: string, size: number | undefined) => void;
  onUpdateBubbleColor: (id: string, color: string) => void;
  onUpdateBubbleOpacity: (id: string, opacity: number) => void;
  onUpdateBubbleLineHeight: (id: string, lineHeight: number) => void;
  onUpdateBubbleShape: (id: string, shape: BubbleShape) => void;
  onBatchFontSize: (size: number) => void;
  onBatchUpdateBubblesType: (ids: string[], type: BubbleType) => void;
  onBatchToggleCase: () => void;
  onDeleteBubble: (id: string) => void;
  selectedBubbleIds: string[];
  onSelectBubbles: (ids: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRecordHistory: () => void;
  onAutoDetect: () => void;
  onQuitProject?: () => void; 
  onEmergencyReset?: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  bubbles,
  onUpdateBubble,
  onUpdateBubbleFontSize,
  onUpdateBubbleColor,
  onUpdateBubbleOpacity,
  onUpdateBubbleLineHeight,
  onUpdateBubbleShape,
  onBatchFontSize,
  onBatchUpdateBubblesType,
  onBatchToggleCase,
  onDeleteBubble,
  selectedBubbleIds,
  onSelectBubbles,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRecordHistory,
  onAutoDetect,
  onQuitProject,
  onEmergencyReset
}) => {
  const [batchSize, setBatchSize] = useState(24);

  const selectedBubbles = bubbles.filter(b => selectedBubbleIds.includes(b.id));
  const primarySelected = selectedBubbles[0] || null;
  
  const sliderValue = primarySelected ? (primarySelected.fontSize || 24) : batchSize;
  const opacityValue = primarySelected ? (primarySelected.opacity ?? 1) : 1;
  const lineHeightValue = primarySelected ? (primarySelected.lineHeight ?? 1.1) : 1.1;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setBatchSize(val);
    onBatchFontSize(val);
  };

  const handleToggleCase = (id: string, text: string) => {
    onRecordHistory();
    const isAllUpper = text === text.toUpperCase() && text !== text.toLowerCase();
    if (isAllUpper) {
        const lower = text.toLowerCase();
        // Use consistent regex for sentence case conversion without invalid escapes
        const sentenceCase = lower.replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (c) => c.toUpperCase());
        onUpdateBubble(id, sentenceCase);
    } else {
        onUpdateBubble(id, text.toUpperCase());
    }
  };

  return (
    <div className="w-full lg:w-96 shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col h-full z-10 shadow-xl">
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Pencil size={18} />
            Edit Collection
            </h2>
            <div className="flex items-center gap-1">
                <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30">
                    <Undo2 size={18} />
                </button>
                <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30">
                    <Redo2 size={18} />
                </button>
            </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {bubbles.length} frames detected • {selectedBubbleIds.length} selected
        </p>
      </div>

      {/* Batch Tools */}
      {selectedBubbleIds.length > 1 && (
        <div className="p-4 bg-indigo-900/30 border-b border-indigo-500/30 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3 block flex items-center gap-2">
                <Layers size={14} />
                Selection Actions ({selectedBubbleIds.length})
            </label>
            <div className="flex gap-2">
                <button 
                  onClick={() => onBatchUpdateBubblesType(selectedBubbleIds, 'dialogue')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-xs font-medium text-white hover:bg-slate-700 transition-colors"
                >
                    <MessageCircle size={14} />
                    Dialogue
                </button>
                <button 
                  onClick={() => onBatchUpdateBubblesType(selectedBubbleIds, 'caption')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 border border-indigo-500/30 rounded-lg text-xs font-medium text-white hover:bg-slate-700 transition-colors"
                >
                    <Captions size={14} />
                    Caption
                </button>
            </div>
        </div>
      )}

      {/* Controls Area */}
      <div className="border-b border-slate-700 bg-slate-800/50 flex flex-col">
          {bubbles.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-700/50">
              <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                <span>Font Size {selectedBubbleIds.length > 1 ? '(Selection)' : '(All)'}</span>
                <span className="text-slate-500">{sliderValue}px</span>
              </label>
              <div className="flex gap-2 items-center">
                <Type size={14} className="text-slate-500" />
                <input
                  type="range" min="10" max="100" value={sliderValue}
                  onMouseDown={onRecordHistory}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <Type size={18} className="text-slate-400" />
                <button 
                  onClick={onBatchToggleCase}
                  className="ml-2 p-1.5 bg-slate-700 hover:bg-indigo-600 border border-slate-600 rounded text-indigo-400 hover:text-white transition-all group flex items-center gap-1"
                  title="UPPERCASE ALL TRANSLATIONS"
                >
                  <CaseUpper size={16} />
                  <span className="text-[9px] font-black uppercase hidden sm:block">CAPS ALL</span>
                </button>
              </div>
            </div>
          )}

          {selectedBubbleIds.length === 1 && (
            <div className="px-4 py-3 border-b border-slate-700/50 animate-in fade-in">
                <label className="text-xs text-slate-400 mb-2 block flex items-center gap-2">
                    <Shapes size={14} />
                    Frame Shape
                </label>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-600/50">
                    <button
                        onClick={() => onUpdateBubbleShape(selectedBubbleIds[0], 'ellipse')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${
                            (primarySelected?.shape || 'ellipse') === 'ellipse' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700/50'
                        }`}
                    >
                        <Circle size={14} />
                        <span>Ellipse</span>
                    </button>
                    <button
                        onClick={() => onUpdateBubbleShape(selectedBubbleIds[0], 'rectangle')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${
                            primarySelected?.shape === 'rectangle' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700/50'
                        }`}
                    >
                        <Square size={14} />
                        <span>Rectangle</span>
                    </button>
                </div>
            </div>
          )}

          {selectedBubbleIds.length === 1 && (
            <div className="px-4 py-3 animate-in fade-in space-y-4">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                    <span>Opacity</span>
                    <span className="text-slate-500">{Math.round(opacityValue * 100)}%</span>
                    </label>
                    <div className="flex gap-2 items-center">
                    <Droplets size={14} className="text-slate-500" />
                    <input
                        type="range" min="0" max="1" step="0.05" value={opacityValue}
                        onMouseDown={onRecordHistory}
                        onChange={(e) => onUpdateBubbleOpacity(selectedBubbleIds[0], parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="w-[18px]"></div>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                    <span>Line Spacing</span>
                    <span className="text-slate-500">{lineHeightValue.toFixed(1)}x</span>
                    </label>
                    <div className="flex gap-2 items-center">
                    <ArrowUpDown size={14} className="text-slate-500" />
                    <input
                        type="range" min="0.8" max="2.5" step="0.1" value={lineHeightValue}
                        onMouseDown={onRecordHistory}
                        onChange={(e) => onUpdateBubbleLineHeight(selectedBubbleIds[0], parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="w-[18px]"></div>
                    </div>
                </div>
            </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {bubbles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10 px-6">
            <div className="bg-slate-700/30 p-6 rounded-full text-slate-500">
               <ScanLine size={48} className="animate-pulse" />
            </div>
            <div>
               <h3 className="text-slate-200 font-bold mb-2">No bubbles found</h3>
               <p className="text-sm text-slate-500 italic">Click the button below to automatically scan the current image for text regions.</p>
            </div>
            <button 
              onClick={onAutoDetect}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Search size={18} />
              Auto-Scan Image
            </button>
          </div>
        ) : (
          bubbles.map((bubble, idx) => (
            <div
              key={bubble.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedBubbleIds.includes(bubble.id)
                  ? 'bg-slate-700 border-indigo-500 ring-2 ring-indigo-500/50'
                  : 'bg-slate-750 border-slate-600 hover:border-slate-500'
              }`}
              onClick={(e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    if (selectedBubbleIds.includes(bubble.id)) {
                        onSelectBubbles(selectedBubbleIds.filter(id => id !== bubble.id));
                    } else {
                        onSelectBubbles([...selectedBubbleIds, bubble.id]);
                    }
                } else {
                    onSelectBubbles([bubble.id]);
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                    {bubble.type === 'caption' ? (
                        <div className="flex items-center gap-1 text-[10px] bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            <Captions size={10} />
                            <span>CAPTION</span>
                        </div>
                    ) : (
                        <div className="text-slate-600">
                             <MessageCircle size={12} />
                        </div>
                    )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteBubble(bubble.id); }}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {selectedBubbleIds.length === 1 && selectedBubbleIds[0] === bubble.id ? (
                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase tracking-wider text-indigo-400">Content</label>
                      <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleToggleCase(bubble.id, bubble.translatedText); }} className={`p-1 rounded ${bubble.translatedText === bubble.translatedText.toUpperCase() && bubble.translatedText !== bubble.translatedText.toLowerCase() ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                              <CaseUpper size={14} />
                          </button>
                          <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); onRecordHistory(); }}>
                             <div className="w-5 h-5 rounded border border-slate-600" style={{ backgroundColor: bubble.backgroundColor || '#ffffff' }} />
                             <input type="color" value={bubble.backgroundColor || '#ffffff'} onChange={(e) => onUpdateBubbleColor(bubble.id, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                          <div className="flex items-center gap-1">
                             <span className="text-[10px] text-slate-500">A</span>
                             <input type="number" className="w-10 bg-slate-800 border border-slate-600 rounded text-xs text-right" value={bubble.fontSize || ''} onClick={(e) => e.stopPropagation()} onFocus={onRecordHistory} onChange={(e) => onUpdateBubbleFontSize(bubble.id, e.target.value ? parseInt(e.target.value) : undefined)} />
                          </div>
                      </div>
                   </div>
                   <textarea
                     className="w-full bg-slate-900 text-slate-100 text-sm p-2 rounded border border-slate-700 min-h-[80px]"
                     value={bubble.translatedText}
                     onFocus={onRecordHistory}
                     onChange={(e) => onUpdateBubble(bubble.id, e.target.value)}
                     onClick={(e) => e.stopPropagation()}
                   />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic line-clamp-1">{bubble.translatedText || bubble.originalText}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* EXIT BUTTONS (English) */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-700 flex flex-col gap-2">
          {onQuitProject && (
            <button 
              onClick={onQuitProject}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all group shadow-sm"
            >
              <Home size={16} className="text-slate-400 group-hover:text-white" />
              <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">Exit to Menu</span>
            </button>
          )}
          
          {onEmergencyReset && (
            <button 
              onClick={onEmergencyReset}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 bg-red-900/10 hover:bg-red-600 border border-red-900/30 hover:border-red-500 rounded-lg transition-all group"
              title="Instant reset without confirmation"
            >
              <RefreshCw size={14} className="text-red-500/50 group-hover:text-white" />
              <span className="text-[10px] font-black text-red-500/70 group-hover:text-white uppercase tracking-tighter">Emergency Reset</span>
            </button>
          )}
      </div>
    </div>
  );
};
