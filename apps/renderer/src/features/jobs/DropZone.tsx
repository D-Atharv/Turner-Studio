import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { extractPathsFromFileList } from './file-paths';

type DropZoneProps = {
  disabled?: boolean;
  /**
   * Extensions accepted for this drop zone, derived from the currently
   * selected conversion profile's input format (e.g. ['.mp4'] for MP4 → WebM).
   * Drop events are filtered to these extensions and the subtitle reflects them.
   */
  acceptedExtensions: readonly string[];
  onPathsSelected: (paths: string[]) => void;
  onBrowse: () => void;
  onError: (message: string) => void;
};

export const DropZone = ({
  disabled,
  acceptedExtensions,
  onPathsSelected,
  onBrowse,
  onError
}: DropZoneProps) => {
  const [isHovering, setIsHovering] = useState(false);

  // Human-readable subtitle: ".webm · .mpeg · .mpg — or click to browse"
  const acceptedLabel = acceptedExtensions.join(' · ');

  const handleFiles = (files: FileList | null) => {
    const { acceptedPaths, rejectedCount } = extractPathsFromFileList(files, acceptedExtensions);

    if (acceptedPaths.length > 0) {
      onPathsSelected(acceptedPaths);
    }

    if (rejectedCount > 0) {
      onError(
        `${rejectedCount} file(s) ignored — current profile only accepts ${acceptedLabel} files.`
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

  const zoneClass = ['dropzone', isHovering && 'is-hovering', disabled && 'is-disabled']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={zoneClass}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`Drop ${acceptedLabel} video files here or press Enter to browse`}
      onDragEnter={(e) => { e.preventDefault(); if (!disabled) setIsHovering(true); }}
      onDragOver={(e)  => { e.preventDefault(); }}
      onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
      onDrop={handleDrop}
      onClick={() => { if (!disabled) onBrowse(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="dropzone-icon" aria-hidden="true">⇪</div>

      <p className="dropzone-title">Drop video files here</p>
      <p className="dropzone-subtitle">{acceptedLabel} — or click to browse</p>

      <div className="dropzone-formats" aria-hidden="true">
        {acceptedExtensions.map((ext) => (
          <span key={ext} className="format-badge">
            {ext.replace(/^\./, '').toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
};
