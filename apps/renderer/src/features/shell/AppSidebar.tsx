import { SIDEBAR_ITEMS, type SidebarItemId, type SidebarView } from './navigation';

type AppSidebarProps = {
  activeView: SidebarView;
  queueCount: number;
  onNavigate: (target: SidebarItemId) => void;
};

export const AppSidebar = ({
  activeView,
  queueCount,
  onNavigate
}: AppSidebarProps) => {
  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      {/* Brand */}
      <div className="brand-block">
        <div className="brand-logo-wrap">
          <div className="brand-logo-icon" aria-hidden="true">⇄</div>
          <div>
            <p className="brand-title">Turner Studio</p>
            <p className="brand-subtitle">High-fidelity converter</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="side-nav">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`side-nav-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className={`nav-icon-box${isActive ? ' is-active' : ''}`} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.id === 'queue' && queueCount > 0 ? (
                <span
                  className="side-badge"
                  aria-label={`${queueCount} items in queue`}
                >
                  {queueCount > 99 ? '99+' : queueCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Workspace info */}
      <div className="workspace-pill">
        <strong>Workspace</strong>
        <span>Standard User</span>
      </div>
    </aside>
  );
};
