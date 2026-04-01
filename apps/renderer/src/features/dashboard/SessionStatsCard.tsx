import { formatDurationShort } from './formatters';
import type { SessionStats } from './selectors';

type SessionStatsCardProps = {
  stats: SessionStats;
  /** When provided, an "Add Files" button is rendered. Omit in monitor-only views. */
  onAddFiles?: () => void;
};

type StatRowProps = {
  icon: 'queue' | 'ok' | 'error';
  accent: 'neutral' | 'ok' | 'error';
  label: string;
  value: string | number;
};

const StatGlyph = ({ icon }: { icon: StatRowProps['icon'] }) => {
  if (icon === 'queue') {
    return (
      <span className="stat-mark stat-mark--queue" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (icon === 'ok') {
    return <span className="stat-mark stat-mark--ok" aria-hidden="true" />;
  }

  return <span className="stat-mark stat-mark--error" aria-hidden="true" />;
};

const StatRow = ({ icon, accent, label, value }: StatRowProps) => (
  <div>
    <div className="stat-label-wrap">
      <dt>{label}</dt>
    </div>
    <dd>{value}</dd>
  </div>
);

export const SessionStatsCard = ({
  stats,
  onAddFiles
}: SessionStatsCardProps) => {
  const queueTotal = stats.queued + stats.converting;

  return (
    <aside className="session-stats panel-fade-in">
      <h2>Session Stats</h2>

      <dl>
        <StatRow accent="neutral" icon="queue" label="Queue count" value={queueTotal} />
        <StatRow accent="ok"      icon="ok" label="Completed" value={stats.successful} />
        <StatRow accent="error"   icon="error" label="Failed" value={stats.failed} />
      </dl>

      <div className="stat-eta-row">
        <span className="stat-eta-label">Est. time remaining</span>
        <span className="stat-eta-value" aria-label="Estimated time remaining">
          {formatDurationShort(stats.estimatedSeconds)}
        </span>
      </div>

      {onAddFiles ? (
        <button type="button" className="primary-button" onClick={onAddFiles}>
          Add Files
        </button>
      ) : null}
    </aside>
  );
};
