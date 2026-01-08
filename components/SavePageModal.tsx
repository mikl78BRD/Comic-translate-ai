
import React from 'react';
import { X, Save, FileType, FileText, FolderArchive, Download, FilePlus, Trash2, RotateCcw, PlayCircle, Layers, Home } from 'lucide-react';
import { TextBubble } from '../types';

interface PageState {
  imageSrc: string | null;
  bubbles: TextBubble[];
  preview: string;
}

interface SavePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePage: (pageNumber: number) => void;
  onLoadPage: (pageNumber: number) => void;
  onDeletePage: (pageNumber: number) => void;
  savedPages: Record<number, PageState>; 
  currentPageSlot: number | null;
  onDownloadArchive: (format: 'pdf' | 'cbz') => void;
  onNewDocument: () => void;
}

export const SavePageModal: React.FC<SavePageModalProps> = ({
  isOpen,
  onClose,
  onSavePage,
  onLoadPage,
  onDeletePage,
  savedPages,
  currentPageSlot,
  onDownloadArchive,
  onNewDocument
}) => {
  if (!isOpen) return null;

  const totalPages = 50;
  const pageArray = Array.from({ length: totalPages }, (_, i) => i + 1);
  const savedCount = Object.keys(savedPages).length;

  const handleSlotClick = (num: number) => {
      const isOccupied = !!savedPages[num];
      const isCurrent = currentPageSlot === num;
      
      if (!isOccupied || isCurrent) {
          onSavePage(num);
      } else {
          onLoadPage(num);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-5xl rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[85vh]">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-green-600/20 p-2 rounded-lg text-green-400">
                <Save size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Project Memory</h2>
                <p className="text-xs text-slate-400">
                  Manage {savedCount} pages in your current collection.
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50 custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileType size={14} />
                        Page Thumbnails
                    </h3>
                    <div className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700 font-mono">
                        {savedCount} / {totalPages} CAPACITY
                    </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {pageArray.map((num) => {
                        const page = savedPages[num];
                        const isOccupied = !!page;
                        const isCurrent = currentPageSlot === num;
                        
                        return (
                            <div key={num} className="group relative">
                                <div
                                    onClick={() => handleSlotClick(num)}
                                    className={`
                                        w-full aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden relative cursor-pointer
                                        ${isOccupied 
                                            ? (isCurrent ? 'border-green-500 ring-2 ring-green-500/50 bg-green-900/10' : 'border-slate-600 hover:border-indigo-400') 
                                            : 'border-slate-800 border-dashed hover:border-indigo-500/50 hover:bg-slate-800/50'
                                        }
                                    `}
                                >
                                    {isOccupied ? (
                                        <>
                                            <img src={page.preview} className="w-full h-full object-cover" alt={`Page ${num}`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                            
                                            {isCurrent && (
                                                <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-lg">CURRENT</div>
                                            )}

                                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                                                {!isCurrent && (
                                                    <button onClick={(e) => { e.stopPropagation(); onLoadPage(num); }} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1.5">
                                                        <PlayCircle size={12} /> LOAD
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); onSavePage(num); }} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded flex items-center justify-center gap-1.5">
                                                    <RotateCcw size={12} /> {isCurrent ? 'UPDATE' : 'REPLACE'}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeletePage(num); }} className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 text-[10px] font-bold rounded flex items-center justify-center gap-1.5">
                                                    <Trash2 size={12} /> DELETE
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-700 group-hover:text-indigo-400 transition-colors">
                                            <Save size={24} />
                                            <span className="text-[10px] font-bold tracking-widest">SLOT {num}</span>
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 left-0 right-0 p-1 text-center text-[9px] font-mono transition-colors ${isOccupied ? 'bg-black/60 text-white' : 'text-slate-600'}`}>
                                        PAGE {num}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-72 bg-slate-850 border-l border-slate-700 p-6 flex flex-col gap-6 shrink-0">
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Actions</h3>
                    <button onClick={onNewDocument} className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left group">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-400"><Trash2 size={20} /></div>
                        <div>
                            <span className="block font-bold text-red-200 text-sm">Main Menu</span>
                            <span className="text-[9px] text-red-500/70 font-medium uppercase">Reset all memory</span>
                        </div>
                    </button>
                </div>

                <div className="h-px bg-slate-700" />

                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Export Options</h3>
                    <div className="space-y-2">
                        <button onClick={() => onDownloadArchive('pdf')} disabled={savedCount === 0} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-left disabled:opacity-20 group">
                            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20"><FileText size={20} /></div>
                            <div>
                                <span className="block font-bold text-slate-200 text-sm">Download PDF</span>
                                <span className="text-[10px] text-slate-500">Document bundle</span>
                            </div>
                        </button>
                        <button onClick={() => onDownloadArchive('cbz')} disabled={savedCount === 0} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all text-left disabled:opacity-20 group">
                            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20"><FolderArchive size={20} /></div>
                            <div>
                                <span className="block font-bold text-slate-200 text-sm">Download CBZ</span>
                                <span className="text-[10px] text-slate-500">Comic archive</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-auto bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                     <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Layers size={10} /> Usage Help
                     </h4>
                     <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-3">
                        <li>Save your work to slots to preserve panel translations.</li>
                        <li>Export bundles only include non-empty slots.</li>
                        <li>Main Menu reset clears <span className="text-red-400">everything</span>.</li>
                     </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
