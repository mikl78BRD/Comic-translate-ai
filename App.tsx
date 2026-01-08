
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Loader2, Image as ImageIcon, Sparkles, ZoomIn, ZoomOut, Pipette, SquareDashedMousePointer, MousePointer2, Circle, Square, Wand2, Crop, X, Trash2, Zap, ScanLine, BookOpen, Eye, Home, LogOut, AlertTriangle, RefreshCw, Languages, Cpu, Type } from 'lucide-react';
import { TargetLanguage, TextBubble, ProcessingStatus, BoundingBox, AiModelId, BubbleShape, TranslationStyle, BubbleType, RestorationType, ArchivePageState } from './types';
import { SUPPORTED_LANGUAGES, AVAILABLE_MODELS } from './constants';
import { analyzeAndTranslateComic, upscaleComicPage } from './services/geminiService';
import { detectBubbleColors, getContrastColor } from './utils/imageAnalysis';
import { applyManualFilters, FilterSettings } from './utils/imageFilters';
import { EditorSidebar } from './components/EditorSidebar';
import { CanvasPreview } from './components/CanvasPreview';
import { GalleryModal } from './components/GalleryModal';
import { ImageComparisonModal } from './components/ImageComparisonModal';
import { RestorationOptionsModal } from './components/RestorationOptionsModal';
import { BackgroundGalleryModal } from './components/BackgroundGalleryModal';
import { ThumbnailsSidebar } from './components/ThumbnailsSidebar';

interface GalleryFile {
  name: string;
  data: string;
}

interface HistoryState {
  bubbles: TextBubble[];
  imageSrc: string | null;
  selectedBubbleIds: string[];
}

