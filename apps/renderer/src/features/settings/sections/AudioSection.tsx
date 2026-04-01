import { AUDIO_OPTIONS } from '../constants';

type AudioSectionProps = {
  audioBitrate: string;
  selectedAudioHelp: string;
  onAudioBitrateChange: (value: string) => void;
};

export const AudioSection = ({
  audioBitrate,
  selectedAudioHelp,
  onAudioBitrateChange
}: AudioSectionProps) => {
  return (
    <section className="settings-group settings-modal-section" id="settings-audio">
      <p className="settings-section-label">Audio processing</p>
      <h3>Audio quality</h3>

      <label>
        Audio bitrate
        <select value={audioBitrate} onChange={(event) => onAudioBitrateChange(event.target.value)}>
          {AUDIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="field-help">{selectedAudioHelp}</p>
    </section>
  );
};
