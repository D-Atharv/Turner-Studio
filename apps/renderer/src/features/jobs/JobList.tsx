import type { UiJob } from '@/state/types';
import { JobCard } from './JobCard';

type JobListProps = {
  jobs: UiJob[];
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
};

export const JobList = ({ jobs, onCancel, onOpenFile, onShowInFolder }: JobListProps) => {
  if (jobs.length === 0) {
    return <p className="empty-state">No jobs yet. Add a .webm file to start converting.</p>;
  }

  return (
    <section className="job-list">
      {jobs.map((job) => (
        <JobCard
          key={job.jobId}
          job={job}
          onCancel={onCancel}
          onOpenFile={onOpenFile}
          onShowInFolder={onShowInFolder}
        />
      ))}
    </section>
  );
};
