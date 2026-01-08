import React, { useRef } from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { STOCK_BACKGROUNDS } from '../constants/stockBackgrounds';

interface BackgroundGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackground: (src: string) => void;
}

export const BackgroundGalleryModal: React.FC<BackgroundGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectBackground
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectBackground(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-pink-600/20 p-2 rounded-lg text-pink-400">
                <ImageIcon size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Canvas Backgrounds</h2>
                <p className="text-xs text-slate-400">Select a preset or upload your own</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Upload Custom Card */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-3"
              >
                 <div className="bg-slate-800 p-3 rounded-full group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors text-slate-400">
                    <Upload size={24} />
                 </div>
                 <span className="text-sm font-semibold text-slate-400 group-hover:text-white">Upload Your Own</span>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                 />
              </button>

              {/* Stock Backgrounds */}
              {STOCK_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onSelectBackground(bg.src)}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-slate-700 hover:border-pink-500 hover:ring-2 hover:ring-pink-500/50 transition-all"
                  >
                      <div className="absolute inset-0 bg-slate-800" />
                      <img 
                        src={bg.src} 
                        alt={bg.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <span className="text-sm font-semibold text-white">{bg.name}</span>
                      </div>
                  </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};