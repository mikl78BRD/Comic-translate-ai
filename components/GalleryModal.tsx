
import React from 'react';
import { X, Image as ImageIcon, FileArchive, Layers } from 'lucide-react';

interface GalleryFile {
  name: string;
  data: string; // Base64
}

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GalleryFile[];
  onSelectImage: (base64: string) => void;
  fileName: string;
  onOpenFullProject: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectImage,
  fileName,
  onOpenFullProject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-5xl h-[85vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                <FileArchive size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Archive Gallery</h2>
                <p className="text-xs text-slate-400">{fileName} • {files.length} images found</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenFullProject}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95"
            >
              <Layers size={18} />
              Open as Full Project
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
               <p>No valid JPG or PNG images found in this archive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectImage(file.data)}
                  className="group relative aspect-[2/3] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/50 transition-all text-left flex flex-col"
                >
                  <div className="flex-1 w-full relative overflow-hidden">
                    <img 
                      src={file.data} 
                      alt={file.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 bg-slate-800 text-xs text-slate-300 truncate w-full border-t border-slate-700 group-hover:bg-indigo-900/30 group-hover:text-indigo-200">
                    {file.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
