import type { AppSettings } from '@turner/contracts';
import { ConverterWorkspace } from '@/features/dashboard/ConverterWorkspace';
import { LibraryWorkspace } from '@/features/dashboard/LibraryWorkspace';
import { QueueWorkspace } from '@/features/dashboard/QueueWorkspace';
import { SettingsPanel } from '@/features/settings/SettingsPanel';
import type { SidebarView } from '@/features/shell/navigation';
import type { UiJob } from '@/state/types';
import type { SessionStats } from '@/features/dashboard/selectors';

type AppWorkspacesProps = {
  activeView: SidebarView;
  jobs: UiJob[];
  sessionStats: SessionStats;
  activeJob: UiJob | undefined;
  recentProcessed: UiJob[];
  completedJobs: UiJob[];
  notifyOnCompletion: boolean;
  loadingSettings: boolean;
  isEnqueueing: boolean;
  initialSettings: AppSettings;
  onPathsSelected: (paths: string[]) => void;
  onBrowse: () => void;
  onDropError: (message: string) => void;
  onCancel: (jobId: string) => void;
  onOpenFile: (outputPath: string) => void;
  onShowInFolder: (outputPath: string) => void;
  onRenameOutputFile: (outputPath: string) => void;
  onSetPreferredName: (jobId: string, name: string) => void;
  onSettingsSave: (settings: AppSettings) => Promise<void>;
  onPickOutputFolder: () => Promise<string | null>;
  onSettingsClose: () => void;
};

export const AppWorkspaces = ({
  activeView,
  jobs,
  sessionStats,
  activeJob,
  recentProcessed,
  completedJobs,
  notifyOnCompletion,
  loadingSettings,
  isEnqueueing,
  initialSettings,
  onPathsSelected,
  onBrowse,
  onDropError,
  onCancel,
  onOpenFile,
  onShowInFolder,
  onRenameOutputFile,
  onSetPreferredName,
  onSettingsSave,
  onPickOutputFolder,
  onSettingsClose
}: AppWorkspacesProps) => {
  if (activeView === 'settings') {
    return (
      <SettingsPanel
        initialSettings={initialSettings}
        onSave={onSettingsSave}
        onPickOutputFolder={onPickOutputFolder}
        onClose={onSettingsClose}
        isWorkspace
      />
    );
  }

  if (activeView === 'queue') {
    return (
      <QueueWorkspace
        jobs={jobs}
        sessionStats={sessionStats}
        activeJob={activeJob}
        notifyOnCompletion={notifyOnCompletion}
        onBrowse={onBrowse}
        onCancel={onCancel}
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onRenameOutputFile={onRenameOutputFile}
      />
    );
  }

  if (activeView === 'library') {
    return (
      <LibraryWorkspace
        completedJobs={completedJobs}
        onOpenFile={onOpenFile}
        onShowInFolder={onShowInFolder}
        onRenameOutputFile={onRenameOutputFile}
      />
    );
  }

  return (
    <ConverterWorkspace
      disabled={loadingSettings || isEnqueueing}
      jobs={jobs}
      sessionStats={sessionStats}
      activeJob={activeJob}
      recentProcessed={recentProcessed}
      notifyOnCompletion={notifyOnCompletion}
      onPathsSelected={onPathsSelected}
      onBrowse={onBrowse}
      onDropError={onDropError}
      onCancel={onCancel}
      onOpenFile={onOpenFile}
      onShowInFolder={onShowInFolder}
      onRenameOutputFile={onRenameOutputFile}
      onSetPreferredName={onSetPreferredName}
    />
  );
};
