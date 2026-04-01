import type { UiJob } from '@/state/types';
import { fileNameFromPath } from '@/features/jobs/file-paths';

// ── Percent ───────────────────────────────────────────────────────────────────

export const formatPercent = (value: number): string =>
  `${Math.max(0, Math.min(100, Math.round(value)))}%`;

// ── Duration: "1m 30s" ────────────────────────────────────────────────────────

export const formatDurationShort = (seconds: number): string => {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest    = safe % 60;
  return minutes === 0 ? `${rest}s` : `${minutes}m ${rest}s`;
};

// ── Duration: "00:12:44" for elapsed / remaining displays ─────────────────────

export const formatHMS = (seconds: number): string => {
  const safe = Math.max(0, Math.round(seconds));
  const h    = Math.floor(safe / 3600);
  const m    = Math.floor((safe % 3600) / 60);
  const s    = safe % 60;
  const pad  = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// ── ETA ───────────────────────────────────────────────────────────────────────

export const formatEta = (seconds?: number): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 'Calculating…';
  return formatDurationShort(seconds);
};

// ── Elapsed (wall-clock from startedAt to now) ────────────────────────────────

export const formatElapsed = (startedAt: number | undefined, nowMs: number = Date.now()): string => {
  if (typeof startedAt !== 'number') return '--:--:--';
  return formatHMS(Math.max(0, Math.round((nowMs - startedAt) / 1000)));
};

// ── Remaining (HH:MM:SS from etaSeconds) ─────────────────────────────────────

export const formatRemaining = (etaSeconds: number | undefined): string => {
  if (typeof etaSeconds !== 'number' || !Number.isFinite(etaSeconds)) return '--:--:--';
  return formatHMS(etaSeconds);
};

// ── Speed ─────────────────────────────────────────────────────────────────────

export const formatFps = (fps?: number): string => {
  if (typeof fps !== 'number' || !Number.isFinite(fps) || fps <= 0) return '--';
  return `${Math.round(fps)} FPS`;
};

export const formatSpeedMultiplier = (speedMultiplier?: number): string => {
  if (
    typeof speedMultiplier !== 'number' ||
    !Number.isFinite(speedMultiplier) ||
    speedMultiplier <= 0
  ) {
    return '--';
  }
  return `${speedMultiplier.toFixed(2)}x`;
};

// ── Status label ──────────────────────────────────────────────────────────────

export const statusLabel = (status: UiJob['status']): string => {
  switch (status) {
    case 'waiting':   return 'Queued';
    case 'converting':return 'Converting';
    case 'done':      return 'Success';
    case 'failed':    return 'Failed';
    case 'cancelled': return 'Cancelled';
    default:          return status;
  }
};

// ── File name ─────────────────────────────────────────────────────────────────

export const shortName = (inputPath: string): string => fileNameFromPath(inputPath);
