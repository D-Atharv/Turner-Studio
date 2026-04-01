import type { UiJob } from '@/state/types';
import { fileNameFromPath } from './file-paths';

type JobCardProps = {
  job: UiJob;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
};

export const JobCard = ({ job, onCancel, onOpenFile, onShowInFolder }: JobCardProps) => {
  const canCancel = job.status === 'waiting' || job.status === 'converting';
  const canOpen = job.status === 'done' && Boolean(job.outputPath);

  return (
    <article className={`job-card status-${job.status}`}>
      <div className="job-row">
        <h3>{fileNameFromPath(job.inputPath)}</h3>
        <span className="job-status">{job.status}</span>
      </div>

      <div className="job-progress-wrap" aria-label={`Progress ${job.progressPercent}%`}>
        <div className="job-progress" style={{ width: `${job.progressPercent}%` }} />
      </div>

      <div className="job-row">
        <small>{job.progressPercent}%</small>
        <div className="job-actions">
          {canCancel ? <button onClick={() => onCancel(job.jobId)}>Cancel</button> : null}
          {canOpen && job.outputPath ? (
            <>
              <button onClick={() => onOpenFile(job.outputPath ?? '')}>Open file</button>
              <button onClick={() => onShowInFolder(job.outputPath ?? '')}>Show in folder</button>
            </>
          ) : null}
        </div>
      </div>

      {job.error ? <p className="job-error">{job.error.message}</p> : null}
    </article>
  );
};
