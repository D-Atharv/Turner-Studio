import { SETTINGS_SECTIONS } from './constants';
import type { SettingsSectionId } from './types';

type SectionTabsProps = {
  activeSection: SettingsSectionId;
  onSelect: (sectionId: SettingsSectionId) => void;
};

export const SectionTabs = ({ activeSection, onSelect }: SectionTabsProps) => {
  return (
    <nav className="settings-tab-nav" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`settings-tab-item${activeSection === section.id ? ' is-active' : ''}`}
          aria-selected={activeSection === section.id}
          onClick={() => onSelect(section.id)}
        >
          {section.label}
          <span className="settings-tab-caption">{section.caption}</span>
        </button>
      ))}
    </nav>
  );
};
