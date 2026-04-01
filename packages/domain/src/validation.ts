import path from 'node:path';
import { FILE_EXTENSIONS, createAppError, err, ok, type Result } from '@turner/shared';

export const validateWebmInputPath = (inputPath: string): Result<string> => {
  const trimmed = inputPath.trim();

  if (trimmed.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Input path cannot be empty'));
  }

  if (path.extname(trimmed).toLowerCase() !== FILE_EXTENSIONS.WEBM) {
    return err(
      createAppError('VALIDATION_ERROR', 'Only .webm input files are supported', {
        details: { inputPath: trimmed }
      })
    );
  }

  return ok(trimmed);
};

export const dedupeInputPaths = (inputPaths: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const inputPath of inputPaths) {
    const normalized = inputPath.trim();

    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(normalized);
  }

  return deduped;
};

export const ensureDifferentInputAndOutput = (
  inputPath: string,
  outputPath: string
): Result<void> => {
  if (path.resolve(inputPath) === path.resolve(outputPath)) {
    return err(
      createAppError('VALIDATION_ERROR', 'Input and output paths cannot be the same', {
        details: { inputPath, outputPath }
      })
    );
  }

  return ok(undefined);
};
