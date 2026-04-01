import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from '@turner/media-engine';

describe('ffmpeg command builder', () => {
  it('includes required compatibility flags and codecs', () => {
    const args = buildFfmpegArgs('/tmp/input.webm', '/tmp/output.mp4', {
      profileId: 'webm-to-mp4',
      crf: 23,
      preset: 'medium',
      audioBitrate: '128k',
      keepOriginal: true,
      timeoutMs: 60_000
    });

    expect(args).toContain('-movflags');
    expect(args).toContain('+faststart');
    expect(args).toContain('-pix_fmt');
    expect(args).toContain('yuv420p');
    expect(args).toContain('libx264');
    expect(args).toContain('aac');
    expect(args).toContain('-map');
    expect(args).toContain('0:v:0');
    expect(args).toContain('0:a?');
    expect(args).toContain('-af');
    expect(args).toContain('aresample=async=1:min_hard_comp=0.100:first_pts=0');
    expect(args).toContain('-fflags');
    expect(args).toContain('+genpts');
  });
});
