
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type BubbleShape = 'rectangle' | 'ellipse';

export type BubbleType = 'dialogue' | 'caption';

export interface TextBubble {
  id: string;
  originalText: string;
  translatedText: string;
  box: BoundingBox;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;
  shape?: BubbleShape;
  type?: BubbleType;
  opacity?: number;
}

export enum TargetLanguage {
  RUSSIAN = 'Russian',
  UKRAINIAN = 'Ukrainian',
  GERMAN = 'German',
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  CHINESE = 'Chinese',
  FRENCH = 'French',
  ARABIC = 'Arabic',
  PORTUGUESE = 'Portuguese',
  JAPANESE = 'Japanese',
  HINDI = 'Hindi',
  KOREAN = 'Korean',
  ITALIAN = 'Italian'
}

export type ProcessingStatus = 'idle' | 'analyzing' | 'complete' | 'error';

export type AiModelId = 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'claude-3-5-sonnet';

export type TranslationStyle = 'google' | 'yandex' | 'default';

export type RestorationType = 'faces' | 'denoise' | 'color' | 'balanced' | 'gpen' | 'diffusion' | 'hd_upscale';

export interface ArchivePageState {
  bubbles: TextBubble[];
  imageSrc: string;
  name: string;
  isModified: boolean;
}
