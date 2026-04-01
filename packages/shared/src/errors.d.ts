export declare const APP_ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly IO_ERROR: "IO_ERROR";
    readonly FFMPEG_ERROR: "FFMPEG_ERROR";
    readonly PERMISSION_ERROR: "PERMISSION_ERROR";
    readonly CANCELLED: "CANCELLED";
    readonly UNKNOWN: "UNKNOWN";
};
export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];
export type AppError = {
    code: AppErrorCode;
    message: string;
    details?: unknown;
    cause?: unknown;
};
export declare const createAppError: (code: AppErrorCode, message: string, options?: {
    details?: unknown;
    cause?: unknown;
}) => AppError;
//# sourceMappingURL=errors.d.ts.map