import { useMemo, useState } from 'react';
import { appSettingsPatchSchema, type AppSettings } from '@turner/contracts';
import { DEFAULT_SETTINGS } from '@/state/types';
import { getQualityPresetCrf, inferQualityPreset } from './constants';
import { getAudioHelp, getQualityHelp, getSpeedHelp, getTimeoutHelp } from './help';
import { SectionNav } from './SectionNav';
import { SectionTabs } from './SectionTabs';
import { AudioSection } from './sections/AudioSection';
import { OutputSection } from './sections/OutputSection';
import { TimeoutSection } from './sections/TimeoutSection';
import { VideoSection } from './sections/VideoSection';
import { WorkflowSection } from './sections/WorkflowSection';
import type { QualityPresetId, SettingsPanelProps, SettingsSectionId } from './types';
import { useSectionTracker } from './useSectionTracker';

const RECOMMENDED: Partial<AppSettings> = {
  crf: 23,
  preset: 'medium',
  audioBitrate: '128k',
  timeoutMs: 30 * 60 * 1000,
  keepOriginal: true,
  notifyOnCompletion: true,
  outputDir: undefined
};

export const SettingsPanel = ({ initialSettings, onSave, onClose, onPickOutputFolder, isWorkspace = false }: SettingsPanelProps) => {
  const [draft, setDraft] = useState<AppSettings>(initialSettings);
  const [qualityPreset, setQualityPreset] = useState<QualityPresetId>(inferQualityPreset(initialSettings.crf));
  const [outputMode, setOutputMode] = useState<'same' | 'custom'>(initialSettings.outputDir ? 'custom' : 'same');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [recommendedApplied, setRecommendedApplied] = useState(false);

  const { activeSection, selectSection } = useSectionTracker();
  const selectedQualityHelp = useMemo(() => getQualityHelp(qualityPreset, draft.crf), [qualityPreset, draft.crf]);
  const selectedSpeedHelp = useMemo(() => getSpeedHelp(draft.preset), [draft.preset]);
  const selectedAudioHelp = useMemo(() => getAudioHelp(draft.audioBitrate), [draft.audioBitrate]);
  const selectedTimeoutHelp = useMemo(() => getTimeoutHelp(draft.timeoutMs), [draft.timeoutMs]);

  const applyRecommended = () => {
    setDraft((current) => ({ ...current, ...RECOMMENDED }));
    setQualityPreset('balanced');
    setOutputMode('same');
    setErrorMessage(undefined);
    setRecommendedApplied(true);
  };

  const handleSave = async () => {
    if (outputMode === 'custom' && !draft.outputDir) {
      setErrorMessage('Please choose an output folder or switch back to same-as-source.');
      return;
    }

    const parsed = appSettingsPatchSchema.safeParse({
      outputDir: outputMode === 'custom' ? draft.outputDir : undefined,
      crf: draft.crf,
      preset: draft.preset,
      audioBitrate: draft.audioBitrate,
      keepOriginal: draft.keepOriginal,
      notifyOnCompletion: draft.notifyOnCompletion,
      timeoutMs: draft.timeoutMs
    });

    if (!parsed.success) {
      setErrorMessage('Please correct the settings values before saving.');
      return;
    }

    setErrorMessage(undefined);
    setIsSaving(true);

    try {
      await onSave({ ...draft, outputDir: outputMode === 'custom' ? draft.outputDir : undefined });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (id: SettingsSectionId) => {
    switch (id) {
      case 'output':
        return (
          <OutputSection
            outputMode={outputMode}
            outputDir={draft.outputDir}
            onChangeMode={(mode) => {
              setOutputMode(mode);
              if (mode === 'same') setDraft((c) => ({ ...c, outputDir: undefined }));
            }}
            onPickFolder={async () => {
              const picked = await onPickOutputFolder();
              if (picked) setDraft((c) => ({ ...c, outputDir: picked }));
            }}
          />
        );
      case 'video':
        return (
          <VideoSection
            qualityPreset={qualityPreset}
            crf={draft.crf}
            preset={draft.preset}
            selectedQualityHelp={selectedQualityHelp}
            selectedSpeedHelp={selectedSpeedHelp}
            onQualityPresetChange={(id) => {
              setQualityPreset(id);
              const nextCrf = getQualityPresetCrf(id);
              if (nextCrf !== undefined) setDraft((c) => ({ ...c, crf: nextCrf }));
            }}
            onCrfChange={(v) => setDraft((c) => ({ ...c, crf: v }))}
            onPresetChange={(v) => setDraft((c) => ({ ...c, preset: v }))}
          />
        );
      case 'audio':
        return (
          <AudioSection
            audioBitrate={draft.audioBitrate}
            selectedAudioHelp={selectedAudioHelp}
            onAudioBitrateChange={(v) => setDraft((c) => ({ ...c, audioBitrate: v }))}
          />
        );
      case 'timeout':
        return (
          <TimeoutSection
            timeoutMs={draft.timeoutMs}
            selectedTimeoutHelp={selectedTimeoutHelp}
            onTimeoutChange={(v) => setDraft((c) => ({ ...c, timeoutMs: v }))}
          />
        );
      case 'workflow':
        return (
          <WorkflowSection
            keepOriginal={draft.keepOriginal}
            notifyOnCompletion={draft.notifyOnCompletion}
            onKeepOriginalChange={(v) => setDraft((c) => ({ ...c, keepOriginal: v }))}
            onNotifyChange={(v) => setDraft((c) => ({ ...c, notifyOnCompletion: v }))}
          />
        );
    }
  };

  return (
    <aside
      className={`settings-panel settings-modal-shell panel-fade-in${isWorkspace ? ' is-workspace' : ''}`}
      role={isWorkspace ? undefined : 'dialog'}
      aria-modal={isWorkspace ? undefined : true}
    >
      <header className="settings-modal-header">
        {isWorkspace ? (
          <>
            <SectionTabs activeSection={activeSection} onSelect={selectSection} />
            <div className="settings-header-actions">
              <button
                type="button"
                className={`settings-recommended-button ${recommendedApplied ? 'is-applied' : ''}`}
                onClick={applyRecommended}
                aria-pressed={recommendedApplied}
              >
                {recommendedApplied ? 'Recommended Applied' : 'Apply Recommended'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2>System Preferences</h2>
              <p>Configure Turner engine behavior with easy, production-safe controls.</p>
            </div>
            <div className="settings-header-actions">
              <button
                type="button"
                className={`settings-recommended-button ${recommendedApplied ? 'is-applied' : ''}`}
                onClick={applyRecommended}
                aria-pressed={recommendedApplied}
              >
                {recommendedApplied ? 'Recommended Applied' : 'Apply Recommended'}
              </button>
              <button type="button" className="settings-close-button" onClick={onClose} aria-label="Close settings">
                ×
              </button>
            </div>
          </>
        )}
      </header>

      <div className="settings-modal-body">
        {isWorkspace
          ? null
          : <SectionNav activeSection={activeSection} onSelect={selectSection} />
        }

        <div className="settings-modal-content" aria-live="polite">
          {renderSection(activeSection)}
          {errorMessage ? <p className="panel-error">{errorMessage}</p> : null}
        </div>
      </div>

      <footer className="settings-modal-footer">
        <button
          type="button"
          className="settings-reset-button"
          onClick={() => {
            setDraft(DEFAULT_SETTINGS);
            setQualityPreset(inferQualityPreset(DEFAULT_SETTINGS.crf));
            setOutputMode(DEFAULT_SETTINGS.outputDir ? 'custom' : 'same');
            setErrorMessage(undefined);
            setRecommendedApplied(false);
          }}
        >
          Reset to defaults
        </button>
        <div className="settings-footer-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-button" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </footer>
    </aside>
  );
};
