import { useState } from 'react';
import type { SettingsSectionId } from './types';

export const useSectionTracker = () => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('output');
  return { activeSection, selectSection: setActiveSection };
};
