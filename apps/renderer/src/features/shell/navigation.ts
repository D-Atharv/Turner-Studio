export const SIDEBAR_ITEMS = [
  { id: 'converter', label: 'Converter', icon: '⇄' },
  { id: 'queue',     label: 'Queue',     icon: '≡' },
  { id: 'library',   label: 'Library',   icon: '⊡' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' }
] as const;

export type SidebarItemId = (typeof SIDEBAR_ITEMS)[number]['id'];
export type SidebarView   = SidebarItemId;

export const TOPBAR_COPY: Record<SidebarView, { title: string; subtitle: string }> = {
  converter: {
    title: 'Video Transcoding',
    subtitle: 'Convert WebM source files into universal MP4 with local FFmpeg processing.'
  },
  queue: {
    title: 'Queue Monitor',
    subtitle: 'Track live conversions, inspect ETA, and control queued jobs.'
  },
  library: {
    title: 'Conversion Library',
    subtitle: 'Review successful outputs and recent processing history.'
  },
  settings: {
    title: 'System Preferences',
    subtitle: 'Configure Turner engine behavior with easy, production-safe controls.'
  }
};
