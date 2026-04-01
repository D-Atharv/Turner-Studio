export const APP_ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    IO_ERROR: 'IO_ERROR',
    FFMPEG_ERROR: 'FFMPEG_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    CANCELLED: 'CANCELLED',
    UNKNOWN: 'UNKNOWN'
};
export const createAppError = (code, message, options) => ({
    code,
    message,
    details: options?.details,
    cause: options?.cause
});
//# sourceMappingURL=errors.js.map