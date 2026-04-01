import { createAppError } from '@turner/shared';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type Logger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

const formatLog = (level: LogLevel, message: string, meta?: Record<string, unknown>): string => {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...(meta ? { meta } : {})
  };

  return JSON.stringify(payload);
};

export const createLogger = (): Logger => ({
  debug: (message, meta) => console.debug(formatLog('debug', message, meta)),
  info: (message, meta) => console.info(formatLog('info', message, meta)),
  warn: (message, meta) => console.warn(formatLog('warn', message, meta)),
  error: (message, meta) => console.error(formatLog('error', message, meta))
});

export const mapUnknownError = (unknownError: unknown, fallbackMessage: string) => {
  if (unknownError instanceof Error) {
    return createAppError('UNKNOWN', fallbackMessage, {
      cause: {
        name: unknownError.name,
        message: unknownError.message,
        stack: unknownError.stack
      }
    });
  }

  return createAppError('UNKNOWN', fallbackMessage, { cause: unknownError });
};
