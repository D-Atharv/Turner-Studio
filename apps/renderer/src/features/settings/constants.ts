import type { SelectOption, QualityPreset, QualityPresetId, SettingsSection } from './types';

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'best',
    label: 'Best quality (larger files)',
    crf: 18,
    help: 'Best visual quality. File size is bigger and conversion may be slower.'
  },
  {
    id: 'balanced',
    label: 'Balanced (Recommended)',
    crf: 23,
    help: 'Best choice for most users. Good quality, decent speed, reasonable file size.'
  },
  {
    id: 'small',
    label: 'Smaller files (faster)',
    crf: 28,
    help: 'Creates smaller files faster, with a small drop in visual quality.'
  },
  {
    id: 'custom',
    label: 'Custom quality',
    help: 'Use your own CRF value. Lower CRF means better quality and larger files.'
  }
];

export const SPEED_OPTIONS: SelectOption<'ultrafast' | 'veryfast' | 'fast' | 'medium' | 'slow'>[] = [
  {
    value: 'ultrafast',
    label: 'Ultra fast',
    help: 'Fastest conversion mode with noticeably larger output size.'
  },
  {
    value: 'veryfast',
    label: 'Very fast (Recommended for speed)',
    help: 'Best speed-focused mode for most systems, including low-end laptops.'
  },
  {
    value: 'fast',
    label: 'Fast',
    help: 'Finishes quickly. File size may be slightly larger.'
  },
  {
    value: 'medium',
    label: 'Medium (Recommended)',
    help: 'Balanced speed and compression efficiency for everyday use.'
  },
  {
    value: 'slow',
    label: 'Slow',
    help: 'Best compression efficiency. Conversion takes longer.'
  }
];

export const AUDIO_OPTIONS: SelectOption<string>[] = [
  { value: '96k', label: '96k (smaller size)', help: 'Good for voice-heavy recordings with smaller output size.' },
  { value: '128k', label: '128k (Recommended)', help: 'Best default for most videos. Clear audio and balanced size.' },
  { value: '160k', label: '160k', help: 'Higher clarity for music or rich audio tracks.' },
  { value: '192k', label: '192k (highest quality)', help: 'Highest audio quality. Output file may be larger.' }
];

export const TIMEOUT_OPTIONS: SelectOption<number>[] = [
  { value: 2 * 60 * 1000, label: '2 minutes (quick fail)', help: 'Stops long-running conversions quickly if something is wrong.' },
  { value: 10 * 60 * 1000, label: '10 minutes', help: 'Good for short and medium clips.' },
  { value: 30 * 60 * 1000, label: '30 minutes (Recommended)', help: 'Safe default for most recordings.' },
  { value: 60 * 60 * 1000, label: '60 minutes (large files)', help: 'Use for long recordings and high-resolution videos.' }
];

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'output', label: 'Output', caption: 'Folder and file destination' },
  { id: 'video', label: 'Video', caption: 'Quality and speed profile' },
  { id: 'audio', label: 'Audio', caption: 'Bitrate and clarity' },
  { id: 'timeout', label: 'Timeout', caption: 'Processing guardrails' },
  { id: 'workflow', label: 'Workflow', caption: 'Originals and notifications' }
];

export const inferQualityPreset = (crf: number): QualityPresetId => {
  if (crf === 18) {
    return 'best';
  }

  if (crf === 23) {
    return 'balanced';
  }

  if (crf === 28) {
    return 'small';
  }

  return 'custom';
};

export const getQualityPresetCrf = (presetId: QualityPresetId): number | undefined => {
  return QUALITY_PRESETS.find((preset) => preset.id === presetId)?.crf;
};
