import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { extractPathsFromFileList } from './file-paths';

type DropZoneProps = {
  disabled?: boolean;
  onPathsSelected: (paths: string[]) => void;
  onBrowse: () => void;
  onError: (message: string) => void;
};

export const DropZone = ({
  disabled,
  onPathsSelected,
  onBrowse,
  onError
}: DropZoneProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const extracted = extractPathsFromFileList(files);

    if (extracted.acceptedPaths.length > 0) {
      onPathsSelected(extracted.acceptedPaths);
    }

    if (extracted.rejectedCount > 0) {
      onError(
        `${extracted.rejectedCount} file(s) ignored — only .webm files are supported.`
      );
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovering(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) onBrowse();
    }
  };

  const zoneClass = [
    'dropzone',
    isHovering ? 'is-hovering' : '',
    disabled    ? 'is-disabled' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={zoneClass}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Drop WebM files here or press Enter to browse"
      onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsHovering(true); }}
      onDragOver={(e)  => { e.preventDefault(); }}
      onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
      onDrop={handleDrop}
      onClick={() => { if (!disabled) onBrowse(); }}
      onKeyDown={handleKeyDown}
    >
      {/* Upload icon */}
      <div className="dropzone-icon" aria-hidden="true">⇪</div>

      <p className="dropzone-title">Drop .webm files here</p>
      <p className="dropzone-subtitle">or click to open native file picker</p>

      {/* Supported output formats */}
      <div className="dropzone-formats" aria-hidden="true">
        <span className="format-badge">H.264</span>
        <span className="format-badge">AAC</span>
        <span className="format-badge">MP4</span>
      </div>
    </div>
  );
};
