import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setPriority } from 'node:os';
import type { MediaEngineRunner, MediaEngineStartParams, MediaEngineTask } from './types.js';
import { buildFfmpegArgs } from './ffmpeg-command.js';
import { collectStderrChunk, formatStderrSnippet, mapFfmpegFailure } from './ffmpeg-errors.js';
import { extractDurationSeconds, parseProgressLine } from './progress.js';
import { CONVERSION_DEFAULTS } from '@turner/shared';
import { createAppError, err, ok, type Result } from '@turner/shared';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static') as string | null;

export class FfmpegMediaEngine implements MediaEngineRunner {
  start(params: MediaEngineStartParams): Result<MediaEngineTask> {
    if (!ffmpegPath) {
      return err(createAppError('FFMPEG_ERROR', 'FFmpeg binary is not available'));
    }

    const args = buildFfmpegArgs(params.inputPath, params.outputPath, params.options);

    try {
      const child = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'ignore', 'pipe']
      });

      if (typeof child.pid === 'number') {
        try {
          setPriority(child.pid, CONVERSION_DEFAULTS.PROCESS_PRIORITY_NICE);
        } catch {
          // Best effort: if priority change is not supported we continue conversion normally.
        }
      }

      let durationSeconds: number | undefined;
      let timedOut = false;
      let cancelled = false;
      const stderrLines: string[] = [];

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, params.options.timeoutMs);

      const done = new Promise<Result<void>>((resolve) => {
        child.stderr?.on('data', (chunk: Buffer) => {
          const chunkText = chunk.toString('utf8');
          collectStderrChunk(stderrLines, chunkText);

          for (const line of chunkText.split(/[\r\n]+/)) {
            const parsedDuration = extractDurationSeconds(line);

            if (typeof parsedDuration === 'number' && parsedDuration > 0) {
              durationSeconds = parsedDuration;
            }

            const progress = parseProgressLine(line, durationSeconds);
            if (progress) {
              params.onProgress(progress);
            }
          }
        });

        child.once('error', (spawnError: Error) => {
          clearTimeout(timeout);
          resolve(
            err(
              createAppError('FFMPEG_ERROR', 'Failed to start FFmpeg process', {
                cause: spawnError,
                details: {
                  inputPath: params.inputPath,
                  outputPath: params.outputPath,
                  stderrSnippet: formatStderrSnippet(stderrLines)
                }
              })
            )
          );
        });

        child.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
          clearTimeout(timeout);
          const stderrSnippet = formatStderrSnippet(stderrLines);

          if (cancelled) {
            resolve(err(createAppError('CANCELLED', 'Conversion cancelled by user')));
            return;
          }

          if (timedOut) {
            resolve(
              err(
                createAppError('FFMPEG_ERROR', 'Conversion timed out', {
                  details: {
                    timeoutMs: params.options.timeoutMs,
                    inputPath: params.inputPath,
                    outputPath: params.outputPath,
                    stderrSnippet
                  }
                })
              )
            );
            return;
          }

          if (code === 0) {
            resolve(ok(undefined));
            return;
          }

          resolve(
            err(
              mapFfmpegFailure({
                inputPath: params.inputPath,
                outputPath: params.outputPath,
                code,
                signal,
                stderrSnippet
              })
            )
          );
        });
      });

      return ok({
        cancel: () => {
          cancelled = true;
          child.kill('SIGTERM');
        },
        done
      });
    } catch (unknownError) {
      return err(
        createAppError('UNKNOWN', 'Unexpected error while starting conversion', {
          cause: unknownError
        })
      );
    }
  }
}
