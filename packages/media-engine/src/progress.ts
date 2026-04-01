import type { MediaEngineProgress } from './types.js';

const DURATION_REGEX = /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/;
const PROGRESS_REGEX = /time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/;
const FPS_REGEX = /fps=\s*([\d.]+)/;
const SPEED_REGEX = /speed=\s*([\d.]+)x/;

const toSeconds = (hours: string, minutes: string, seconds: string): number => {
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

export const extractDurationSeconds = (line: string): number | undefined => {
  const match = DURATION_REGEX.exec(line);
  if (!match) {
    return undefined;
  }

  const [, h, m, s] = match;
  if (!h || !m || !s) {
    return undefined;
  }

  return toSeconds(h, m, s);
};

export const parseProgressLine = (
  line: string,
  totalDurationSeconds?: number
): MediaEngineProgress | undefined => {
  const progressMatch = PROGRESS_REGEX.exec(line);

  if (!progressMatch) {
    return undefined;
  }

  const [, h, m, s] = progressMatch;
  if (!h || !m || !s) {
    return undefined;
  }

  const currentSeconds = toSeconds(h, m, s);
  const fpsMatch = FPS_REGEX.exec(line);
  const fps = fpsMatch?.[1] ? Number(fpsMatch[1]) : undefined;
  const speedMatch = SPEED_REGEX.exec(line);
  const speedMultiplier = speedMatch?.[1] ? Number(speedMatch[1]) : undefined;

  let percent = 0;
  let etaSeconds: number | undefined;

  if (totalDurationSeconds && totalDurationSeconds > 0) {
    percent = Math.min(100, Math.max(0, Math.round((currentSeconds / totalDurationSeconds) * 100)));
    const remaining = Math.max(0, totalDurationSeconds - currentSeconds);
    if (typeof speedMultiplier === 'number' && Number.isFinite(speedMultiplier) && speedMultiplier > 0) {
      etaSeconds = Math.round(remaining / speedMultiplier);
    } else {
      etaSeconds = remaining > 0 ? Math.round(remaining) : 0;
    }
  }

  return {
    percent,
    fps: Number.isFinite(fps) ? fps : undefined,
    speedMultiplier:
      typeof speedMultiplier === 'number' && Number.isFinite(speedMultiplier) && speedMultiplier > 0
        ? speedMultiplier
        : undefined,
    etaSeconds
  };
};
