import type { UiJob } from '@/state/types';
import type { JobStatus } from '@turner/contracts';
import { formatHMS, shortName } from './formatters';

type RecentProcessedTableProps = {
  jobs: UiJob[];
  title?: string;
  limit?: number;
  onOpenFile?: (outputPath: string) => void;
  onShowInFolder?: (outputPath: string) => void;
  onRenameOutputFile?: (outputPath: string) => void;
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
                  <td title={job.inputPath}>{shortName(job.inputPath)}</td>
                  <td>{formatJobDuration(job)}</td>
                  <td><StatusCell status={job.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="inline-button"
                        disabled={!job.outputPath}
                        onClick={() => {
                          if (job.outputPath) onOpenFile?.(job.outputPath);
                        }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="inline-button"
                        disabled={!job.outputPath}
                        onClick={() => {
                          if (job.outputPath) onShowInFolder?.(job.outputPath);
                        }}
                      >
                        Folder
                      </button>
                      <button
                        type="button"
                        className="inline-button"
                        disabled={!job.outputPath}
                        onClick={() => {
                          if (job.outputPath) onRenameOutputFile?.(job.outputPath);
                        }}
                      >
                        Rename
                      </button>
                    </div>
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
