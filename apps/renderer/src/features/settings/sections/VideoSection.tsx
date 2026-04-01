import type { AppSettings } from '@turner/contracts';
import { QUALITY_PRESETS, SPEED_OPTIONS } from '../constants';
import type { QualityPresetId } from '../types';

type VideoSectionProps = {
  qualityPreset: QualityPresetId;
  crf: number;
  preset: AppSettings['preset'];
  selectedQualityHelp: string;
  selectedSpeedHelp: string;
  onQualityPresetChange: (value: QualityPresetId) => void;
  onCrfChange: (value: number) => void;
  onPresetChange: (value: AppSettings['preset']) => void;
};

export const VideoSection = ({
  qualityPreset,
  crf,
  preset,
  selectedQualityHelp,
  selectedSpeedHelp,
  onQualityPresetChange,
  onCrfChange,
  onPresetChange
}: VideoSectionProps) => {
  return (
    <section className="settings-group settings-modal-section" id="settings-video">
      <p className="settings-section-label">Video processing</p>
      <h3>Video quality</h3>

      <label>
        Quality profile
        <select value={qualityPreset} onChange={(event) => onQualityPresetChange(event.target.value as QualityPresetId)}>
          {QUALITY_PRESETS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {qualityPreset === 'custom' ? (
        <label>
          Custom CRF ({crf})
          <input type="range" min={1} max={40} value={crf} onChange={(event) => onCrfChange(Number(event.target.value))} />
        </label>
      ) : null}

      <p className="field-help">{selectedQualityHelp}</p>

      <h3>Conversion speed</h3>
      <label>
        Speed mode
        <select value={preset} onChange={(event) => onPresetChange(event.target.value as AppSettings['preset'])}>
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="field-help">{selectedSpeedHelp}</p>
      <p className="field-help">
        Speed changes apply to new files you add after saving settings. Ongoing conversions keep their current profile.
      </p>
    </section>
  );
};
