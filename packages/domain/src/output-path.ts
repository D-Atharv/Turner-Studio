import path from 'node:path';
import { DEFAULT_PROFILE_ID, createAppError, err, ok, getOutputExtension, type Result } from '@turner/shared';
import { ensureDifferentInputAndOutput } from './validation.js';

export type ResolveOutputPathParams = {
  inputPath: string;
  outputDir?: string | undefined;
  outputFileBaseName?: string | undefined;
  /** Output file extension (with dot). Derived from the conversion profile via getOutputExtension(). */
  outputExtension?: string | undefined;
  exists: (candidatePath: string) => boolean;
};

const sanitizeBaseName = (raw: string | undefined, fallback: string): string => {
  if (!raw) return fallback;
  // Strip any trailing extension (handles .mp4, .mkv, .webm, etc.)
  const cleaned = raw.trim().replace(/\.[a-z0-9]+$/i, '').replace(/[\\/:"*?<>|]/g, '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

export const resolveOutputPath = ({
  inputPath,
  outputDir,
  outputFileBaseName,
  outputExtension,
  exists
}: ResolveOutputPathParams): Result<string> => {
  const ext = outputExtension ?? getOutputExtension(DEFAULT_PROFILE_ID);
  const sourceDir = path.dirname(inputPath);
  const destinationDir = outputDir?.trim().length ? outputDir : sourceDir;
  const defaultName = path.basename(inputPath, path.extname(inputPath));
  const sourceName = sanitizeBaseName(outputFileBaseName, defaultName);

  let attempt = 0;

  while (attempt < 10_000) {
    const suffix = attempt === 0 ? '' : ` (${attempt})`;
    const candidate = path.join(destinationDir, `${sourceName}${suffix}${ext}`);

    if (!exists(candidate)) {
      const distinctResult = ensureDifferentInputAndOutput(inputPath, candidate);
      if (!distinctResult.ok) {
        return distinctResult;
      }
      return ok(candidate);
    }

    attempt += 1;
  }

  return err(
    createAppError('IO_ERROR', 'Unable to resolve output path due to excessive collisions', {
      details: { inputPath, outputDir, outputExtension: ext }
    })
  );
};
