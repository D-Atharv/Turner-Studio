import type { AppSettings, AppSettingsPatch, ConvertOptions } from '@turner/contracts';

export const mergeSettingsWithOverrides = (
  currentSettings: AppSettings,
  patch?: AppSettingsPatch
): Partial<ConvertOptions> => {
  const merged: Partial<ConvertOptions> = {
    crf: patch?.crf ?? currentSettings.crf,
    preset: patch?.preset ?? currentSettings.preset,
    audioBitrate: patch?.audioBitrate ?? currentSettings.audioBitrate,
    keepOriginal: patch?.keepOriginal ?? currentSettings.keepOriginal,
    timeoutMs: patch?.timeoutMs ?? currentSettings.timeoutMs
  };

  if (patch?.outputDir !== undefined) merged.outputDir = patch.outputDir;
  else if (currentSettings.outputDir !== undefined) merged.outputDir = currentSettings.outputDir;

  return merged;
};
