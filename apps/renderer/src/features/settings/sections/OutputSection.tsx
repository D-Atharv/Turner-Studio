type OutputSectionProps = {
  outputMode: 'same' | 'custom';
  outputDir: string | undefined;
  onChangeMode: (mode: 'same' | 'custom') => void;
  onPickFolder: () => Promise<void>;
};

export const OutputSection = ({
  outputMode,
  outputDir,
  onChangeMode,
  onPickFolder
}: OutputSectionProps) => {
  return (
    <section className="settings-group settings-modal-section" id="settings-output">
      <p className="settings-section-label">Output settings</p>
      <h3>Output location</h3>

      <label className="radio-line">
        <input type="radio" name="outputMode" checked={outputMode === 'same'} onChange={() => onChangeMode('same')} />
        Save next to original file (Recommended)
      </label>

      <label className="radio-line">
        <input type="radio" name="outputMode" checked={outputMode === 'custom'} onChange={() => onChangeMode('custom')} />
        Save to a specific folder
      </label>

      {outputMode === 'custom' ? (
        <div className="folder-row">
          <button type="button" onClick={() => void onPickFolder()}>
            Browse folder
          </button>
          <code>{outputDir ?? 'No folder selected yet'}</code>
        </div>
      ) : null}

      <p className="field-help">
        {outputMode === 'same'
          ? 'Output .mp4 will be created in the same folder as your input file.'
          : 'All converted .mp4 files will be saved into the selected folder.'}
      </p>
    </section>
  );
};
