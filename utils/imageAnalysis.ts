
import { TextBubble, BubbleShape } from "../types";

/**
 * Calculates the best contrasting text color (black or white) for a given background color.
 */
export const getContrastColor = (hexColor: string): string => {
    if (!hexColor || !hexColor.startsWith('#')) return '#000000';
    
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance (YIQ formula)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return (yiq >= 145) ? '#000000' : '#ffffff';
};

/**
 * Detects the dominant color in a specific region of a canvas context.
 * Optimized for comics: ignores black ink lines and handles screentones.
 */
export const detectDominantColor = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number,
  shape: BubbleShape
): string => {
  try {
    if (w <= 0 || h <= 0) return '#ffffff';

    const safeX = Math.max(0, Math.floor(x));
    const safeY = Math.max(0, Math.floor(y));
    const safeW = Math.min(Math.floor(w), ctx.canvas.width - safeX);
    const safeH = Math.min(Math.floor(h), ctx.canvas.height - safeY);

    if (safeW <= 0 || safeH <= 0) return '#ffffff';

    const imageData = ctx.getImageData(safeX, safeY, safeW, safeH);
    const data = imageData.data;
    const colorCounts: Record<string, number> = {};
    
    const cx = safeW / 2; 
    const cy = safeH / 2;
    const rxSq = (safeW / 2) ** 2;
    const rySq = (safeH / 2) ** 2;

    // comic-specific optimization: ignore very dark colors (ink lines)
    // and sample only the center of the region to avoid the outline
    for (let i = 0; i < data.length; i += 16) { 
      const pixelIndex = i / 4;
      const px = pixelIndex % safeW;
      const py = Math.floor(pixelIndex / safeW);

      // Check if we are inside the sampled area (0.8 scale of the box)
      const dx = px - cx;
      const dy = py - cy;
      const dist = (dx*dx)/rxSq + (dy*dy)/rySq;
      
      if (shape === 'ellipse' && dist > 0.8) continue;
      if (shape === 'rectangle' && (Math.abs(dx) > safeW * 0.4 || Math.abs(dy) > safeH * 0.4)) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Ignore pure black or very dark ink lines (typical for comic lineart)
      if (r < 65 && g < 65 && b < 65) continue;

      // Quantize to handle halftones (screentones) - map nearby colors to the same key
      const rQ = Math.round(r / 20) * 20;
      const gQ = Math.round(g / 20) * 20;
      const bQ = Math.round(b / 20) * 20;

      const key = `${rQ},${gQ},${bQ}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    let maxCount = 0;
    let dominantKey = "255,255,255";

    for (const key in colorCounts) {
      if (colorCounts[key] > maxCount) {
        maxCount = colorCounts[key];
        dominantKey = key;
      }
    }

    // Force nearly white colors to be pure white (#ffffff)
    const parts = dominantKey.split(',').map(Number);
    if (parts[0] > 230 && parts[1] > 230 && parts[2] > 230) return '#ffffff';

    const [finalR, finalG, finalB] = parts;
    return "#" + ((1 << 24) + (finalR << 16) + (finalG << 8) + finalB).toString(16).slice(1);
  } catch (e) {
    return '#ffffff';
  }
};

export const detectBubbleColors = (
    imageSrc: string,
    bubbles: TextBubble[]
): Promise<TextBubble[]> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if(!ctx) { resolve(bubbles); return; }
            
            ctx.drawImage(img, 0, 0);

            const coloredBubbles = bubbles.map(bubble => {
                const { ymin, xmin, ymax, xmax } = bubble.box;
                const x = (xmin / 1000) * canvas.width;
                const y = (ymin / 1000) * canvas.height;
                const w = ((xmax - xmin) / 1000) * canvas.width;
                const h = ((ymax - ymin) / 1000) * canvas.height;

                const color = detectDominantColor(ctx, x, y, w, h, bubble.shape || 'ellipse');
                const textColor = getContrastColor(color);
                
                return { ...bubble, backgroundColor: color, textColor };
            });
            resolve(coloredBubbles);
        };
        img.onerror = () => resolve(bubbles);
    });
};
