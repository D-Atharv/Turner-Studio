import path from 'node:path';
import { FILE_EXTENSIONS, createAppError, err, ok, type Result } from '@turner/shared';
import { ensureDifferentInputAndOutput } from './validation.js';

export type ResolveOutputPathParams = {
  inputPath: string;
  outputDir?: string | undefined;
  outputFileBaseName?: string | undefined;
  exists: (candidatePath: string) => boolean;
};

const sanitizeBaseName = (raw: string | undefined, fallback: string): string => {
  if (!raw) return fallback;
  const cleaned = raw.trim().replace(/\.mp4$/i, '').replace(/[\\/:"*?<>|]/g, '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

export const resolveOutputPath = ({
  inputPath,
  outputDir,
  outputFileBaseName,
  exists
}: ResolveOutputPathParams): Result<string> => {
  const sourceDir = path.dirname(inputPath);
  const destinationDir = outputDir?.trim().length ? outputDir : sourceDir;
  const defaultName = path.basename(inputPath, path.extname(inputPath));
  const sourceName = sanitizeBaseName(outputFileBaseName, defaultName);

  let attempt = 0;

  while (attempt < 10_000) {
    const suffix = attempt === 0 ? '' : ` (${attempt})`;
    const candidate = path.join(destinationDir, `${sourceName}${suffix}${FILE_EXTENSIONS.MP4}`);

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
      details: { inputPath, outputDir }
    })
  );
};
