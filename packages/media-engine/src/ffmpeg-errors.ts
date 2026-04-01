import { createAppError, type AppError } from '@turner/shared';

const STDERR_BUFFER_LIMIT = 40;
const STDERR_MAX_LENGTH = 2_000;

export const collectStderrChunk = (lines: string[], chunkText: string): void => {
  for (const line of chunkText.split(/[\r\n]+/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    lines.push(trimmed);
    if (lines.length > STDERR_BUFFER_LIMIT) {
      lines.shift();
    }
  }
};

export const formatStderrSnippet = (lines: string[]): string | undefined => {
  if (lines.length === 0) {
    return undefined;
  }

  const joined = lines.join('\n');
  if (joined.length <= STDERR_MAX_LENGTH) {
    return joined;
  }

  return joined.slice(joined.length - STDERR_MAX_LENGTH);
};

type FfmpegFailureParams = {
  inputPath: string;
  outputPath: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  stderrSnippet?: string | undefined;
};

export const mapFfmpegFailure = ({
  inputPath,
  outputPath,
  code,
  signal,
  stderrSnippet
}: FfmpegFailureParams): AppError => {
  const normalized = stderrSnippet?.toLowerCase() ?? '';

  if (normalized.includes('no space left on device')) {
    return createAppError('IO_ERROR', 'Disk is full. Unable to finish conversion.', {
      details: { inputPath, outputPath, code, signal, stderrSnippet }
    });
  }

  if (normalized.includes('permission denied')) {
    return createAppError('PERMISSION_ERROR', 'Permission denied while writing converted file.', {
      details: { inputPath, outputPath, code, signal, stderrSnippet }
    });
  }

  if (
    normalized.includes("stream map '0:v:0' matches no streams") ||
    normalized.includes('does not contain any stream')
  ) {
    return createAppError('VALIDATION_ERROR', 'Input file does not contain a supported video stream.', {
      details: { inputPath, outputPath, code, signal, stderrSnippet }
    });
  }

  return createAppError('FFMPEG_ERROR', 'FFmpeg conversion failed', {
    details: { inputPath, outputPath, code, signal, stderrSnippet }
  });
};
