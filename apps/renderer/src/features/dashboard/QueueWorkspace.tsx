import type { UiJob } from '@/state/types';
import { formatPercent, shortName, statusLabel } from './formatters';
import { PipelineTable } from './PipelineTable';
import type { SessionStats } from './selectors';

type QueueWorkspaceProps = {
  jobs: UiJob[];
  sessionStats: SessionStats;
  activeJob: UiJob | undefined;
  notifyOnCompletion: boolean;
  onBrowse: () => void;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
};

type StatCardProps = {
  label: string;
  value: number;
  accent?: 'primary' | 'ok' | 'error';
};

const StatCard = ({ label, value, accent = 'primary' }: StatCardProps) => (
  <div className={`queue-stat-card queue-stat-card--${accent}`}>
    <span className="queue-stat-value">{value}</span>
    <span className="queue-stat-label">{label}</span>
  </div>
);

type ActiveCardProps = {
  job: UiJob;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
};

const ActiveCard = ({ job, onCancel, onOpenFile, onShowInFolder, onRenameOutputFile }: ActiveCardProps) => {
  const canCancel = job.status === 'waiting' || job.status === 'converting';
  const canOpen   = job.status === 'done' && Boolean(job.outputPath);

  return (
    <article className={`active-job status-${job.status}`}>
      <div className="active-row">
        <strong title={job.inputPath}>{shortName(job.inputPath)}</strong>
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
              <button
                type="button"
                className="icon-button"
                onClick={() => onRenameOutputFile(job.outputPath ?? '')}
              >
                Rename
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className="active-progress-wrap"
        role="progressbar"
        aria-valuenow={job.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Conversion progress ${job.progressPercent}%`}
      >
        <div className="active-progress" style={{ width: `${job.progressPercent}%` }} />
      </div>

      <span className="active-meta-pill">{formatPercent(job.progressPercent)}</span>

      {job.error ? <p className="job-error">{job.error.message}</p> : null}
    </article>
  );
};

export const QueueWorkspace = ({
  jobs,
  sessionStats,
  activeJob,
  onCancel,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile
}: QueueWorkspaceProps) => {
  const activeJobs = jobs.filter((j) => j.status === 'converting' || j.status === 'waiting').slice(0, 2);

  return (
    <section className="workspace-stack">
      <div className="queue-stats-row">
        <StatCard label="Total Jobs"  value={sessionStats.total} />
        <StatCard label="Converting"  value={sessionStats.converting} accent="primary" />
        <StatCard label="Completed"   value={sessionStats.successful} accent="ok" />
        <StatCard label="Failed"      value={sessionStats.failed}     accent="error" />
      </div>

      {activeJobs.length > 0 ? (
        <div className="queue-active-grid">
          {activeJobs.map((job) => (
            <ActiveCard
              key={job.jobId}
              job={job}
              onCancel={onCancel}
              onOpenFile={onOpenFile}
              onShowInFolder={onShowInFolder}
              onRenameOutputFile={onRenameOutputFile}
            />
          ))}
        </div>
      ) : activeJob ? (
        <div className="queue-active-grid">
          <ActiveCard
            job={activeJob}
            onCancel={onCancel}
            onOpenFile={onOpenFile}
            onShowInFolder={onShowInFolder}
            onRenameOutputFile={onRenameOutputFile}
          />
        </div>
      ) : null}

      <section className="queue-panel panel-fade-in">
        <h2>Pipeline</h2>
        <PipelineTable jobs={jobs} />
      </section>
    </section>
  );
};
