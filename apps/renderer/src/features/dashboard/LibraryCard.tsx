import type { UiJob } from '@/state/types';
import { fileNameFromPath } from '@/features/jobs/file-paths';
import { formatHMS } from './formatters';

type LibraryCardProps = {
  job: UiJob;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
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

export const LibraryCard = ({ job, onOpenFile, onShowInFolder, onRenameOutputFile }: LibraryCardProps) => {
  const filename = fileNameFromPath(job.inputPath);
  const isDone      = job.status === 'done';
  const isFailed    = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';

  return (
    <article className={`library-card lc-status-${job.status}`}>
      {/* ── Preview ── */}
      <div className="library-card-preview">
        <div className="lc-badges">
          <span className="lc-badge">WEBM</span>
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

        <div className="lc-footer">
          <span className={`lc-status-chip lc-status-chip--${job.status}`}>
            {isDone ? '✓ Success' : isFailed ? '✕ Failed' : '◎ Cancelled'}
          </span>
          <div className="lc-actions">
            <button
              type="button"
              className="icon-button"
              title="Show in Folder"
              disabled={!job.outputPath}
              onClick={() => { if (job.outputPath) onShowInFolder(job.outputPath); }}
            >
              ⊡
            </button>
            <button
              type="button"
              className="icon-button"
              title="Open File"
              disabled={!job.outputPath}
              onClick={() => { if (job.outputPath) onOpenFile(job.outputPath); }}
            >
              ▷
            </button>
            <button
              type="button"
              className="icon-button"
              title="Rename File"
              disabled={!job.outputPath}
              onClick={() => { if (job.outputPath) onRenameOutputFile(job.outputPath); }}
            >
              ✎
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
