import type { ConversionProfileId } from '@turner/shared';
import { getInputExtensions } from '@turner/shared';
import type { UiJob } from '@/state/types';
import { FormatSelector } from '@/features/conversion-profiles/FormatSelector';
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
  selectedProfileId: ConversionProfileId;
  onPathsSelected: (paths: string[]) => void;
  onBrowse: () => void;
  onDropError: (message: string) => void;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string, nextName: string) => void;
  onSetPreferredName: (jobId: string, name: string) => void;
  onSelectProfile: (profileId: ConversionProfileId) => void;
};

export const ConverterWorkspace = ({
  disabled,
  jobs,
  sessionStats,
  activeJob,
  recentProcessed,
  notifyOnCompletion,
  selectedProfileId,
  onPathsSelected,
  onBrowse,
  onDropError,
  onCancel,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile,
  onSetPreferredName,
  onSelectProfile
}: ConverterWorkspaceProps) => {
  // Derive accepted extensions from the selected profile so the drop zone
  // and file picker only show/accept files of the correct input format.
  const acceptedExtensions = getInputExtensions(selectedProfileId);

  return (
    <div className="converter-workspace">
      <section className="converter-grid">
        <DropZone
          disabled={disabled}
          acceptedExtensions={acceptedExtensions}
          onPathsSelected={onPathsSelected}
          onBrowse={onBrowse}
          onError={onDropError}
        />
        <SessionStatsCard stats={sessionStats} onAddFiles={onBrowse} />
      </section>

      <FormatSelector
        selectedProfileId={selectedProfileId}
        disabled={disabled}
        onSelect={onSelectProfile}
      />

      <ActiveProcessPanel
        job={activeJob}
        profileId={selectedProfileId}
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
        <QueuePanel
          jobs={jobs.filter((j) => j.status === 'waiting' || j.status === 'converting')}
          onSetPreferredName={onSetPreferredName}
        />
      </section>
    </div>
  );
};
