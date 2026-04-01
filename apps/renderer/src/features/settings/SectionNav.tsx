import { SETTINGS_SECTIONS } from './constants';
import type { SettingsSectionId } from './types';

type SectionNavProps = {
  activeSection: SettingsSectionId;
  onSelect: (sectionId: SettingsSectionId) => void;
};

export const SectionNav = ({ activeSection, onSelect }: SectionNavProps) => {
  return (
    <nav className="settings-modal-nav" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`settings-nav-item ${activeSection === section.id ? 'is-active' : ''}`}
          onClick={() => onSelect(section.id)}
        >
          <span className="settings-nav-dot" aria-hidden="true" />
          <span className="settings-nav-copy">
            <strong>{section.label}</strong>
            <small>{section.caption}</small>
          </span>
        </button>
      ))}
    </nav>
  );
};
