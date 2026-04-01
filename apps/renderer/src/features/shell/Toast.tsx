import { useEffect, useState } from 'react';
import type { AppToast, ToastVariant } from '@/state/types';

const AUTODISMISS_MS = 6000;

const VARIANT_ICONS: Record<ToastVariant, string> = {
  error:   '⚠',
  success: '✓',
  info:    'ℹ'
};

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
  return raw;
};

type ToastItemProps = {
  toast: AppToast;
  onDismiss: (id: string) => void;
};

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTODISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <div
      className={`toast toast--${toast.variant}${exiting ? ' toast--exit' : ''}`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast-icon" aria-hidden="true">{VARIANT_ICONS[toast.variant]}</span>
      <span className="toast-message">
        {toast.variant === 'error' ? toFriendlyMessage(toast.message) : toast.message}
      </span>
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
  toasts: AppToast[];
  onDismiss: (id: string) => void;
};

export const ToastList = ({ toasts, onDismiss }: ToastListProps) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-list" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
