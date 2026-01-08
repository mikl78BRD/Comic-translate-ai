// Pre-encoded SVGs to ensure offline availability and performance without external dependencies

// Helper to generate the common SVG structure for the lightning/circle design
const generateComicSVG = (baseColor: string, ringColor: string) => {
  // Common Lightning Bolt Path
  // A 3D-ish bolt shape. We'll draw the shadow (black) then the bolt (yellow).
  const boltPath = "M20 0 L0 50 L15 50 L5 100 L40 40 L25 40 L50 0 Z";
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3Cpattern id='dots' x='0' y='0' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='black' opacity='0.2'/%3E%3C/pattern%3E%3Cfilter id='shadow'%3E%3CfeDropShadow dx='4' dy='4' stdDeviation='0' flood-color='black' /%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='${encodeURIComponent(baseColor)}'/%3E%3C!-- Concentric Rings --%3E%3Cg fill='none' stroke='${encodeURIComponent(ringColor)}' stroke-width='40' opacity='0.6'%3E%3Ccircle cx='400' cy='300' r='50' /%3E%3Ccircle cx='400' cy='300' r='120' /%3E%3Ccircle cx='400' cy='300' r='190' /%3E%3Ccircle cx='400' cy='300' r='260' /%3E%3Ccircle cx='400' cy='300' r='330' /%3E%3Ccircle cx='400' cy='300' r='400' /%3E%3Ccircle cx='400' cy='300' r='470' /%3E%3Ccircle cx='400' cy='300' r='540' /%3E%3C/g%3E%3C!-- Halftone Overlay (Corners) --%3E%3Crect width='100%25' height='100%25' fill='url(%23dots)' /%3E%3C!-- Lightning Bolts (4 Corners) --%3E%3Cg filter='url(%23shadow)'%3E%3C!-- Top Left --%3E%3Cpath d='${boltPath}' fill='%23facc15' stroke='black' stroke-width='2' transform='translate(20, 20) scale(1.2) rotate(-15)' /%3E%3C!-- Top Right --%3E%3Cpath d='${boltPath}' fill='%23facc15' stroke='black' stroke-width='2' transform='translate(730, 20) scale(1.2) scale(-1, 1) rotate(-15)' /%3E%3C!-- Bottom Left --%3E%3Cpath d='${boltPath}' fill='%23facc15' stroke='black' stroke-width='2' transform='translate(20, 500) scale(1.2) scale(1, -1) rotate(-15)' /%3E%3C!-- Bottom Right --%3E%3Cpath d='${boltPath}' fill='%23facc15' stroke='black' stroke-width='2' transform='translate(730, 500) scale(1.2) scale(-1, -1) rotate(-15)' /%3E%3C/g%3E%3C/svg%3E`;
};

export const STOCK_BACKGROUNDS = [
  {
    id: 'comic-red',
    name: 'Red Impact',
    src: generateComicSVG('#7f1d1d', '#ef4444') // Dark Red BG, Bright Red Rings
  },
  {
    id: 'comic-purple',
    name: 'Purple Power',
    src: generateComicSVG('#581c87', '#a855f7') // Dark Purple BG, Bright Purple Rings
  },
  {
    id: 'comic-yellow',
    name: 'Yellow Flash',
    src: generateComicSVG('#b45309', '#facc15') // Brownish/Orange BG, Bright Yellow Rings
  },
  {
    id: 'comic-green',
    name: 'Green Energy',
    src: generateComicSVG('#14532d', '#22c55e') // Dark Green BG, Bright Green Rings
  },
  {
    id: 'comic-blue',
    name: 'Blue Shock',
    src: generateComicSVG('#1e3a8a', '#3b82f6') // Dark Blue BG, Bright Blue Rings
  }
];