import type { UiJob } from '@/state/types';
import { deriveLiveEtaSeconds } from './eta';
import {
  formatElapsed,
  formatFps,
  formatPercent,
  formatRemaining,
  formatSpeedMultiplier,
  shortName,
  statusLabel
} from './formatters';

type ActiveProcessPanelProps = {
  job: UiJob | undefined;
  notifyOnCompletion: boolean;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
};

type MetricCellProps = { label: string; value: string };

const MetricCell = ({ label, value }: MetricCellProps) => (
  <div className="active-metric-cell">
    <span className="active-metric-label">{label}</span>
    <span className="active-metric-value">{value}</span>
  </div>
);

export const ActiveProcessPanel = ({
  job,
  notifyOnCompletion,
  onCancel,
  onOpenFile,
  onShowInFolder
}: ActiveProcessPanelProps) => {
  if (!job) {
    return (
      <section className="active-process panel-fade-in">
        <h2>Active Process</h2>
        <p className="empty-inline">No active conversion. Add files to begin.</p>
      </section>
    );
  }

  const canCancel  = job.status === 'waiting' || job.status === 'converting';
  const canOpen    = job.status === 'done' && Boolean(job.outputPath);
  const isRunning  = job.status === 'converting';
  const etaSeconds = deriveLiveEtaSeconds(job);
  const now        = Date.now();

  return (
    <section className="active-process panel-fade-in">
      <h2>Active Process</h2>

      <article className={`active-job status-${job.status}`}>
        {/* ── Header: filename + status badge + cancel ── */}
        <div className="active-row">
          <div className="active-file-info">
            <strong title={job.inputPath}>{shortName(job.inputPath)}</strong>
            <span className="active-file-meta">Output: MP4 · H.264 / AAC</span>
          </div>
          <div className="active-row-end">
            <span className="active-status-badge">{statusLabel(job.status)}</span>
            {canCancel ? (
              <button
                type="button"
                className="icon-button cancel-btn"
                onClick={() => onCancel(job.jobId)}
              >
                Cancel
              </button>
            ) : null}
            {canOpen && job.outputPath ? (
              <>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onOpenFile(job.outputPath ?? '')}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onShowInFolder(job.outputPath ?? '')}
                >
                  Folder
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* ── Progress: percent label + bar ── */}
        <div className="active-progress-header">
          <span className="active-meta-pill">
            {`Progress: ${formatPercent(job.progressPercent)}`}
          </span>
          {isRunning ? (
            <span className="active-meta-pill">
              {`${formatSpeedMultiplier(job.speedMultiplier)} (${formatFps(job.fps)})`}
            </span>
          ) : null}
        </div>

        <div
          className="active-progress-wrap"
          role="progressbar"
          aria-valuenow={job.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Conversion progress ${job.progressPercent}%`}
        >
          <div
            className="active-progress"
            style={{ width: `${job.progressPercent}%` }}
          />
        </div>

        {/* ── 3-column metrics grid ── */}
        <div className="active-metrics-grid">
          <MetricCell
            label="Elapsed"
            value={formatElapsed(job.startedAt, now)}
          />
          <MetricCell
            label="Remaining"
            value={formatRemaining(etaSeconds)}
          />
          <MetricCell
            label="Speed"
            value={
              isRunning
                ? `${formatSpeedMultiplier(job.speedMultiplier)} · ${formatFps(job.fps)}`
                : '—'
            }
          />
        </div>

        {/* ── Notification hint ── */}
        {isRunning && notifyOnCompletion ? (
          <p className="job-note">
            Desktop notification will appear when this conversion completes.
          </p>
        ) : null}

        {/* ── Error ── */}
        {job.error ? <p className="job-error">{job.error.message}</p> : null}
      </article>
    </section>
  );
};
