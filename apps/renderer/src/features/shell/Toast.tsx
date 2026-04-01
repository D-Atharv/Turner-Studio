import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  onDismiss: () => void;
};

const AUTODISMISS_MS = 6000;

const toFriendlyMessage = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes('enoent') || lower.includes('no such file') || lower.includes('not found')) {
    return 'File not found — it may have been moved or deleted.';
  }
  if (lower.includes('eacces') || lower.includes('permission denied')) {
    return 'Permission denied. Check that the file is accessible.';
  }
  if (lower.includes('bridge') || lower.includes('unavailable') || lower.includes('desktop bridge')) {
    return 'Turner engine is not responding. Try restarting the app.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Conversion timed out. Try increasing the timeout in Settings → Timeout.';
  }
  if (lower.includes('webm') && lower.includes('ignored')) {
    return raw; // keep the already-friendly "N file(s) ignored" message
  }
  return raw;
};

export const Toast = ({ message, onDismiss }: ToastProps) => {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 200);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTODISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toast${exiting ? ' toast--exit' : ''}`} role="alert" aria-live="assertive">
      <span className="toast-icon" aria-hidden="true">⚠</span>
      <span className="toast-message">{toFriendlyMessage(message)}</span>
      <button
        type="button"
        className="toast-dismiss"
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

type ToastListProps = {
  error: string | undefined;
  onClear: () => void;
};

export const ToastList = ({ error, onClear }: ToastListProps) => {
  if (!error) return null;
  return (
    <div className="toast-list" aria-label="Notifications">
      <Toast key={error} message={error} onDismiss={onClear} />
    </div>
  );
};
