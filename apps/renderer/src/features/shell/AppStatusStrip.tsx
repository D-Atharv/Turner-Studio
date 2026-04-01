import type { SessionStats } from '@/features/dashboard/selectors';

type AppStatusStripProps = {
  stats: SessionStats;
};

export const AppStatusStrip = ({ stats }: AppStatusStripProps) => {
  const queueActive = stats.queued + stats.converting;

  return (
    <footer className="app-status-strip" aria-label="Application status">
      <div className="status-strip-left">
        <span className="status-chip status-chip--ready">Engine Ready</span>
        <span className="status-chip">Queue: {queueActive}</span>
        <span className="status-chip">Completed: {stats.successful}</span>
        <span className="status-chip">Failed: {stats.failed}</span>
      </div>
      <div className="status-strip-right">
        <span>Turner Studio</span>
      </div>
    </footer>
  );
};
