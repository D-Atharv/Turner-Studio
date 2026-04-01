import type { ConvertOptions } from '@turner/contracts';
import { CONVERSION_DEFAULTS } from '@turner/shared';

export const buildFfmpegArgs = (
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
): string[] => [
  '-hide_banner',
  '-y',
  '-fflags',
  CONVERSION_DEFAULTS.TIMESTAMP_GEN_FLAG,
  '-i',
  inputPath,
  '-map',
  CONVERSION_DEFAULTS.VIDEO_STREAM_MAP,
  '-map',
  CONVERSION_DEFAULTS.AUDIO_STREAM_MAP,
  '-c:v',
  CONVERSION_DEFAULTS.VIDEO_CODEC,
  '-preset',
  options.preset,
  '-crf',
  String(options.crf),
  '-vsync',
  CONVERSION_DEFAULTS.VIDEO_SYNC_MODE,
  '-pix_fmt',
  CONVERSION_DEFAULTS.PIXEL_FORMAT,
  '-c:a',
  CONVERSION_DEFAULTS.AUDIO_CODEC,
  '-b:a',
  options.audioBitrate,
  '-ar',
  String(CONVERSION_DEFAULTS.AUDIO_SAMPLE_RATE),
  '-ac',
  String(CONVERSION_DEFAULTS.AUDIO_CHANNELS),
  '-af',
  CONVERSION_DEFAULTS.AUDIO_SYNC_FILTER,
  '-movflags',
  CONVERSION_DEFAULTS.MOVFLAGS,
  '-max_muxing_queue_size',
  String(CONVERSION_DEFAULTS.MAX_MUXING_QUEUE_SIZE),
  outputPath
];
