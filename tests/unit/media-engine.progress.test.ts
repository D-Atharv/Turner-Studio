import { describe, expect, it } from 'vitest';
import { parseProgressLine } from '@turner/media-engine';

describe('ffmpeg progress parser', () => {
  it('computes ETA using speed multiplier when available', () => {
    const progress = parseProgressLine(
      'frame=240 fps=60.0 q=28.0 size=1024kB time=00:00:12.00 bitrate=699.0kbits/s speed=2.00x',
      120
    );

    expect(progress?.percent).toBe(10);
    expect(progress?.speedMultiplier).toBe(2);
    expect(progress?.etaSeconds).toBe(54);
  });

  it('falls back to remaining media seconds when speed is missing', () => {
    const progress = parseProgressLine(
      'frame=240 fps=60.0 q=28.0 size=1024kB time=00:00:12.00 bitrate=699.0kbits/s',
      120
    );

    expect(progress?.percent).toBe(10);
    expect(progress?.speedMultiplier).toBeUndefined();
    expect(progress?.etaSeconds).toBe(108);
  });
});

