import type { UiJob } from '@/state/types';
import { DropZone } from '@/features/jobs/DropZone';
import { ActiveProcessPanel } from './ActiveProcessPanel';
import { QueuePanel } from './QueuePanel';
import { RecentProcessedTable } from './RecentProcessedTable';
import { SessionStatsCard } from './SessionStatsCard';
import type { SessionStats } from './selectors';

type ConverterWorkspaceProps = {
  disabled: boolean;
  jobs: UiJob[];
  sessionStats: SessionStats;
  activeJob: UiJob | undefined;
  recentProcessed: UiJob[];
  notifyOnCompletion: boolean;
  onPathsSelected: (paths: string[]) => void;
  onBrowse: () => void;
  onDropError: (message: string) => void;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
  onSetPreferredName: (jobId: string, name: string) => void;
};

export const ConverterWorkspace = ({
  disabled,
  jobs,
  sessionStats,
  activeJob,
  recentProcessed,
  notifyOnCompletion,
  onPathsSelected,
  onBrowse,
  onDropError,
  onCancel,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile,
  onSetPreferredName
}: ConverterWorkspaceProps) => {
  return (
    <>
      <section className="converter-grid">
        <DropZone
          disabled={disabled}
          onPathsSelected={onPathsSelected}
          onBrowse={onBrowse}
          onError={onDropError}
        />
        <SessionStatsCard stats={sessionStats} onAddFiles={onBrowse} />
      </section>

      <ActiveProcessPanel
        job={activeJob}
        notifyOnCompletion={notifyOnCompletion}
        onCancel={onCancel}
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
      />

      <section className="lower-grid">
        <RecentProcessedTable
          jobs={recentProcessed}
          onOpenFile={onOpenFile}
          onShowInFolder={onShowInFolder}
          onRenameOutputFile={onRenameOutputFile}
        />
        <QueuePanel jobs={jobs} onSetPreferredName={onSetPreferredName} />
      </section>
    </>
  );
};