const App = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isRestorationOptionsOpen, setIsRestorationOptionsOpen] = useState(false);
  const [isBackgroundGalleryOpen, setIsBackgroundGalleryOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isProcessingArchive, setIsProcessingArchive] = useState(false);
  const [isExportingArchive, setIsExportingArchive] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Archive Project State
  const [archivePages, setArchivePages] = useState<ArchivePageState[]>([]);
  const [currentArchiveIndex, setCurrentArchiveIndex] = useState<number>(-1);
  const [isArchiveMode, setIsArchiveMode] = useState(false);

  // Current Workspace State
  const [bubbles, setBubbles] = useState<TextBubble[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);
  const [currentArchiveName, setCurrentArchiveName] = useState('');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setHistoryFuture] = useState<HistoryState[]>([]); 

  // Config
  const [selectedLanguage, setSelectedLanguage] = useState<TargetLanguage>(TargetLanguage.RUSSIAN);
  const [sourceLanguage, setSourceLanguage] = useState<TargetLanguage>(TargetLanguage.ENGLISH);
  const [selectedModel, setSelectedModel] = useState<AiModelId>('gemini-flash');
  const [selectedFont, setSelectedFont] = useState<string>('Comic Neue');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Editor State
  const [selectedBubbleIds, setSelectedBubbleIds] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [appMode, setAppMode] = useState<'view' | 'draw' | 'picker' | 'crop'>('view');
  const [currentFillColor, setCurrentFillColor] = useState<string>('#ffffff');
  const [currentShape, setCurrentShape] = useState<BubbleShape>('ellipse');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>('#0f172a');
  const [cropBox, setCropBox] = useState<BoundingBox | null>(null);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  // --- Core Handlers ---

  const recordHistory = useCallback(() => {
    setHistory(prev => [...prev, { bubbles: JSON.parse(JSON.stringify(bubbles)), imageSrc, selectedBubbleIds: [...selectedBubbleIds] }]);
    setHistoryFuture([]);
  }, [bubbles, imageSrc, selectedBubbleIds]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    setHistoryFuture(prev => [{ bubbles: JSON.parse(JSON.stringify(bubbles)), imageSrc, selectedBubbleIds: [...selectedBubbleIds] }, ...prev]);
    setBubbles(previousState.bubbles);
    setImageSrc(previousState.imageSrc);
    setSelectedBubbleIds(previousState.selectedBubbleIds || []);
    setHistory(newHistory);
  }, [history, bubbles, imageSrc, selectedBubbleIds]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[0];
    const newFuture = future.slice(1);
    setHistory(prev => [...prev, { bubbles: JSON.parse(JSON.stringify(bubbles)), imageSrc, selectedBubbleIds: [...selectedBubbleIds] }]);
    setBubbles(nextState.bubbles);
    setImageSrc(nextState.imageSrc);
    setSelectedBubbleIds(nextState.selectedBubbleIds || []);
    setHistoryFuture(newFuture);
  }, [future, bubbles, imageSrc, selectedBubbleIds]);

  const handleDeleteSelectedBubbles = useCallback(() => {
    if (selectedBubbleIds.length === 0) return;
    recordHistory();
    setBubbles(prev => prev.filter(b => !selectedBubbleIds.includes(b.id)));
    setSelectedBubbleIds([]);
  }, [selectedBubbleIds, recordHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isTyping) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBubbleIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedBubbles();
        }
      }

      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBubbleIds, redo, undo, handleDeleteSelectedBubbles]);

  const handleSelectArchivePage = (index: number) => {
    if (index === currentArchiveIndex) return;
    setArchivePages(prev => {
        const updated = [...prev];
        if (currentArchiveIndex >= 0) {
            updated[currentArchiveIndex] = {
                ...updated[currentArchiveIndex],
                bubbles: JSON.parse(JSON.stringify(bubbles)),
                isModified: bubbles.length > 0 || updated[currentArchiveIndex].isModified
            };
        }
        return updated;
    });
    const nextPage = archivePages[index];
    setImageSrc(nextPage.imageSrc);
    setBubbles(nextPage.bubbles);
    setCurrentArchiveIndex(index);
    setHistory([]);
    setHistoryFuture([]);
    setSelectedBubbleIds([]);
    setZoomLevel(1);
  };

  const handleOpenFullProject = () => {
    if (galleryFiles.length === 0) return;
    const pages: ArchivePageState[] = galleryFiles.map(file => ({
        bubbles: [],
        imageSrc: file.data,
        name: file.name,
        isModified: false
    }));
    setArchivePages(pages);
    setIsArchiveMode(true);
    setIsGalleryOpen(false);
    setImageSrc(pages[0].imageSrc);
    setBubbles([]);
    setCurrentArchiveIndex(0);
    setZoomLevel(1);
    setAppMode('view');
  };

  const handleExportFullArchive = async () => {
    if (archivePages.length === 0) return;
    setIsExportingArchive(true);
    setStatus('analyzing');
    try {
        // @ts-ignore
        const JSZipModule = await import('jszip');
        const JSZipConstructor = JSZipModule.default || (JSZipModule as any);
        const zip = new (JSZipConstructor as any)();
        
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");
        for (let i = 0; i < archivePages.length; i++) {
            const page = i === currentArchiveIndex ? { ...archivePages[i], bubbles } : archivePages[i];
            setStatusMessage(`Processing page ${i + 1} of ${archivePages.length}...`);
            const img = new Image();
            img.src = page.imageSrc;
            await new Promise(r => img.onload = r);
            exportCanvas.width = img.naturalWidth;
            exportCanvas.height = img.naturalHeight;
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.drawImage(img, 0, 0);
            page.bubbles.forEach(bubble => {
                const { ymin, xmin, ymax, xmax } = bubble.box;
                const x = (xmin / 1000) * exportCanvas.width;
                const y = (ymin / 1000) * exportCanvas.height;
                const w = ((xmax - xmin) / 1000) * exportCanvas.width;
                const h = ((ymax - ymin) / 1000) * exportCanvas.height;
                const color = bubble.backgroundColor || '#ffffff';
                const alpha = bubble.opacity ?? 1;
                ctx.fillStyle = `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, ${alpha})`;
                ctx.beginPath();
                if (bubble.shape === 'rectangle') ctx.roundRect(x, y, w, h, 4);
                else ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, 2 * Math.PI);
                ctx.fill();
                if (bubble.translatedText) {
                    ctx.fillStyle = bubble.textColor || '#000000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const fontSize = bubble.fontSize || Math.floor(h * 0.4);
                    ctx.font = `bold ${fontSize}px "${selectedFont}", sans-serif`;
                    ctx.fillText(bubble.translatedText, x + w/2, y + h/2);
                }
            });
            const blob = await new Promise<Blob | null>(r => exportCanvas.toBlob(r, 'image/jpeg', 0.9));
            if (blob) zip.file(page.name, blob);
        }
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `${currentArchiveName.replace(/\.[^/.]+$/, "")}_translated.cbz`;
        link.href = URL.createObjectURL(zipContent);
        link.click();
        setStatus('complete');
    } catch (e) {
        setStatus('error');
    } finally {
        setIsExportingArchive(false);
    }
  };

  const forceResetToMenu = useCallback(() => {
    setIsExitConfirmOpen(false);
    setIsGalleryOpen(false);
    setIsRestorationOptionsOpen(false);
    setIsBackgroundGalleryOpen(false);
    setIsComparisonOpen(false);
    setStatus('idle');
    setStatusMessage('');
    setImageSrc(null);
    setBubbles([]);
    setGalleryFiles([]);
    setCurrentArchiveName('');
    setArchivePages([]);
    setIsArchiveMode(false);
    setCurrentArchiveIndex(-1);
    setHistory([]);
    setHistoryFuture([]);
    setSelectedBubbleIds([]);
    setAppMode('view');
    setZoomLevel(1);
    setCropBox(null);
    setRestoredImage(null);
    setCanvasBackgroundColor('#0f172a');
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleAutoDetect = async (specificImage?: string) => {
    const targetImage = specificImage || imageSrc;
    if (!targetImage) return;
    recordHistory();
    setStatus('analyzing');
    setStatusMessage('Searching for text bubbles...');
    try {
        const mimeType = targetImage.substring(5, targetImage.indexOf(';'));
        const base64Data = targetImage.split(',')[1];
        const detected = await analyzeAndTranslateComic(base64Data, selectedLanguage, sourceLanguage, selectedModel, [], mimeType, true);
        setStatusMessage('Analyzing colors and contrast...');
        const colored = await detectBubbleColors(targetImage, detected);
        setBubbles(colored);
        setStatus('complete');
    } catch (error: any) {
        if (error?.message?.includes("Requested entity was not found.")) {
          setHasApiKey(false);
        }
        setStatus('error');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const lowerName = file.name.toLowerCase();

    // CBR check
    if (lowerName.endsWith('.cbr')) {
      alert("CBR файлы (RAR архивы) пока не поддерживаются для прямого чтения. Пожалуйста, перепакуйте их в CBZ (ZIP) или используйте форматы JPG/PNG.");
    }

    if (lowerName.endsWith('.cbz') || lowerName.endsWith('.zip') || lowerName.endsWith('.cbr')) {
        setIsProcessingArchive(true);
        setCurrentArchiveName(file.name);
        setGalleryFiles([]);
        try {
            // @ts-ignore
            const JSZipModule = await import('jszip');
            const JSZipConstructor = JSZipModule.default || (JSZipModule as any);
            const zip = new (JSZipConstructor as any)();
            const content = await zip.loadAsync(file);
            
            const fileNames = Object.keys(content.files).filter(name => {
                const f = content.files[name];
                if (f.dir) return false;
                const n = name.toLowerCase();
                const isImage = n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png');
                const isSystem = n.startsWith('__macosx') || n.split('/').some(part => part.startsWith('.'));
                return isImage && !isSystem;
            });
            
            fileNames.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));
            
            const validImages = (await Promise.all(fileNames.map(filename => 
                content.files[filename].async('base64').then(b64 => ({
                    name: filename,
                    data: `data:${filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${b64}`
                })).catch(() => null)
            ))).filter((r): r is GalleryFile => r !== null);
            
            if (validImages.length === 0) {
              alert("В архиве не найдено подходящих изображений (JPG/PNG).");
              setIsProcessingArchive(false);
              return;
            }

            setGalleryFiles(validImages);
            setIsGalleryOpen(true);
        } catch (e) {
            console.error("Archive Load Error:", e);
            alert("Не удалось открыть архив. Убедитесь, что это ZIP/CBZ формат.");
        } finally {
            setIsProcessingArchive(false);
        }
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBubbles([]);
      setArchivePages([]);
      setIsArchiveMode(false);
      setImageSrc(result);
      setAppMode('view'); 
      setZoomLevel(1);
    };
    reader.readAsDataURL(file);
  };

  const handleFullScan = async (style: TranslationStyle = 'default') => {
    if (!imageSrc) return;
    recordHistory();
    setStatus('analyzing');
    const modelLabel = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label || "AI";
    setStatusMessage(style === 'default' ? `Processing with ${modelLabel}...` : style === 'yandex' ? 'Translating (Natural style)...' : 'Translating (High Accuracy Mode)...');
    try {
      const mimeType = imageSrc.substring(5, imageSrc.indexOf(';'));
      const base64Data = imageSrc.split(',')[1];
      const detected = await analyzeAndTranslateComic(base64Data, selectedLanguage, sourceLanguage, selectedModel, [], mimeType, false, style);
      setStatusMessage('Analyzing colors & text contrast...');
      const colored = await detectBubbleColors(imageSrc, detected);
      setBubbles(colored);
      setStatus('complete');
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found.")) {
        setHasApiKey(false);
      }
      setStatus('error');
    }
  };

  // --- Bubble Management Handlers ---

  const handleUpdateBubble = useCallback((id: string, text: string) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, translatedText: text } : b));
  }, []);

  const handleUpdateBubbleFontSize = useCallback((id: string, size: number | undefined) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, fontSize: size } : b));
  }, []);

  const handleUpdateBubbleColor = useCallback((id: string, color: string) => {
    const textColor = getContrastColor(color);
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, backgroundColor: color, textColor } : b));
  }, []);

  const handleUpdateBubbleOpacity = useCallback((id: string, opacity: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, opacity } : b));
  }, []);

  const handleUpdateBubbleLineHeight = useCallback((id: string, lineHeight: number) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, lineHeight } : b));
  }, []);

  const handleUpdateBubbleShape = useCallback((id: string, shape: BubbleShape) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, shape } : b));
  }, []);

  const handleBatchFontSize = useCallback((size: number) => {
    setBubbles(prev => prev.map(b => {
      if (selectedBubbleIds.length > 0) {
        return selectedBubbleIds.includes(b.id) ? { ...b, fontSize: size } : b;
      }
      return { ...b, fontSize: size };
    }));
  }, [selectedBubbleIds]);

  const handleBatchUpdateBubblesType = useCallback((ids: string[], type: BubbleType) => {
    recordHistory();
    setBubbles(prev => prev.map(b => ids.includes(b.id) ? { ...b, type, shape: type === 'caption' ? 'rectangle' : 'ellipse' } : b));
  }, [recordHistory]);

  const handleBatchToggleCase = useCallback(() => {
    recordHistory();
    setBubbles(prev => {
        const targetIds = selectedBubbleIds.length > 0 ? selectedBubbleIds : prev.map(b => b.id);
        const relevantBubbles = prev.filter(b => targetIds.includes(b.id) && b.translatedText);
        
        // Determine if currently all are uppercase
        const isAllUppercase = relevantBubbles.length > 0 && relevantBubbles.every(b => 
            b.translatedText === b.translatedText.toUpperCase() && b.translatedText !== b.translatedText.toLowerCase()
        );

        return prev.map(b => {
            if (targetIds.includes(b.id) && b.translatedText) {
                if (isAllUppercase) {
                    // Convert to Sentence Case
                    const lower = b.translatedText.toLowerCase();
                    const sentence = lower.replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (c) => c.toUpperCase());
                    return { ...b, translatedText: sentence };
                } else {
                    // Convert to Uppercase
                    return { ...b, translatedText: b.translatedText.toUpperCase() };
                }
            }
            return b;
        });
    });
  }, [selectedBubbleIds, recordHistory]);

  const handleDeleteBubble = useCallback((id: string) => {
    recordHistory();
    setBubbles(prev => prev.filter(b => b.id !== id));
    setSelectedBubbleIds(prev => prev.filter(sid => sid !== id));
  }, [recordHistory]);

  const workspaceStyle = canvasBackgroundColor.startsWith('data:') 
    ? { backgroundImage: `url("${canvasBackgroundColor}")`, backgroundSize: 'cover' }
    : { backgroundColor: canvasBackgroundColor };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {!hasApiKey && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="bg-slate-800 border-2 border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-500/20">
                    <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Требуется API Ключ</h3>
                <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed">
                   Для использования профессиональных моделей выберите API ключ из платного проекта GCP. 
                   Подробнее в <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 underline">документации</a>.
                </p>
                <button onClick={handleOpenKeySelector} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    Выбрать API Ключ
                </button>
             </div>
          </div>
      )}

      {isExitConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="bg-slate-800 border-2 border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Выйти в меню</h3>
                <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed">
                   Вы уверены, что хотите покинуть редактор? Все несохраненные изменения будут потеряны.
                </p>
                <div className="flex flex-col gap-2">
                   <button onClick={forceResetToMenu} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"><LogOut size={18} /> ДА, ВЫЙТИ В МЕНЮ</button>
                   <button onClick={() => setIsExitConfirmOpen(false)} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl">ОСТАТЬСЯ В РЕДАКТОРЕ</button>
                </div>
             </div>
          </div>
      )}

      <GalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} files={galleryFiles} onSelectImage={(b) => {setImageSrc(b); setIsGalleryOpen(false); setIsArchiveMode(false);}} fileName={currentArchiveName} onOpenFullProject={handleOpenFullProject} />
      <BackgroundGalleryModal isOpen={isBackgroundGalleryOpen} onClose={() => setIsBackgroundGalleryOpen(false)} onSelectBackground={setCanvasBackgroundColor} />
      <RestorationOptionsModal isOpen={isRestorationOptionsOpen} onClose={() => setIsRestorationOptionsOpen(false)} onSelectMethod={(m, t) => upscaleComicPage(imageSrc!.split(',')[1], 'image/jpeg', '1:1', m, t).then(res => {setRestoredImage(res); setIsComparisonOpen(true);}).catch((err) => {if(err.message?.includes("Requested entity was not found.")) setHasApiKey(false);})} onApplyManualFilters={s => applyManualFilters(imageSrc!, s).then(res => {setRestoredImage(res); setIsComparisonOpen(true);})} />
      {isComparisonOpen && imageSrc && restoredImage && <ImageComparisonModal originalImage={imageSrc} restoredImage={restoredImage} onConfirm={() => {recordHistory(); setImageSrc(restoredImage); setRestoredImage(null); setIsComparisonOpen(false);}} onCancel={() => setIsComparisonOpen(false)} />}
      
      {/* FULL PROFESSIONAL HEADER */}
      <header className="h-16 border-b border-slate-700 flex items-center justify-between px-4 sm:px-6 bg-slate-800 shrink-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={imageSrc ? forceResetToMenu : undefined} className="flex items-center gap-2 group cursor-pointer outline-none">
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors"><Sparkles className="text-white" size={18} /></div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden lg:block">ComicTranslate AI</h1>
          </button>
        </div>

        <div className="flex items-center gap-2 xl:gap-3">
           <div className="flex items-center bg-slate-700 rounded-lg p-0.5 border border-slate-600">
               <div className="flex items-center px-2 text-slate-400"><Type size={14} /></div>
               <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="bg-transparent text-white rounded px-2 py-1 text-[11px] border-none outline-none focus:ring-0 w-28 sm:w-32">
                   {['Comic Neue', 'Luckiest Guy', 'Bangers', 'Komika Axis', 'Badaboom BB', 'Anime Ace 2 BB', 'Sensei', 'Montserrat', 'Rubik'].map(f => <option key={f} value={f} className="bg-slate-800">{f}</option>)}
               </select>
           </div>

           <div className="flex items-center bg-slate-700 rounded-lg p-0.5 border border-slate-600">
               <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value as TargetLanguage)} className="bg-transparent text-white rounded px-2 py-1 text-[11px] border-none outline-none focus:ring-0 w-24 sm:w-28">
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-slate-800">{l.flag} {l.label}</option>)}
               </select>
               <span className="text-slate-500 px-0.5 text-xs">→</span>
               <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as TargetLanguage)} className="bg-transparent text-white rounded px-2 py-1 text-[11px] border-none outline-none focus:ring-0 w-24 sm:w-28">
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-slate-800">{l.flag} {l.label}</option>)}
               </select>
           </div>

           <div className="flex items-center gap-1.5 ml-1">
              {/* AI Controls Grouped */}
              <div className="flex items-center bg-slate-700 rounded-lg p-0.5 border border-slate-600">
                <div className="flex items-center px-2 text-indigo-400"><Cpu size={14} /></div>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as AiModelId)} className="bg-transparent text-white rounded px-2 py-1 text-[11px] border-none outline-none focus:ring-0 w-32 sm:w-40">
                    {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id} className="bg-slate-800">{m.label}</option>)}
                </select>
              </div>

              <button 
                onClick={() => handleFullScan('default')} 
                disabled={!imageSrc || status === 'analyzing'} 
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                title="Translate using selected AI model"
              >
                <Languages size={12} />
                AUTO-TRANSLATE
              </button>
              
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              
              <button onClick={() => handleFullScan('google')} disabled={!imageSrc || status === 'analyzing'} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">GOOGLE</button>
              <button onClick={() => handleFullScan('yandex')} disabled={!imageSrc || status === 'analyzing'} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-[10px] font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all">YANDEX</button>
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {isArchiveMode && (
          <ThumbnailsSidebar 
            pages={archivePages} 
            currentIndex={currentArchiveIndex} 
            onSelectPage={handleSelectArchivePage} 
            onExportArchive={handleExportFullArchive}
            isExporting={isExportingArchive}
          />
        )}
        
        <div className="flex-1 min-w-0 relative flex flex-col overflow-hidden" style={workspaceStyle}>
           {(imageSrc || isProcessingArchive) && status !== 'analyzing' && (
             <>
               <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-xl">
                    <button onClick={() => setAppMode('draw')} className={`p-2 rounded-md ${appMode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Draw Bubble"><SquareDashedMousePointer size={20} /></button>
                    <button onClick={() => setAppMode('view')} className={`p-2 rounded-md ${appMode === 'view' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Select/Move"><MousePointer2 size={20} /></button>
                    <button onClick={() => setAppMode('picker')} className={`p-2 rounded-md ${appMode === 'picker' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:bg-slate-700'}`} title="Color Picker"><Pipette size={20} /></button>
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`p-2 rounded-md ${isPreviewMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Preview Final"><Eye size={20} /></button>
                    <button onClick={() => setAppMode('crop')} className="p-2 text-slate-400 hover:bg-slate-700 rounded-md" title="Crop"><Crop size={20} /></button>
                    <button onClick={() => setIsRestorationOptionsOpen(true)} className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-md" title="Restoration"><Wand2 size={20} /></button>
               </div>
               <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-xl">
                  <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded"><ZoomOut size={16} /></button>
                  <input type="range" min="10" max="500" value={Math.round(zoomLevel * 100)} onChange={(e) => setZoomLevel(parseInt(e.target.value) / 100)} className="w-24 accent-indigo-500" />
                  <button onClick={() => setZoomLevel(z => Math.min(5, z + 0.1))} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded"><ZoomIn size={16} /></button>
                  <span className="text-xs font-mono text-slate-400 ml-2">{Math.round(zoomLevel * 100)}%</span>
               </div>
             </>
           )}
           
           {(status === 'analyzing' || isProcessingArchive) && (
             <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur flex flex-col items-center justify-center animate-in fade-in duration-300">
               <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
               <p className="text-xl font-medium text-white tracking-wide">{isProcessingArchive ? 'Unpacking Archive...' : statusMessage || 'Gemini is processing...'}</p>
             </div>
           )}

          {!imageSrc ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 animate-in fade-in duration-500">
              <div className="bg-indigo-600/10 p-8 rounded-full mb-8"><BookOpen size={80} className="text-indigo-400" /></div>
              <h3 className="text-2xl font-black text-slate-200 mb-2 uppercase tracking-widest">ComicTranslate AI</h3>
              <p className="mb-10 text-slate-400 font-medium">Upload a page (JPG, PNG) or full archive (CBZ, CBR, ZIP)</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-2xl shadow-indigo-600/30 flex items-center gap-3 transition-all active:scale-95 text-lg"><Upload size={24} /> OPEN WORKSPACE</button>
            </div>
          ) : (
            <CanvasPreview 
                imageSrc={imageSrc} 
                bubbles={bubbles} 
                selectedBubbleIds={selectedBubbleIds} 
                onSelectBubbles={setSelectedBubbleIds} 
                onAddBubble={(box, shape, dc) => {
                    recordHistory(); 
                    const textColor = getContrastColor(dc || '#ffffff'); 
                    const b = { 
                        id: `manual-${Date.now()}`, 
                        originalText: "", 
                        translatedText: "", 
                        box, 
                        backgroundColor: dc || '#ffffff', 
                        textColor, 
                        shape, 
                        opacity: 1 
                    }; 
                    setBubbles(p => [...p, b]); 
                    setSelectedBubbleIds([b.id]);
                }} 
                onUpdateBubbleBox={(id, box) => setBubbles(p => p.map(b => b.id === id ? { ...b, box } : b))} 
                forwardedRef={canvasRef} 
                zoomLevel={zoomLevel} 
                onZoomChange={setZoomLevel}
                mode={appMode} 
                onColorPicked={(c) => {
                    if(selectedBubbleIds.length > 0) {
                        recordHistory(); 
                        const tc = getContrastColor(c); 
                        setBubbles(p => p.map(b => selectedBubbleIds.includes(b.id) ? {...b, backgroundColor: c, textColor: tc} : b));
                    } else {
                        setCurrentFillColor(c); 
                        setAppMode('draw');
                    }
                }} 
                currentShape={currentShape} 
                isPreviewMode={isPreviewMode} 
                selectedFont={selectedFont} 
                backgroundColor={canvasBackgroundColor} 
                onRecordHistory={recordHistory} 
                cropBox={cropBox} 
                onUpdateCropBox={setCropBox} 
            />
          )}
        </div>
        
        {imageSrc && (
            <EditorSidebar 
              bubbles={bubbles} 
              onUpdateBubble={handleUpdateBubble} 
              onUpdateBubbleFontSize={handleUpdateBubbleFontSize} 
              onUpdateBubbleColor={handleUpdateBubbleColor} 
              onUpdateBubbleOpacity={handleUpdateBubbleOpacity} 
              onUpdateBubbleLineHeight={handleUpdateBubbleLineHeight} 
              onUpdateBubbleShape={handleUpdateBubbleShape} 
              onBatchFontSize={handleBatchFontSize} 
              onBatchUpdateBubblesType={handleBatchUpdateBubblesType} 
              onBatchToggleCase={handleBatchToggleCase}
              onDeleteBubble={handleDeleteBubble} 
              selectedBubbleIds={selectedBubbleIds} 
              onSelectBubbles={setSelectedBubbleIds} 
              onUndo={undo} 
              onRedo={redo} 
              canUndo={history.length > 0} 
              canRedo={future.length > 0} 
              onRecordHistory={recordHistory} 
              onAutoDetect={() => handleAutoDetect()} 
              onQuitProject={() => setIsExitConfirmOpen(true)}
              onEmergencyReset={forceResetToMenu}
            />
        )}
      </main>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".cbz,.cbr,.zip,.jpg,.jpeg,.png" className="hidden" />
    </div>
  );
};

export default App;
