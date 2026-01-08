// Helper to load image
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
};

export const getContext = (img: HTMLImageElement): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(img, 0, 0);
    return { canvas, ctx };
};

export interface FilterSettings {
    brightness: number; // -100 to 100
    contrast: number;   // -100 to 100
    saturation: number; // -100 to 100
    sharpen: number;    // 0 to 100
}

export const applyManualFilters = async (imageSrc: string, settings: FilterSettings): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    // Apply CSS-style filters (Brightness, Contrast, Saturation)
    // Map -100..100 to CSS filter values
    // Brightness: 100% is default (1.0). Range 0.5 to 1.5
    const b = 1 + (settings.brightness / 200); 
    // Contrast: 100% is default (1.0). Range 0.5 to 1.5
    const c = 1 + (settings.contrast / 200);
    // Saturate: 100% is default (1.0). Range 0 to 2.0
    const s = 1 + (settings.saturation / 100);

    ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none'; // Reset for pixel manipulation

    // Apply Sharpening (Convolution) if needed
    if (settings.sharpen > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const amount = settings.sharpen / 100; // 0.0 to 1.0
        
        // Simple Sharpen Kernel
        //  0 -1  0
        // -1  5 -1
        //  0 -1  0
        // Mix original with sharpened based on amount
        
        const w = canvas.width;
        const h = canvas.height;
        const data = imageData.data;
        const buff = new Uint8ClampedArray(data); // Copy original

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = (y * w + x) * 4;
                
                // Convolve
                // center * 5 - (left + right + top + bottom)
                const r = buff[i] * 5 
                        - buff[i - 4] 
                        - buff[i + 4] 
                        - buff[i - w * 4] 
                        - buff[i + w * 4];
                
                const g = buff[i + 1] * 5 
                        - buff[i + 1 - 4] 
                        - buff[i + 1 + 4] 
                        - buff[i + 1 - w * 4] 
                        - buff[i + 1 + w * 4];

                const b = buff[i + 2] * 5 
                        - buff[i + 2 - 4] 
                        - buff[i + 2 + 4] 
                        - buff[i + 2 - w * 4] 
                        - buff[i + 2 + w * 4];

                // Mix based on amount
                data[i] = data[i] * (1 - amount) + r * amount;
                data[i + 1] = data[i + 1] * (1 - amount) + g * amount;
                data[i + 2] = data[i + 2] * (1 - amount) + b * amount;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
};
