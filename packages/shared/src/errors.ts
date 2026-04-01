export const APP_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  IO_ERROR: 'IO_ERROR',
  FFMPEG_ERROR: 'FFMPEG_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  CANCELLED: 'CANCELLED',
  UNKNOWN: 'UNKNOWN'
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export type AppError = {
  code: AppErrorCode;
  message: string;
  details?: unknown;
  cause?: unknown;
};

export const createAppError = (
  code: AppErrorCode,
  message: string,
  options?: {
    details?: unknown;
    cause?: unknown;
  }
): AppError => ({
  code,
  message,
  details: options?.details,
  cause: options?.cause
});
