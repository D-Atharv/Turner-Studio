/**
 * Conversion Profile Registry — single source of truth for every
 * supported source-to-target format combination.
 *
 * To add a new profile, append an entry to CONVERSION_PROFILES.
 * Everything else (validation, output-path, FFmpeg args, file-picker,
 * UI dropdowns) derives from this registry automatically.
 */

// ─── Video Format ─────────────────────────────────────────────────────────────

export type VideoFormat = {
  /** Stable unique identifier, never change once shipped. */
  readonly id: string;
  /** Short human-readable label shown in UI dropdowns, e.g. "WebM". */
  readonly label: string;
  /** All file extensions recognised for this format (lower-case with dot). */
  readonly extensions: readonly string[];
  /** Extension used when writing output files for this format. */
  readonly primaryExtension: string;
};

export const VIDEO_FORMATS = [
  {
    id:               'webm',
    label:            'WebM',
    extensions:       ['.webm'],
    primaryExtension: '.webm'
  },
  {
    id:               'mpeg',
    label:            'MPEG',
    extensions:       ['.mpeg', '.mpg'],
    primaryExtension: '.mpeg'
  },
  {
    id:               'mp4',
    label:            'MP4',
    extensions:       ['.mp4'],
    primaryExtension: '.mp4'
  }
] as const satisfies VideoFormat[];

export type VideoFormatId = (typeof VIDEO_FORMATS)[number]['id'];
// 'webm' | 'mpeg' | 'mp4'

// ─── Quality Mode ─────────────────────────────────────────────────────────────

/**
 * Describes how the video quality setting is passed to FFmpeg.
 *
 * - `crf-with-preset`  libx264 / libx265:  -preset <p>  -crf <n>
 * - `crf-no-preset`    libvpx-vp9:         -crf <n>  -b:v 0  (b:v 0 is mandatory for VP9 CRF)
 * - `qscale`           mpeg2video:         -q:v <n>  (CRF 1-40 mapped linearly to q:v 1-31)
 */
export type VideoQualityMode = 'crf-with-preset' | 'crf-no-preset' | 'qscale';

// ─── Conversion Profile ───────────────────────────────────────────────────────

