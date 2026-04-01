import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonSettingsRepository, migrateSettings } from '@turner/persistence';

const testDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    testDirs.splice(0, testDirs.length).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    })
  );
});

describe('settings repository', () => {
  it('persists updates atomically and flushes pending write', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'turner-settings-'));
    testDirs.push(dir);

    const filePath = path.join(dir, 'settings.json');
    const repository = new JsonSettingsRepository(filePath, 5);

    const update = await repository.update({
      crf: 18,
      preset: 'slow',
      keepOriginal: false,
      notifyOnCompletion: false
    });
    expect(update.ok).toBe(true);

    const flush = await repository.flush();
    expect(flush.ok).toBe(true);

    const raw = await fs.readFile(filePath, 'utf8');
    expect(raw).toContain('"crf": 18');
    expect(raw).toContain('"preset": "slow"');
    expect(raw).toContain('"notifyOnCompletion": false');
  });

  it('migrates legacy settings payload', () => {
    const migrated = migrateSettings({ qualityCrf: 19, preset: 'fast', audioBitrate: '128k' });

    expect(migrated.ok).toBe(true);

    if (migrated.ok) {
      expect(migrated.value.crf).toBe(19);
    }
  });
});
