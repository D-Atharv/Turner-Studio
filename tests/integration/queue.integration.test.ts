import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { MediaEngineRunner, MediaEngineStartParams, MediaEngineTask } from '@turner/media-engine';
import { ok, type Result } from '@turner/shared';
import { createLogger } from '@turner/observability';
import { ConversionQueue } from '../../apps/desktop/src/queue/conversion-queue';

const testDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    testDirs.splice(0, testDirs.length).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    })
  );
});

class ImmediateEngine implements MediaEngineRunner {
  start(params: MediaEngineStartParams): Result<MediaEngineTask> {
    const done = (async () => {
      params.onProgress({ percent: 50 });
      params.onProgress({ percent: 100 });
      return ok(undefined);
    })();

    return ok({
      cancel: () => {},
      done
    });
  }
}

describe('conversion queue', () => {
  it('processes jobs in order and emits done statuses', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'turner-queue-'));
    testDirs.push(dir);

    const inputA = path.join(dir, 'a.webm');
    const inputB = path.join(dir, 'b.webm');

    await fs.writeFile(inputA, 'data-a');
    await fs.writeFile(inputB, 'data-b');

    const queue = new ConversionQueue(new ImmediateEngine(), createLogger());
    const statuses: Array<{ jobId: string; status: string }> = [];

    queue.onStatusChanged((event) => {
      statuses.push({ jobId: event.jobId, status: event.status });
    });

    const enqueue = await queue.enqueue(
      [inputA, inputB],
      {
        crf: 23,
        preset: 'medium',
        audioBitrate: '128k',
        keepOriginal: true,
        timeoutMs: 60_000
      }
    );

    expect(enqueue.ok).toBe(true);

    await new Promise<void>((resolve) => setTimeout(resolve, 20));

    const doneCount = statuses.filter((item) => item.status === 'done').length;
    expect(doneCount).toBe(2);
  });
});
