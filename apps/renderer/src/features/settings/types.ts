import type { AppSettings } from '@turner/contracts';

export type SettingsPanelProps = {
  initialSettings: AppSettings;
  onSave: (nextSettings: AppSettings) => Promise<void>;
  onClose: () => void;
  onPickOutputFolder: () => Promise<string | null>;
  /** When true, panel fills the workspace view instead of rendering as a modal card. */
  isWorkspace?: boolean;
};

export type QualityPresetId = 'best' | 'balanced' | 'small' | 'custom';
export type SettingsSectionId = 'output' | 'video' | 'audio' | 'timeout' | 'workflow';

export type QualityPreset = {
  id: QualityPresetId;
  label: string;
  crf?: number;
  help: string;
};

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  help: string;
};

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  caption: string;
};
