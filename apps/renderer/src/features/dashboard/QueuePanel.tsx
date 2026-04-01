import { useRef, useState } from 'react';
import type { UiJob } from '@/state/types';
import { fileNameFromPath } from '@/features/jobs/file-paths';
import { deriveLiveEtaSeconds } from './eta';
import { formatEta } from './formatters';

type QueuePanelProps = {
  jobs: UiJob[];
  title?: string;
  limit?: number;
  onSetPreferredName?: (jobId: string, name: string) => void;
};

/** Strip last extension (e.g. "clip.webm" → "clip"). */
const baseName = (filePath: string): string => {
  const name = fileNameFromPath(filePath);
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.slice(0, dotIndex) : name;
};

const queueItemStatusText = (job: UiJob): string => {
  if (job.status === 'converting') {
    const eta = deriveLiveEtaSeconds(job);
    return eta !== undefined ? `Converting · ETA ${formatEta(eta)}` : 'Converting';
  }
  if (job.status === 'waiting')   return 'Waiting';
  if (job.status === 'done')      return 'Done';
  if (job.status === 'failed')    return 'Failed';
  if (job.status === 'cancelled') return 'Cancelled';
  return job.status;
};

type QueueItemProps = {
  job: UiJob;
  onSetPreferredName: ((jobId: string, name: string) => void) | undefined;
};

const QueueItem = ({ job, onSetPreferredName }: QueueItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = job.preferredOutputName ?? baseName(job.inputPath);
  const isWaiting = job.status === 'waiting';

  const startEditing = () => {
    if (!isWaiting || !onSetPreferredName) return;
    setDraft(displayName);
    setIsEditing(true);
    // Focus on next tick after render
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    if (!onSetPreferredName) return;
    onSetPreferredName(job.jobId, draft);
    setIsEditing(false);
  };

  const cancel = () => {
    setIsEditing(false);
  };

  return (
    <li className={`queue-item status-${job.status}`}>
      <span className="queue-item-name" title={job.inputPath}>
        {isEditing ? (
          <input
            ref={inputRef}
            className="queue-item-name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            }}
            autoFocus
          />
        ) : (
          <span className="queue-item-name-text">{displayName}</span>
        )}
      </span>

      {isWaiting && onSetPreferredName && !isEditing ? (
        <button
          type="button"
          className="queue-item-edit-btn"
          title="Set output name"
          onClick={startEditing}
        >
          Rename
        </button>
      ) : null}

      {!isEditing ? (
        <span className="queue-item-status">
          {queueItemStatusText(job)}
        </span>
      ) : null}
    </li>
  );
};

export const QueuePanel = ({
  jobs,
  title = 'Queue',
  limit = 10,
  onSetPreferredName
}: QueuePanelProps) => {
  const visibleJobs = jobs.slice(0, limit);
  const hiddenCount = jobs.length - visibleJobs.length;

  return (
    <section className="queue-panel panel-fade-in">
      <h2>{title}</h2>

      {jobs.length === 0 ? (
        <p className="empty-inline">No jobs in queue.</p>
      ) : (
        <ul role="list">
          {visibleJobs.map((job) => (
            <QueueItem
              key={job.jobId}
              job={job}
              onSetPreferredName={onSetPreferredName}
            />
          ))}

          {hiddenCount > 0 ? (
            <li className="queue-item">
              <span className="queue-item-name" style={{ color: 'var(--text-dim)' }}>
                +{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}…
              </span>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
};
