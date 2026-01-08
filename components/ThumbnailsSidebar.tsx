
import React from 'react';
import { ArchivePageState } from '../types';
import { Download, CheckCircle2, Layers } from 'lucide-react';

interface ThumbnailsSidebarProps {
  pages: ArchivePageState[];
  currentIndex: number;
  onSelectPage: (index: number) => void;
  onExportArchive: () => void;
  isExporting: boolean;
}

export const ThumbnailsSidebar: React.FC<ThumbnailsSidebarProps> = ({
  pages,
  currentIndex,
  onSelectPage,
  onExportArchive,
  isExporting
}) => {
  return (
    <div className="w-40 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col h-full z-20 shadow-2xl">
      <div className="p-4 border-b border-slate-800 bg-slate-800/50">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Layers size={12} />
          Project Pages
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {pages.map((page, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPage(idx)}
            className={`group relative w-full aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all flex flex-col ${
              currentIndex === idx 
                ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                : 'border-slate-800 hover:border-slate-600'
            }`}
          >
            <img 
              src={page.imageSrc} 
              alt={page.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {page.isModified && (
              <div className="absolute top-1 right-1 text-green-400 bg-slate-900/80 rounded-full">
                <CheckCircle2 size={16} fill="currentColor" className="text-slate-900" />
              </div>
            )}
            
            <div className={`absolute inset-x-0 bottom-0 p-1 text-[9px] font-mono text-center transition-colors ${
              currentIndex === idx ? 'bg-indigo-600 text-white' : 'bg-black/60 text-slate-300'
            }`}>
              PAGE {idx + 1}
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <button
          onClick={onExportArchive}
          disabled={isExporting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Download size={18} />
              <span className="text-[10px] uppercase tracking-tighter">Export CBZ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
