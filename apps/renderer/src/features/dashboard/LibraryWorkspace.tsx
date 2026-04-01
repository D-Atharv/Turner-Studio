import { useState } from 'react';
import type { UiJob } from '@/state/types';
import { LibraryCard } from './LibraryCard';

type StatusFilter = 'all' | 'done' | 'failed' | 'cancelled';

type LibraryWorkspaceProps = {
  completedJobs: UiJob[];
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
};

const FILTER_LABELS: Record<StatusFilter, string> = {
  all:    'All',
  done:   'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export const LibraryWorkspace = ({
  completedJobs,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile
}: LibraryWorkspaceProps) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = statusFilter === 'all'
    ? completedJobs
    : completedJobs.filter((j) => j.status === statusFilter);

  const doneCount   = completedJobs.filter((j) => j.status === 'done').length;
  const failedCount = completedJobs.filter((j) => j.status === 'failed').length;
  const cancelledCount = completedJobs.filter((j) => j.status === 'cancelled').length;

  return (
    <section className="workspace-stack">
      {/* ── Toolbar: filters + stats ── */}
      <div className="library-toolbar">
        <div className="library-filter-group">
          <span className="library-filter-group-label">Status</span>
          {(['all', 'done', 'failed', 'cancelled'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`library-filter-chip${statusFilter === f ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="library-summary">
          <div className="library-summary-stat">
            <span className="library-summary-label">Total assets</span>
            <span className="library-summary-value">{completedJobs.length.toLocaleString()}</span>
          </div>
          <div className="library-summary-stat">
            <span className="library-summary-label">Completed</span>
            <span className="library-summary-value library-summary-value--ok">{doneCount}</span>
          </div>
          <div className="library-summary-stat">
            <span className="library-summary-label">Failed</span>
            <span className="library-summary-value library-summary-value--error">{failedCount}</span>
          </div>
          <div className="library-summary-stat">
            <span className="library-summary-label">Cancelled</span>
            <span className="library-summary-value library-summary-value--cancelled">{cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* ── Card grid ── */}
      {filtered.length === 0 ? (
        <p className="empty-inline">
          {completedJobs.length === 0
            ? 'Converted files will appear here once jobs complete.'
            : 'No files match the selected filter.'}
        </p>
      ) : (
        <div className="library-grid">
          {filtered.map((job) => (
            <LibraryCard
              key={job.jobId}
              job={job}
              onOpenFile={onOpenFile}
              onShowInFolder={onShowInFolder}
              onRenameOutputFile={onRenameOutputFile}
            />
          ))}
        </div>
      )}
    </section>
  );
};
