export declare const FILE_EXTENSIONS: {
    readonly WEBM: ".webm";
    readonly MP4: ".mp4";
};
export declare const JOB_STATUS: {
    readonly WAITING: "waiting";
    readonly CONVERTING: "converting";
    readonly DONE: "done";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export declare const APP_SETTINGS_SCHEMA_VERSION = 1;
export declare const CONVERSION_DEFAULTS: {
    readonly CRF: 23;
    readonly PRESET: "medium";
    readonly AUDIO_BITRATE: "128k";
    readonly AUDIO_SAMPLE_RATE: 48000;
    readonly AUDIO_CHANNELS: 2;
    readonly AUDIO_SYNC_FILTER: "aresample=async=1:min_hard_comp=0.100:first_pts=0";
    readonly VIDEO_CODEC: "libx264";
    readonly AUDIO_CODEC: "aac";
    readonly PIXEL_FORMAT: "yuv420p";
    readonly MOVFLAGS: "+faststart";
    readonly VIDEO_STREAM_MAP: "0:v:0";
    readonly AUDIO_STREAM_MAP: "0:a?";
    readonly TIMESTAMP_GEN_FLAG: "+genpts";
    readonly VIDEO_SYNC_MODE: "vfr";
    readonly MAX_MUXING_QUEUE_SIZE: 1024;
    readonly KEEP_ORIGINAL: true;
    readonly NOTIFY_ON_COMPLETION: true;
    readonly CONCURRENCY: 1;
    readonly CONVERSION_TIMEOUT_MS: number;
};
export declare const CONVERSION_LIMITS: {
    readonly CRF_MIN: 1;
    readonly CRF_MAX: 40;
    readonly MAX_BATCH_SIZE: 1000;
    readonly DEBOUNCE_WRITE_MS: 250;
};
//# sourceMappingURL=constants.d.ts.map
