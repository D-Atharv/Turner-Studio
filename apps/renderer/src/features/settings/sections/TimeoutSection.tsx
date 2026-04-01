import { TIMEOUT_OPTIONS } from '../constants';

type TimeoutSectionProps = {
  timeoutMs: number;
  selectedTimeoutHelp: string;
  onTimeoutChange: (value: number) => void;
};

export const TimeoutSection = ({
  timeoutMs,
  selectedTimeoutHelp,
  onTimeoutChange
}: TimeoutSectionProps) => {
  return (
    <section className="settings-group settings-modal-section" id="settings-timeout">
      <p className="settings-section-label">Process control</p>
      <h3>Timeout</h3>

      <label>
        Maximum time per video
        <select value={String(timeoutMs)} onChange={(event) => onTimeoutChange(Number(event.target.value))}>
          {TIMEOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="field-help">{selectedTimeoutHelp}</p>
    </section>
  );
};
