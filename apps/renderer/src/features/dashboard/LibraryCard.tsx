import { useRef, useState } from 'react';
import type { UiJob } from '@/state/types';
import { fileExtLabel, fileNameFromPath } from '@/features/jobs/file-paths';
import { formatHMS } from './formatters';

type LibraryCardProps = {
  job: UiJob;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string, nextName: string) => void;
};

const formatTimestamp = (ms: number | undefined): string => {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const getJobDuration = (job: UiJob): string => {
  if (typeof job.startedAt === 'number' && typeof job.endedAt === 'number') {
    return formatHMS(Math.max(0, Math.round((job.endedAt - job.startedAt) / 1000)));
  }
  return '—';
};

/** Derive the base name (no extension) from the current output path or input path. */
const deriveBaseName = (job: UiJob): string => {
  const source = job.outputPath ?? job.inputPath;
  const name = fileNameFromPath(source);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

export const LibraryCard = ({ job, onOpenFile, onShowInFolder, onRenameOutputFile }: LibraryCardProps) => {
  const [isEditing, setIsEditing]     = useState(false);
  const [draft, setDraft]             = useState('');
  const inputRef                      = useRef<HTMLInputElement>(null);

  const filename    = fileNameFromPath(job.inputPath);
  const inputFormat = fileExtLabel(job.inputPath);
  const isDone      = job.status === 'done';
  const isFailed    = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const canAct      = isDone && Boolean(job.outputPath);

  const startEditing = () => {
    if (!canAct) return;
    setDraft(deriveBaseName(job));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && job.outputPath) {
      onRenameOutputFile(job.outputPath, trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => setIsEditing(false);

  return (
    <article className={`library-card lc-status-${job.status}`}>
      {/* ── Preview ── */}
      <div className="library-card-preview">
        <div className="lc-badges">
          <span className="lc-badge">{inputFormat}</span>
          {isDone ? <span className="lc-badge lc-badge--mp4">MP4</span> : null}
        </div>
        {isFailed    ? <span className="lc-overlay-badge lc-overlay-badge--failed">FAILED</span>    : null}
        {isCancelled ? <span className="lc-overlay-badge lc-overlay-badge--cancelled">CANCELLED</span> : null}
        <div className="lc-preview-icon" aria-hidden="true">
          {isFailed ? '⚠' : isCancelled ? '◎' : '▶'}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="library-card-body">
        <h3 className="lc-title" title={job.inputPath}>{filename}</h3>
        <p className="lc-date">{formatTimestamp(job.endedAt ?? job.startedAt)}</p>

        <div className="lc-stats">
          <div className="lc-stat">
            <span className="lc-stat-label">Duration</span>
            <span className="lc-stat-value">{getJobDuration(job)}</span>
          </div>
          <div className="lc-stat">
            <span className="lc-stat-label">Size</span>
            <span className="lc-stat-value">—</span>
          </div>
        </div>

        {isFailed && job.error ? (
          <p className="lc-error-msg">{job.error.message}</p>
        ) : null}

        {/* Inline rename input */}
        {isEditing ? (
          <div className="lc-rename-row">
            <input
              ref={inputRef}
              className="queue-item-name-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancel(); }
              }}
              autoFocus
              aria-label="New file name"
            />
          </div>
        ) : null}

        <div className="lc-footer">
          <span className={`lc-status-chip lc-status-chip--${job.status}`}>
            {isDone ? '✓ Success' : isFailed ? '✕ Failed' : '◎ Cancelled'}
          </span>
          {!isEditing ? (
            <div className="lc-actions">
              <button
                type="button"
                className="icon-button"
                title="Show in Folder"
                disabled={!canAct}
                onClick={() => { if (job.outputPath) onShowInFolder(job.outputPath); }}
              >
                ⊡
              </button>
              <button
                type="button"
                className="icon-button"
                title="Open File"
                disabled={!canAct}
                onClick={() => { if (job.outputPath) onOpenFile(job.outputPath); }}
              >
                ▷
              </button>
              <button
                type="button"
                className="icon-button"
                title="Rename File"
                disabled={!canAct}
                onClick={startEditing}
              >
                ✎
              </button>
            </div>
          ) : (
            <div className="lc-actions">
              <button type="button" className="icon-button" onClick={commit} title="Save rename">✓</button>
              <button type="button" className="icon-button" onClick={cancel} title="Cancel rename">✕</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