export type ConversionProfile = {
  /** Stable unique identifier — never change once shipped. */
  readonly id: string;
  /** Input format id (key into VIDEO_FORMATS). */
  readonly inputFormatId: VideoFormatId;
  /** Output format id (key into VIDEO_FORMATS). */
  readonly outputFormatId: VideoFormatId;
  /** One-line codec summary shown as a hint in the UI. */
  readonly description: string;
  /** FFmpeg video codec identifier, e.g. "libx264". */
  readonly videoCodec: string;
  /** How the quality setting is passed to FFmpeg. */
  readonly videoQualityMode: VideoQualityMode;
  /** FFmpeg audio codec identifier, e.g. "aac". */
  readonly audioCodec: string;
  /** FFmpeg pixel format, e.g. "yuv420p". */
  readonly pixelFormat: string;
  /** Optional container movflags, e.g. "+faststart" for MP4 (omitted for WebM / MPEG). */
  readonly movflags?: string | undefined;
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CONVERSION_PROFILES = [
  // ── To MP4 ──────────────────────────────────────────────────────────────────
  {
    id:               'webm-to-mp4',
    inputFormatId:    'webm',
    outputFormatId:   'mp4',
    description:      'H.264 + AAC · Maximum device & browser compatibility',
    videoCodec:       'libx264',
    videoQualityMode: 'crf-with-preset',
    audioCodec:       'aac',
    pixelFormat:      'yuv420p',
    movflags:         '+faststart'
  },
  {
    id:               'mpeg-to-mp4',
    inputFormatId:    'mpeg',
    outputFormatId:   'mp4',
    description:      'H.264 + AAC · Maximum device & browser compatibility',
    videoCodec:       'libx264',
    videoQualityMode: 'crf-with-preset',
    audioCodec:       'aac',
    pixelFormat:      'yuv420p',
    movflags:         '+faststart'
  },

  // ── To WebM ──────────────────────────────────────────────────────────────────
  {
    id:               'mp4-to-webm',
    inputFormatId:    'mp4',
    outputFormatId:   'webm',
    description:      'VP9 + Opus · Open web format, excellent compression',
    videoCodec:       'libvpx-vp9',
    videoQualityMode: 'crf-no-preset',
    audioCodec:       'libopus',
    pixelFormat:      'yuv420p'
  },
  {
    id:               'mpeg-to-webm',
    inputFormatId:    'mpeg',
    outputFormatId:   'webm',
    description:      'VP9 + Opus · Open web format, excellent compression',
    videoCodec:       'libvpx-vp9',
    videoQualityMode: 'crf-no-preset',
    audioCodec:       'libopus',
    pixelFormat:      'yuv420p'
  },

  // ── To MPEG ──────────────────────────────────────────────────────────────────
  {
    id:               'mp4-to-mpeg',
    inputFormatId:    'mp4',
    outputFormatId:   'mpeg',
    description:      'MPEG-2 + MP2 · Broad hardware device compatibility',
    videoCodec:       'mpeg2video',
    videoQualityMode: 'qscale',
    audioCodec:       'mp2',
    pixelFormat:      'yuv420p'
  },
  {
    id:               'webm-to-mpeg',
    inputFormatId:    'webm',
    outputFormatId:   'mpeg',
    description:      'MPEG-2 + MP2 · Broad hardware device compatibility',
    videoCodec:       'mpeg2video',
    videoQualityMode: 'qscale',
    audioCodec:       'mp2',
    pixelFormat:      'yuv420p'
  }
] as const satisfies ConversionProfile[];

export type ConversionProfileId = (typeof CONVERSION_PROFILES)[number]['id'];
// 'webm-to-mp4' | 'mpeg-to-mp4' | 'mp4-to-webm' | 'mpeg-to-webm' | 'mp4-to-mpeg' | 'webm-to-mpeg'

export const DEFAULT_PROFILE_ID: ConversionProfileId = 'webm-to-mp4';

// ─── Format Helpers ───────────────────────────────────────────────────────────

export const getFormatById = (id: string): VideoFormat | undefined =>
  (VIDEO_FORMATS as readonly VideoFormat[]).find((f) => f.id === id);

/** All formats that appear as input in at least one profile, in registry order. */
export const getFromFormats = (): VideoFormat[] => {
  const seen = new Set<string>();
  const result: VideoFormat[] = [];
  for (const p of CONVERSION_PROFILES) {
    if (!seen.has(p.inputFormatId)) {
      seen.add(p.inputFormatId);
      const fmt = getFormatById(p.inputFormatId);
      if (fmt) result.push(fmt);
    }
  }
  return result;
};

/** All valid target formats for a given input format, in registry order. */
export const getToFormats = (fromFormatId: string): VideoFormat[] => {
  const seen = new Set<string>();
  const result: VideoFormat[] = [];
  for (const p of CONVERSION_PROFILES) {
    if (p.inputFormatId === fromFormatId && !seen.has(p.outputFormatId)) {
      seen.add(p.outputFormatId);
      const fmt = getFormatById(p.outputFormatId);
      if (fmt) result.push(fmt);
    }
  }
  return result;
};

// ─── Profile Helpers ──────────────────────────────────────────────────────────

export const getProfileById = (id: string): ConversionProfile | undefined =>
  (CONVERSION_PROFILES as readonly ConversionProfile[]).find((p) => p.id === id);

export const getProfileByIdOrDefault = (id: string): ConversionProfile =>
  getProfileById(id) ?? CONVERSION_PROFILES[0];

/** Look up the profile for a specific (inputFormatId, outputFormatId) pair. */
export const getProfileByFormats = (
  inputFormatId: string,
  outputFormatId: string
): ConversionProfile | undefined =>
  (CONVERSION_PROFILES as readonly ConversionProfile[]).find(
    (p) => p.inputFormatId === inputFormatId && p.outputFormatId === outputFormatId
  );

/** Decompose a profile ID into its (inputFormatId, outputFormatId) pair. */
export const getFormatIdsForProfile = (
  profileId: string
): { inputFormatId: VideoFormatId; outputFormatId: VideoFormatId } | undefined => {
  const profile = getProfileById(profileId);
  if (!profile) return undefined;
  return {
    inputFormatId:  profile.inputFormatId as VideoFormatId,
    outputFormatId: profile.outputFormatId as VideoFormatId
  };
};

/** Primary output file extension for a given profile (with dot, e.g. ".mp4"). */
export const getOutputExtension = (profileId: string): string => {
  const profile = getProfileByIdOrDefault(profileId);
  const fmt     = getFormatById(profile.outputFormatId);
  return fmt?.primaryExtension ?? '.mp4';
};

/** All unique accepted input extensions across every registered profile. */
export const getAllAcceptedExtensions = (): string[] => {
  const seen = new Set<string>();
  for (const p of CONVERSION_PROFILES) {
    const fmt = getFormatById(p.inputFormatId);
    if (fmt) {
      for (const ext of fmt.extensions) seen.add(ext);
    }
  }
  return [...seen];
};

/**
 * Input file extensions accepted by a specific profile's input format.
 * Used to drive the file-picker dialog and drop-zone filtering.
 * e.g. 'mp4-to-webm' → ['.mp4']  |  'mpeg-to-mp4' → ['.mpeg', '.mpg']
 */
export const getInputExtensions = (profileId: string): readonly string[] => {
  const profile = getProfileByIdOrDefault(profileId);
  return getFormatById(profile.inputFormatId)?.extensions ?? [];
};
