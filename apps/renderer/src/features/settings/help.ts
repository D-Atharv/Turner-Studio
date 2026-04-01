import { AUDIO_OPTIONS, QUALITY_PRESETS, SPEED_OPTIONS, TIMEOUT_OPTIONS } from './constants';
import type { QualityPresetId } from './types';

export const getQualityHelp = (qualityPreset: QualityPresetId, crf: number): string => {
  const selected = QUALITY_PRESETS.find((preset) => preset.id === qualityPreset);
  if (!selected) {
    return 'Choose the video quality profile.';
  }

  if (selected.id === 'custom') {
    return `${selected.help} Current CRF: ${crf}.`;
  }

  return selected.help;
};

export const getSpeedHelp = (preset: string): string => {
  return (
    SPEED_OPTIONS.find((option) => option.value === preset)?.help ??
    'Controls conversion speed and output compression efficiency.'
  );
};

export const getAudioHelp = (audioBitrate: string): string => {
  return AUDIO_OPTIONS.find((option) => option.value === audioBitrate)?.help ?? 'Custom audio bitrate selected.';
};

export const getTimeoutHelp = (timeoutMs: number): string => {
  return TIMEOUT_OPTIONS.find((option) => option.value === timeoutMs)?.help ?? 'Custom timeout selected.';
};
