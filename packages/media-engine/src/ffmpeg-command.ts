import type { ConvertOptions } from '@turner/contracts';
import { CONVERSION_DEFAULTS, getProfileByIdOrDefault } from '@turner/shared';

/**
 * Map the user's CRF setting (1-40 scale) to an MPEG q:v value (1-31 scale).
 * Lower is better quality in both ranges.
 */
const crfToQscale = (crf: number): number =>
  Math.max(1, Math.min(31, Math.round((crf / 40) * 31)));

export const buildFfmpegArgs = (
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
): string[] => {
  const profile = getProfileByIdOrDefault(options.profileId);

  const args: string[] = [
    '-hide_banner',
    '-y',
    '-fflags', CONVERSION_DEFAULTS.TIMESTAMP_GEN_FLAG,
    '-i', inputPath,
    '-map', CONVERSION_DEFAULTS.VIDEO_STREAM_MAP,
    '-map', CONVERSION_DEFAULTS.AUDIO_STREAM_MAP,
    '-c:v', profile.videoCodec
  ];

  // ── Video quality args — codec-dependent ─────────────────────────────────
  switch (profile.videoQualityMode) {
    case 'crf-with-preset':
      // libx264 / libx265: supports both -preset and -crf
      args.push('-preset', options.preset);
      args.push('-crf', String(options.crf));
      break;

    case 'crf-no-preset':
      // libvpx-vp9: CRF mode requires -b:v 0; does not accept -preset
      args.push('-crf', String(options.crf));
      args.push('-b:v', '0');
      break;

    case 'qscale':
      // mpeg2video: uses -q:v instead of -crf; map user's 1-40 CRF → 1-31 q:v
      args.push('-q:v', String(crfToQscale(options.crf)));
      break;
  }

  // ── Common post-quality args ──────────────────────────────────────────────
  args.push(
    '-vsync',  CONVERSION_DEFAULTS.VIDEO_SYNC_MODE,
    '-pix_fmt', profile.pixelFormat,
    '-c:a',     profile.audioCodec,
    '-b:a',     options.audioBitrate,
    '-ar',      String(CONVERSION_DEFAULTS.AUDIO_SAMPLE_RATE),
    '-ac',      String(CONVERSION_DEFAULTS.AUDIO_CHANNELS),
    '-af',      CONVERSION_DEFAULTS.AUDIO_SYNC_FILTER,
    '-max_muxing_queue_size', String(CONVERSION_DEFAULTS.MAX_MUXING_QUEUE_SIZE)
  );

  // ── Container flags (MP4-only) ────────────────────────────────────────────
  if (profile.movflags) {
    args.push('-movflags', profile.movflags);
  }

  args.push(outputPath);

  return args;
};
