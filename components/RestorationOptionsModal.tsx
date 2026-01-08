
import React, { useState } from 'react';
import { X, Wand2, Zap, Sparkles, UserRound, Palette, Waves, Sliders, Check, Scan, Image as ImageIcon } from 'lucide-react';
import { RestorationType } from '../types';
import { FilterSettings } from '../utils/imageFilters';

interface RestorationOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (model: 'gemini-flash' | 'gemini-pro', type: RestorationType) => void;
  onApplyManualFilters: (settings: FilterSettings) => void;
}

export const RestorationOptionsModal: React.FC<RestorationOptionsModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  onApplyManualFilters
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // AI State
  const [selectedType, setSelectedType] = useState<RestorationType>('gpen');
  const [selectedModel, setSelectedModel] = useState<'gemini-flash' | 'gemini-pro'>('gemini-flash');

  // Manual State
  const [manualSettings, setManualSettings] = useState<FilterSettings>({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpen: 0
  });

  if (!isOpen) return null;

  const handleApply = () => {
    if (activeTab === 'ai') {
        onSelectMethod(selectedModel, selectedType);
    } else {
        onApplyManualFilters(manualSettings);
    }
  };

  const updateSetting = (key: keyof FilterSettings, value: number) => {
      setManualSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                <Sliders size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Professional Restoration</h2>
                <p className="text-sm text-slate-400">AI Remastering & Retouching</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
            <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'ai' ? 'bg-slate-800 text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
                AI Models
            </button>
            <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'manual' ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
                Manual Adjustments
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            
            {activeTab === 'manual' ? (
                <div className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <label className="text-slate-300">Brightness</label>
                            <span className="text-slate-500">{manualSettings.brightness > 0 ? '+' : ''}{manualSettings.brightness}</span>
                        </div>
                        <input 
                            type="range" min="-100" max="100" 
                            value={manualSettings.brightness} 
                            onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <label className="text-slate-300">Contrast</label>
                            <span className="text-slate-500">{manualSettings.contrast > 0 ? '+' : ''}{manualSettings.contrast}</span>
                        </div>
                        <input 
                            type="range" min="-100" max="100" 
                            value={manualSettings.contrast} 
                            onChange={(e) => updateSetting('contrast', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <label className="text-slate-300">Saturation</label>
                            <span className="text-slate-500">{manualSettings.saturation > 0 ? '+' : ''}{manualSettings.saturation}</span>
                        </div>
                        <input 
                            type="range" min="-100" max="100" 
                            value={manualSettings.saturation} 
                            onChange={(e) => updateSetting('saturation', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between text-sm">
                            <label className="text-slate-300 font-medium">Sharpen (Filter)</label>
                            <span className="text-slate-500">{manualSettings.sharpen}</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            value={manualSettings.sharpen} 
                            onChange={(e) => updateSetting('sharpen', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                </div>
            ) : (
                <>
                {/* Enhancement Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Restoration Engine</label>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => setSelectedType('gpen')}
                            className={`p-3 rounded-lg border text-left flex items-center gap-4 transition-all ${selectedType === 'gpen' ? 'bg-pink-600/20 border-pink-500 ring-1 ring-pink-500 shadow-lg shadow-pink-500/10' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                        >
                            <div className={`p-3 rounded-lg ${selectedType === 'gpen' ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                <UserRound size={24} />
                            </div>
                            <div>
                                <span className={`block font-bold ${selectedType === 'gpen' ? 'text-white' : 'text-slate-300'}`}>Face Restoration (GPEN Style)</span>
                                <span className="text-xs text-slate-500 italic">Fix eyes, skin, and blurry character features</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedType('diffusion')}
                            className={`p-3 rounded-lg border text-left flex items-center gap-4 transition-all ${selectedType === 'diffusion' ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                        >
                            <div className={`p-3 rounded-lg ${selectedType === 'diffusion' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                <Wand2 size={24} />
                            </div>
                            <div>
                                <span className={`block font-bold ${selectedType === 'diffusion' ? 'text-white' : 'text-slate-300'}`}>Digital Redraw (Stable Diffusion)</span>
                                <span className="text-xs text-slate-500 italic">Creative remastering with modern digital painting quality</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedType('hd_upscale')}
                            className={`p-3 rounded-lg border text-left flex items-center gap-4 transition-all ${selectedType === 'hd_upscale' ? 'bg-amber-600/20 border-amber-500 ring-1 ring-amber-500 shadow-lg shadow-amber-500/10' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                        >
                            <div className={`p-3 rounded-lg ${selectedType === 'hd_upscale' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                <Scan size={24} />
                            </div>
                            <div>
                                <span className={`block font-bold ${selectedType === 'hd_upscale' ? 'text-white' : 'text-slate-300'}`}>HD Super-Resolution</span>
                                <span className="text-xs text-slate-500 italic">Upscale line art and remove scan artifacts</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-3 pt-4 border-t border-slate-700/50">
                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Performance Level</label>
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setSelectedModel('gemini-flash')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                selectedModel === 'gemini-flash' 
                                ? 'bg-slate-600 text-white shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Zap size={16} />
                            <span>Quick (Free)</span>
                        </button>
                        <button
                            onClick={() => setSelectedModel('gemini-pro')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                                selectedModel === 'gemini-pro' 
                                ? 'bg-purple-600 text-white shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Sparkles size={16} />
                            <span>Pro (High Fidelity)</span>
                        </button>
                    </div>
                </div>
                </>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end">
            <button
                onClick={handleApply}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2 active:scale-95"
            >
                {activeTab === 'manual' ? <Check size={18} /> : <Wand2 size={18} />}
                {activeTab === 'manual' ? 'Apply Filters' : 'Run Restoration Model'}
            </button>
        </div>
      </div>
    </div>
  );
};
