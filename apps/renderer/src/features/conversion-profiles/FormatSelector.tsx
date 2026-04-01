import type { ConversionProfileId, VideoFormatId } from '@turner/shared';
import {
  getFromFormats,
  getProfileByFormats,
  getProfileByIdOrDefault,
  getToFormats
} from '@turner/shared';

type FormatSelectorProps = {
  selectedProfileId: ConversionProfileId;
  disabled?: boolean;
  onSelect: (profileId: ConversionProfileId) => void;
};

export const FormatSelector = ({
  selectedProfileId,
  disabled = false,
  onSelect
}: FormatSelectorProps) => {
  const profile      = getProfileByIdOrDefault(selectedProfileId);
  const fromFormatId = profile.inputFormatId  as VideoFormatId;
  const toFormatId   = profile.outputFormatId as VideoFormatId;

  const fromFormats = getFromFormats();
  const toFormats   = getToFormats(fromFormatId);

  /** When the FROM format changes, keep the current TO if it's still valid; otherwise pick the first available. */
  const handleFromChange = (newFromId: string) => {
    const available = getToFormats(newFromId);
    const keepTo    = available.some((f) => f.id === toFormatId);
    const nextToId  = keepTo ? toFormatId : available[0]?.id;
    if (!nextToId) return;

    const nextProfile = getProfileByFormats(newFromId, nextToId);
    if (nextProfile) onSelect(nextProfile.id as ConversionProfileId);
  };

  const handleToChange = (newToId: string) => {
    const nextProfile = getProfileByFormats(fromFormatId, newToId);
    if (nextProfile) onSelect(nextProfile.id as ConversionProfileId);
  };

  return (
    <div className="format-selector-wrap">
      <span className="format-selector-label">Convert</span>

      {/* FROM dropdown */}
      <div className="format-selector-control">
        <select
          className="format-selector-select"
          value={fromFormatId}
          disabled={disabled}
          aria-label="Select input format"
          onChange={(e) => handleFromChange(e.target.value)}
        >
          {fromFormats.map((fmt) => (
            <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
          ))}
        </select>
        <span className="format-selector-caret" aria-hidden="true">▾</span>
      </div>

      <span className="format-selector-arrow" aria-hidden="true">→</span>

      {/* TO dropdown */}
      <div className="format-selector-control">
        <select
          className="format-selector-select"
          value={toFormatId}
          disabled={disabled}
          aria-label="Select output format"
          onChange={(e) => handleToChange(e.target.value)}
        >
          {toFormats.map((fmt) => (
            <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
          ))}
        </select>
        <span className="format-selector-caret" aria-hidden="true">▾</span>
      </div>

      {/* Codec hint — always in sync with the selected profile */}
      <span className="format-selector-hint">{profile.description}</span>
    </div>
  );
};
