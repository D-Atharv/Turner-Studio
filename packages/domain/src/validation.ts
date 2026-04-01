import path from 'node:path';
import { getAllAcceptedExtensions, createAppError, err, ok, type Result } from '@turner/shared';

export const validateVideoInputPath = (inputPath: string): Result<string> => {
  const trimmed = inputPath.trim();

  if (trimmed.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Input path cannot be empty'));
  }

  const ext = path.extname(trimmed).toLowerCase();
  const accepted = getAllAcceptedExtensions();
  if (!accepted.includes(ext)) {
    return err(
      createAppError('VALIDATION_ERROR', `Unsupported input format "${ext}". Accepted: ${accepted.join(', ')}`, {
        details: { inputPath: trimmed, ext }
      })
    );
  }

  return ok(trimmed);
};

/** @deprecated Use validateVideoInputPath — kept for backward-compat during migration. */
export const validateWebmInputPath = validateVideoInputPath;

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
