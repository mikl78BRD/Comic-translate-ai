import { TargetLanguage, AiModelId } from "./types";

export const SUPPORTED_LANGUAGES = [
  { value: TargetLanguage.RUSSIAN, label: 'Русский', flag: '🇷🇺' },
  { value: TargetLanguage.UKRAINIAN, label: 'Українська', flag: '🇺🇦' },
  { value: TargetLanguage.GERMAN, label: 'Deutsch', flag: '🇩🇪' },
  { value: TargetLanguage.ENGLISH, label: 'English', flag: '🇺🇸' },
  { value: TargetLanguage.SPANISH, label: 'Español', flag: '🇪🇸' },
  { value: TargetLanguage.FRENCH, label: 'Français', flag: '🇫🇷' },
  { value: TargetLanguage.ITALIAN, label: 'Italiano', flag: '🇮🇹' },
  { value: TargetLanguage.CHINESE, label: '中文 (Manhua)', flag: '🇨🇳' },
  { value: TargetLanguage.JAPANESE, label: '日本語 (Manga)', flag: '🇯🇵' },
  { value: TargetLanguage.KOREAN, label: '한국어 (Manhwa)', flag: '🇰🇷' },
  { value: TargetLanguage.ARABIC, label: 'العربية', flag: '🇸🇦' },
  { value: TargetLanguage.PORTUGUESE, label: 'Português', flag: '🇵🇹' },
  { value: TargetLanguage.HINDI, label: 'हिन्दी', flag: '🇮🇳' },
];

export const AVAILABLE_MODELS: { id: AiModelId; label: string }[] = [
  { id: 'gemini-flash', label: 'Gemini Flash' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
];

export const MAX_IMAGE_SIZE_MB = 10;