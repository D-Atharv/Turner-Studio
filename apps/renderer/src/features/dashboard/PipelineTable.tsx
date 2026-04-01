import type { UiJob } from '@/state/types';
import { fileNameFromPath } from '@/features/jobs/file-paths';
import { statusLabel } from './formatters';

type PipelineTableProps = {
  jobs: UiJob[];
};

const fileExtension = (filePath: string): string => {
  const name = fileNameFromPath(filePath);
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '—' : name.slice(dot + 1).toUpperCase();
};

const formatFileSize = (bytes: number | undefined): string => {
  if (bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

type StatusCellProps = { status: UiJob['status'] };

const StatusCell = ({ status }: StatusCellProps) => (
  <span className={`table-status status-${status}`}>
    <span className="status-dot" aria-hidden="true" />
    {statusLabel(status)}
  </span>
);

export const PipelineTable = ({ jobs }: PipelineTableProps) => {
  if (jobs.length === 0) {
    return <p className="empty-inline">No jobs in pipeline.</p>;
  }

  return (
    <div className="recent-table-wrap">
      <table className="recent-table pipeline-table">
        <thead>
          <tr>
            <th scope="col">Filename</th>
            <th scope="col">Format</th>
            <th scope="col">Priority</th>
            <th scope="col">Size</th>
            <th scope="col" className="pipeline-status-col">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr key={job.jobId}>
              <td className="pipeline-filename" title={job.inputPath}>
                {fileNameFromPath(job.inputPath)}
              </td>
              <td className="pipeline-format">
                <span className="format-badge">{fileExtension(job.inputPath)}</span>
              </td>
              <td className="pipeline-priority">{index + 1}</td>
              <td className="pipeline-size">{formatFileSize(job.fileSizeBytes)}</td>
              <td className="pipeline-status-col"><StatusCell status={job.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
