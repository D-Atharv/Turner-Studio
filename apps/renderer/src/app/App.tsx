import { AppSidebar } from '@/features/shell/AppSidebar';
import { AppStatusStrip } from '@/features/shell/AppStatusStrip';
import { AppTopbar } from '@/features/shell/AppTopbar';
import { ToastList } from '@/features/shell/Toast';
import { TOPBAR_COPY } from '@/features/shell/navigation';
import { AppWorkspaces } from './AppWorkspaces';
import { useTurnerController } from './useTurnerController';

export const App = () => {
  const app = useTurnerController();
  const topbarCopy = TOPBAR_COPY[app.activeView];

  return (
    <main className={`app-shell ${app.isBusy ? 'is-busy' : ''}`}>
      <AppSidebar
        activeView={app.activeView}
        queueCount={app.sessionStats.queued + app.sessionStats.converting}
        onNavigate={app.handleSidebarNavigate}
      />

      <section className="app-main">
        <AppTopbar
          title={topbarCopy.title}
          subtitle={topbarCopy.subtitle}
        />

        <div className="view-scroll">
          <AppWorkspaces
            activeView={app.activeView}
            jobs={app.jobs}
            sessionStats={app.sessionStats}
            activeJob={app.activeJob}
            recentProcessed={app.recentProcessed}
            completedJobs={app.completedJobs}
            notifyOnCompletion={app.state.settings.notifyOnCompletion}
            loadingSettings={app.state.loadingSettings}
            isEnqueueing={app.state.isEnqueueing}
            initialSettings={app.state.settings}
            onPathsSelected={(paths) => { void app.enqueue(paths); }}
            onBrowse={() => { void app.browseAndEnqueue(); }}
            onDropError={app.setAppError}
            onCancel={(jobId) => { void app.cancelJob(jobId); }}
            onOpenFile={(outputPath) => { void app.openFile(outputPath); }}
            onShowInFolder={(outputPath) => { void app.showInFolder(outputPath); }}
            onRenameOutputFile={(outputPath, nextName) => { void app.renameOutputFile(outputPath, nextName); }}
            onSetPreferredName={(jobId, name) => { void app.setPreferredOutputName(jobId, name); }}
            selectedProfileId={app.selectedProfileId}
            onSelectProfile={app.setConversionProfile}
            onSettingsSave={app.updateSettings}
            onPickOutputFolder={app.pickOutputFolder}
            onSettingsClose={() => app.handleSidebarNavigate('converter')}
          />
        </div>

        <AppStatusStrip stats={app.sessionStats} />
      </section>

      <ToastList
        toasts={app.state.toasts}
        onDismiss={app.dismissToast}
      />
    </main>
  );
};
