export const FILE_EXTENSIONS = {
    WEBM: '.webm',
    MP4: '.mp4'
};
export const JOB_STATUS = {
    WAITING: 'waiting',
    CONVERTING: 'converting',
    DONE: 'done',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
export const APP_SETTINGS_SCHEMA_VERSION = 1;
export const CONVERSION_DEFAULTS = {
    CRF: 23,
    PRESET: 'medium',
    AUDIO_BITRATE: '128k',
    AUDIO_SAMPLE_RATE: 48000,
    AUDIO_CHANNELS: 2,
    AUDIO_SYNC_FILTER: 'aresample=async=1:min_hard_comp=0.100:first_pts=0',
    VIDEO_CODEC: 'libx264',
    AUDIO_CODEC: 'aac',
    PIXEL_FORMAT: 'yuv420p',
    MOVFLAGS: '+faststart',
    VIDEO_STREAM_MAP: '0:v:0',
    AUDIO_STREAM_MAP: '0:a?',
    TIMESTAMP_GEN_FLAG: '+genpts',
    VIDEO_SYNC_MODE: 'vfr',
    MAX_MUXING_QUEUE_SIZE: 1024,
    KEEP_ORIGINAL: true,
    NOTIFY_ON_COMPLETION: true,
    CONCURRENCY: 1,
    CONVERSION_TIMEOUT_MS: 30 * 60 * 1000
};
export const CONVERSION_LIMITS = {
    CRF_MIN: 1,
    CRF_MAX: 40,
    MAX_BATCH_SIZE: 1000,
    DEBOUNCE_WRITE_MS: 250
};
//# sourceMappingURL=constants.js.map
