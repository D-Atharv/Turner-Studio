import { useRef, useState } from 'react';
import type { UiJob } from '@/state/types';
import type { JobStatus } from '@turner/contracts';
import { fileNameFromPath } from '@/features/jobs/file-paths';
import { formatHMS, shortName } from './formatters';

type RecentProcessedTableProps = {
  jobs: UiJob[];
  title?: string;
  limit?: number;
  onOpenFile?: (outputPath: string) => void;
  onShowInFolder?: (outputPath: string) => void;
  onRenameOutputFile?: (outputPath: string, nextName: string) => void;
};

const STATUS_LABELS: Record<JobStatus, string> = {
  waiting:    'Waiting',
  converting: 'Converting',
  done:       'Success',
  failed:     'Failed',
  cancelled:  'Cancelled'
};

type StatusCellProps = { status: JobStatus };

const StatusCell = ({ status }: StatusCellProps) => (
  <span className={`table-status status-${status}`}>
    <span className="status-dot" aria-hidden="true" />
    {STATUS_LABELS[status]}
  </span>
);

const formatJobDuration = (job: UiJob): string => {
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

type RowActionsProps = {
  job: UiJob;
  onOpenFile: ((outputPath: string) => void) | undefined;
  onShowInFolder: ((outputPath: string) => void) | undefined;
  onRenameOutputFile: ((outputPath: string, nextName: string) => void) | undefined;
};

const RowActions = ({ job, onOpenFile, onShowInFolder, onRenameOutputFile }: RowActionsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const canAct = Boolean(job.outputPath);

  const startEditing = () => {
    if (!canAct || !onRenameOutputFile) return;
    setDraft(deriveBaseName(job));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && job.outputPath && onRenameOutputFile) {
      onRenameOutputFile(job.outputPath, trimmed);
    }
    setIsEditing(false);
  };

  const cancel = () => setIsEditing(false);

  if (isEditing) {
    return (
      <div className="row-actions row-actions--editing">
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
        <button type="button" className="inline-button" onClick={commit}>Save</button>
        <button type="button" className="inline-button" onClick={cancel}>✕</button>
      </div>
    );
  }

  return (
    <div className="row-actions">
      <button
        type="button"
        className="inline-button"
        disabled={!canAct}
        onClick={() => { if (job.outputPath) onOpenFile?.(job.outputPath); }}
      >
        Open
      </button>
      <button
        type="button"
        className="inline-button"
        disabled={!canAct}
        onClick={() => { if (job.outputPath) onShowInFolder?.(job.outputPath); }}
      >
        Folder
      </button>
      <button
        type="button"
        className="inline-button"
        disabled={!canAct || !onRenameOutputFile}
        onClick={startEditing}
      >
        Rename
      </button>
    </div>
  );
};

export const RecentProcessedTable = ({
  jobs,
  title = 'Recently Processed',
  limit = 8,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile
}: RecentProcessedTableProps) => {
  const visibleJobs = jobs.slice(0, limit);

  return (
    <section className="recent-panel panel-fade-in">
      <h2>{title}</h2>

      {jobs.length === 0 ? (
        <p className="empty-inline">Your successful conversions will appear here.</p>
      ) : (
        <div className="recent-table-wrap">
          <table className="recent-table">
            <thead>
              <tr>
                <th scope="col">File name</th>
                <th scope="col">Duration</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => (
                <tr key={job.jobId}>
                  <td title={job.outputPath ?? job.inputPath}>
                    {shortName(job.outputPath ?? job.inputPath)}
                  </td>
                  <td>{formatJobDuration(job)}</td>
                  <td><StatusCell status={job.status} /></td>
                  <td>
                    <RowActions
                      job={job}
                      onOpenFile={onOpenFile}
                      onShowInFolder={onShowInFolder}
                      onRenameOutputFile={onRenameOutputFile}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
